export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${minutes}m ${remaining}s`;
}

export function deriveDurationMs(
  startedAt?: Date | string | null,
  completedAt?: Date | string | null
): number | null {
  if (!startedAt) return null;
  const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
  if (Number.isNaN(start.getTime())) return null;
  const end = completedAt
    ? completedAt instanceof Date
      ? completedAt
      : new Date(completedAt)
    : new Date();
  if (Number.isNaN(end.getTime())) return null;
  const diff = end.getTime() - start.getTime();
  return diff >= 0 ? diff : null;
}

export function truncateToken(id: string, max = 24): string {
  if (id.length <= max) return id;
  return `${id.slice(0, max - 1)}…`;
}
