import { getPool } from "@/lib/dal/db";
import { SystemCode } from "@/types/systemCodes";
import type { AnalysisJob } from "@/types/models/analysisJob";
import { toIntOrDefault, toNumberOrNull } from "../utils/valueUtils";
import path from "path";
import { fileExists } from "../utils/fileUtils";
import { BaseCrudService } from "./baseCrudService";
import { analysisJobMapping } from "./mappings/analysisJobMapping";

export type AnalysisJobStats = {
  summary:      { total: number; last24h: number; last7d: number };
  statusCounts: { processing: number; completed: number; error: number; timeout: number };
  timings:      { avgRunMs: number | null; p50RunMs: number | null; avgQueueMs: number | null };
  recentJobs:   AnalysisJob[];
};

const STATUS_ORDER = [
  SystemCode.ANALYSIS_PROCESSING,
  SystemCode.ANALYSIS_COMPLETED,
  SystemCode.ANALYSIS_ERROR,
  SystemCode.ANALYSIS_TIMEOUT,
];

class AnalysisJobsService extends BaseCrudService<AnalysisJob, typeof analysisJobMapping> {
  protected readonly tableName = 'analysis_jobs';
  protected readonly columnsMapping      = analysisJobMapping;
  protected readonly defaultOrderBy = 'created_at DESC';

  async create(job: AnalysisJob): Promise<AnalysisJob> {
    return super.create({ ...job, status: job.status ?? SystemCode.ANALYSIS_PROCESSING });
  }

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
             COUNT(*) FILTER (WHERE status = $2)                                            AS processing_count,
             COUNT(*) FILTER (WHERE status = $3)                                            AS completed_count,
             COUNT(*) FILTER (WHERE status = $4)                                            AS error_count,
             COUNT(*) FILTER (WHERE status = $5)                                            AS timeout_count,
             AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
               FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL)           AS avg_run_ms,
             PERCENTILE_CONT(0.5) WITHIN GROUP (
               ORDER BY EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
             ) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL)           AS p50_run_ms,
             AVG(EXTRACT(EPOCH FROM (started_at - created_at)) * 1000)
               FILTER (WHERE started_at IS NOT NULL)                                        AS avg_queue_ms
           FROM user_jobs`,
          [userId, ...STATUS_ORDER]
        ),
        client.query(
          `SELECT ${aliasedFields}
           FROM analysis_jobs aj
           JOIN users u ON aj.user_id = u.id
           WHERE u.uuid = $1
           ORDER BY aj.created_at DESC
           LIMIT 20`,
          [userId]
        ),
      ]);

      const summary = summaryResult.rows[0] ?? {};

      const recentJobs = await Promise.all(
        recentResult.rows.map(async (row: AnalysisJob) => {
          if (row.status !== SystemCode.ANALYSIS_COMPLETED || !row.completedAt) {
            return { ...row, resultsAvailable: false };
          }
          const resultPath = path.join(process.cwd(), 'temp', `${row.id}-result.json`);
          return { ...row, resultsAvailable: await fileExists(resultPath) };
        })
      );

      return {
        summary: {
          total:   toIntOrDefault(summary.total_jobs),
          last24h: toIntOrDefault(summary.jobs_last_24h),
          last7d:  toIntOrDefault(summary.jobs_last_7d),
        },
        statusCounts: {
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

export const createAnalysisJob   = (job: AnalysisJob)                          => service.create(job);
export const updateAnalysisJob   = (id: string, updates: Partial<AnalysisJob>) => service.update(id, updates);
export const getAnalysisJobStats = (userId: string)                             => service.getStats(userId);
