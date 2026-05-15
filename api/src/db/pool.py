import logging
from typing import Optional

import asyncpg

from src.config import get_settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is not None:
        return _pool

    s = get_settings()
    if not s.db_name or not s.db_user:
        logger.warning("database not configured; persistence and api key validation will be disabled")
        return None

    _pool = await asyncpg.create_pool(
        host=s.db_host,
        port=s.db_port,
        database=s.db_name,
        user=s.db_user,
        password=s.db_password,
        min_size=s.db_min_pool_size,
        max_size=s.db_max_pool_size,
    )
    logger.info("database pool initialized (%s@%s:%s/%s)", s.db_user, s.db_host, s.db_port, s.db_name)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool
