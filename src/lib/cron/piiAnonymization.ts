import { getPool } from '@/lib/dal/db';
import { config } from '@/lib/config';
import { useLogger } from '@/lib/logger';

const CRON_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function anonymizeExpiredPii(): Promise<void> {
  const logger = useLogger();
  const retentionDays = config.pii.retentionDays;

  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT target, rows_affected FROM anonymize_expired_pii($1)',
      [retentionDays]
    );

    const total = result.rows.reduce((sum, r) => sum + Number(r.rows_affected || 0), 0);
    const details = result.rows.map((r) => `${r.target}=${r.rows_affected}`).join(' ');
    const msg = `cron piiAnonymization cleared=${total} retention=${retentionDays}d${details ? ` ${details}` : ''}`;
    total > 0 ? logger.info(msg) : logger.debug(msg);
  } catch (error) {
    logger.error(`cron piiAnonymization failed: ${error}`);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPiiAnonymizationJob(): void {
  if (intervalId) return;

  const logger = useLogger();
  const retentionDays = config.pii.retentionDays;
  logger.info(`cron piiAnonymization started interval=${CRON_INTERVAL_MS / 3600000}h retention=${retentionDays}d`);

  anonymizeExpiredPii();

  intervalId = setInterval(anonymizeExpiredPii, CRON_INTERVAL_MS);
}
