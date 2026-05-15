import asyncio
import json
from typing import AsyncIterator

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from src.codes import SystemCode, format_message, http_status
from src.db import jobs as db_jobs
from src.status import service

router = APIRouter(prefix="/status", tags=["status"])


def _envelope(code: SystemCode, data=None, context: dict | None = None, cause: str | None = None) -> JSONResponse:
    body: dict = {"code": code.value, "message": format_message(code)}
    if data is not None:
        body["data"] = data
    if context:
        body["context"] = context
    if cause:
        body["cause"] = cause
    return JSONResponse(status_code=http_status(code), content=body)


def _sse(payload: dict) -> bytes:
    return f"data: {json.dumps(payload)}\n\n".encode("utf-8")


@router.get("/{token}")
async def get_status(token: str) -> JSONResponse:
    job = await db_jobs.get_job(token)
    if not job:
        return _envelope(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    try:
        code = SystemCode(job["status"])
    except ValueError:
        code = SystemCode.ANALYSIS_ERROR

    data: dict = {"token": token}
    if job.get("feature_count") is not None:
        data["featureCount"] = job["feature_count"]
    if job.get("progress_percent") is not None:
        data["percent"] = job["progress_percent"]
    if job.get("progress_message"):
        data["processStatusMessages"] = [job["progress_message"]]

    if code == SystemCode.ANALYSIS_COMPLETED:
        if service.result_path(token).exists():
            data = service.read_json(service.result_path(token))
        else:
            return _envelope(SystemCode.ANALYSIS_RESULT_NOT_FOUND)

    return _envelope(code, data=data, cause=job.get("error_message"))


@router.get("/{token}/stream")
async def status_stream(token: str, request: Request) -> StreamingResponse:
    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }

    job = await db_jobs.get_job(token)
    if not job:
        body = _sse({"code": SystemCode.ANALYSIS_JOB_NOT_FOUND.value, "final": True})
        return StreamingResponse(iter([body]), headers=headers)

    try:
        code = SystemCode(job["status"])
    except ValueError:
        code = SystemCode.ANALYSIS_ERROR

    if code in (SystemCode.ANALYSIS_COMPLETED, SystemCode.ANALYSIS_ERROR, SystemCode.ANALYSIS_TIMEOUT):
        payload: dict = {"code": code.value, "final": True}
        if code == SystemCode.ANALYSIS_COMPLETED and service.result_path(token).exists():
            payload["data"] = service.read_json(service.result_path(token))
        if job.get("error_message"):
            payload["cause"] = job["error_message"]
        return StreamingResponse(iter([_sse(payload)]), headers=headers)

    async def _gen() -> AsyncIterator[bytes]:
        last_percent = job.get("progress_percent") or -1
        yield _sse({
            "code": code.value,
            "data": {
                "featureCount": job.get("feature_count"),
                "percent": job.get("progress_percent"),
            },
        })

        while True:
            if await request.is_disconnected():
                break
            await asyncio.sleep(2)

            current = await db_jobs.get_job(token)
            if not current:
                break

            try:
                current_code = SystemCode(current["status"])
            except ValueError:
                break

            if current_code in (SystemCode.ANALYSIS_COMPLETED, SystemCode.ANALYSIS_ERROR, SystemCode.ANALYSIS_TIMEOUT):
                payload = {"code": current_code.value, "final": True}
                if current_code == SystemCode.ANALYSIS_COMPLETED and service.result_path(token).exists():
                    payload["data"] = service.read_json(service.result_path(token))
                if current.get("error_message"):
                    payload["cause"] = current["error_message"]
                yield _sse(payload)
                break

            percent = current.get("progress_percent")
            if percent is not None and percent != last_percent:
                last_percent = percent
                yield _sse({
                    "code": SystemCode.ANALYSIS_PROCESSING.value,
                    "data": {
                        "percent": percent,
                        "processStatusMessages": [current.get("progress_message", "")] if current.get("progress_message") else [],
                    },
                })

    return StreamingResponse(_gen(), headers=headers)
