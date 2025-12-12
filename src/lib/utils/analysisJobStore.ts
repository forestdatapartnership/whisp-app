import { getPool } from "@/lib/db";
import { SystemCode } from "@/types/systemCodes";

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
  durationMs?: number | null;
  timeoutMs?: number | null;
  percent?: number | null;
  processStatusMessages?: any;
  errorMessage?: string | null;
  resultPath?: string | null;
  featureCount?: number | null;
};

const columnMap: Record<keyof UpdateParams, string> = {
  status: 'status',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  durationMs: 'duration_ms',
  timeoutMs: 'timeout_ms',
  percent: 'percent',
  processStatusMessages: 'process_status_messages',
  errorMessage: 'error_message',
  resultPath: 'result_path',
  featureCount: 'feature_count'
};

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

