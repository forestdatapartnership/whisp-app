from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    temp_dir: Path = Field(default=Path("./temp"))
    ee_credential_path: Path = Field(default=Path("./credentials.json"))

    geometry_limit_sync: int = 500
    geometry_limit_async: int = 10000
    analysis_timeout_seconds: int = 1800

    asset_registry_base_url: str = ""
    asset_registry_catalog: str = ""
    asset_registry_collection: str = ""
    asset_registry_concurrency: int = 20

    allowed_origins: str = "*"

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_min_pool_size: int = 1
    db_max_pool_size: int = 10

    rate_limit_window_ms: int = 60_000
    rate_limit_max_requests: int = 30

    redis_url: str = "redis://localhost:6379"
    celery_broker_url: str = ""

    api_version: str = "0.0.0"

    @property
    def broker_url(self) -> str:
        return self.celery_broker_url or self.redis_url

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.temp_dir.mkdir(parents=True, exist_ok=True)
    return s
