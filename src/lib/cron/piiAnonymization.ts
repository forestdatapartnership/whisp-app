import { getPool } from '@/lib/dal/db';
import { useLogger } from '@/lib/logger';

const DEFAULT_RETENTION_DAYS = 90;
const CRON_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getRetentionDays(): number {
  const value = process.env.PII_RETENTION_DAYS;
  if (!value) return DEFAULT_RETENTION_DAYS;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? DEFAULT_RETENTION_DAYS : parsed;
}

async function anonymizeExpiredPii(): Promise<void> {
  const logger = useLogger();
  const retentionDays = getRetentionDays();

  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT target, rows_affected FROM anonymize_expired_pii($1)',
      [retentionDays]
    );

    if (result.rows.length > 0) {
      for (const row of result.rows) {
        logger.info(`PII anonymization: cleared ${row.rows_affected} row(s) in ${row.target} (retention: ${retentionDays} days)`);
      }
    } else {
      logger.debug(`PII anonymization: nothing to anonymize (retention: ${retentionDays} days)`);
    }
  } catch (error) {
    logger.error(`PII anonymization failed: ${error}`);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPiiAnonymizationJob(): void {
  if (intervalId) return;

  const logger = useLogger();
  const retentionDays = getRetentionDays();
  logger.info(`PII anonymization job started (retention: ${retentionDays} days, interval: 24h)`);

  anonymizeExpiredPii();

  intervalId = setInterval(anonymizeExpiredPii, CRON_INTERVAL_MS);
}
