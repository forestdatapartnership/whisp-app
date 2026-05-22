from collections.abc import Sequence
from typing import Any

from fastapi.responses import JSONResponse

from src.codes import SystemCode


def api_envelope(
    code: SystemCode,
    *,
    args: Sequence[str] | int | float | None = None,
    data: Any = None,
    context: dict | None = None,
    cause: str | None = None,
    **extra: Any,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "code": code.value,
        "message": code.format(args),
    }
    if data is not None:
        body["data"] = data
    if context:
        body["context"] = context
    if cause:
        body["cause"] = cause
    body.update(extra)
    return body


def api_response(
    code: SystemCode,
    *,
    args: Sequence[str] | int | float | None = None,
    data: Any = None,
    context: dict | None = None,
    cause: str | None = None,
    **extra: Any,
) -> JSONResponse:
    return JSONResponse(
        status_code=code.http_status,
        content=api_envelope(code, args=args, data=data, context=context, cause=cause, **extra),
    )
