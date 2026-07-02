from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from src.auth.api_key import ApiKey, api_key_dependency
from src.codes import SystemCode
from src.config import Settings, SettingsDep
from src.exceptions import AppError
from src.geoid import client as geoid
from src.responses import api_response
from src.schemas import (
    SUBMIT_ERRORS,
    SUBMIT_GEOID_ERRORS,
    SubmitGeoJsonRequest,
    SubmitGeoIdsRequest,
    SubmitWktRequest,
    route_responses,
)
from src.submit import service
from src.submit import validators as v
from src.submit.schemas import AnalysisOptions, JobContext

router = APIRouter(prefix="/submit", tags=["submit"])


def _request_body_size(request: Request) -> int:
    raw = request.headers.get("content-length")
    if not raw:
        return 0
    try:
        return int(raw)
    except ValueError:
        return 0


def _check_request_size(request: Request, settings: Settings) -> None:
    max_bytes = settings.max_request_body_size_bytes
    if max_bytes is None:
        return
    body_size = _request_body_size(request)
    if body_size > max_bytes:
        raise AppError(
            SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE,
            [f"{body_size / 1024:.2f}", f"{max_bytes / 1024:.2f}"],
        )


async def _read_json(request: Request, settings: Settings) -> dict:
    body_size = _request_body_size(request)
    if body_size == 0:
        raise AppError(SystemCode.VALIDATION_MISSING_REQUEST_BODY)

    max_bytes = settings.max_request_body_size_bytes
    if max_bytes is not None and body_size > max_bytes:
        raise AppError(
            SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE,
            [f"{body_size / 1024:.2f}", f"{max_bytes / 1024:.2f}"],
        )

    try:
        body = await request.json()
    except Exception:
        raise AppError(SystemCode.VALIDATION_MISSING_REQUEST_BODY)
    if not isinstance(body, dict):
        raise AppError(SystemCode.VALIDATION_MISSING_REQUEST_BODY)
    return body


def _build_context(request: Request, api_key: ApiKey) -> JobContext:
    agent_header = request.headers.get("x-whisp-agent")
    agent = "ui" if agent_header == "ui" else "api"

    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else request.headers.get("x-real-ip")

    return JobContext(
        api_key_id=api_key.key_id,
        user_id=api_key.user_id,
        max_concurrent_analyses=api_key.max_concurrent_analyses,
        agent=agent,
        ip_address=ip or None,
        endpoint=request.url.path,
    )


@router.post(
    "/geojson",
    response_model=None,
    responses=route_responses(
        SystemCode.ANALYSIS_COMPLETED,
        SystemCode.ANALYSIS_QUEUED,
        *SUBMIT_ERRORS,
    ),
)
async def submit_geojson(
    request: Request,
    body: SubmitGeoJsonRequest,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    _check_request_size(request, settings)

    raw_options = body.analysisOptions
    fc_dict = body.model_dump(exclude={"analysisOptions"})

    errors = v.validate_geojson_structure(fc_dict)
    if errors:
        raise AppError(
            SystemCode.VALIDATION_INVALID_GEOJSON,
            ["\n".join(f"- {e}" for e in errors)],
        )

    ok, _ = v.validate_crs(fc_dict)
    if not ok:
        raise AppError(SystemCode.VALIDATION_INVALID_CRS)
    if v.coordinates_likely_in_meters(fc_dict):
        raise AppError(SystemCode.VALIDATION_COORDINATES_IN_METERS)
    if not v.is_valid_wgs84(fc_dict):
        raise AppError(SystemCode.VALIDATION_INVALID_COORDINATES)

    fc = v.to_feature_collection(fc_dict)
    opts = AnalysisOptions.parse(raw_options.model_dump(by_alias=True) if raw_options else None)
    input_metrics = service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings, input_metrics=input_metrics)
    return api_response(result.code, data=result.data, context=result.context)


@router.post(
    "/wkt",
    response_model=None,
    responses=route_responses(
        SystemCode.ANALYSIS_COMPLETED,
        SystemCode.ANALYSIS_QUEUED,
        *SUBMIT_ERRORS,
    ),
)
async def submit_wkt(
    request: Request,
    body: SubmitWktRequest,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    _check_request_size(request, settings)

    geom = v.wkt_to_geojson(body.wkt)
    if geom is None:
        raise AppError(SystemCode.VALIDATION_INVALID_WKT)
    if v.coordinates_likely_in_meters(geom):
        raise AppError(SystemCode.VALIDATION_COORDINATES_IN_METERS)
    if not v.is_valid_wgs84(geom):
        raise AppError(SystemCode.VALIDATION_INVALID_COORDINATES)

    fc = v.wkt_to_feature_collection(body.wkt)
    if fc is None:
        raise AppError(SystemCode.VALIDATION_INVALID_WKT)

    opts = AnalysisOptions.parse(
        body.analysisOptions.model_dump(by_alias=True) if body.analysisOptions else None
    )
    input_metrics = service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings, input_metrics=input_metrics)
    return api_response(result.code, data=result.data, context=result.context)


@router.post(
    "/geo-ids",
    response_model=None,
    responses=route_responses(
        SystemCode.ANALYSIS_COMPLETED,
        SystemCode.ANALYSIS_QUEUED,
        *SUBMIT_GEOID_ERRORS,
    ),
)
async def submit_geo_ids(
    request: Request,
    body: SubmitGeoIdsRequest,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    _check_request_size(request, settings)

    raw_options = body.analysisOptions.model_dump(by_alias=True) if body.analysisOptions else {}
    raw_options.setdefault("externalIdColumn", "geoid")
    opts = AnalysisOptions.parse(raw_options)

    resolved = await geoid.resolve_geo_ids(body.geoIds, settings)

    missing = [gid for gid, feat in zip(body.geoIds, resolved) if feat is None]
    if missing:
        raise AppError(
            SystemCode.VALIDATION_GEO_ID_NOT_FOUND,
            cause="The following GeoIDs were not found:\n" + "\n".join(missing),
        )

    fc = {"type": "FeatureCollection", "features": [f for f in resolved if f is not None]}
    input_metrics = service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings, input_metrics=input_metrics)
    return api_response(result.code, data=result.data, context=result.context)
