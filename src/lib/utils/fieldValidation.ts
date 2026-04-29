import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';

export function validateRequiredFields(body: any, requiredFields: string[]): void {
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

export const PASSWORD_RULES: { test: (p: string) => boolean; message: string }[] = [
  { test: (p) => p.length >= 8, message: 'At least 8 characters long' },
  { test: (p) => /[A-Z]/.test(p), message: 'Include at least one uppercase letter (A-Z)' },
  { test: (p) => /[a-z]/.test(p), message: 'Include at least one lowercase letter (a-z)' },
  { test: (p) => /[0-9]/.test(p), message: 'Include at least one number (0-9)' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), message: 'Include at least one special character' },
];

export function getPasswordErrors(password: string): string[] {
  return PASSWORD_RULES.filter(r => !r.test(password)).map(r => r.message);
}

export function isValidPassword(password: string): boolean {
  return PASSWORD_RULES.every(r => r.test(password));
}

