import logging
import traceback

from fastapi import FastAPI, Request

from src.codes import SystemCode
from src.responses import api_response

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, code: SystemCode, args: list | None = None, cause: str | None = None):
        self.code = code
        self.format_args = args
        self.cause = cause
        super().__init__(code.format(args))


def register(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_req: Request, exc: AppError):
        logger.warning("app_error code=%s cause=%s", exc.code.value, exc.cause or "")
        return api_response(exc.code, args=exc.format_args, cause=exc.cause)

    @app.exception_handler(Exception)
    async def _unhandled(_req: Request, exc: Exception):
        logger.error("%s: %s\n%s", type(exc).__name__, exc, traceback.format_exc())
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)
