'use server';

import { getAuthUser } from '@/lib/auth/session';
import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';
import { action } from '@/lib/server/action';
import { getAnalysisJobStats, type AnalysisJobStats } from '@/lib/db/analysis-jobs-service';

export const fetchAnalysisJobStats = action(async (): Promise<AnalysisJobStats> => {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return getAnalysisJobStats(user.id);
});
