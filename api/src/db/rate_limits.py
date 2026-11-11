from src.db.pool import get_pool


async def find_global_rate_limits() -> dict:
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT rate_limit_window_ms, rate_limit_max_requests, max_concurrent_analyses "
        "FROM rate_limits_global WHERE id = 1"
    )
    return dict(row) if row else {}
