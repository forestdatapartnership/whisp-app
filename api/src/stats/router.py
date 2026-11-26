import asyncio
import time

from fastapi import APIRouter

from src.db.stats import find_public_stats
from src.schemas import PublicStatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

_TTL_SECONDS = 300
_lock = asyncio.Lock()
_cached: tuple[float, dict] = (0.0, {})


@router.get(
    "",
    response_model=PublicStatsResponse,
    description="Usage statistics of completed analyses, refreshed every five minutes.",
)
async def get_stats() -> dict:
    global _cached
    async with _lock:
        if _cached[0] <= time.monotonic():
            _cached = (time.monotonic() + _TTL_SECONDS, await find_public_stats())
    return _cached[1]
