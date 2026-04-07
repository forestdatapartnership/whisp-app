import { releaseStuckJobs as releaseStuckJobsInDb } from '@/lib/dal/analysisJobsService';
import { config } from '@/lib/config';
import { useLogger } from '@/lib/logger';

const STUCK_JOB_MARGIN_MINUTES = 5;
const CRON_INTERVAL_MS = 15 * 60 * 1000;

function getStuckJobThresholdMinutes(): number {
  const maxTimeoutMs = Math.max(config.analysis.pythonTimeoutMs, config.analysis.pythonTimeoutSyncMs);
  return Math.ceil(maxTimeoutMs / 60000) + STUCK_JOB_MARGIN_MINUTES;
}

async function runReleaseStuckJobs(): Promise<void> {
  const logger = useLogger();
  const thresholdMinutes = getStuckJobThresholdMinutes();

  try {
    const count = await releaseStuckJobsInDb(thresholdMinutes);
    const msg = `cron releaseStuckJobs released=${count} threshold=${thresholdMinutes}m`;
    count > 0 ? logger.info(msg) : logger.debug(msg);
  } catch (error) {
    logger.error(`cron releaseStuckJobs failed: ${error}`);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReleaseStuckJobsJob(): void {
  if (intervalId) return;

  const logger = useLogger();
  logger.info(`cron releaseStuckJobs started interval=${CRON_INTERVAL_MS / 60000}m`);

  runReleaseStuckJobs();

  intervalId = setInterval(runReleaseStuckJobs, CRON_INTERVAL_MS);
}
