import json
import logging
import threading
from collections.abc import AsyncIterator, Callable
from typing import Any

from src.config import get_settings

logger = logging.getLogger(__name__)

_async_redis = None
_worker_redis = threading.local()

_PUBSUB_POLL_SECONDS = 30.0
_SNAPSHOT_TTL_SECONDS = 600


def _state_key(job_id: str) -> str:
    return f"job:{job_id}:state"


def _channel(job_id: str) -> str:
    return f"job:{job_id}:events"


def _parse(data: str | bytes | dict) -> dict[str, Any]:
    if isinstance(data, dict):
        return data
    if isinstance(data, bytes):
        data = data.decode("utf-8")
    return json.loads(data)


def _sync_redis():
    if not getattr(_worker_redis, "client", None):
        import redis

        _worker_redis.client = redis.from_url(get_settings().redis_url, decode_responses=True)
    return _worker_redis.client


def _store_and_publish(body: str, job_id: str) -> None:
    r = _sync_redis()
    pipe = r.pipeline()
    pipe.setex(_state_key(job_id), _SNAPSHOT_TTL_SECONDS, body)
    pipe.publish(_channel(job_id), body)
    pipe.execute()


def publish_sync(job_id: str, data: dict[str, Any]) -> None:
    try:
        _store_and_publish(json.dumps(data), job_id)
    except Exception:
        logger.exception("redis publish failed for job %s", job_id)


async def init_redis() -> None:
    global _async_redis
    if _async_redis is not None:
        return
    import redis.asyncio as aioredis

    _async_redis = aioredis.from_url(get_settings().redis_url, decode_responses=True)
    await _async_redis.ping()


async def close_redis() -> None:
    global _async_redis
    if _async_redis is not None:
        await _async_redis.aclose()
        _async_redis = None


def _async_redis_client():
    if _async_redis is None:
        raise RuntimeError("redis not initialized")
    return _async_redis


async def check_redis() -> None:
    await _async_redis_client().ping()


async def publish(job_id: str, data: dict[str, Any]) -> None:
    try:
        body = json.dumps(data)
        r = _async_redis_client()
        await r.setex(_state_key(job_id), _SNAPSHOT_TTL_SECONDS, body)
        await r.publish(_channel(job_id), body)
    except Exception:
        logger.exception("redis publish failed for job %s", job_id)


async def get(job_id: str) -> dict[str, Any] | None:
    try:
        raw = await _async_redis_client().get(_state_key(job_id))
        return _parse(raw) if raw is not None else None
    except Exception:
        logger.exception("redis get failed for job %s", job_id)
        return None


async def _pubsub_bodies(job_id: str) -> AsyncIterator[str | None]:
    pubsub = _async_redis_client().pubsub()
    await pubsub.subscribe(_channel(job_id))
    try:
        while True:
            msg = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=_PUBSUB_POLL_SECONDS,
            )
            if msg is None:
                yield None
            elif msg.get("type") == "message":
                yield msg["data"]
    finally:
        await pubsub.unsubscribe(_channel(job_id))
        await pubsub.aclose()


async def wait_for(job_id: str, until: Callable[[dict[str, Any]], bool]) -> dict[str, Any]:
    state = await get(job_id)
    if state and until(state):
        return state

    async for body in _pubsub_bodies(job_id):
        if body is None:
            state = await get(job_id)
            if state and until(state):
                return state
            continue
        state = _parse(body)
        if until(state):
            return state


async def subscribe(job_id: str, *, skip_cached: bool = False) -> AsyncIterator[dict[str, Any]]:
    state = await get(job_id)
    if state and not skip_cached:
        yield state

    last_body = json.dumps(state, sort_keys=True) if state else None
    async for body in _pubsub_bodies(job_id):
        if body is None or body == last_body:
            continue
        last_body = body
        yield _parse(body)
