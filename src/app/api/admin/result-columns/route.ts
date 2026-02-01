import { NextRequest, NextResponse } from 'next/server';
import { getAllResultColumns, createResultColumn } from '@/lib/services/resultColumnsService';
import { withAdminAuth, AuthenticatedUser } from '@/lib/hooks/withAuthUser';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { withJsonBody } from '@/lib/hooks/withJsonBody';
import { compose } from '@/lib/utils/compose';
import { useResponse } from '@/lib/hooks/responses';
import { SystemCode } from '@/types/systemCodes';
import { LogFunction } from '@/lib/logger';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (_req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const columns = await getAllResultColumns();
  
  const response = useResponse(SystemCode.RESULT_COLUMNS_FETCH_SUCCESS, { columns });
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  
  return response;
});

export const POST = compose(
  withLogging,
  withErrorHandling,
  withAdminAuth,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any, user: AuthenticatedUser): Promise<NextResponse> => {
  const column = await createResultColumn(body, user.userId.toString());
  
  return useResponse(SystemCode.RESULT_COLUMNS_CREATED_SUCCESS, { column });
});
