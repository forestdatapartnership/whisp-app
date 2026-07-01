from collections.abc import Sequence
from enum import Enum


class SystemCode(str, Enum):
    def __new__(cls, value: str, http_status: int = 500, message: str = ""):
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj.http_status = http_status
        obj.message = message
        return obj

    SYSTEM_INTERNAL_SERVER_ERROR = ("system_internal_server_error", 500, "An internal server error occurred. Please try again later.")

    AUTH_MISSING_API_KEY = ("auth_missing_api_key", 401, "API key is required for this request.")
    AUTH_INVALID_API_KEY = ("auth_invalid_api_key", 401, "Invalid or expired API key.")
    AUTH_RATE_LIMIT_EXCEEDED = ("auth_rate_limit_exceeded", 429, "Rate limit exceeded. Try again in {0} seconds.")

    VALIDATION_MISSING_REQUEST_BODY = ("validation_missing_request_body", 400, "Missing or invalid request body.")
    VALIDATION_INVALID_GEOJSON = ("validation_invalid_geojson", 400, "The body does not contain a valid GeoJSON. Errors:\n{0}")
    VALIDATION_INVALID_WKT = ("validation_invalid_wkt", 400, "Invalid WKT format. Unable to parse geometry.")
    VALIDATION_INVALID_COORDINATES = ("validation_invalid_coordinates", 400, "Invalid coordinates. Please ensure your data uses EPSG:4326 (WGS84) coordinate reference system.",)
    VALIDATION_COORDINATES_IN_METERS = ("validation_coordinates_in_meters", 400, "Coordinates appear to be in meters rather than degrees. Please use EPSG:4326 (WGS84) coordinate reference system.")
    VALIDATION_INVALID_CRS = ("validation_invalid_crs", 400, "Invalid coordinate reference system. Only EPSG:4326 is supported.")

    VALIDATION_TOO_MANY_GEOMETRIES = ("validation_too_many_geometries", 400, "Too many geometries provided. Maximum allowed is {0}.")
    VALIDATION_REQUEST_BODY_TOO_LARGE = ("validation_request_body_too_large", 413, "Request body is too large: {0} KB. Maximum allowed size is {1} KB.")
    VALIDATION_INVALID_EXTERNAL_ID_COLUMN = ("validation_invalid_external_id_column", 400, 'The external ID column "{0}" does not exist in your GeoJSON features. Available columns: {1}')
    VALIDATION_GEO_ID_NOT_FOUND = ("validation_geo_id_not_found", 400, "One or more Geo IDs were not found in GeoID.")
    VALIDATION_INVALID_GEO_ID = ("validation_invalid_geo_id", 400, 'Invalid Geo ID "{0}".')

    SERVICE_GEOID_NOT_CONFIGURED = ("service_geoid_not_configured", 503, "GeoID service is not configured. Please contact the administrator.")
    SERVICE_GEOID_UNAVAILABLE = ("service_geoid_unavailable", 503, "GeoID service is currently unavailable. Please try again later.")

    ANALYSIS_QUEUED = ("analysis_queued", 202, "Analysis queued, waiting for available worker...")
    ANALYSIS_PROCESSING = ("analysis_processing", 202, "Analysis in progress...")
    ANALYSIS_COMPLETED = ("analysis_completed", 200, "Analysis completed successfully")
    ANALYSIS_ERROR = ("analysis_error", 500, "Analysis service encountered an error. Please try again.")
    ANALYSIS_TIMEOUT = ("analysis_timeout", 408, "Analysis timed out after {0} seconds. Please try with a smaller dataset or contact support.")
    ANALYSIS_CANCELLED = ("analysis_cancelled", 400, "Analysis cancelled.")
    ANALYSIS_JOB_NOT_FOUND = ("analysis_job_not_found", 404, "Analysis job not found.")
    ANALYSIS_TOO_MANY_CONCURRENT = ("analysis_too_many_concurrent", 429, "Too many concurrent analyses. Please wait for existing analyses to finish.")

    def format(self, args: Sequence[str] | int | float | None = None) -> str:
        if args is None:
            return self.message
        if not isinstance(args, Sequence):
            args = [args]
        if not args:
            return self.message
        return self.message.format(*args)


RUNNING_STATUSES = frozenset({
    SystemCode.ANALYSIS_QUEUED,
    SystemCode.ANALYSIS_PROCESSING,
})

TERMINAL_STATUSES = frozenset({
    SystemCode.ANALYSIS_COMPLETED,
    SystemCode.ANALYSIS_ERROR,
    SystemCode.ANALYSIS_TIMEOUT,
    SystemCode.ANALYSIS_CANCELLED,
})
