export enum SystemCode {
  // General/System Errors
  SYSTEM_INTERNAL_SERVER_ERROR = 'system_internal_server_error',
  SYSTEM_MISSING_REQUEST_BODY = 'system_missing_request_body',

  // Authentication
  AUTH_UNAUTHORIZED = 'auth_unauthorized',
  AUTH_MISSING_API_KEY = 'auth_missing_api_key',
  AUTH_INVALID_API_KEY = 'auth_invalid_api_key',
  AUTH_INVALID_CREDENTIALS = 'auth_invalid_credentials',
  AUTH_EMAIL_NOT_VERIFIED = 'auth_email_not_verified',
  AUTH_INVALID_TOKEN = 'auth_invalid_token',
  AUTH_LOGIN_SUCCESS = 'auth_login_success',
  AUTH_LOGOUT_SUCCESS = 'auth_logout_success',
  AUTH_PASSWORD_RESET_REQUESTED = 'auth_password_reset_requested',
  AUTH_PASSWORD_RESET_SUCCESS = 'auth_password_reset_success',
  AUTH_RATE_LIMIT_EXCEEDED = 'auth_rate_limit_exceeded',
  AUTH_PASSWORD_CHANGED_SUCCESS = 'auth_password_changed_success',
  AUTH_STATUS_AUTHENTICATED = 'auth_status_authenticated',
  AUTH_STATUS_UNAUTHENTICATED = 'auth_status_unauthenticated',
  AUTH_EMAIL_VERIFIED_SUCCESS = 'auth_email_verified_success',
  AUTH_ADMIN_REQUIRED = 'auth_admin_required',

  // User Management
  USER_WEAK_PASSWORD = 'user_weak_password',
  USER_EMAIL_ALREADY_EXISTS = 'user_email_already_exists',
  USER_REGISTRATION_FAILED = 'user_registration_failed',
  USER_NOT_FOUND = 'user_not_found',
  USER_INVALID_USER_ID = 'user_invalid_user_id',
  USER_PASSWORD_CONFIRMATION_REQUIRED = 'user_password_confirmation_required',
  USER_INVALID_PASSWORD = 'user_invalid_password',
  USER_REGISTRATION_SUCCESS = 'user_registration_success',
  USER_PROFILE_UPDATE_SUCCESS = 'user_profile_update_success',
  USER_ACCOUNT_DELETION_SUCCESS = 'user_account_deletion_success',
  USER_API_KEY_CREATED_SUCCESS = 'user_api_key_created_success',
  USER_API_KEY_DELETED_SUCCESS = 'user_api_key_deleted_success',

  // Notifications
  NOTIFICATION_SUBSCRIBED_SUCCESS = 'notification_subscribed_success',
  NOTIFICATION_UNSUBSCRIBED_SUCCESS = 'notification_unsubscribed_success',
  NOTIFICATION_INVALID_EMAIL = 'notification_invalid_email',

  // Data Validation Errors
  VALIDATION_MISSING_REQUIRED_FIELDS = 'validation_missing_required_fields',
  VALIDATION_INVALID_GEOJSON = 'validation_invalid_geojson',
  VALIDATION_INVALID_WKT = 'validation_invalid_wkt',
  VALIDATION_INVALID_COORDINATES = 'validation_invalid_coordinates',
  VALIDATION_INVALID_CRS = 'validation_invalid_crs',
  VALIDATION_COORDINATES_IN_METERS = 'validation_coordinates_in_meters',
  VALIDATION_TOO_MANY_GEOMETRIES = 'validation_too_many_geometries',
  VALIDATION_REQUEST_BODY_TOO_LARGE = 'validation_request_body_too_large',
  VALIDATION_INVALID_EXTERNAL_ID_COLUMN = 'validation_invalid_external_id_column',

  // Service/External Errors
  SERVICE_ASSET_REGISTRY_UNAVAILABLE = 'service_asset_registry_unavailable',

  // Analysis Status
  ANALYSIS_PROCESSING = 'analysis_processing',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_ERROR = 'analysis_error',
  ANALYSIS_TIMEOUT = 'analysis_timeout',
  ANALYSIS_JOB_NOT_FOUND = 'analysis_job_not_found',
  ANALYSIS_TOO_MANY_CONCURRENT = 'analysis_too_many_concurrent',

  RESULT_COLUMNS_NOT_FOUND = 'result_columns_not_found',
  RESULT_COLUMNS_DUPLICATE_NAME = 'result_columns_duplicate_name',
  RESULT_COLUMNS_FETCH_SUCCESS = 'result_columns_fetch_success',
  RESULT_COLUMNS_CREATED_SUCCESS = 'result_columns_created_success',
  RESULT_COLUMNS_UPDATED_SUCCESS = 'result_columns_updated_success',
  RESULT_COLUMNS_DELETED_SUCCESS = 'result_columns_deleted_success',
}

export interface SystemCodeInfo {
  code: SystemCode;
  message: string;
  httpStatus?: number;
  publicCode?: SystemCode;
}

/**
 * Formats a string by replacing placeholders like {0}, {1}, {2} with provided arguments
 * @param template - The template string with placeholders
 * @param args - Arguments to replace placeholders with
 * @returns Formatted string
 */
export function formatString(template: string, ...args: (string | number)[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const argIndex = parseInt(index, 10);
    return args[argIndex] !== undefined ? String(args[argIndex]) : match;
  });
}

export const SYSTEM_MESSAGES: Record<SystemCode, SystemCodeInfo> = {
  // General/System Errors
  [SystemCode.SYSTEM_INTERNAL_SERVER_ERROR]: {
    code: SystemCode.SYSTEM_INTERNAL_SERVER_ERROR,
    message: 'An internal server error occurred. Please try again later.',
    httpStatus: 500
  },
  [SystemCode.SYSTEM_MISSING_REQUEST_BODY]: {
    code: SystemCode.SYSTEM_MISSING_REQUEST_BODY,
    message: 'Missing or invalid request body.',
    httpStatus: 400
  },

  // Authentication Errors
  [SystemCode.AUTH_UNAUTHORIZED]: {
    code: SystemCode.AUTH_UNAUTHORIZED,
    message: 'Unauthorized access. Please authenticate.',
    httpStatus: 401
  },
  [SystemCode.AUTH_MISSING_API_KEY]: {
    code: SystemCode.AUTH_MISSING_API_KEY,
    message: 'API key is required for this request.',
    httpStatus: 401
  },
  [SystemCode.AUTH_INVALID_API_KEY]: {
    code: SystemCode.AUTH_INVALID_API_KEY,
    message: 'Invalid or expired API key.',
    httpStatus: 401
  },
  [SystemCode.AUTH_INVALID_CREDENTIALS]: {
    code: SystemCode.AUTH_INVALID_CREDENTIALS,
    message: 'Invalid email or password.',
    httpStatus: 401
  },
  [SystemCode.AUTH_EMAIL_NOT_VERIFIED]: {
    code: SystemCode.AUTH_EMAIL_NOT_VERIFIED,
    message: 'Please verify your email before logging in. Check your inbox for a verification link.',
    httpStatus: 403
  },
  [SystemCode.AUTH_INVALID_TOKEN]: {
    code: SystemCode.AUTH_INVALID_TOKEN,
    message: 'Invalid or expired token.',
    httpStatus: 400
  },
  [SystemCode.AUTH_LOGIN_SUCCESS]: {
    code: SystemCode.AUTH_LOGIN_SUCCESS,
    message: 'Login successful',
    httpStatus: 200
  },
  [SystemCode.AUTH_LOGOUT_SUCCESS]: {
    code: SystemCode.AUTH_LOGOUT_SUCCESS,
    message: 'Logout successful',
    httpStatus: 200
  },
  [SystemCode.AUTH_PASSWORD_RESET_REQUESTED]: {
    code: SystemCode.AUTH_PASSWORD_RESET_REQUESTED,
    message: 'If your email is registered, you will receive a password reset link.',
    httpStatus: 200
  },
  [SystemCode.AUTH_PASSWORD_RESET_SUCCESS]: {
    code: SystemCode.AUTH_PASSWORD_RESET_SUCCESS,
    message: 'Your password has been reset successfully',
    httpStatus: 200
  },
  [SystemCode.AUTH_RATE_LIMIT_EXCEEDED]: {
    code: SystemCode.AUTH_RATE_LIMIT_EXCEEDED,
    message: 'Rate limit exceeded. Try again in {0} seconds.',
    httpStatus: 429
  },
  [SystemCode.AUTH_PASSWORD_CHANGED_SUCCESS]: {
    code: SystemCode.AUTH_PASSWORD_CHANGED_SUCCESS,
    message: 'Password changed successfully',
    httpStatus: 200
  },
  [SystemCode.AUTH_STATUS_AUTHENTICATED]: {
    code: SystemCode.AUTH_STATUS_AUTHENTICATED,
    message: 'User is authenticated',
    httpStatus: 200
  },
  [SystemCode.AUTH_STATUS_UNAUTHENTICATED]: {
    code: SystemCode.AUTH_STATUS_UNAUTHENTICATED,
    message: 'User is not authenticated',
    httpStatus: 200
  },
  [SystemCode.AUTH_EMAIL_VERIFIED_SUCCESS]: {
    code: SystemCode.AUTH_EMAIL_VERIFIED_SUCCESS,
    message: 'Email verified successfully',
    httpStatus: 200
  },
  [SystemCode.AUTH_ADMIN_REQUIRED]: {
    code: SystemCode.AUTH_ADMIN_REQUIRED,
    message: 'Administrator access required',
    httpStatus: 403
  },

  // User Management
  [SystemCode.USER_WEAK_PASSWORD]: {
    code: SystemCode.USER_WEAK_PASSWORD,
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
    httpStatus: 400
  },
  [SystemCode.USER_EMAIL_ALREADY_EXISTS]: {
    code: SystemCode.USER_EMAIL_ALREADY_EXISTS,
    message: 'An account with this email already exists.',
    httpStatus: 409
  },
  [SystemCode.USER_REGISTRATION_FAILED]: {
    code: SystemCode.USER_REGISTRATION_FAILED,
    message: 'Registration failed. Please try again.',
    httpStatus: 400
  },
  [SystemCode.USER_NOT_FOUND]: {
    code: SystemCode.USER_NOT_FOUND,
    message: 'User not found.',
    httpStatus: 404
  },
  [SystemCode.USER_INVALID_USER_ID]: {
    code: SystemCode.USER_INVALID_USER_ID,
    message: 'Invalid user ID provided.',
    httpStatus: 400
  },
  [SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED]: {
    code: SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED,
    message: 'Password confirmation is required for this operation.',
    httpStatus: 400
  },
  [SystemCode.USER_INVALID_PASSWORD]: {
    code: SystemCode.USER_INVALID_PASSWORD,
    message: 'Current password is incorrect.',
    httpStatus: 401
  },
  [SystemCode.USER_REGISTRATION_SUCCESS]: {
    code: SystemCode.USER_REGISTRATION_SUCCESS,
    message: 'Registration successful. Please check your email to verify your account.',
    httpStatus: 201
  },
  [SystemCode.USER_PROFILE_UPDATE_SUCCESS]: {
    code: SystemCode.USER_PROFILE_UPDATE_SUCCESS,
    message: 'Profile updated successfully',
    httpStatus: 200
  },
  [SystemCode.USER_ACCOUNT_DELETION_SUCCESS]: {
    code: SystemCode.USER_ACCOUNT_DELETION_SUCCESS,
    message: 'Account deleted successfully',
    httpStatus: 200
  },
  [SystemCode.USER_API_KEY_CREATED_SUCCESS]: {
    code: SystemCode.USER_API_KEY_CREATED_SUCCESS,
    message: 'API key created successfully',
    httpStatus: 201
  },
  [SystemCode.USER_API_KEY_DELETED_SUCCESS]: {
    code: SystemCode.USER_API_KEY_DELETED_SUCCESS,
    message: 'API key deleted successfully',
    httpStatus: 200
  },

  // Notifications
  [SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS]: {
    code: SystemCode.NOTIFICATION_SUBSCRIBED_SUCCESS,
    message: 'Successfully subscribed to email notifications',
    httpStatus: 200
  },
  [SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS]: {
    code: SystemCode.NOTIFICATION_UNSUBSCRIBED_SUCCESS,
    message: 'Successfully unsubscribed from email notifications',
    httpStatus: 200
  },
  [SystemCode.NOTIFICATION_INVALID_EMAIL]: {
    code: SystemCode.NOTIFICATION_INVALID_EMAIL,
    message: 'Invalid email format',
    httpStatus: 400
  },

  // Data Validation Errors
  [SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS]: {
    code: SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS,
    message: 'Missing required fields: {0}',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_INVALID_GEOJSON]: {
    code: SystemCode.VALIDATION_INVALID_GEOJSON,
    message: 'The body does not contain a valid GeoJSON. Errors:\n{0}',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_INVALID_WKT]: {
    code: SystemCode.VALIDATION_INVALID_WKT,
    message: 'Invalid WKT format. Unable to parse geometry.',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_INVALID_COORDINATES]: {
    code: SystemCode.VALIDATION_INVALID_COORDINATES,
    message: 'Invalid coordinates. Please ensure your data uses EPSG:4326 (WGS84) coordinate reference system.',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_INVALID_CRS]: {
    code: SystemCode.VALIDATION_INVALID_CRS,
    message: 'Invalid coordinate reference system. Only EPSG:4326 is supported.',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_COORDINATES_IN_METERS]: {
    code: SystemCode.VALIDATION_COORDINATES_IN_METERS,
    message: 'Coordinates appear to be in meters rather than degrees. Please use EPSG:4326 (WGS84) coordinates.',
    httpStatus: 400
  },
  [SystemCode.VALIDATION_TOO_MANY_GEOMETRIES]: {
    code: SystemCode.VALIDATION_TOO_MANY_GEOMETRIES,
    message: 'Too many geometries provided. Maximum allowed is {0}.',
    httpStatus: 400
  },

  [SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE]: {
    code: SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE,
    message: 'Request body is too large: {0} KB. Maximum allowed size is {1} KB.',
    httpStatus: 413
  },
  [SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN]: {
    code: SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN,
    message: 'The external ID column "{0}" does not exist in your GeoJSON features. Available columns: {1}',
    httpStatus: 400
  },

  // Service/External Errors
  [SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE]: {
    code: SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE,
    message: 'Asset registry service is currently unavailable. Please try again later.',
    publicCode: SystemCode.ANALYSIS_ERROR
  },

  // Analysis Status
  [SystemCode.ANALYSIS_PROCESSING]: {
    code: SystemCode.ANALYSIS_PROCESSING,
    message: 'Analysis in progress...',
    httpStatus: 200
  },
  [SystemCode.ANALYSIS_COMPLETED]: {
    code: SystemCode.ANALYSIS_COMPLETED,
    message: 'Analysis completed successfully',
    httpStatus: 200
  },
  [SystemCode.ANALYSIS_ERROR]: {
    code: SystemCode.ANALYSIS_ERROR,
    message: 'Analysis service encountered an error. Please try again.',
    httpStatus: 500
  },
  [SystemCode.ANALYSIS_TIMEOUT]: {
    code: SystemCode.ANALYSIS_TIMEOUT,
    message: 'Analysis timed out after {0} seconds. Please try with a smaller dataset or contact support.',
    httpStatus: 408
  },
  [SystemCode.ANALYSIS_JOB_NOT_FOUND]: {
    code: SystemCode.ANALYSIS_JOB_NOT_FOUND,
    message: 'Analysis job not found.',
    httpStatus: 404
  },
  [SystemCode.ANALYSIS_TOO_MANY_CONCURRENT]: {
    code: SystemCode.ANALYSIS_TOO_MANY_CONCURRENT,
    message: 'Too many concurrent analyses. Please wait for existing analyses to finish.',
    httpStatus: 429
  },

  [SystemCode.RESULT_COLUMNS_NOT_FOUND]: {
    code: SystemCode.RESULT_COLUMNS_NOT_FOUND,
    message: 'Result column definition not found',
    httpStatus: 404
  },
  [SystemCode.RESULT_COLUMNS_DUPLICATE_NAME]: {
    code: SystemCode.RESULT_COLUMNS_DUPLICATE_NAME,
    message: 'A column with this name already exists',
    httpStatus: 409
  },
  [SystemCode.RESULT_COLUMNS_FETCH_SUCCESS]: {
    code: SystemCode.RESULT_COLUMNS_FETCH_SUCCESS,
    message: 'Result columns fetched successfully',
    httpStatus: 200
  },
  [SystemCode.RESULT_COLUMNS_CREATED_SUCCESS]: {
    code: SystemCode.RESULT_COLUMNS_CREATED_SUCCESS,
    message: 'Result column created successfully',
    httpStatus: 201
  },
  [SystemCode.RESULT_COLUMNS_UPDATED_SUCCESS]: {
    code: SystemCode.RESULT_COLUMNS_UPDATED_SUCCESS,
    message: 'Result column updated successfully',
    httpStatus: 200
  },
  [SystemCode.RESULT_COLUMNS_DELETED_SUCCESS]: {
    code: SystemCode.RESULT_COLUMNS_DELETED_SUCCESS,
    message: 'Result column deleted successfully',
    httpStatus: 200
  }
};

export function getSystemCodeInfo(responseCode: SystemCode): SystemCodeInfo {
  return SYSTEM_MESSAGES[responseCode];
}

export function createFormattedSystemCodeInfo(responseCode: SystemCode, formatArgs: (string | number)[]): SystemCodeInfo {
  const baseInfo = SYSTEM_MESSAGES[responseCode];
  return {
    ...baseInfo,
    message: formatString(baseInfo.message, ...formatArgs)
  };
}
