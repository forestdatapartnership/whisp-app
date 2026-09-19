import { SystemError } from '@/types/system-error';
import { SystemCode } from '@/types/system-codes';

export function validateRequiredFields(body: Record<string, unknown>, requiredFields: string[]): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new SystemError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, [missingFields.join(', ')]);
  }
}

type PasswordRule = 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special';

export const PASSWORD_RULES: { rule: PasswordRule; test: (p: string) => boolean }[] = [
  { rule: 'minLength', test: (p) => p.length >= 8 },
  { rule: 'uppercase', test: (p) => /[A-Z]/.test(p) },
  { rule: 'lowercase', test: (p) => /[a-z]/.test(p) },
  { rule: 'number', test: (p) => /[0-9]/.test(p) },
  { rule: 'special', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function getPasswordErrors(password: string): PasswordRule[] {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.rule);
}

export function isValidPassword(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}
