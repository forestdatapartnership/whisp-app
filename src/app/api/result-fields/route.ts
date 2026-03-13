import { NextRequest, NextResponse } from 'next/server';
import { getAllResultFields } from '@/lib/dal/resultFieldsService';
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
  const fields = await getAllResultFields();
  const response = useResponse(SystemCode.RESULT_FIELDS_FETCH_SUCCESS, { fields });
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
});
