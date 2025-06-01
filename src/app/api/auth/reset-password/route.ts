import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { withLogging } from '@/lib/hooks/withLogging';
import { withRequiredJsonBody } from '@/lib/hooks/withRequiredJsonBody';
import { compose } from '@/lib/utils/compose';

export const POST = compose(
  withLogging,
  withRequiredJsonBody
)(async (request: NextRequest, ...args): Promise<NextResponse> => {
  const [log, body] = args;
  const logSource = "reset-password/route.ts";
  
  try {
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      log("warn", "Missing required fields in reset password request", logSource);
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    log("debug", "Attempting password reset with token", logSource);
    
    const pool = await getPool();
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
          return NextResponse.json(
            { message: 'Your password has been reset successfully' },
            { status: 200 }
          );
      
        case 'INVALID_OR_EXPIRED_TOKEN':
          log("warn", `Password reset failed: ${status}`, logSource);
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 400 }
          );
      
        default:
          log("warn", `Password reset failed: ${status}`, logSource);
          return NextResponse.json(
            { error: status },
            { status: 400 }
          );
      }
    } finally {
      client.release();
    }
  } catch (error) {
    log("error", `Password reset error: ${error}`, logSource);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});