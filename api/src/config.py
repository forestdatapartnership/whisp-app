from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_API_ROOT = Path(__file__).resolve().parents[1]
_ENV_FILES = (_API_ROOT / ".env", _API_ROOT / ".env.local")


def _load_package_version(distribution: str) -> str:
    try:
        from importlib.metadata import version

        return version(distribution)
    except Exception:
        return "0.0.0"


def _load_api_version() -> str:
    return _load_package_version("whisp-api")


def _load_openforis_whisp_version() -> str:
    return _load_package_version("openforis-whisp")


def _load_earthengine_api_version() -> str:
    return _load_package_version("earthengine-api")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    temp_dir: Path = Field(default=Path("./temp"))
    ee_credential_path: Path = Field(default=Path("./credentials.json"))

    max_request_body_size_kb: int | None = None

    geometry_limit_sync: int = 500
    geometry_limit_async: int = 10000
    analysis_timeout_sync_seconds: int = 60
    analysis_timeout_async_seconds: int = 1800

    @field_validator("analysis_timeout_sync_seconds")
    @classmethod
    def _sync_timeout_cap(cls, value: int) -> int:
        if value > 60:
            raise ValueError("analysis_timeout_sync_seconds must not exceed 60")
        return value

    def analysis_timeout_seconds(self, *, async_mode: bool) -> int:
        return (
            self.analysis_timeout_async_seconds
            if async_mode
            else self.analysis_timeout_sync_seconds
        )

    geoid_base_url: str = ""
    geoid_catalog: str = ""
    geoid_collection: str = ""
    geoid_resolve_concurrency: int = 20

    allowed_origins: str = "*"

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_min_pool_size: int = 1
    db_max_pool_size: int = 10

    redis_url: str = "redis://localhost:6379"

    api_version: str = Field(default_factory=_load_api_version)
    openforis_whisp_version: str = Field(default_factory=_load_openforis_whisp_version)
    earthengine_api_version: str = Field(default_factory=_load_earthengine_api_version)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def cors_allow_credentials(self) -> bool:
        return "*" not in self.cors_origins_list

    @property
    def max_request_body_size_bytes(self) -> int | None:
        if self.max_request_body_size_kb is None:
            return None
        return self.max_request_body_size_kb * 1024

    def public_config(self) -> dict[str, int | None]:
        return {
            "maxRequestBodySizeKb": self.max_request_body_size_kb,
            "geometryLimitSync": self.geometry_limit_sync,
            "geometryLimitAsync": self.geometry_limit_async,
            "analysisTimeoutSyncSeconds": self.analysis_timeout_sync_seconds,
            "analysisTimeoutAsyncSeconds": self.analysis_timeout_async_seconds,
        }


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.temp_dir.mkdir(parents=True, exist_ok=True)
    return s


SettingsDep = Annotated[Settings, Depends(get_settings)]
