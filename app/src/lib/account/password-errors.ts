import { SystemCode } from '@/types/system-codes';

export type PasswordErrors = {
  current?: string;
  new?: string;
  confirm?: string;
  general?: string;
};

export function passwordErrorField(code: SystemCode): keyof PasswordErrors {
  if (code === SystemCode.USER_INVALID_PASSWORD) return 'current';
  if (code === SystemCode.USER_WEAK_PASSWORD) return 'new';
  return 'general';
}
