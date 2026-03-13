import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/dal/db';
import { compose } from '@/lib/middleware/compose';
import { withLogging } from '@/lib/middleware/withLogging';
import { withErrorHandling } from '@/lib/middleware/withErrorHandling';
import { withJsonBody } from '@/lib/middleware/withJsonBody';
import { useResponse } from '@/lib/middleware/responses';
import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import { validateEmail } from '@/lib/utils/emailValidation';
import { SystemCode } from '@/types/systemCodes';
import { LogFunction } from '@/lib/logger';

const handleNotificationRequest = async (
  email: string,
  log: LogFunction,
  sql: string,
  successCode: SystemCode
): Promise<NextResponse> => {
  const normalizedEmail = await validateEmail(email, log);
  if (!normalizedEmail) {
    return useResponse(successCode);
  }
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(sql, [normalizedEmail]);
    return useResponse(successCode);
  } finally {
    client.release();
  }
};

export const POST = compose(
  withLogging,
  withErrorHandling,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['email']);
  return handleNotificationRequest(
    body.email,
    log,
    'SELECT subscribe_notifications($1)',
    SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS
  );
});

export const DELETE = compose(
  withLogging,
  withErrorHandling,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['email']);
  return handleNotificationRequest(
    body.email,
    log,
    'SELECT unsubscribe_notifications($1)',
    SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS
  );
});

