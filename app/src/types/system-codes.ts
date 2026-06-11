export enum SystemCode {
  SYSTEM_INTERNAL_SERVER_ERROR = 'system_internal_server_error',

  AUTH_UNAUTHORIZED = 'auth_unauthorized',
  AUTH_INVALID_CREDENTIALS = 'auth_invalid_credentials',
  AUTH_EMAIL_NOT_VERIFIED = 'auth_email_not_verified',
  AUTH_INVALID_TOKEN = 'auth_invalid_token',
  AUTH_RATE_LIMIT_EXCEEDED = 'auth_rate_limit_exceeded',
  AUTH_ADMIN_REQUIRED = 'auth_admin_required',

  USER_WEAK_PASSWORD = 'user_weak_password',
  USER_EMAIL_ALREADY_EXISTS = 'user_email_already_exists',
  USER_INVALID_EMAIL = 'user_invalid_email',
  USER_REGISTRATION_FAILED = 'user_registration_failed',
  USER_NOT_FOUND = 'user_not_found',
  USER_PASSWORD_CONFIRMATION_REQUIRED = 'user_password_confirmation_required',
  USER_INVALID_PASSWORD = 'user_invalid_password',

  VALIDATION_MISSING_REQUIRED_FIELDS = 'validation_missing_required_fields',

  ANALYSIS_QUEUED = 'analysis_queued',
  ANALYSIS_PROCESSING = 'analysis_processing',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_ERROR = 'analysis_error',
  ANALYSIS_TIMEOUT = 'analysis_timeout',

  RESULT_FIELDS_DUPLICATE_CODE = 'result_fields_duplicate_code',
  COMMODITIES_DUPLICATE_CODE = 'commodities_duplicate_code',
}

export const SYSTEM_MESSAGES: Record<SystemCode, string> = {
  [SystemCode.SYSTEM_INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',

  [SystemCode.AUTH_UNAUTHORIZED]: 'Unauthorized access. Please authenticate.',
  [SystemCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [SystemCode.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in. Check your inbox for a verification link.',
  [SystemCode.AUTH_INVALID_TOKEN]: 'Invalid or expired token.',
  [SystemCode.AUTH_RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Try again in {0} seconds.',
  [SystemCode.AUTH_ADMIN_REQUIRED]: 'Administrator access required',

  [SystemCode.USER_WEAK_PASSWORD]: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
  [SystemCode.USER_EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [SystemCode.USER_INVALID_EMAIL]: 'Please provide a valid email address.',
  [SystemCode.USER_REGISTRATION_FAILED]: 'Registration failed. Please try again.',
  [SystemCode.USER_NOT_FOUND]: 'User not found.',
  [SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED]: 'Password confirmation is required for this operation.',
  [SystemCode.USER_INVALID_PASSWORD]: 'Current password is incorrect.',

  [SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS]: 'Missing required fields: {0}',

  [SystemCode.ANALYSIS_QUEUED]: 'Analysis queued, waiting for available worker...',
  [SystemCode.ANALYSIS_PROCESSING]: 'Analysis in progress...',
  [SystemCode.ANALYSIS_COMPLETED]: 'Analysis completed successfully',
  [SystemCode.ANALYSIS_ERROR]: 'Analysis service encountered an error. Please try again.',
  [SystemCode.ANALYSIS_TIMEOUT]: 'Analysis timed out after {0} seconds. Please try with a smaller dataset or contact support.',

  [SystemCode.RESULT_FIELDS_DUPLICATE_CODE]: 'A field with this name already exists',
  [SystemCode.COMMODITIES_DUPLICATE_CODE]: 'A commodity with this code already exists',
};

export function formatSystemMessage(code: SystemCode, args?: (string | number)[]): string {
  const template = SYSTEM_MESSAGES[code] ?? code;
  if (!args?.length) return template;
  return template.replace(/\{(\d+)\}/g, (m, i) => {
    const v = args[parseInt(i, 10)];
    return v !== undefined ? String(v) : m;
  });
}
