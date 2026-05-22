export function formatDateTime(value?: Date | string | null): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

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

export function formatRelative(value: Date | string | null | undefined): {
  label: string;
  tooltip: string;
} {
  if (!value) return { label: '—', tooltip: '—' };
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { label: '—', tooltip: '—' };
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  let label = '';
  if (diffSec < 60) label = `${diffSec}s ago`;
  else if (diffMin < 60) label = `${diffMin}m ago`;
  else if (diffHr < 24) label = `${diffHr}h ago`;
  else label = `${diffDay}d ago`;
  return { label, tooltip: date.toLocaleString() };
}

export function truncateToken(id: string, max = 24): string {
  if (id.length <= max) return id;
  return `${id.slice(0, max - 1)}…`;
}
