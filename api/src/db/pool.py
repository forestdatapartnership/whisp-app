import asyncio
import logging
import threading
from collections.abc import Callable, Coroutine
from typing import Any, TypeVar

import asyncpg

from src.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

_pool: asyncpg.Pool | None = None
_worker_local = threading.local()


def connection_params() -> dict[str, str | int]:
    s = get_settings()
    if not s.db_name or not s.db_user:
        raise RuntimeError("DB_NAME and DB_USER are required")

    return {
        "host": s.db_host,
        "port": s.db_port,
        "database": s.db_name,
        "user": s.db_user,
        "password": s.db_password,
    }


async def _create_pool() -> asyncpg.Pool:
    params = connection_params()
    s = get_settings()
    pool = await asyncpg.create_pool(
        **params,
        min_size=s.db_min_pool_size,
        max_size=s.db_max_pool_size,
    )
    async with pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
    logger.info(
        "database pool initialized (%s@%s:%s/%s)",
        params["user"],
        params["host"],
        params["port"],
        params["database"],
    )
    return pool


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    _pool = await _create_pool()
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
    _reset_worker_pool()


def get_pool() -> asyncpg.Pool:
    if _pool is not None:
        return _pool
    pool = getattr(_worker_local, "pool", None)
    if pool is not None:
        return pool
    raise RuntimeError("database pool not initialized")


async def acquire_pool() -> asyncpg.Pool:
    return get_pool()


def _worker_loop() -> asyncio.AbstractEventLoop:
    loop = getattr(_worker_local, "loop", None)
    if loop is None:
        loop = asyncio.new_event_loop()
        _worker_local.loop = loop
    return loop


def _reset_worker_pool() -> None:
    pool = getattr(_worker_local, "pool", None)
    loop = getattr(_worker_local, "loop", None)
    if pool is not None and loop is not None:
        try:
            loop.run_until_complete(pool.close())
        except Exception:
            pass
    _worker_local.pool = None


def _ensure_worker_pool(loop: asyncio.AbstractEventLoop) -> asyncpg.Pool:
    if _pool is not None:
        return _pool
    pool = getattr(_worker_local, "pool", None)
    if pool is None:
        pool = loop.run_until_complete(_create_pool())
        _worker_local.pool = pool
    return pool


def _run_sync(factory: Callable[[], Coroutine[Any, Any, T]]) -> T:
    loop = _worker_loop()
    _ensure_worker_pool(loop)
    try:
        return loop.run_until_complete(factory())
    except Exception:
        _reset_worker_pool()
        _ensure_worker_pool(loop)
        return loop.run_until_complete(factory())


def run_sync(fn: Callable[..., Coroutine[Any, Any, T]], /, *args: Any, **kwargs: Any) -> T:
    return _run_sync(lambda: fn(*args, **kwargs))


async def check_db() -> None:
    async with acquire_pool().acquire() as conn:
        await conn.fetchval("SELECT 1")
