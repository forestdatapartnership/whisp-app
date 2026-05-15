import 'server-only';
import disposableDomains from 'disposable-email-domains';
import dns from 'dns';
import { promisify } from 'util';
import { normalizeEmail, validateEmailFormat } from '@/lib/shared/email-format';

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

export async function validateEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!validateEmailFormat(normalized)) return null;
  if (isDisposableEmail(normalized)) return null;
  if (!(await validateEmailDomain(normalized))) return null;
  return normalized;
}
