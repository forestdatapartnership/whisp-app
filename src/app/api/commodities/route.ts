import { NextRequest, NextResponse } from 'next/server';
import { getAllCommodities } from '@/lib/dal/commoditiesService';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { compose } from '@/lib/utils/compose';
import { useResponse } from '@/lib/hooks/responses';
import { SystemCode } from '@/types/systemCodes';
import { LogFunction } from '@/lib/logger';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (_req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const commodities = await getAllCommodities();
  const response = useResponse(SystemCode.COMMODITIES_FETCH_SUCCESS, { commodities });
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
});
