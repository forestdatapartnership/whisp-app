import { NextRequest, NextResponse } from 'next/server';
import { getAllCommodities } from '@/lib/dal/commoditiesService';
import { withLogging } from '@/lib/middleware/withLogging';
import { withErrorHandling } from '@/lib/middleware/withErrorHandling';
import { compose } from '@/lib/middleware/compose';
import { useResponse } from '@/lib/middleware/responses';
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
