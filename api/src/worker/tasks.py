import logging
import re
from typing import Any

import numpy as np
import pandas as pd
from celery.exceptions import SoftTimeLimitExceeded

from src.codes import SystemCode
from src.config import get_settings
from src.db import jobs as db_jobs
from src.status import service as jobs
from src.submit.schemas import AnalysisOptions
from src.worker.celery_app import app

logger = logging.getLogger(__name__)

_PROGRESS_RE = re.compile(r"Progress: [\d,]+/[\d,]+ batches \((\d+)%\)")


class _ProgressHandler(logging.Handler):
    def __init__(self, token: str):
        super().__init__(level=logging.INFO)
        self.token = token

    def emit(self, record: logging.LogRecord):
        msg = self.format(record)
        pm = _PROGRESS_RE.search(msg)
        percent = int(pm.group(1)) if pm else None
        try:
            if percent is not None:
                db_jobs.update_analysis_job_sync(
                    self.token,
                    progress_message=msg,
                    progress_percent=percent,
                )
            else:
                db_jobs.update_analysis_job_sync(
                    self.token,
                    progress_message=msg,
                )
        except Exception:
            pass


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

    handler = _ProgressHandler(token)
    whisp_logger = logging.getLogger("whisp")
    whisp_logger.addHandler(handler)
    try:
        input_file = str(jobs.input_path(token))
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

        result_file = str(jobs.result_path(token))
        whisp.convert_df_to_geojson(risk_df, result_file)
    finally:
        whisp_logger.removeHandler(handler)


def _get_versions() -> dict[str, str]:
    try:
        from importlib_metadata import version
        return {
            "openforis_whisp_version": version("openforis-whisp"),
            "earthengine_api_version": version("earthengine-api"),
        }
    except Exception:
        return {}


@app.task(bind=True, max_retries=1, name="src.worker.tasks.run_analysis")
def run_analysis(self, token: str, opts_dict: dict) -> None:
    opts = AnalysisOptions(**opts_dict)
    settings = get_settings()
    timeout = settings.analysis_timeout_seconds

    try:
        db_jobs.update_analysis_job_sync(
            token,
            status=SystemCode.ANALYSIS_PROCESSING,
            started_at=db_jobs.utc_now(),
        )

        _run_whisp_blocking(token, opts)

        db_jobs.update_analysis_job_sync(
            token,
            status=SystemCode.ANALYSIS_COMPLETED,
            completed_at=db_jobs.utc_now(),
            **_get_versions(),
        )
        logger.info("analysis completed for token %s", token)
    except SoftTimeLimitExceeded:
        db_jobs.update_analysis_job_sync(
            token,
            status=SystemCode.ANALYSIS_TIMEOUT,
            completed_at=db_jobs.utc_now(),
            error_message=f"Timed out after {timeout}s",
        )
        logger.warning("analysis timed out for token %s after %ds", token, timeout)
    except Exception as e:
        logger.exception("analysis failed for token %s", token)
        db_jobs.update_analysis_job_sync(
            token,
            status=SystemCode.ANALYSIS_ERROR,
            completed_at=db_jobs.utc_now(),
            error_message=str(e),
            **_get_versions(),
        )
