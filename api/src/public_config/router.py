from fastapi import APIRouter

from src.config import SettingsDep
from src.schemas import PublicConfigResponse

router = APIRouter(prefix="/config", tags=["config"])


@router.get("", response_model=PublicConfigResponse)
async def get_config(settings: SettingsDep) -> dict:
    return settings.public_config()
