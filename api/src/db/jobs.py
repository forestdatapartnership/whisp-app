import json
from datetime import datetime, timezone
from typing import Any

from src.codes import RUNNING_STATUSES, SystemCode
from src.db.pool import acquire_pool
from src.exceptions import AppError

async def create_analysis_job(
    *,
    job_id: str,
    api_key_id: int | None,
    user_id: int | None,
    agent: str | None,
    ip_address: str | None,
    api_version: str | None,
    endpoint: str | None,
    feature_count: int | None,
    analysis_options: dict | None,
    timeout_seconds: int | None = None,
    status: SystemCode,
    openforis_whisp_version: str | None = None,
    earthengine_api_version: str | None = None,
    max_concurrent_analyses: int | None = None,
) -> None:
    pool = await acquire_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            if user_id is not None and max_concurrent_analyses:
                row = await conn.fetchrow(
                    "SELECT COUNT(*)::int AS running FROM analysis_jobs "
                    "WHERE user_id = $1 AND status = ANY($2::text[])",
                    user_id,
                    [s.value for s in RUNNING_STATUSES],
                )
                running = int(row["running"]) if row else 0
                if running >= max_concurrent_analyses:
                    raise AppError(SystemCode.ANALYSIS_TOO_MANY_CONCURRENT)

            await conn.execute(
                """
                INSERT INTO analysis_jobs (
                    id, api_key_id, user_id, agent, ip_address, api_version, endpoint,
                    feature_count, analysis_options, timeout_seconds, status,
                    openforis_whisp_version, earthengine_api_version, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, now())
                """,
                job_id,
                api_key_id,
                user_id,
                agent,
                ip_address,
                api_version,
                endpoint,
                feature_count,
                json.dumps(analysis_options) if analysis_options is not None else None,
                timeout_seconds,
                status.value,
                openforis_whisp_version,
                earthengine_api_version,
            )


_FIELD_TO_COLUMN: dict[str, str] = {
    "status": "status",
    "started_at": "started_at",
    "completed_at": "completed_at",
    "error_message": "error_message",
    "openforis_whisp_version": "openforis_whisp_version",
    "earthengine_api_version": "earthengine_api_version",
    "feature_count": "feature_count",
}


def _build_update_sets(updates: dict[str, Any]) -> tuple[list[str], list[Any]]:
    sets: list[str] = []
    values: list[Any] = []
    for key, value in updates.items():
        column = _FIELD_TO_COLUMN.get(key)
        if column is None:
            continue
        if isinstance(value, SystemCode):
            value = value.value
        sets.append(f"{column} = ${len(values) + 2}")
        values.append(value)
    return sets, values


async def update_analysis_job(job_id: str, **updates: Any) -> None:
    sets, values = _build_update_sets(updates)
    if not sets:
        return
    pool = await acquire_pool()
    await pool.execute(
        f"UPDATE analysis_jobs SET {', '.join(sets)} WHERE id = $1",
        job_id,
        *values,
    )


async def get_job(job_id: str) -> dict | None:
    pool = await acquire_pool()
    row = await pool.fetchrow(
        "SELECT id, status, feature_count, error_message, timeout_seconds, analysis_options "
        "FROM analysis_jobs WHERE id = $1",
        job_id,
    )
    if row is None:
        return None
    return dict(row)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
