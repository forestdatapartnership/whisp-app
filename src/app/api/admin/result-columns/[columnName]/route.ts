import { NextRequest, NextResponse } from 'next/server';
import { getResultColumn, updateResultColumn, deleteResultColumn } from '@/lib/services/resultColumnsService';
import { withAdminAuth, AuthenticatedUser } from '@/lib/hooks/withAuthUser';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { withJsonBody } from '@/lib/hooks/withJsonBody';
import { compose } from '@/lib/utils/compose';
import { useResponse } from '@/lib/hooks/responses';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import { LogFunction } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  context: { params: { columnName: string } }
) {
  return compose(
    withLogging,
    withErrorHandling
  )(async (_req: NextRequest, log: LogFunction): Promise<NextResponse> => {
    const column = await getResultColumn(context.params.columnName);
    
    if (!column) {
      throw new SystemError(SystemCode.RESULT_COLUMNS_NOT_FOUND);
    }
    
    const response = useResponse(SystemCode.RESULT_COLUMNS_FETCH_SUCCESS, { column });
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    return response;
  })(request);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { columnName: string } }
) {
  return compose(
    withLogging,
    withErrorHandling,
    withAdminAuth,
    withJsonBody
  )(async (_req: NextRequest, log: LogFunction, body: any, user: AuthenticatedUser): Promise<NextResponse> => {
    const column = await updateResultColumn(
      context.params.columnName,
      body,
      user.userId.toString()
    );
    
    return useResponse(SystemCode.RESULT_COLUMNS_UPDATED_SUCCESS, { column });
  })(request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { columnName: string } }
) {
  return compose(
    withLogging,
    withErrorHandling,
    withAdminAuth
  )(async (_req: NextRequest, log: LogFunction, user: AuthenticatedUser): Promise<NextResponse> => {
    await deleteResultColumn(context.params.columnName);
    
    return useResponse(SystemCode.RESULT_COLUMNS_DELETED_SUCCESS);
  })(request);
}
