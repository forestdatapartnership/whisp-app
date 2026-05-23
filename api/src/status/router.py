from typing import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse

from src.auth.api_key import ApiKey, api_key_dependency
from src.config import SettingsDep
from src.codes import SystemCode, RUNNING_STATUSES, TERMINAL_STATUSES
from src.io.files import load_completed_result
from src.job_progress import JobProgress
from src.responses import api_response
from src.redis import subscribe
from src.status import service

router = APIRouter(prefix="/status", tags=["status"])

_SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
}


@router.get("/{token}")
async def get_status(
    token: str,
    settings: SettingsDep,
    _api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    job = await service.get_job_state(token)
    if not job:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    if job.status == SystemCode.ANALYSIS_COMPLETED:
        data = load_completed_result(token, settings)
        if data is None:
            return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
        return api_response(job.status, data=data)

    if job.status in RUNNING_STATUSES:
        return api_response(job.status, data=service.progress_api_data(job, token=token))

    return await service.terminal_api_response(token, job)


@router.post("/{token}/cancel")
async def cancel_status(
    token: str,
    _api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    job = await service.get_job_state(token)
    if not job:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    if job.status in TERMINAL_STATUSES:
        return await service.terminal_api_response(token, job)

    message = "Cancelled by user"
    await service.terminate_analysis(token, message)
    return api_response(
        SystemCode.ANALYSIS_CANCELLED,
        context={"token": token},
        cause=message,
    )


@router.get("/{token}/stream")
async def status_stream(
    token: str,
    request: Request,
    settings: SettingsDep,
    _api_key: ApiKey = Depends(api_key_dependency),
) -> StreamingResponse:
    job = await service.get_job_state(token)
    if not job:
        return StreamingResponse(iter([service.not_found_sse()]), headers=_SSE_HEADERS)

    if job.status in TERMINAL_STATUSES:
        return StreamingResponse(
            iter([service.terminal_sse(token, job, settings)]),
            headers=_SSE_HEADERS,
        )

    async def _gen() -> AsyncIterator[bytes]:
        yield service.progress_sse(job, token=token)

        async for event in subscribe(token, skip_cached=True):
            if await request.is_disconnected():
                break

            progress = JobProgress.from_redis(event, id=token)
            if progress.status in TERMINAL_STATUSES:
                yield service.terminal_sse(token, progress, settings)
                break

            yield service.progress_sse(progress)

    return StreamingResponse(_gen(), headers=_SSE_HEADERS)
