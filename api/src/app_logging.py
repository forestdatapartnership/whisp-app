import contextvars
import logging
import logging.config
from typing import Any

from pythonjsonlogger import jsonlogger

from src.config import get_settings

_UVICORN_LOGGERS = ("uvicorn", "uvicorn.error", "uvicorn.access")
_LOG_FMT = (
    "%(levelname)s %(asctime)s %(name)s %(process)d %(processName)s %(message)s"
)

_context: contextvars.ContextVar[dict[str, Any]] = contextvars.ContextVar(
    "log_context", default={}
)


def resolve_level(name: str) -> int:
    return getattr(logging, name.upper(), logging.INFO)


def bind(**fields: Any) -> None:
    current = _context.get().copy()
    for key, value in fields.items():
        if value is not None:
            current[key] = value
    _context.set(current)


def clear_context() -> None:
    _context.set({})


class AppJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(
        self,
        log_record: dict[str, Any],
        record: logging.LogRecord,
        message_dict: dict[str, Any],
    ) -> None:
        super().add_fields(log_record, record, message_dict)
        for key, value in _context.get().items():
            if value is not None:
                log_record[key] = value


def log_config_dict() -> dict[str, Any]:
    level = get_settings().log_level.upper()
    uvicorn_loggers = {
        name: {"level": level, "handlers": [], "propagate": True}
        for name in _UVICORN_LOGGERS
    }
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "src.app_logging.AppJsonFormatter",
                "fmt": _LOG_FMT,
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": level,
            "handlers": ["console"],
        },
        "loggers": uvicorn_loggers,
    }


def configure() -> None:
    logging.config.dictConfig(log_config_dict())
