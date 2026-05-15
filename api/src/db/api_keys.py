from dataclasses import dataclass
from typing import Optional

from src.db.pool import get_pool


@dataclass
class ApiKeyRow:
    id: int
    user_id: int
    user_email: str
    rate_limit_window_ms: Optional[int]
    rate_limit_max_requests: Optional[int]
    max_concurrent_analyses: Optional[int]


async def find_api_key(api_key: str) -> Optional[ApiKeyRow]:
    pool = get_pool()
    if pool is None:
        return None

    row = await pool.fetchrow(
        "SELECT id, user_id, user_email, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses "
        "FROM find_api_key($1)",
        api_key,
    )
    if row is None:
        return None
    return ApiKeyRow(
        id=row["id"],
        user_id=row["user_id"],
        user_email=row["user_email"],
        rate_limit_window_ms=row["rate_limit_window_ms"],
        rate_limit_max_requests=row["rate_limit_max_requests"],
        max_concurrent_analyses=row["max_concurrent_analyses"],
    )
