import logging
import uuid
from dataclasses import asdict

from src.codes import SystemCode, TERMINAL_STATUSES
from src.config import Settings
from src.db import jobs as db_jobs
from src.exceptions import AppError
from src.io import files
from src.job_progress import JobProgress
from src.redis import publish, wait_for
from src.submit.schemas import AnalysisOptions, JobContext, SubmitResult
from src.submit.validators import get_common_property_names, validate_external_id_column
from src.worker.celery_app import app as celery_app
from src.worker.analysis_task import AnalysisTask

logger = logging.getLogger(__name__)


def new_token() -> str:
    return str(uuid.uuid4())


def validate_feature_collection(fc: dict, opts: AnalysisOptions, settings: Settings) -> int:
    features = fc.get("features") or []
    count = len(features)
    if count < 1:
        raise AppError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ["features"])

    limit = settings.geometry_limit_async if opts.async_mode else settings.geometry_limit_sync
    if count > limit:
        raise AppError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [limit])

    if opts.external_id_column and not validate_external_id_column(fc, opts.external_id_column):
        raise AppError(
            SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN,
            [opts.external_id_column, ", ".join(get_common_property_names(fc))],
        )
    return count


def _options_payload(opts: AnalysisOptions, timeout_seconds: int) -> dict:
    payload: dict = {"timeoutSeconds": timeout_seconds}
    if opts.external_id_column:
        payload["externalIdColumn"] = opts.external_id_column
    if opts.unit_type:
        payload["unitType"] = opts.unit_type
    if opts.national_codes:
        payload["nationalCodes"] = opts.national_codes
    if opts.async_mode:
        payload["async"] = True
    return payload


def _is_terminal_event(event: dict) -> bool:
    return JobProgress.from_redis(event).status in TERMINAL_STATUSES


def _completed_result(token: str, settings: Settings) -> SubmitResult:
    data = files.load_completed_result(token, settings)
    if data is None:
        raise AppError(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    return SubmitResult(
        SystemCode.ANALYSIS_COMPLETED,
        data=data,
        context={"token": token},
    )


def _raise_or_return_completed(
    token: str,
    code: SystemCode,
    detail: str | None,
    settings: Settings,
    *,
    timeout: int | None = None,
) -> SubmitResult:
    if code == SystemCode.ANALYSIS_COMPLETED:
        return _completed_result(token, settings)
    if code == SystemCode.ANALYSIS_TIMEOUT:
        raise AppError(SystemCode.ANALYSIS_TIMEOUT, [str(timeout)] if timeout is not None else None)
    if detail:
        raise AppError(code, cause=detail)
    raise AppError(code)


async def _wait_for_completion(token: str, timeout: int, settings: Settings) -> SubmitResult:
    event = await wait_for(token, _is_terminal_event)
    try:
        code = SystemCode(event["status"])
    except ValueError:
        code = SystemCode.ANALYSIS_ERROR
    return _raise_or_return_completed(
        token,
        code,
        event.get("error_message"),
        settings,
        timeout=timeout,
    )


async def submit(
    token: str, fc: dict, opts: AnalysisOptions, ctx: JobContext, settings: Settings
) -> SubmitResult:
    feature_count = len(fc.get("features") or [])
    timeout = settings.analysis_timeout_seconds(async_mode=opts.async_mode)
    options_payload = _options_payload(opts, timeout)

    await db_jobs.create_analysis_job(
        job_id=token,
        api_key_id=ctx.api_key_id,
        user_id=ctx.user_id,
        agent=ctx.agent,
        ip_address=ctx.ip_address,
        api_version=settings.api_version,
        endpoint=ctx.endpoint,
        feature_count=feature_count,
        analysis_options=options_payload,
        status=SystemCode.ANALYSIS_QUEUED,
        openforis_whisp_version=settings.openforis_whisp_version,
        earthengine_api_version=settings.earthengine_api_version,
        max_concurrent_analyses=ctx.max_concurrent_analyses,
    )

    await publish(
        token,
        JobProgress.of(
            SystemCode.ANALYSIS_QUEUED,
            feature_count=feature_count,
        ).to_redis(),
    )

    payload = dict(fc)
    if options_payload:
        payload["analysisOptions"] = options_payload
    files.atomic_write_json(files.input_path(token), payload)

    queue = "async" if opts.async_mode else "sync"
    celery_app.send_task(
        "src.worker.tasks.run_analysis",
        args=[token, asdict(opts), timeout],
        queue=queue,
        task_id=AnalysisTask.task_id_for(token),
        time_limit=timeout,
    )

    if opts.async_mode or ctx.agent == "ui":
        return SubmitResult(
            SystemCode.ANALYSIS_QUEUED,
            data={
                "token": token,
                "statusUrl": f"/status/{token}",
                "featureCount": feature_count,
            },
        )

    return await _wait_for_completion(token, timeout, settings)
