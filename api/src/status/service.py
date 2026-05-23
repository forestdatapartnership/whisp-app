import json

from fastapi.responses import JSONResponse

from src.codes import RUNNING_STATUSES, SystemCode
from src.config import Settings
from src.db import jobs as db_jobs
from src.io.files import load_completed_result
from src.job_progress import JobProgress
from src.redis import get, publish
from src.responses import api_response
from src.worker.celery_app import app as celery_app
from src.worker.analysis_task import AnalysisTask


async def get_job_state(token: str) -> JobProgress | None:
    state = await get(token)
    if state is not None:
        return JobProgress.from_redis(state, id=token)
    db_job = await db_jobs.get_job(token)
    if db_job is not None:
        return JobProgress.from_db(db_job)
    return None


async def terminal_api_response(token: str, job: JobProgress) -> JSONResponse:
    if job.status == SystemCode.ANALYSIS_TIMEOUT:
        db_job = await db_jobs.get_job(token)
        timeout = db_job.get("timeout_seconds") if db_job else None
        if timeout is not None:
            return api_response(job.status, args=[str(timeout)])
    return api_response(job.status, cause=job.error_message)


async def terminate_analysis(token: str, error_message: str | None = None) -> None:
    celery_app.control.revoke(AnalysisTask.task_id_for(token), terminate=True, signal="SIGKILL")
    job = await db_jobs.get_job(token)
    if not job or JobProgress.from_db(job).status not in RUNNING_STATUSES:
        return
    updates: dict = {
        "status": SystemCode.ANALYSIS_CANCELLED,
        "completed_at": db_jobs.utc_now(),
    }
    if error_message:
        updates["error_message"] = error_message
    await db_jobs.update_analysis_job(token, **updates)
    await publish(
        token,
        JobProgress.of(
            SystemCode.ANALYSIS_CANCELLED,
            error_message=error_message,
        ).to_redis(),
    )


def progress_api_data(job: JobProgress, *, token: str | None = None) -> dict:
    data: dict = {}
    if token is not None:
        data["token"] = token
    if job.feature_count is not None:
        data["featureCount"] = job.feature_count
    if job.percent is not None:
        data["percent"] = job.percent
    if job.messages:
        data["processStatusMessages"] = job.messages
    return data


def sse_bytes(payload: dict) -> bytes:
    return f"data: {json.dumps(payload)}\n\n".encode("utf-8")


def not_found_sse() -> bytes:
    return sse_bytes({"code": SystemCode.ANALYSIS_JOB_NOT_FOUND.value, "final": True})


def terminal_sse_payload(token: str, job: JobProgress, settings: Settings | None) -> dict:
    payload: dict = {"code": job.status.value, "final": True}
    if job.status == SystemCode.ANALYSIS_COMPLETED:
        data = load_completed_result(token, settings)
        if data is not None:
            payload["data"] = data
    elif job.error_message:
        payload["cause"] = job.error_message
    return payload


def terminal_sse(token: str, job: JobProgress, settings: Settings | None) -> bytes:
    return sse_bytes(terminal_sse_payload(token, job, settings))


def progress_sse(job: JobProgress, *, token: str | None = None) -> bytes:
    code = job.status.value if token is not None else SystemCode.ANALYSIS_PROCESSING.value
    return sse_bytes({"code": code, "data": progress_api_data(job, token=token)})
