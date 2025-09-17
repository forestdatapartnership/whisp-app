import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { withLogging } from '@/lib/hooks/withLogging';
import { withRequiredJsonBody } from '@/lib/hooks/withRequiredJsonBody';
import { compose } from '@/lib/utils/compose';
import { SystemCode } from '@/types/systemCodes';
import { useResponse } from '@/lib/hooks/responses';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import { SystemError } from '@/types/systemError';
import { LogFunction } from '@/lib/logger';

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (request: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  const logSource = "reset-password/route.ts";
  
  const { token, newPassword } = body;
  validateRequiredFields(body, ['token', 'newPassword']);
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Reset the password using the token
      const result = await client.query(
        'SELECT reset_password_with_token($1, $2)',
        [token, newPassword]
      );
      
      const status = result.rows[0].reset_password_with_token;

      switch (status) {
        case 'PASSWORD_RESET_SUCCESSFUL':
          log("debug", "Password reset successfully", logSource);
          return useResponse(SystemCode.AUTH_PASSWORD_RESET_SUCCESS);
      
        case 'INVALID_OR_EXPIRED_TOKEN':
          throw new SystemError(SystemCode.AUTH_INVALID_TOKEN);
      
        default:
          log("warn", `Password reset failed: ${status}`, logSource);
          return useResponse(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR);
      }
    } finally {
      client.release();
    }
});