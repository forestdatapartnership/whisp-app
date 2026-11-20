import logging
import re
import shutil
import tempfile
import time
from contextlib import AbstractContextManager, redirect_stdout, suppress
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from src.codes import SystemCode
from src.config import get_settings
from src.app_logging import resolve_level
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
_PROGRESS_RE = re.compile(r"Progress: [\d,]+/[\d,]+ (?:batches|downloads) \((\d+)%\)")
_LOCAL_SCRATCH = Path(tempfile.gettempdir()) / "whisp-local"


class _ProgressHandler(logging.Handler):
    def __init__(self, token: str, messages: list[str], feature_count: int | None = None, mode: str | None = None):
        super().__init__(level=resolve_level(get_settings().log_level))
        self.token = token
        self._messages = messages
        self._last_percent = 0
        self._feature_count = feature_count
        self._mode = mode

    def emit(self, record: logging.LogRecord):
        message = record.getMessage().strip()
        if message.startswith(_SKIP_MESSAGE_PREFIX) or _SKIP_MESSAGE_CONTAINS in message:
            return

        self._messages.append(timestamped(message))

        pm = _PROGRESS_RE.search(message)
        if pm:
            self._last_percent = int(pm.group(1))

        publish_sync(
            self.token,
            JobProgress.of(
                SystemCode.ANALYSIS_PROCESSING,
                percent=self._last_percent,
                feature_count=self._feature_count,
                mode=self._mode,
                messages=self._messages,
            ).to_redis(),
        )


def _compute_stats(token: str, opts: AnalysisOptions) -> pd.DataFrame:
    import openforis_whisp as whisp

    input_file = str(files.input_path(token))
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
        # Called directly with the same 5% decoys as mode="local" to set max_extract_workers=1:
        # the extraction then runs in a thread, as a prefork worker can't start child processes.
        return whisp.whisp_stats_local(
            input_file,
            output_dir=str(_LOCAL_SCRATCH / token),
            add_random_features=True,
            random_proportion=0.05,
            max_extract_workers=1,
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
        with redirect_stdout(None):
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
    # Only a killed run (cancel, hard time limit, out of memory) leaves its folder behind; one older
    # than the analysis time limit belongs to an analysis that has already timed out or been killed.
    cutoff = time.time() - max_age_seconds
    for path in _LOCAL_SCRATCH.glob("*"):
        with suppress(FileNotFoundError):
            if path.stat().st_mtime < cutoff:
                shutil.rmtree(path, ignore_errors=True)


@app.task(base=AnalysisTask, bind=True, name="src.worker.tasks.run_local_analysis", throws=(CallerEarthEngineError,))
def run_local_analysis(self: AnalysisTask, context: dict, opts_dict: dict, earth_engine: dict | None = None) -> None:
    ctx = AnalysisTaskContext.parse(context)
    opts = AnalysisOptions(**opts_dict)
    _remove_stale_scratch(ctx.timeout)
    session = (
        caller_earth_engine_session(earth_engine, opts.async_mode)
        if earth_engine
        else whisp_earth_engine_session()
    )
    try:
        _run_in_session(session, ctx, opts)
    finally:
        shutil.rmtree(_LOCAL_SCRATCH / ctx.token, ignore_errors=True)
