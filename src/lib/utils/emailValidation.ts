import disposableDomains from 'disposable-email-domains';
import dns from 'dns';
import { promisify } from 'util';
import type { LogFunction } from '@/lib/logger';
import { validateEmailFormat } from './emailFormat';

const resolveMx = promisify(dns.resolveMx);

const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? disposableDomains.includes(domain) : true;
};

const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    const mxRecords = await resolveMx(domain);
    return !!(mxRecords && mxRecords.length > 0);
  } catch {
    return false;
  }
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export async function validateEmail(
  email: string,
  log?: LogFunction
): Promise<string | null> {
  const normalized = normalizeEmail(email);

  if (!validateEmailFormat(normalized)) {
    log?.('info', `Invalid email format: ${email}`);
    return null;
  }

  if (isDisposableEmail(normalized)) {
    log?.('info', `Blocked disposable email: ${email}`);
    return null;
  }

  if (!(await validateEmailDomain(normalized))) {
    log?.('info', `Blocked email with invalid domain: ${email}`);
    return null;
  }

  return normalized;
}
