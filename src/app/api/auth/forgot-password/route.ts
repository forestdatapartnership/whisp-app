import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { withLogging } from '@/lib/hooks/withLogging';
import { withJsonBody } from '@/lib/hooks/withJsonBody';
import { compose } from '@/lib/utils/compose';
import { SystemCode } from '@/types/systemCodes';
import { useResponse } from '@/lib/hooks/responses';
import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';

export const POST = compose(
  withLogging,
  withErrorHandling,
  withJsonBody
)(async (request: NextRequest, ...args): Promise<NextResponse> => {
  const [log, body] = args;

    const { email } = body;
    validateRequiredFields(body, ['email']);

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      log("debug", `Creating password reset token for email: ${email}`);
      
      // Create token in database
      const result = await client.query(
        'SELECT create_password_reset_token($1, $2, $3)',
        [email, token, expiresAt]
      );
      
      const status = result.rows[0].create_password_reset_token;
      
      if (status === 'Password reset token created successfully') {
        // Send email with reset link only if token was created
        log("debug", `Sending password reset email to: ${email}`);
        await sendPasswordResetEmail(email, token);
      } else {
        log("debug", `Token creation status: ${status}`);
      }
    } finally {
      client.release();
    }
    
    return useResponse(SystemCode.AUTH_PASSWORD_RESET_REQUESTED);
});