from dataclasses import dataclass

from fastapi import Header

from src.app_logging import bind
from src.auth.rate_limiter import check_rate_limit
from src.codes import SystemCode
from src.db.api_keys import ApiKeyRow, find_api_key
from src.exceptions import AppError

_DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000
_DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30


@dataclass
class ApiKey:
    key_id: int
    user_id: int
    max_concurrent_analyses: int | None


async def api_key_dependency(
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
) -> ApiKey:
    if not x_api_key:
        raise AppError(SystemCode.AUTH_MISSING_API_KEY)

    row: ApiKeyRow | None = await find_api_key(x_api_key)
    if row is None:
        raise AppError(SystemCode.AUTH_INVALID_API_KEY)

    bind(user_id=row.user_id, api_key_id=row.id)

    window_ms = row.rate_limit_window_ms or _DEFAULT_RATE_LIMIT_WINDOW_MS
    limit = row.rate_limit_max_requests or _DEFAULT_RATE_LIMIT_MAX_REQUESTS

    result = check_rate_limit(str(row.id), window_ms, limit)
    if not result.allowed:
        raise AppError(SystemCode.AUTH_RATE_LIMIT_EXCEEDED, [result.retry_after])

    return ApiKey(row.id, row.user_id, row.max_concurrent_analyses)
