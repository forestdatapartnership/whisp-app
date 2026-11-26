import 'server-only';
import { getPool } from '@/lib/db/pool';
import { SystemCode } from '@/types/system-codes';
import type { AnalysisJob } from '@/types/models/analysis-job';
import { toIntOrDefault, toNumberOrNull } from '@/lib/shared/value-utils';
import { BaseCrudService } from './base-crud-service';
import { analysisJobMapping } from './mappings/analysis-job-mapping';

const RESULTS_MAX_AGE_MS = 10 * 60 * 1000;

function resultsAvailableWithinMaxAge(completedAt: Date | string | undefined): boolean {
  if (!completedAt) return false;
  const completedMs =
    completedAt instanceof Date ? completedAt.getTime() : new Date(completedAt).getTime();
  if (Number.isNaN(completedMs)) return false;
  return Date.now() - completedMs <= RESULTS_MAX_AGE_MS;
}

export type AnalysisJobStats = {
  summary:      { total: number; last24h: number; last7d: number };
  statusCounts: { queued: number; processing: number; completed: number; error: number; timeout: number };
  timings:      { avgRunMs: number | null; p50RunMs: number | null; avgQueueMs: number | null };
  recentJobs:   AnalysisJob[];
};

const STATUS_ORDER = [
  SystemCode.ANALYSIS_QUEUED,
  SystemCode.ANALYSIS_PROCESSING,
  SystemCode.ANALYSIS_COMPLETED,
  SystemCode.ANALYSIS_ERROR,
  SystemCode.ANALYSIS_TIMEOUT,
];

class AnalysisJobsService extends BaseCrudService<AnalysisJob, typeof analysisJobMapping> {
  protected readonly tableName = 'analysis_jobs';
  protected readonly columnsMapping      = analysisJobMapping;
  protected readonly defaultOrderBy = 'created_at DESC';

  async getStats(userId: string): Promise<AnalysisJobStats> {
    const pool   = getPool();
    const client = await pool.connect();
    try {
      const aliasedFields = this.returningFields
        .split(',')
        .map(f => `aj.${f.trim()}`)
        .join(', ');

      const [summaryResult, recentResult] = await Promise.all([
        client.query(
          `WITH user_jobs AS (
             SELECT aj.*
             FROM analysis_jobs aj
             JOIN users u ON aj.user_id = u.id
             WHERE u.uuid = $1
           )
           SELECT
             COUNT(*)                                                                        AS total_jobs,
             COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours')             AS jobs_last_24h,
             COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')               AS jobs_last_7d,
             COUNT(*) FILTER (WHERE status = $2)                                            AS queued_count,
             COUNT(*) FILTER (WHERE status = $3)                                            AS processing_count,
             COUNT(*) FILTER (WHERE status = $4)                                            AS completed_count,
             COUNT(*) FILTER (WHERE status = $5)                                            AS error_count,
             COUNT(*) FILTER (WHERE status = $6)                                            AS timeout_count,
             AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
               FILTER (WHERE status = $4 AND completed_at IS NOT NULL AND started_at IS NOT NULL) AS avg_run_ms,
             PERCENTILE_CONT(0.5) WITHIN GROUP (
               ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
             ) FILTER (WHERE status = $4 AND completed_at IS NOT NULL AND started_at IS NOT NULL) AS p50_run_ms,
             AVG(EXTRACT(EPOCH FROM (started_at - created_at)) * 1000)
               FILTER (WHERE started_at IS NOT NULL AND status <> $2)                       AS avg_queue_ms
           FROM user_jobs`,
          [userId, ...STATUS_ORDER]
        ),
        client.query(
          `SELECT ${aliasedFields}
           FROM analysis_jobs aj
           JOIN users u ON aj.user_id = u.id
           WHERE u.uuid = $1
           ORDER BY aj.created_at DESC
           LIMIT 100`,
          [userId]
        ),
      ]);

      const summary = summaryResult.rows[0] ?? {};

      const recentJobs = recentResult.rows.map((row: AnalysisJob) => ({
        ...row,
        resultsAvailable:
          row.status === SystemCode.ANALYSIS_COMPLETED &&
          resultsAvailableWithinMaxAge(row.completedAt),
      }));

      return {
        summary: {
          total:   toIntOrDefault(summary.total_jobs),
          last24h: toIntOrDefault(summary.jobs_last_24h),
          last7d:  toIntOrDefault(summary.jobs_last_7d),
        },
        statusCounts: {
          queued:     toIntOrDefault(summary.queued_count),
          processing: toIntOrDefault(summary.processing_count),
          completed:  toIntOrDefault(summary.completed_count),
          error:      toIntOrDefault(summary.error_count),
          timeout:    toIntOrDefault(summary.timeout_count),
        },
        timings: {
          avgRunMs:   toNumberOrNull(summary.avg_run_ms),
          p50RunMs:   toNumberOrNull(summary.p50_run_ms),
          avgQueueMs: toNumberOrNull(summary.avg_queue_ms),
        },
        recentJobs,
      };
    } finally {
      client.release();
    }
  }
}

const service = new AnalysisJobsService();

export const getAnalysisJobStats = (userId: string) => service.getStats(userId);
