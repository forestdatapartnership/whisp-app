export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPiiAnonymizationJob } = await import('@/lib/cron/piiAnonymization');
    startPiiAnonymizationJob();
  }
}
