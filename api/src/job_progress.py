from dataclasses import dataclass
from typing import Any

from src.codes import SystemCode


@dataclass
class JobProgress:
    status: SystemCode
    id: str | None = None
    percent: int | None = None
    messages: list[str] | None = None
    error_message: str | None = None
    feature_count: int | None = None

    @staticmethod
    def _parse_status(value: SystemCode | str | None) -> SystemCode:
        if isinstance(value, SystemCode):
            return value
        if not value:
            return SystemCode.ANALYSIS_ERROR
        try:
            return SystemCode(value)
        except ValueError:
            return SystemCode.ANALYSIS_ERROR

    @classmethod
    def of(
        cls,
        status: SystemCode | str,
        *,
        percent: int | None = None,
        messages: list[str] | None = None,
        error_message: str | None = None,
        feature_count: int | None = None,
    ) -> "JobProgress":
        return cls(
            status=cls._parse_status(status),
            percent=percent,
            messages=messages,
            error_message=error_message,
            feature_count=feature_count,
        )

    @classmethod
    def from_redis(cls, data: dict[str, Any], *, id: str | None = None) -> "JobProgress":
        return cls(
            id=id,
            status=cls._parse_status(data.get("status")),
            percent=data.get("percent"),
            messages=data.get("messages"),
            error_message=data.get("error_message"),
            feature_count=data.get("feature_count"),
        )

    @classmethod
    def from_db(cls, row: dict[str, Any]) -> "JobProgress":
        return cls(
            id=row["id"],
            status=cls._parse_status(row["status"]),
            feature_count=row.get("feature_count"),
            error_message=row.get("error_message"),
        )

    def to_redis(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "status": self.status.value,
            "percent": self.percent,
            "error_message": self.error_message,
            "feature_count": self.feature_count,
        }
        if self.messages is not None:
            payload["messages"] = self.messages
        return payload
