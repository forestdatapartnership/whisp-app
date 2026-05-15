import asyncio
import logging
import uuid
from dataclasses import asdict

from src.codes import SystemCode, format_message
from src.config import get_settings
from src.db import jobs as db_jobs
from src.exceptions import AppError
from src.status import service as jobs
from src.submit.schemas import AnalysisOptions, JobContext
from src.submit.validators import get_common_property_names, validate_external_id_column
from src.worker.celery_app import app as celery_app

logger = logging.getLogger(__name__)


def new_token() -> str:
    return str(uuid.uuid4())


def validate_feature_collection(fc: dict, opts: AnalysisOptions) -> int:
    features = fc.get("features") or []
    count = len(features)
    if count < 1:
        raise AppError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ["features"])

    settings = get_settings()
    limit = settings.geometry_limit_async if opts.async_mode else settings.geometry_limit_sync
    if count > limit:
        raise AppError(SystemCode.VALIDATION_TOO_MANY_GEOMETRIES, [limit])

    if opts.external_id_column and not validate_external_id_column(fc, opts.external_id_column):
        raise AppError(
            SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN,
            [opts.external_id_column, ", ".join(get_common_property_names(fc))],
        )
    return count


async def enforce_concurrency(ctx: JobContext) -> None:
    if not ctx.max_concurrent_analyses or not ctx.user_id:
        return
    running = await db_jobs.count_running_for_user(ctx.user_id)
    if running >= ctx.max_concurrent_analyses:
        raise AppError(SystemCode.ANALYSIS_TOO_MANY_CONCURRENT)


def _options_payload(opts: AnalysisOptions) -> dict | None:
    payload: dict = {}
    if opts.external_id_column:
        payload["externalIdColumn"] = opts.external_id_column
    if opts.unit_type:
        payload["unitType"] = opts.unit_type
    if opts.national_codes:
        payload["nationalCodes"] = opts.national_codes
    if opts.async_mode:
        payload["async"] = True
    return payload or None


async def submit(token: str, fc: dict, opts: AnalysisOptions, ctx: JobContext) -> dict:
    settings = get_settings()
    feature_count = len(fc.get("features") or [])
    options_payload = _options_payload(opts)

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
    )

    payload = dict(fc)
    if options_payload:
        payload["analysisOptions"] = options_payload
    jobs.atomic_write_json(jobs.input_path(token), payload)

    queue = "async" if opts.async_mode else "sync"
    celery_app.send_task(
        "src.worker.tasks.run_analysis",
        args=[token, asdict(opts)],
        queue=queue,
    )

    if opts.async_mode:
        return {
            "code": SystemCode.ANALYSIS_QUEUED.value,
            "message": format_message(SystemCode.ANALYSIS_QUEUED),
            "data": {
                "token": token,
                "statusUrl": f"/status/{token}",
                "featureCount": feature_count,
            },
        }

    return await _wait_for_completion(token, settings.analysis_timeout_seconds + 60)


_listener_conn = None
_listener_events: dict[str, asyncio.Event] = {}


async def _ensure_listener():
    global _listener_conn
    if _listener_conn is not None:
        return
    import asyncpg
    from src.config import get_settings

    s = get_settings()
    _listener_conn = await asyncpg.connect(
        host=s.db_host, port=s.db_port, database=s.db_name,
        user=s.db_user, password=s.db_password,
    )

    def _on_notify(connection, pid, channel, payload):
        event = _listener_events.pop(payload, None)
        if event:
            event.set()

    await _listener_conn.add_listener("job_update", _on_notify)
    await _listener_conn.execute("LISTEN job_update")
    logger.info("shared LISTEN connection established")


async def _wait_for_completion(token: str, timeout: int) -> dict:
    await _ensure_listener()

    event = asyncio.Event()
    _listener_events[token] = event

    try:
        job = await db_jobs.get_job(token)
        if job:
            try:
                code = SystemCode(job["status"])
            except ValueError:
                code = SystemCode.ANALYSIS_ERROR
            if code in (SystemCode.ANALYSIS_COMPLETED, SystemCode.ANALYSIS_ERROR, SystemCode.ANALYSIS_TIMEOUT):
                event.set()

        try:
            await asyncio.wait_for(event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            raise AppError(SystemCode.ANALYSIS_TIMEOUT, cause=f"Timed out after {timeout}s")

        job = await db_jobs.get_job(token)
        if not job:
            raise AppError(SystemCode.ANALYSIS_JOB_NOT_FOUND)

        try:
            code = SystemCode(job["status"])
        except ValueError:
            code = SystemCode.ANALYSIS_ERROR

        if code == SystemCode.ANALYSIS_COMPLETED:
            result_path = jobs.result_path(token)
            if result_path.exists():
                return {
                    "code": code.value,
                    "message": format_message(code),
                    "data": jobs.read_json(result_path),
                }
            return {"code": code.value, "message": format_message(code)}

        raise AppError(code, cause=job.get("error_message"))
    finally:
        _listener_events.pop(token, None)
