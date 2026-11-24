import json
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from contextlib import AbstractContextManager, redirect_stdout, suppress
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from celery import platforms

from src.codes import SystemCode
from src.config import get_settings
from src.app_logging import bind, configure, resolve_level
from src.redis import get_sync, publish_sync
from src.job_progress import JobProgress, timestamped
from src.io import files
from src.submit.schemas import AnalysisOptions, AnalysisTaskContext
from src.worker.celery_app import app
from src.worker.analysis_task import AnalysisTask
from src.worker.earth_engine_init import (
    CallerEarthEngineError,
    caller_earth_engine_session,
    whisp_earth_engine_session,
)

logger = logging.getLogger(__name__)
logging.getLogger("whisp").propagate = False

_SKIP_MESSAGE_PREFIX = "Mode:"
_SKIP_MESSAGE_CONTAINS = "Concurrent processing + formatting + validation complete"
_PROGRESS_RE = re.compile(r"Progress: [\d,]+/[\d,]+ (batches|downloads) \((\d+)%\)")
_LOCAL_SCRATCH = Path(tempfile.gettempdir()) / "whisp-local"


class _ProgressHandler(logging.Handler):
    def __init__(self, token: str, messages: list[str], feature_count: int | None = None, mode: str | None = None):
        super().__init__(level=resolve_level(get_settings().log_level))
        self.token = token
        self._messages = messages
        self._last_percent = 0
        self._download_percent: int | None = None
        self._feature_count = feature_count
        self._mode = mode

    def emit(self, record: logging.LogRecord):
        message = record.getMessage().strip()
        if message.startswith(_SKIP_MESSAGE_PREFIX) or _SKIP_MESSAGE_CONTAINS in message:
            return

        self._messages.append(timestamped(message))

        # Only local mode downloads before it processes; one percent would run to 100% twice
        pm = _PROGRESS_RE.search(message)
        if pm and pm.group(1) == "downloads":
            self._download_percent = int(pm.group(2))
        elif pm:
            self._last_percent = int(pm.group(2))

        publish_sync(
            self.token,
            JobProgress.of(
                SystemCode.ANALYSIS_PROCESSING,
                percent=self._last_percent,
                download_percent=self._download_percent,
                feature_count=self._feature_count,
                mode=self._mode,
                messages=self._messages,
            ).to_redis(),
        )


def _compute_stats(token: str, opts: AnalysisOptions) -> pd.DataFrame:
    import openforis_whisp as whisp

    input_file = str(files.input_path(token))
    if not os.path.isfile(input_file):
        raise FileNotFoundError("Analysis input not found. It may have expired; please submit the analysis again.")
    df_kwargs: dict[str, Any] = {}
    if opts.national_codes:
        df_kwargs["national_codes"] = opts.national_codes
    if opts.external_id_column:
        df_kwargs["external_id_column"] = opts.external_id_column
    if opts.unit_type:
        df_kwargs["unit_type"] = opts.unit_type
    if opts.geometry_audit_trail:
        df_kwargs["geometry_audit_trail"] = True

    if opts.local_mode:
        from rasterio.env import set_gdal_config

        # The library forces a 50 MB read cache per open tile through environment variables; a GDAL config option
        # overrides them, and the extraction processes inherit it
        set_gdal_config("VSI_CACHE", False)
        # Called directly with the same 5% decoys as mode="local" to cap the extraction processes: the library
        # defaults to the node's CPU count minus one, more than the pod's memory holds on a node dev and prod share
        return whisp.whisp_stats_local(
            input_file,
            output_dir=str(_LOCAL_SCRATCH / token),
            add_random_features=True,
            random_proportion=0.05,
            max_extract_workers=3,
            **df_kwargs,
        )

    if opts.batch_size:
        df_kwargs["batch_size"] = opts.batch_size
    return whisp.whisp_formatted_stats_geojson_to_df(input_file, mode=opts.processing_mode, **df_kwargs)


def _run_whisp_blocking(token: str, opts: AnalysisOptions, feature_count: int | None = None) -> None:
    import openforis_whisp as whisp

    state = get_sync(token) or {}
    messages = [*(state.get("messages") or []), timestamped("Starting analysis")]
    publish_sync(
        token,
        JobProgress.of(
            SystemCode.ANALYSIS_PROCESSING,
            percent=0,
            feature_count=feature_count,
            mode=opts.processing_mode,
            messages=messages,
        ).to_redis(),
    )

    handler = _ProgressHandler(token, messages, feature_count=feature_count, mode=opts.processing_mode)
    whisp_logger = logging.getLogger("whisp")
    removed = [h for h in whisp_logger.handlers if isinstance(h, logging.StreamHandler)]
    for h in removed:
        whisp_logger.removeHandler(h)
    whisp_logger.addHandler(handler)
    try:
        # A real stream, not None: the library's loggers call sys.stdout.flush() after each message
        with open(os.devnull, "w") as devnull, redirect_stdout(devnull):
            stats_df = _compute_stats(token, opts)

            risk_df = whisp.whisp_risk(
                stats_df,
                explicit_unit_type=opts.unit_type,
                national_codes=opts.national_codes,
            )

            for col in risk_df.columns:
                if pd.api.types.is_numeric_dtype(risk_df[col]):
                    risk_df[col] = risk_df[col].replace([np.nan, np.inf, -np.inf], None)
                elif risk_df[col].dtype == "object":
                    risk_df[col] = risk_df[col].fillna("")

            result_file = str(files.result_path(token))
            whisp.convert_df_to_geojson(risk_df, result_file)
    finally:
        whisp_logger.removeHandler(handler)
        for h in removed:
            whisp_logger.addHandler(h)


@app.task(base=AnalysisTask, bind=True, name="src.worker.tasks.run_analysis")
def run_analysis(self: AnalysisTask, context: dict, opts_dict: dict) -> None:
    ctx = AnalysisTaskContext.parse(context)
    opts = AnalysisOptions(**opts_dict)
    _run_whisp_blocking(ctx.token, opts, feature_count=ctx.feature_count)


def _run_in_session(session: AbstractContextManager[None], ctx: AnalysisTaskContext, opts: AnalysisOptions) -> None:
    try:
        with session:
            _run_whisp_blocking(ctx.token, opts, feature_count=ctx.feature_count)
    except CallerEarthEngineError as e:
        logger.warning("%s", e)
        raise


@app.task(base=AnalysisTask, bind=True, name="src.worker.tasks.run_caller_analysis", throws=(CallerEarthEngineError,))
def run_caller_analysis(self: AnalysisTask, context: dict, opts_dict: dict, earth_engine: dict) -> None:
    ctx = AnalysisTaskContext.parse(context)
    opts = AnalysisOptions(**opts_dict)
    _run_in_session(caller_earth_engine_session(earth_engine, opts.async_mode), ctx, opts)


def _remove_stale_scratch(max_age_seconds: int) -> None:
    # Only a killed pool process (cancel, hard time limit) leaves its folder behind; one older
    # than the analysis time limit belongs to an analysis that has already timed out or been killed.
    cutoff = time.time() - max_age_seconds
    for path in _LOCAL_SCRATCH.glob("*"):
        with suppress(FileNotFoundError):
            if path.stat().st_mtime < cutoff:
                shutil.rmtree(path, ignore_errors=True)


def _local_error_file(token: str) -> Path:
    return _LOCAL_SCRATCH / token / "error.json"


def run_local_process() -> None:
    # Entry point of the process each local analysis runs in (python -m src.worker.local_analysis)
    payload = json.load(sys.stdin)
    ctx = AnalysisTaskContext.parse(payload["context"])
    opts = AnalysisOptions(**payload["opts"])
    configure()
    bind(token=ctx.token, user_id=ctx.user_id, api_key_id=ctx.api_key_id, input_metrics=ctx.input_metrics)
    earth_engine = payload["earth_engine"]
    session = (
        caller_earth_engine_session(earth_engine, opts.async_mode)
        if earth_engine
        else whisp_earth_engine_session()
    )
    try:
        _run_in_session(session, ctx, opts)
    except Exception as e:
        error_file = _local_error_file(ctx.token)
        error_file.parent.mkdir(parents=True, exist_ok=True)
        error_file.write_text(json.dumps({"type": type(e).__name__, "message": str(e), "traceback": traceback.format_exc()}))
        sys.exit(1)


def _local_process_error(token: str, returncode: int) -> Exception:
    if returncode == -9:  # SIGKILL, as sent by the out-of-memory killer
        return RuntimeError(
            "The analysis stopped unexpectedly, most likely because it ran out of memory. "
            "Please try again with fewer or smaller plots."
        )
    error_file = _local_error_file(token)
    if not error_file.exists():
        return RuntimeError(f"The analysis process exited with code {returncode}")
    error = json.loads(error_file.read_text())
    exc_type = CallerEarthEngineError if error["type"] == CallerEarthEngineError.__name__ else RuntimeError
    exc = exc_type(error["message"])
    exc.add_note(error["traceback"])
    return exc


@app.task(base=AnalysisTask, bind=True, name="src.worker.tasks.run_local_analysis", throws=(CallerEarthEngineError,))
def run_local_analysis(self: AnalysisTask, context: dict, opts_dict: dict, earth_engine: dict | None = None) -> None:
    ctx = AnalysisTaskContext.parse(context)
    _remove_stale_scratch(ctx.timeout)
    try:
        # In its own process, running out of memory kills only the analysis (the node pool sets singleProcessOomKill),
        # and this pool process records the failure; run() kills it when the soft time limit interrupts the wait
        returncode = subprocess.run(
            [sys.executable, "-m", "src.worker.local_analysis"],
            input=json.dumps({"context": context, "opts": opts_dict, "earth_engine": earth_engine}).encode(),
            # A cancel or a hard time limit kills this pool process outright, and the analysis must go with it
            preexec_fn=(lambda: platforms.set_pdeathsig("SIGKILL")) if sys.platform == "linux" else None,
        ).returncode
        if returncode:
            raise _local_process_error(ctx.token, returncode)
    finally:
        shutil.rmtree(_LOCAL_SCRATCH / ctx.token, ignore_errors=True)
