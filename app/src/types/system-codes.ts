export enum SystemCode {
  SYSTEM_INTERNAL_SERVER_ERROR = 'system_internal_server_error',

  AUTH_UNAUTHORIZED = 'auth_unauthorized',
  AUTH_INVALID_CREDENTIALS = 'auth_invalid_credentials',
  AUTH_EMAIL_NOT_VERIFIED = 'auth_email_not_verified',
  AUTH_INVALID_TOKEN = 'auth_invalid_token',
  AUTH_RATE_LIMIT_EXCEEDED = 'auth_rate_limit_exceeded',
  AUTH_ADMIN_REQUIRED = 'auth_admin_required',
  AUTH_SSO_REQUIRED = 'auth_sso_required',
  AUTH_SSO_FAILED = 'auth_sso_failed',

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
  ANALYSIS_CANCELLED = 'analysis_cancelled',

  RESULT_FIELDS_DUPLICATE_CODE = 'result_fields_duplicate_code',
  COMMODITIES_DUPLICATE_CODE = 'commodities_duplicate_code',
}
