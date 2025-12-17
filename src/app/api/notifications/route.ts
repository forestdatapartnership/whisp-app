import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { compose } from '@/lib/utils/compose';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { withJsonBody } from '@/lib/hooks/withJsonBody';
import { useResponse } from '@/lib/hooks/responses';
import { validateRequiredFields } from '@/lib/utils/fieldValidation';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import { LogFunction } from '@/lib/logger';
import disposableDomains from 'disposable-email-domains';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const validateEmailFormat = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
};

const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    return false;
  }
};

export const POST = compose(
  withLogging,
  withErrorHandling,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['email']);

  const { email } = body;
  const normalizedEmail = email.toLowerCase();
  
  if (!validateEmailFormat(normalizedEmail)) {
    throw new SystemError(SystemCode.NOTIFICATION_INVALID_EMAIL);
  }

  if (isDisposableEmail(normalizedEmail)) {
    log('info', `Blocked disposable email: ${normalizedEmail}`);
    return useResponse(SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS);
  }

  const hasMxRecords = await validateEmailDomain(normalizedEmail);
  if (!hasMxRecords) {
    log('info', `Blocked email with invalid domain: ${normalizedEmail}`);
    return useResponse(SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('SELECT subscribe_notifications($1)', [normalizedEmail]);
    return useResponse(SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS);
  } finally {
    client.release();
  }
});

export const DELETE = compose(
  withLogging,
  withErrorHandling,
  withJsonBody
)(async (_req: NextRequest, log: LogFunction, body: any): Promise<NextResponse> => {
  validateRequiredFields(body, ['email']);

  const { email } = body;
  const normalizedEmail = email.toLowerCase();
  
  if (!validateEmailFormat(normalizedEmail)) {
    throw new SystemError(SystemCode.NOTIFICATION_INVALID_EMAIL);
  }

  if (isDisposableEmail(normalizedEmail)) {
    log('info', `Blocked disposable email unsubscribe: ${normalizedEmail}`);
    return useResponse(SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS);
  }

  const hasMxRecords = await validateEmailDomain(normalizedEmail);
  if (!hasMxRecords) {
    log('info', `Blocked email with invalid domain unsubscribe: ${normalizedEmail}`);
    return useResponse(SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('SELECT unsubscribe_notifications($1)', [normalizedEmail]);
    return useResponse(SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS);
  } finally {
    client.release();
  }
});

