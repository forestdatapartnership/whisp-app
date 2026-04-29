'use server';

import { getAuthUser } from '@/lib/auth';
import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';
import { getAnalysisJobStats, type AnalysisJobStats } from '@/lib/dal/analysisJobsService';

export async function fetchAnalysisJobStats(): Promise<AnalysisJobStats> {
  const user = await getAuthUser();
  if (!user) throw new SystemError(SystemCode.AUTH_UNAUTHORIZED);
  return getAnalysisJobStats(user.id);
}
