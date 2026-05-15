import re
from enum import Enum


class SystemCode(str, Enum):
    SYSTEM_INTERNAL_SERVER_ERROR = "system_internal_server_error"
    SYSTEM_MISSING_REQUEST_BODY = "system_missing_request_body"

    AUTH_UNAUTHORIZED = "auth_unauthorized"
    AUTH_MISSING_API_KEY = "auth_missing_api_key"
    AUTH_INVALID_API_KEY = "auth_invalid_api_key"
    AUTH_RATE_LIMIT_EXCEEDED = "auth_rate_limit_exceeded"

    VALIDATION_MISSING_REQUIRED_FIELDS = "validation_missing_required_fields"
    VALIDATION_INVALID_GEOJSON = "validation_invalid_geojson"
    VALIDATION_INVALID_WKT = "validation_invalid_wkt"
    VALIDATION_INVALID_COORDINATES = "validation_invalid_coordinates"
    VALIDATION_INVALID_CRS = "validation_invalid_crs"
    VALIDATION_COORDINATES_IN_METERS = "validation_coordinates_in_meters"
    VALIDATION_TOO_MANY_GEOMETRIES = "validation_too_many_geometries"
    VALIDATION_REQUEST_BODY_TOO_LARGE = "validation_request_body_too_large"
    VALIDATION_INVALID_EXTERNAL_ID_COLUMN = "validation_invalid_external_id_column"
    VALIDATION_GEO_ID_NOT_FOUND = "validation_geo_id_not_found"

    SERVICE_ASSET_REGISTRY_NOT_CONFIGURED = "service_asset_registry_not_configured"
    SERVICE_ASSET_REGISTRY_UNAVAILABLE = "service_asset_registry_unavailable"

    ANALYSIS_QUEUED = "analysis_queued"
    ANALYSIS_PROCESSING = "analysis_processing"
    ANALYSIS_COMPLETED = "analysis_completed"
    ANALYSIS_ERROR = "analysis_error"
    ANALYSIS_TIMEOUT = "analysis_timeout"
    ANALYSIS_JOB_NOT_FOUND = "analysis_job_not_found"
    ANALYSIS_TOO_MANY_CONCURRENT = "analysis_too_many_concurrent"


HTTP_STATUS: dict[SystemCode, int] = {
    SystemCode.SYSTEM_INTERNAL_SERVER_ERROR: 500,
    SystemCode.SYSTEM_MISSING_REQUEST_BODY: 400,
    SystemCode.AUTH_UNAUTHORIZED: 401,
    SystemCode.AUTH_MISSING_API_KEY: 401,
    SystemCode.AUTH_INVALID_API_KEY: 401,
    SystemCode.AUTH_RATE_LIMIT_EXCEEDED: 429,
    SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS: 400,
    SystemCode.VALIDATION_INVALID_GEOJSON: 400,
    SystemCode.VALIDATION_INVALID_WKT: 400,
    SystemCode.VALIDATION_INVALID_COORDINATES: 400,
    SystemCode.VALIDATION_INVALID_CRS: 400,
    SystemCode.VALIDATION_COORDINATES_IN_METERS: 400,
    SystemCode.VALIDATION_TOO_MANY_GEOMETRIES: 400,
    SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE: 413,
    SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN: 400,
    SystemCode.VALIDATION_GEO_ID_NOT_FOUND: 400,
    SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED: 503,
    SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE: 503,
    SystemCode.ANALYSIS_QUEUED: 202,
    SystemCode.ANALYSIS_PROCESSING: 202,
    SystemCode.ANALYSIS_COMPLETED: 200,
    SystemCode.ANALYSIS_ERROR: 500,
    SystemCode.ANALYSIS_TIMEOUT: 408,
    SystemCode.ANALYSIS_JOB_NOT_FOUND: 404,
    SystemCode.ANALYSIS_TOO_MANY_CONCURRENT: 429,
}

MESSAGES: dict[SystemCode, str] = {
    SystemCode.SYSTEM_INTERNAL_SERVER_ERROR: "An internal server error occurred. Please try again later.",
    SystemCode.SYSTEM_MISSING_REQUEST_BODY: "Missing or invalid request body.",
    SystemCode.AUTH_UNAUTHORIZED: "Unauthorized access. Please authenticate.",
    SystemCode.AUTH_MISSING_API_KEY: "API key is required for this request.",
    SystemCode.AUTH_INVALID_API_KEY: "Invalid or expired API key.",
    SystemCode.AUTH_RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Try again in {0} seconds.",
    SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS: "Missing required fields: {0}",
    SystemCode.VALIDATION_INVALID_GEOJSON: "The body does not contain a valid GeoJSON. Errors:\n{0}",
    SystemCode.VALIDATION_INVALID_WKT: "Invalid WKT format. Unable to parse geometry.",
    SystemCode.VALIDATION_INVALID_COORDINATES: "Invalid coordinates. Please ensure your data uses EPSG:4326 (WGS84).",
    SystemCode.VALIDATION_INVALID_CRS: "Invalid coordinate reference system. Only EPSG:4326 is supported.",
    SystemCode.VALIDATION_COORDINATES_IN_METERS: "Coordinates appear to be in meters. Please use EPSG:4326 (WGS84).",
    SystemCode.VALIDATION_TOO_MANY_GEOMETRIES: "Too many geometries. Maximum allowed is {0}.",
    SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE: "Request body too large: {0} KB. Maximum is {1} KB.",
    SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN: 'External ID column "{0}" not found. Available: {1}',
    SystemCode.VALIDATION_GEO_ID_NOT_FOUND: "One or more Geo IDs were not found in the asset registry.",
    SystemCode.SERVICE_ASSET_REGISTRY_NOT_CONFIGURED: "Asset registry is not configured.",
    SystemCode.SERVICE_ASSET_REGISTRY_UNAVAILABLE: "Asset registry service is currently unavailable.",
    SystemCode.ANALYSIS_QUEUED: "Analysis queued, waiting for available worker...",
    SystemCode.ANALYSIS_PROCESSING: "Analysis in progress...",
    SystemCode.ANALYSIS_COMPLETED: "Analysis completed successfully",
    SystemCode.ANALYSIS_ERROR: "Analysis service encountered an error. Please try again.",
    SystemCode.ANALYSIS_TIMEOUT: "Analysis timed out after {0} seconds.",
    SystemCode.ANALYSIS_JOB_NOT_FOUND: "Analysis job not found.",
    SystemCode.ANALYSIS_TOO_MANY_CONCURRENT: "Too many concurrent analyses. Please wait for existing ones to finish.",
}

_PLACEHOLDER = re.compile(r"\{(\d+)\}")


def http_status(code: SystemCode) -> int:
    return HTTP_STATUS.get(code, 500)


def format_message(code: SystemCode, args: list | None = None) -> str:
    template = MESSAGES.get(code, code.value)
    if not args:
        return template

    def _sub(m: re.Match) -> str:
        i = int(m.group(1))
        return str(args[i]) if i < len(args) else m.group(0)

    return _PLACEHOLDER.sub(_sub, template)
