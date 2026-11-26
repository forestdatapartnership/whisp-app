'use server';

import { getAuthUserWithRefresh } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import { config } from '@/lib/server/env';
import { getAnalysisJobStats, type AnalysisJobStats } from '@/lib/db/analysis-jobs-service';

export type PublicStats = {
  totalFeatures: number;
  featuresLast7d: number;
  featuresThisMonth: number;
  featuresLastMonth: number;
  uiFeatures: number;
  apiFeatures: number;
  activeApiKeys: number;
  monthly: { month: string; count: number }[];
};

export const fetchAnalysisJobStats = action(async (): Promise<AnalysisJobStats> => {
  const user = await getAuthUserWithRefresh();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return getAnalysisJobStats(user.id);
});

export const fetchPublicStats = action(async (): Promise<PublicStats> => {
  const res = await fetch(`${config.api.url}/stats`);
  if (!res.ok) throw new Error(`Stats request failed: ${res.status}`);
  return res.json();
});
