from fastapi import APIRouter

from src.auth.api_key import DEFAULT_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_WINDOW_MS
from src.config import SettingsDep
from src.db.rate_limits import find_global_rate_limits
from src.schemas import PublicConfigResponse

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=PublicConfigResponse)
async def get_config(settings: SettingsDep) -> dict:
    limits = await find_global_rate_limits()
    return {
        **settings.public_config(),
        "rateLimitWindowMs": limits.get("rate_limit_window_ms") or DEFAULT_RATE_LIMIT_WINDOW_MS,
        "rateLimitMaxRequests": limits.get("rate_limit_max_requests") or DEFAULT_RATE_LIMIT_MAX_REQUESTS,
        "maxConcurrentAnalyses": limits.get("max_concurrent_analyses"),
    }
