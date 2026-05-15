import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.codes import SystemCode, format_message, http_status

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: SystemCode, args: list | None = None, cause: str | None = None):
        self.code = code
        self.format_args = args
        self.cause = cause
        super().__init__(format_message(code, args))


def error_body(code: SystemCode, args: list | None = None, cause: str | None = None) -> dict:
    body: dict = {"code": code.value, "message": format_message(code, args)}
    if args:
        body["args"] = args
    if cause:
        body["cause"] = cause
    return body


def register(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_req: Request, exc: AppError):
        logger.warning("app_error code=%s cause=%s", exc.code.value, exc.cause or "")
        return JSONResponse(status_code=http_status(exc.code), content=error_body(exc.code, exc.format_args, exc.cause))

    @app.exception_handler(Exception)
    async def _unhandled(_req: Request, exc: Exception):
        logger.error("%s: %s\n%s", type(exc).__name__, exc, traceback.format_exc())
        return JSONResponse(status_code=500, content=error_body(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR, cause=str(exc)))
