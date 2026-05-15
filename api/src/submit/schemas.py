from dataclasses import dataclass
from typing import Optional


@dataclass
class AnalysisOptions:
    external_id_column: str | None = None
    unit_type: str | None = None
    national_codes: list[str] | None = None
    async_mode: bool = False

    @classmethod
    def parse(cls, raw: dict | None) -> "AnalysisOptions":
        d = raw or {}
        nc = d.get("nationalCodes")
        return cls(
            external_id_column=d.get("externalIdColumn"),
            unit_type=d.get("unitType"),
            national_codes=[str(c).lower() for c in nc] if isinstance(nc, list) and nc else None,
            async_mode=bool(d.get("async", False)),
        )


@dataclass
class JobContext:
    api_key_id: Optional[int] = None
    user_id: Optional[int] = None
    max_concurrent_analyses: Optional[int] = None
    agent: Optional[str] = None
    ip_address: Optional[str] = None
    endpoint: Optional[str] = None
