import { NextRequest, NextResponse } from 'next/server';
import { getPool } from "@/lib/db";
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { compose } from '@/lib/utils/compose';
import { SystemCode } from '@/types/systemCodes';
import { useResponse } from '@/lib/hooks/responses';
import { SystemError } from '@/types/systemError';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (request: NextRequest, ...args): Promise<NextResponse> => {

  const token = request.nextUrl.pathname.split('/').pop();

  if (!token) {
    throw new SystemError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ['token']);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT verify_email_by_token($1) AS message",
      [token]
    );

    const message = result.rows[0].message;

      if (message === 'Email verified successfully') {
        return useResponse(SystemCode.AUTH_EMAIL_VERIFIED_SUCCESS);
      } else {
        return useResponse(SystemCode.AUTH_INVALID_TOKEN);
      }
    } finally {
      client.release();
    }
});
