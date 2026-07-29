'use client';

import { useEffect, useState } from 'react';
import { Monitor, Terminal } from 'lucide-react';
import { fetchDetailedPublicStats } from '@/lib/analysis/actions';
import type { DetailedPublicStats } from '@/lib/db/analysis-jobs-service';
import { CloseButton } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { cn } from '@/lib/utils';

function formatCount(n: number): string {
  return n.toLocaleString();
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DetailedStatsModal({ open, onClose }: Props) {
  const [stats, setStats] = useState<DetailedPublicStats | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchDetailedPublicStats().then(r => { if (r.ok) setStats(r.data); });
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxMonthly = stats ? Math.max(...stats.monthly.map(m => m.count), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4">
      <div className="flex max-h-full w-full max-w-[480px] flex-col rounded-sm border border-border bg-surface shadow-xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Platform stats</h2>
          <div className="flex-1" />
          <CloseButton onClick={onClose} />
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          {!stats ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-sm bg-surface-raised" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-sm border border-border bg-bg p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Active API keys
                  </p>
                  <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                    {formatCount(stats.activeApiKeys)}
                  </p>
                </div>

                <div className="rounded-sm border border-border bg-bg p-4">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Total plots analyzed
                  </p>
                  <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                    {formatCount(stats.uiFeatures + stats.apiFeatures)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Plots by source
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-sm border border-border bg-bg p-3">
                    <Monitor className="size-4 shrink-0 text-text-muted" />
                    <span className="text-xs text-text-primary">Web app</span>
                    <div className="flex-1" />
                    <span className="text-sm font-semibold tabular-nums text-text-primary">
                      {formatCount(stats.uiFeatures)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-sm border border-border bg-bg p-3">
                    <Terminal className="size-4 shrink-0 text-text-muted" />
                    <span className="text-xs text-text-primary">API</span>
                    <div className="flex-1" />
                    <span className="text-sm font-semibold tabular-nums text-text-primary">
                      {formatCount(stats.apiFeatures)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[12px] leading-relaxed text-text-dim">
                Need programmatic access?{' '}
                <Link href="/register" variant="subtle">Register for free</Link>
                {' '}to get an API key.
              </p>

              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Last 3 months
                </p>
                <div className="space-y-2">
                  {stats.monthly.map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="w-[72px] shrink-0 text-[11px] tabular-nums text-text-muted">
                        {m.month}
                      </span>
                      <div className="h-5 flex-1 rounded-sm bg-bg">
                        <div
                          className={cn(
                            'h-full rounded-sm transition-all duration-500',
                            m.count > 0 ? 'bg-accent-green/40' : 'bg-surface-raised'
                          )}
                          style={{ width: `${(m.count / maxMonthly) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-[11px] font-semibold tabular-nums text-text-primary">
                        {formatCount(m.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
