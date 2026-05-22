from fastapi import APIRouter

from src.config import SettingsDep

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
async def get_config(settings: SettingsDep) -> dict:
    return settings.public_config()
