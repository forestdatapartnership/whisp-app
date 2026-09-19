'use client';

import { useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';
import { fetchPublicStats } from '@/lib/analysis/actions';
import type { PublicStats } from '@/lib/db/analysis-jobs-service';
import { DetailedStatsModal } from '@/components/landing/detailed-stats-modal';
import { linkVariants } from '@/components/ui/link';
import { cn } from '@/lib/utils';

const STATS = ['totalFeatures', 'featuresLast7d', 'featuresThisMonth', 'featuresLastMonth'] as const;

export function PublicStats() {
  const t = useTranslations('Stats');
  const format = useFormatter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchPublicStats().then(r => { if (r.ok) setStats(r.data); });
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-4">
        <BarChart3 className="size-3.5 shrink-0 text-text-dim" />
        {STATS.map((key) => (
          <div key={key} className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-text-dim">{t(key)}</span>
            <span className={cn(
              'text-xs font-medium tabular-nums text-text-muted',
              !stats && 'animate-pulse'
            )}>
              {stats ? format.number(stats[key]) : '—'}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn('cursor-pointer text-[11px] whitespace-nowrap', linkVariants.subtle)}
        >
          {t('more')}
        </button>
      </div>
      <DetailedStatsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
