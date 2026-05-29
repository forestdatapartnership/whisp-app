import logging
import re
from typing import Any

import numpy as np
import pandas as pd

from src.codes import SystemCode
from src.config import get_settings
from src.app_logging import resolve_level
from src.redis import publish_sync
from src.job_progress import JobProgress
from src.io import files
from src.submit.schemas import AnalysisOptions, AnalysisTaskContext
from src.worker.celery_app import app
from src.worker.analysis_task import AnalysisTask

logger = logging.getLogger(__name__)

_SKIP_MESSAGE_PREFIX = "Mode:"
_SKIP_MESSAGE_CONTAINS = "Concurrent processing + formatting + validation complete"
_PROGRESS_RE = re.compile(r"Progress: [\d,]+/[\d,]+ batches \((\d+)%\)")


class _ProgressHandler(logging.Handler):
    def __init__(self, token: str, messages: list[str]):
        super().__init__(level=resolve_level(get_settings().log_level))
        self.token = token
        self._messages = messages
        self._last_percent = 0

    def emit(self, record: logging.LogRecord):
        message = record.getMessage().strip()
        if message.startswith(_SKIP_MESSAGE_PREFIX) or _SKIP_MESSAGE_CONTAINS in message:
            return

        self._messages.append(message)

        pm = _PROGRESS_RE.search(message)
        if pm:
            self._last_percent = int(pm.group(1))

        publish_sync(
            self.token,
            JobProgress.of(
                SystemCode.ANALYSIS_PROCESSING,
                percent=self._last_percent,
                messages=self._messages,
            ).to_redis(),
        )


def _run_whisp_blocking(token: str, opts: AnalysisOptions) -> None:
    import openforis_whisp as whisp

    df_kwargs: dict[str, Any] = {
        "mode": "concurrent" if opts.async_mode else "sequential",
    }
    if opts.national_codes:
        df_kwargs["national_codes"] = opts.national_codes
    if opts.external_id_column:
        df_kwargs["external_id_column"] = opts.external_id_column
    if opts.unit_type:
        df_kwargs["unit_type"] = opts.unit_type

    messages = ["Starting analysis"]
    publish_sync(
        token,
        JobProgress.of(
            SystemCode.ANALYSIS_PROCESSING,
            percent=0,
            messages=messages,
        ).to_redis(),
    )

    handler = _ProgressHandler(token, messages)
    whisp_logger = logging.getLogger("whisp")
    whisp_logger.addHandler(handler)
    try:
        input_file = str(files.input_path(token))
        stats_df = whisp.whisp_formatted_stats_geojson_to_df(input_file, **df_kwargs)

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


@app.task(base=AnalysisTask, bind=True, name="src.worker.tasks.run_analysis")
def run_analysis(self: AnalysisTask, context: dict, opts_dict: dict) -> None:
    ctx = AnalysisTaskContext.parse(context)
    opts = AnalysisOptions(**opts_dict)
    _run_whisp_blocking(ctx.token, opts)
