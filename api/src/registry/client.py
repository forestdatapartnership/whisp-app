import asyncio
from typing import Any

import httpx

from src.codes import SystemCode
from src.config import get_settings
from src.exceptions import AppError

_RETRY_DELAY_S = 0.5
_MAX_ATTEMPTS = 2


def _is_retryable(status: int) -> bool:
    return status >= 500 or status in (408, 429)


async def _request(client: httpx.AsyncClient, url: str) -> dict[str, Any] | None:
    cause: str | None = None
    for attempt in range(_MAX_ATTEMPTS):
        if attempt > 0:
            await asyncio.sleep(_RETRY_DELAY_S)
        try:
            resp = await client.get(url)
        except Exception as e:
            cause = str(e)
            continue
        if resp.status_code == 200:
            return resp.json()
        if resp.status_code == 404:
            return None
        cause = f"{resp.status_code} {resp.text}"
        if not _is_retryable(resp.status_code):
            break
    raise AppError(SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE, cause=f"Operation failed: {cause}")


async def resolve_geo_ids(geo_ids: list[str], collection: str | None = None) -> list[dict | None]:
    settings = get_settings()
    if not settings.asset_registry_base_url or not settings.asset_registry_catalog:
        raise AppError(SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED)

    coll = collection or settings.asset_registry_collection
    if not coll:
        raise AppError(SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED)

    base = settings.asset_registry_base_url.rstrip("/")
    results: list[dict | None] = [None] * len(geo_ids)
    sem = asyncio.Semaphore(settings.asset_registry_concurrency)

    async with httpx.AsyncClient(timeout=30) as client:
        async def _resolve_one(i: int, geo_id: str):
            url = f"{base}/catalog/features/catalogs/{settings.asset_registry_catalog}/collections/{coll}/items/{geo_id}"
            async with sem:
                data = await _request(client, url)
            if isinstance(data, dict) and data.get("type") == "Feature" and data.get("geometry"):
                results[i] = {**data, "properties": {**(data.get("properties") or {}), "geoid": geo_id}}

        await asyncio.gather(*[_resolve_one(i, gid) for i, gid in enumerate(geo_ids)])

    return results
