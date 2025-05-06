import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { withRequiredJsonBody } from '@/lib/hooks/withRequiredJsonBody';
import { compose } from '@/utils/compose';

export const POST = compose(
  withLogging,
  withErrorHandling,
  withRequiredJsonBody
)(async (request: NextRequest, ...args): Promise<NextResponse> => {
  const [log, body] = args;
  const logSource = "forgot-password/route.ts";
  
  try {
    const { email } = body;

    if (!email) {
      log("warn", "Email field missing in request", logSource);
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    
    const pool = await getPool();
    const client = await pool.connect();
    
    log("debug", `Creating password reset token for email: ${email}`, logSource);
    
    // Create token in database
    const result = await client.query(
      'SELECT create_password_reset_token($1, $2, $3)',
      [email, token, expiresAt]
    );
    
    const status = result.rows[0].create_password_reset_token;
    
    if (status !== 'Password reset token created successfully') {
      log("debug", `Token creation status: ${status}`, logSource);
      // Don't reveal if email exists or not for security reasons
      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link.' },
        { status: 200 }
      );
    }
    
    // Send email with reset link
    log("debug", `Sending password reset email to: ${email}`, logSource);
    await sendPasswordResetEmail(email, token);
    
    log("debug", `Password reset flow completed successfully for: ${email}`, logSource);
    
    return NextResponse.json(
      { message: 'If your email is registered, you will receive a password reset link.' },
      { status: 200 }
    );
  } catch (error) {
    log("error", `Password reset request error: ${error}`, logSource);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
});