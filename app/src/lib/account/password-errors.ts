import { formatSystemMessage, SystemCode } from '@/types/system-codes';

export type PasswordErrors = {
  current?: string;
  new?: string;
  confirm?: string;
  general?: string;
};

export function mapPasswordApiError(code: SystemCode): PasswordErrors {
  if (code === SystemCode.USER_INVALID_PASSWORD) {
    return { current: formatSystemMessage(code) };
  }
  if (code === SystemCode.USER_WEAK_PASSWORD) {
    return { new: formatSystemMessage(code) };
  }
  return { general: formatSystemMessage(code) };
}
