from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from src.codes import SystemCode


# ── Request bodies ─────────────────────────────────────────────────────────────

class AnalysisOptionsInput(BaseModel):
    externalIdColumn: str | None = None
    unitType: str | None = None
    nationalCodes: list[str] | None = None
    async_: bool = Field(False, alias="async")

    model_config = ConfigDict(populate_by_name=True)


class SubmitGeoJsonRequest(BaseModel):
    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-1.612173914909363, 6.160144879904404],
                            [-1.6128122806549074, 6.159344862841789],
                            [-1.6128337383270266, 6.15914219166122],
                            [-1.6120773553848267, 6.158870185481485],
                            [-1.611771583557129, 6.158838184745289],
                            [-1.6111814975738528, 6.159483532552345],
                            [-1.611224412918091, 6.160011543811027],
                            [-1.6117393970489502, 6.160299549730771],
                            [-1.612173914909363, 6.160144879904404]
                        ]]
                    }
                }],
                "analysisOptions": {
                    "nationalCodes": ["co", "ci", "br"],
                    "unitType": "ha",
                    "async": True
                }
            }
        }
    )

    analysisOptions: AnalysisOptionsInput | None = None


class SubmitWktRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "wkt": "POLYGON((-4.286591893206829 5.545425708271704,-4.2872464587004755 5.54450734589365,-4.2883087863049205 5.54450734589365,-4.287901024194124 5.545607244851676,-4.286591893206829 5.545425708271704))",
                "analysisOptions": {
                    "nationalCodes": ["co", "ci", "br"],
                    "unitType": "ha",
                    "async": True
                }
            }
        }
    )

    wkt: str
    analysisOptions: AnalysisOptionsInput | None = None


class SubmitGeoIdsRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "geoIds": ["1b17337e-83dc-43df-8fc1-a7415d5c0890","d5d6af39-8e7c-4130-b220-1bf3c1373b79"],
                "analysisOptions": {
                    "unitType": "ha",
                    "async": True
                }
            }
        }
    )

    geoIds: list[str]
    analysisOptions: AnalysisOptionsInput | None = None


# ── Response model ─────────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    code: SystemCode
    message: str
    cause: str | None = None
    data: Any | None = Field(default=None, json_schema_extra={"example": None})


class PublicConfigResponse(BaseModel):
    maxRequestBodySizeKb: int | None
    geometryLimitSync: int
    geometryLimitAsync: int
    analysisTimeoutSyncSeconds: int
    analysisTimeoutAsyncSeconds: int
    openforisWhispVersion: str
    geoidBaseUrl: str | None


# ── Route response helper ──────────────────────────────────────────────────────

_CODE_EXAMPLES: dict[SystemCode, Any] = {
    SystemCode.ANALYSIS_COMPLETED: {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-1.612834, 6.159142], [-1.612077, 6.15887], [-1.611772, 6.158838],
                    [-1.611181, 6.159484], [-1.611224, 6.160012], [-1.611739, 6.1603],
                    [-1.612174, 6.160145], [-1.612812, 6.159345], [-1.612834, 6.159142]
                ]]
            },
            "properties": {
                "plotId": "1",
                "Area": 1.939,
                "Country": "GHA",
                "Unit": "ha",
                "In_waterbody": False,
                "GFC_TC_2020": 0.387,
                "Forest_FDaP": 0.49,
                "Cocoa_FDaP": 0.672,
                "Ind_01_treecover": "no",
                "Ind_02_commodities": "no",
                "Ind_03_disturbance_before_2020": "yes",
                "Ind_04_disturbance_after_2020": "yes",
                "risk_pcrop": "low",
                "whisp_processing_metadata": {
                    "whisp_version": "3.0.0a14",
                    "processing_timestamp_utc": "2026-06-11 01:59:15+0000"
                }
            }
        }]
    },
    SystemCode.ANALYSIS_QUEUED: {"token": "abc123", "statusUrl": "/api/status/abc123", "featureCount": 1},
    SystemCode.ANALYSIS_PROCESSING: {"token": "abc123", "percent": 42.0, "processStatusMessage": []},
}


def route_responses(*codes: SystemCode) -> dict[int, dict]:
    result: dict[int, dict] = {}
    for code in codes:
        result.setdefault(code.http_status, {
            "model": ApiResponse,
            "description": code.message,
            "content": {
                "application/json": {
                    "example": {"code": code.value, "message": code.message, "data": _CODE_EXAMPLES.get(code)}
                }
            },
        })
    return result


AUTH_ERRORS: tuple[SystemCode, ...] = (
    SystemCode.AUTH_MISSING_API_KEY,
    SystemCode.AUTH_INVALID_API_KEY,
    SystemCode.AUTH_RATE_LIMIT_EXCEEDED,
)

VALIDATION_ERRORS: tuple[SystemCode, ...] = (
    SystemCode.VALIDATION_MISSING_REQUEST_BODY,
    SystemCode.VALIDATION_INVALID_GEOJSON,
    SystemCode.VALIDATION_INVALID_WKT,
    SystemCode.VALIDATION_INVALID_COORDINATES,
    SystemCode.VALIDATION_INVALID_CRS,
    SystemCode.VALIDATION_COORDINATES_IN_METERS,
    SystemCode.VALIDATION_TOO_MANY_GEOMETRIES,
    SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE,
    SystemCode.VALIDATION_INVALID_EXTERNAL_ID_COLUMN,
)

SUBMIT_ERRORS: tuple[SystemCode, ...] = (
    *AUTH_ERRORS,
    *VALIDATION_ERRORS,
    SystemCode.ANALYSIS_TOO_MANY_CONCURRENT
)

SUBMIT_GEOID_ERRORS: tuple[SystemCode, ...] = (
    *SUBMIT_ERRORS,
    SystemCode.VALIDATION_GEO_ID_NOT_FOUND,
    SystemCode.SERVICE_GEOID_NOT_CONFIGURED,
    SystemCode.SERVICE_GEOID_UNAVAILABLE,
)