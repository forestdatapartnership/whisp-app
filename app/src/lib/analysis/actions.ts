'use server';

import { getAuthUserWithRefresh } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import { getAnalysisJobStats, getPublicStats, getDetailedPublicStats, type AnalysisJobStats, type PublicStats, type DetailedPublicStats } from '@/lib/db/analysis-jobs-service';

export const fetchAnalysisJobStats = action(async (): Promise<AnalysisJobStats> => {
  const user = await getAuthUserWithRefresh();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return getAnalysisJobStats(user.id);
});

export const fetchPublicStats = action(async (): Promise<PublicStats> => {
  return getPublicStats();
});

export const fetchDetailedPublicStats = action(async (): Promise<DetailedPublicStats> => {
  return getDetailedPublicStats();
});
