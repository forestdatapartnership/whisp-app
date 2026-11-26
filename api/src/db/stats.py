from src.codes import SystemCode
from src.db.pool import get_pool


async def find_public_stats() -> dict:
    completed = SystemCode.ANALYSIS_COMPLETED.value
    async with get_pool().acquire() as conn:
        totals = await conn.fetchrow(
            """
            SELECT
              COALESCE(SUM(feature_count), 0) AS "totalFeatures",
              COALESCE(SUM(feature_count) FILTER (WHERE completed_at >= now() - interval '7 days'), 0) AS "featuresLast7d",
              COALESCE(SUM(feature_count) FILTER (WHERE completed_at >= date_trunc('month', now())), 0) AS "featuresThisMonth",
              COALESCE(SUM(feature_count) FILTER (
                WHERE completed_at >= date_trunc('month', now()) - interval '1 month'
                  AND completed_at < date_trunc('month', now())
              ), 0) AS "featuresLastMonth",
              COALESCE(SUM(feature_count) FILTER (WHERE agent <> 'api'), 0) AS "uiFeatures",
              COALESCE(SUM(feature_count) FILTER (WHERE agent = 'api'), 0) AS "apiFeatures"
            FROM analysis_jobs
            WHERE status = $1
            """,
            completed,
        )
        active_api_keys = await conn.fetchval(
            "SELECT COUNT(*) FROM api_keys ak JOIN users u ON ak.user_id = u.id "
            "WHERE ak.revoked = false AND (ak.expires_at IS NULL OR ak.expires_at > now())"
        )
        monthly = await conn.fetch(
            """
            SELECT to_char(m, 'YYYY-MM-DD') AS month, COALESCE(SUM(feature_count), 0) AS count
            FROM generate_series(
              date_trunc('month', now()) - interval '3 months',
              date_trunc('month', now()) - interval '1 day',
              interval '1 month'
            ) AS m
            LEFT JOIN analysis_jobs ON status = $1 AND completed_at >= m AND completed_at < m + interval '1 month'
            GROUP BY m
            ORDER BY m DESC
            """,
            completed,
        )
    return {**totals, "activeApiKeys": active_api_keys, "monthly": [dict(row) for row in monthly]}
