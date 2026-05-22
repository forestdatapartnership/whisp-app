from dataclasses import dataclass

from src.db.pool import get_pool


@dataclass
class ApiKeyRow:
    id: int
    user_id: int
    rate_limit_window_ms: int | None
    rate_limit_max_requests: int | None
    max_concurrent_analyses: int | None


async def find_api_key(api_key: str) -> ApiKeyRow | None:
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, user_id, rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses "
        "FROM find_api_key($1)",
        api_key,
    )
    if row is None:
        return None
    return ApiKeyRow(
        id=row["id"],
        user_id=row["user_id"],
        rate_limit_window_ms=row["rate_limit_window_ms"],
        rate_limit_max_requests=row["rate_limit_max_requests"],
        max_concurrent_analyses=row["max_concurrent_analyses"],
    )
