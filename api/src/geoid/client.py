import asyncio
import uuid
from typing import Any

import httpx

from src.codes import SystemCode
from src.config import Settings
from src.exceptions import AppError

_RETRY_DELAY_S = 0.5
_MAX_ATTEMPTS = 2


def _is_retryable(status: int) -> bool:
    return status >= 500 or status in (408, 429)


def _check_geo_id(geo_id: str) -> None:
    try:
        uuid.UUID(geo_id)
    except ValueError:
        raise AppError(SystemCode.VALIDATION_INVALID_GEO_ID, args=[geo_id])


async def _request(client: httpx.AsyncClient, url: str, geo_id: str) -> dict[str, Any] | None:
    cause: str | None = None
    headers = {"Accept": "application/geo+json, application/json"}
    for attempt in range(_MAX_ATTEMPTS):
        if attempt > 0:
            await asyncio.sleep(_RETRY_DELAY_S)
        try:
            resp = await client.get(url, headers=headers)
        except Exception as e:
            cause = str(e)
            continue
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 404:
            return None
        if 400 <= resp.status_code < 500 and not _is_retryable(resp.status_code):
            raise AppError(SystemCode.VALIDATION_INVALID_GEO_ID, args=[geo_id])
        cause = f"{resp.status_code} {resp.text}"
        if not _is_retryable(resp.status_code):
            break
    raise AppError(SystemCode.SERVICE_GEOID_UNAVAILABLE, cause=f"Operation failed: {cause}")


async def resolve_geo_ids(geo_ids: list[str], settings: Settings) -> list[dict | None]:
    if not settings.geoid_base_url:
        raise AppError(SystemCode.SERVICE_GEOID_NOT_CONFIGURED)

    base = settings.geoid_base_url.rstrip("/")
    results: list[dict | None] = [None] * len(geo_ids)
    sem = asyncio.Semaphore(settings.geoid_resolve_concurrency)

    async with httpx.AsyncClient(timeout=30) as client:
        async def _resolve_one(i: int, geo_id: str):
            _check_geo_id(geo_id)
            url = f"{base}/{geo_id}"
            async with sem:
                data = await _request(client, url, geo_id)
            if isinstance(data, dict) and data.get("type") == "Feature" and data.get("geometry"):
                results[i] = {**data, "properties": {**(data.get("properties") or {}), "geoid": geo_id}}

        await asyncio.gather(*[_resolve_one(i, gid) for i, gid in enumerate(geo_ids)])

    return results
