import { getPool } from "@/lib/db";
import { SystemCode } from "@/types/systemCodes";
import { toIntOrDefault, toNumberOrNull } from "./valueUtils";
import path from "path";
import { fileExists } from "./fileUtils";

type CreateParams = {
  token: string;
  apiKeyId: number;
  userId?: number | null;
  featureCount: number;
  analysisOptions?: any;
  status?: SystemCode;
  timeoutMs?: number | null;
};

type UpdateParams = {
  status?: SystemCode;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs?: number | null;
  errorMessage?: string | null;
  featureCount?: number | null;
};

export type AnalysisJobDto = {
  token: string;
  status: string;
  featureCount: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  resultsAvailable: boolean;
};

export type AnalysisJobStats = {
  summary: {
    total: number;
    last24h: number;
    last7d: number;
  };
  statusCounts: {
    processing: number;
    completed: number;
    error: number;
    timeout: number;
  };
  timings: {
    avgRunMs: number | null;
    p50RunMs: number | null;
    avgQueueMs: number | null;
  };
  recentJobs: AnalysisJobDto[];
};

const columnMap: Record<keyof UpdateParams, string> = {
  status: 'status',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  timeoutMs: 'timeout_ms',
  errorMessage: 'error_message',
  featureCount: 'feature_count'
};

const statusOrder = [
  SystemCode.ANALYSIS_PROCESSING,
  SystemCode.ANALYSIS_COMPLETED,
  SystemCode.ANALYSIS_ERROR,
  SystemCode.ANALYSIS_TIMEOUT
];

export const mapAnalysisJobRow = (row: any): AnalysisJobDto => ({
  token: row.token as string,
  status: row.status as string,
  featureCount: row.feature_count as number | null,
  createdAt: row.created_at as string,
  startedAt: row.started_at as string | null,
  completedAt: row.completed_at as string | null,
  errorMessage: row.error_message as string | null,
  resultsAvailable: false
});

export async function createAnalysisJob(params: CreateParams) {
  const pool = getPool();
  const { token, apiKeyId, userId, featureCount, analysisOptions, status, timeoutMs } = params;
  await pool.query(
    `INSERT INTO analysis_jobs (token, api_key_id, user_id, status, feature_count, analysis_options, timeout_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (token) DO NOTHING`,
    [token, apiKeyId, userId ?? null, status ?? SystemCode.ANALYSIS_PROCESSING, featureCount, analysisOptions ?? null, timeoutMs ?? null]
  );
}

export async function updateAnalysisJob(token: string, fields: UpdateParams) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const sets: string[] = [];
  const values: any[] = [token];
  let paramIndex = 2;
  for (const [key, value] of entries) {
    const column = columnMap[key as keyof UpdateParams];
    if (!column) continue;
    sets.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }
  if (!sets.length) return;
  const pool = getPool();
  await pool.query(`UPDATE analysis_jobs SET ${sets.join(', ')} WHERE token = $1`, values);
}

export async function getAnalysisJobStats(userId: number): Promise<AnalysisJobStats> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const summaryResult = await client.query(
      `WITH user_jobs AS (
        SELECT *
        FROM analysis_jobs
        WHERE user_id = $1
      )
      SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS jobs_last_24h,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') AS jobs_last_7d,
        COUNT(*) FILTER (WHERE status = $2) AS processing_count,
        COUNT(*) FILTER (WHERE status = $3) AS completed_count,
        COUNT(*) FILTER (WHERE status = $4) AS error_count,
        COUNT(*) FILTER (WHERE status = $5) AS timeout_count,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) AS avg_run_ms,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) AS p50_run_ms,
        AVG(EXTRACT(EPOCH FROM (started_at - created_at)) * 1000) FILTER (WHERE started_at IS NOT NULL) AS avg_queue_ms
      FROM user_jobs`,
      [userId, ...statusOrder]
    );

    const recentResult = await client.query(
      `SELECT token, status, feature_count, created_at, started_at, completed_at, error_message
       FROM analysis_jobs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const summary = summaryResult.rows[0] || {};

    return {
      summary: {
        total: toIntOrDefault(summary.total_jobs),
        last24h: toIntOrDefault(summary.jobs_last_24h),
        last7d: toIntOrDefault(summary.jobs_last_7d)
      },
      statusCounts: {
        processing: toIntOrDefault(summary.processing_count),
        completed: toIntOrDefault(summary.completed_count),
        error: toIntOrDefault(summary.error_count),
        timeout: toIntOrDefault(summary.timeout_count)
      },
      timings: {
        avgRunMs: toNumberOrNull(summary.avg_run_ms),
        p50RunMs: toNumberOrNull(summary.p50_run_ms),
        avgQueueMs: toNumberOrNull(summary.avg_queue_ms)
      },
      recentJobs: await Promise.all(
        recentResult.rows.map(async (row) => {
          const mapped = mapAnalysisJobRow(row);
          if (mapped.status === SystemCode.ANALYSIS_COMPLETED && mapped.completedAt) {
            const resultPath = path.join(process.cwd(), "temp", `${mapped.token}-result.json`);
            const available = await fileExists(resultPath);
            return { ...mapped, resultsAvailable: available };
          }
          return mapped;
        })
      )
    };
  } finally {
    client.release();
  }
}

