import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from src.codes import SystemCode
from src.db.pool import get_pool

logger = logging.getLogger(__name__)


async def create_analysis_job(
    *,
    job_id: str,
    api_key_id: Optional[int],
    user_id: Optional[int],
    agent: Optional[str],
    ip_address: Optional[str],
    api_version: Optional[str],
    endpoint: Optional[str],
    feature_count: Optional[int],
    analysis_options: Optional[dict],
    status: SystemCode = SystemCode.ANALYSIS_PROCESSING,
) -> None:
    pool = get_pool()
    if pool is None:
        return

    try:
        await pool.execute(
            """
            INSERT INTO analysis_jobs (
                id, api_key_id, user_id, agent, ip_address, api_version, endpoint,
                feature_count, analysis_options, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, now())
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
            status.value,
        )
    except Exception:
        logger.exception("failed to create analysis_jobs row for %s", job_id)


_FIELD_TO_COLUMN: dict[str, str] = {
    "status": "status",
    "started_at": "started_at",
    "completed_at": "completed_at",
    "error_message": "error_message",
    "openforis_whisp_version": "openforis_whisp_version",
    "earthengine_api_version": "earthengine_api_version",
    "feature_count": "feature_count",
    "progress_percent": "progress_percent",
    "progress_message": "progress_message",
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


def update_analysis_job_sync(job_id: str, **updates: Any) -> None:
    import asyncio

    sets, values = _build_update_sets(updates)
    if not sets:
        return

    async def _run():
        import asyncpg
        from src.config import get_settings

        s = get_settings()
        conn = await asyncpg.connect(
            host=s.db_host, port=s.db_port, database=s.db_name,
            user=s.db_user, password=s.db_password,
        )
        try:
            await conn.execute(
                f"UPDATE analysis_jobs SET {', '.join(sets)} WHERE id = $1",
                job_id,
                *values,
            )
            status = updates.get("status")
            if isinstance(status, SystemCode) and status in (
                SystemCode.ANALYSIS_COMPLETED,
                SystemCode.ANALYSIS_ERROR,
                SystemCode.ANALYSIS_TIMEOUT,
            ):
                await conn.execute("SELECT pg_notify('job_update', $1)", job_id)
        finally:
            await conn.close()

    try:
        asyncio.run(_run())
    except Exception:
        logger.exception("sync update failed for %s", job_id)


async def count_running_for_user(user_id: int) -> int:
    pool = get_pool()
    if pool is None:
        return 0
    row = await pool.fetchrow(
        "SELECT COUNT(*)::int AS running FROM analysis_jobs WHERE user_id = $1 AND status IN ($2, $3)",
        user_id,
        SystemCode.ANALYSIS_QUEUED.value,
        SystemCode.ANALYSIS_PROCESSING.value,
    )
    return int(row["running"]) if row else 0


async def get_job(job_id: str) -> dict | None:
    pool = get_pool()
    if pool is None:
        return None
    row = await pool.fetchrow(
        "SELECT id, status, feature_count, progress_percent, "
        "progress_message, error_message, started_at, completed_at "
        "FROM analysis_jobs WHERE id = $1",
        job_id,
    )
    if row is None:
        return None
    return dict(row)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
