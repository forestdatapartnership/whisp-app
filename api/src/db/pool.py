import asyncio
import logging
import os
import threading
from collections.abc import Callable, Coroutine
from typing import Any, TypeVar

import asyncpg

from src.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T")

_POOL_CLOSE_TIMEOUT = 10.0

_pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()
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
    pool = await asyncio.wait_for(
        asyncpg.create_pool(
            **params,
            min_size=s.db_min_pool_size,
            max_size=s.db_max_pool_size,
            statement_cache_size=0,
            max_inactive_connection_lifetime=300,
            command_timeout=s.db_command_timeout,
        ),
        timeout=s.db_connect_timeout,
    )
    try:
        async with pool.acquire() as conn:
            await asyncio.wait_for(conn.fetchval("SELECT 1"), timeout=s.db_connect_timeout)
    except BaseException:
        await pool.close()
        raise
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
    async with _pool_lock:
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
    if loop is not None:
        logger.warning("resetting worker db pool (pid=%d)", os.getpid())
        if pool is not None:
            try:
                loop.run_until_complete(asyncio.wait_for(pool.close(), timeout=_POOL_CLOSE_TIMEOUT))
            except Exception:
                logger.exception("worker pool close failed, terminating (pid=%d)", os.getpid())
                pool.terminate()
        loop.close()
    _worker_local.pool = None
    _worker_local.loop = None


def _ensure_worker_pool(loop: asyncio.AbstractEventLoop) -> asyncpg.Pool:
    pool = getattr(_worker_local, "pool", None)
    if pool is None:
        logger.info("creating worker db pool (pid=%d)", os.getpid())
        pool = loop.run_until_complete(_create_pool())
        _worker_local.pool = pool
    return pool


def run_sync(fn: Callable[..., Coroutine[Any, Any, T]], /, *args: Any, **kwargs: Any) -> T:
    def factory() -> Coroutine[Any, Any, T]:
        return fn(*args, **kwargs)

    loop = _worker_loop()
    _ensure_worker_pool(loop)
    try:
        return loop.run_until_complete(factory())
    except Exception as exc:
        logger.warning(
            "db query failed, resetting pool and retrying (pid=%d, error=%s: %s)",
            os.getpid(),
            type(exc).__name__,
            exc,
        )
        _reset_worker_pool()
        loop = _worker_loop()
        _ensure_worker_pool(loop)
        return loop.run_until_complete(factory())
