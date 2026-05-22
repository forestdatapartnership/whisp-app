export enum SystemCode {
  SYSTEM_INTERNAL_SERVER_ERROR = 'system_internal_server_error',
  SYSTEM_MISSING_REQUEST_BODY = 'system_missing_request_body',

  AUTH_UNAUTHORIZED = 'auth_unauthorized',
  AUTH_MISSING_API_KEY = 'auth_missing_api_key',
  AUTH_INVALID_API_KEY = 'auth_invalid_api_key',
  AUTH_INVALID_CREDENTIALS = 'auth_invalid_credentials',
  AUTH_EMAIL_NOT_VERIFIED = 'auth_email_not_verified',
  AUTH_INVALID_TOKEN = 'auth_invalid_token',
  AUTH_RATE_LIMIT_EXCEEDED = 'auth_rate_limit_exceeded',
  AUTH_EMAIL_VERIFIED_SUCCESS = 'auth_email_verified_success',
  AUTH_ADMIN_REQUIRED = 'auth_admin_required',

  USER_WEAK_PASSWORD = 'user_weak_password',
  USER_EMAIL_ALREADY_EXISTS = 'user_email_already_exists',
  USER_INVALID_EMAIL = 'user_invalid_email',
  USER_REGISTRATION_FAILED = 'user_registration_failed',
  USER_NOT_FOUND = 'user_not_found',
  USER_PASSWORD_CONFIRMATION_REQUIRED = 'user_password_confirmation_required',
  USER_INVALID_PASSWORD = 'user_invalid_password',

  VALIDATION_MISSING_REQUIRED_FIELDS = 'validation_missing_required_fields',
  VALIDATION_INVALID_GEOJSON = 'validation_invalid_geojson',
  VALIDATION_INVALID_WKT = 'validation_invalid_wkt',
  VALIDATION_INVALID_COORDINATES = 'validation_invalid_coordinates',
  VALIDATION_INVALID_CRS = 'validation_invalid_crs',
  VALIDATION_COORDINATES_IN_METERS = 'validation_coordinates_in_meters',
  VALIDATION_TOO_MANY_GEOMETRIES = 'validation_too_many_geometries',
  VALIDATION_REQUEST_BODY_TOO_LARGE = 'validation_request_body_too_large',
  VALIDATION_INVALID_EXTERNAL_ID_COLUMN = 'validation_invalid_external_id_column',
  VALIDATION_GEO_ID_NOT_FOUND = 'validation_geo_id_not_found',

  SERVICE_GEOID_NOT_CONFIGURED = 'service_geoid_not_configured',
  SERVICE_GEOID_UNAVAILABLE = 'service_geoid_unavailable',

  ANALYSIS_QUEUED = 'analysis_queued',
  ANALYSIS_PROCESSING = 'analysis_processing',
  ANALYSIS_COMPLETED = 'analysis_completed',
  ANALYSIS_ERROR = 'analysis_error',
  ANALYSIS_TIMEOUT = 'analysis_timeout',
  ANALYSIS_JOB_NOT_FOUND = 'analysis_job_not_found',
  ANALYSIS_TOO_MANY_CONCURRENT = 'analysis_too_many_concurrent',

  RESULT_FIELDS_DUPLICATE_CODE = 'result_fields_duplicate_code',
  COMMODITIES_DUPLICATE_CODE = 'commodities_duplicate_code',
}

export const SYSTEM_MESSAGES: Record<SystemCode, string> = {
  [SystemCode.SYSTEM_INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [SystemCode.SYSTEM_MISSING_REQUEST_BODY]: 'Missing or invalid request body.',

  [SystemCode.AUTH_UNAUTHORIZED]: 'Unauthorized access. Please authenticate.',
  [SystemCode.AUTH_MISSING_API_KEY]: 'API key is required for this request.',
  [SystemCode.AUTH_INVALID_API_KEY]: 'Invalid or expired API key.',
  [SystemCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [SystemCode.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in. Check your inbox for a verification link.',
  [SystemCode.AUTH_INVALID_TOKEN]: 'Invalid or expired token.',
  [SystemCode.AUTH_RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Try again in {0} seconds.',
  [SystemCode.AUTH_EMAIL_VERIFIED_SUCCESS]: 'Email verified successfully',
  [SystemCode.AUTH_ADMIN_REQUIRED]: 'Administrator access required',

  [SystemCode.USER_WEAK_PASSWORD]: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
  [SystemCode.USER_EMAIL_ALREADY_EXISTS]: 'An account with this email already exists.',
  [SystemCode.USER_INVALID_EMAIL]: 'Please provide a valid email address.',
  [SystemCode.USER_REGISTRATION_FAILED]: 'Registration failed. Please try again.',
  [SystemCode.USER_NOT_FOUND]: 'User not found.',
  [SystemCode.USER_PASSWORD_CONFIRMATION_REQUIRED]: 'Password confirmation is required for this operation.',
  [SystemCode.USER_INVALID_PASSWORD]: 'Current password is incorrect.',

  [SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS]: 'Missing required fields: {0}',
  [SystemCode.VALIDATION_INVALID_GEOJSON]: 'The body does not contain a valid GeoJSON. Errors:\n{0}',
  [SystemCode.VALIDATION_INVALID_WKT]: 'Invalid WKT format. Unable to parse geometry.',
  [SystemCode.VALIDATION_INVALID_COORDINATES]: 'Invalid coordinates. Please ensure your data uses EPSG:4326 (WGS84) coordinate reference system.',
  [SystemCode.VALIDATION_INVALID_CRS]: 'Invalid coordinate reference system. Only EPSG:4326 is supported.',
  [SystemCode.VALIDATION_COORDINATES_IN_METERS]: 'Coordinates appear to be in meters rather than degrees. Please use EPSG:4326 (WGS84) coordinates.',
  [SystemCode.VALIDATION_TOO_MANY_GEOMETRIES]: 'Too many geometries provided. Maximum allowed is {0}.',
  [SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE]: 'Request body is too large: {0} KB. Maximum allowed size is {1} KB.',
  [SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN]: 'The external ID column "{0}" does not exist in your GeoJSON features. Available columns: {1}',
  [SystemCode.VALIDATION_GEO_ID_NOT_FOUND]: 'One or more Geo IDs were not found in GeoID.',

  [SystemCode.SERVICE_GEOID_NOT_CONFIGURED]: 'GeoID service is not configured. Please contact the administrator.',
  [SystemCode.SERVICE_GEOID_UNAVAILABLE]: 'GeoID service is currently unavailable. Please try again later.',

  [SystemCode.ANALYSIS_QUEUED]: 'Analysis queued, waiting for available worker...',
  [SystemCode.ANALYSIS_PROCESSING]: 'Analysis in progress...',
  [SystemCode.ANALYSIS_COMPLETED]: 'Analysis completed successfully',
  [SystemCode.ANALYSIS_ERROR]: 'Analysis service encountered an error. Please try again.',
  [SystemCode.ANALYSIS_TIMEOUT]: 'Analysis timed out after {0} seconds. Please try with a smaller dataset or contact support.',
  [SystemCode.ANALYSIS_JOB_NOT_FOUND]: 'Analysis job not found.',
  [SystemCode.ANALYSIS_TOO_MANY_CONCURRENT]: 'Too many concurrent analyses. Please wait for existing analyses to finish.',

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
