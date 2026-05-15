from dataclasses import dataclass
from typing import Optional

from fastapi import Header, Request

from src.auth.rate_limiter import check_rate_limit
from src.codes import SystemCode
from src.config import get_settings
from src.db.api_keys import ApiKeyRow, find_api_key
from src.exceptions import AppError


@dataclass
class ApiKey:
    key_id: int
    user_id: int
    user_email: str
    max_concurrent_analyses: Optional[int]
    raw: str


async def api_key_dependency(
    request: Request,
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
) -> ApiKey:
    if not x_api_key:
        raise AppError(SystemCode.AUTH_MISSING_API_KEY)

    row: Optional[ApiKeyRow] = await find_api_key(x_api_key)
    if row is None:
        raise AppError(SystemCode.AUTH_INVALID_API_KEY)

    settings = get_settings()
    window_ms = row.rate_limit_window_ms or settings.rate_limit_window_ms
    limit = row.rate_limit_max_requests or settings.rate_limit_max_requests

    key = f"{row.id}:{request.url.path}"
    result = check_rate_limit(key, window_ms, limit)
    if not result.allowed:
        raise AppError(SystemCode.AUTH_RATE_LIMIT_EXCEEDED, [result.retry_after])

    return ApiKey(
        key_id=row.id,
        user_id=row.user_id,
        user_email=row.user_email,
        max_concurrent_analyses=row.max_concurrent_analyses,
        raw=x_api_key,
    )
