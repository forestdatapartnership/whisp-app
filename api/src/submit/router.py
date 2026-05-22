from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from src.auth.api_key import ApiKey, api_key_dependency
from src.codes import SystemCode
from src.config import Settings, SettingsDep
from src.exceptions import AppError
from src.geoid import client as geoid
from src.responses import api_response
from src.submit import service
from src.submit.schemas import AnalysisOptions, JobContext
from src.submit import validators as v

router = APIRouter(prefix="/submit", tags=["submit"])


def _request_body_size(request: Request) -> int:
    raw = request.headers.get("content-length")
    if not raw:
        return 0
    try:
        return int(raw)
    except ValueError:
        return 0


async def _read_json(request: Request, settings: Settings) -> dict:
    body_size = _request_body_size(request)
    if body_size == 0:
        raise AppError(SystemCode.SYSTEM_MISSING_REQUEST_BODY)

    max_bytes = settings.max_request_body_size_bytes
    if max_bytes is not None and body_size > max_bytes:
        raise AppError(
            SystemCode.VALIDATION_REQUEST_BODY_TOO_LARGE,
            [f"{body_size / 1024:.2f}", f"{max_bytes / 1024:.2f}"],
        )

    try:
        body = await request.json()
    except Exception:
        raise AppError(SystemCode.SYSTEM_MISSING_REQUEST_BODY)
    if not isinstance(body, dict):
        raise AppError(SystemCode.SYSTEM_MISSING_REQUEST_BODY)
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


@router.post("/geojson")
async def submit_geojson(
    request: Request,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    body = await _read_json(request, settings)

    raw_options = body.pop("analysisOptions", None)
    errors = v.validate_geojson_structure(body)
    if errors:
        raise AppError(
            SystemCode.VALIDATION_INVALID_GEOJSON,
            ["\n".join(f"- {e}" for e in errors)],
        )

    ok, _ = v.validate_crs(body)
    if not ok:
        raise AppError(SystemCode.VALIDATION_INVALID_CRS)
    if v.coordinates_likely_in_meters(body):
        raise AppError(SystemCode.VALIDATION_COORDINATES_IN_METERS)
    if not v.is_valid_wgs84(body):
        raise AppError(SystemCode.VALIDATION_INVALID_COORDINATES)

    fc = v.to_feature_collection(body)
    opts = AnalysisOptions.parse(raw_options)
    service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings)
    return api_response(result.code, data=result.data, context=result.context)


@router.post("/wkt")
async def submit_wkt(
    request: Request,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    body = await _read_json(request, settings)
    wkt = body.get("wkt")
    if not isinstance(wkt, str) or not wkt.strip():
        raise AppError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ["wkt"])

    raw_options = body.get("analysisOptions")

    geom = v.wkt_to_geojson(wkt)
    if geom is None:
        raise AppError(SystemCode.VALIDATION_INVALID_WKT)
    if v.coordinates_likely_in_meters(geom):
        raise AppError(SystemCode.VALIDATION_COORDINATES_IN_METERS)
    if not v.is_valid_wgs84(geom):
        raise AppError(SystemCode.VALIDATION_INVALID_COORDINATES)

    fc = v.wkt_to_feature_collection(wkt)
    if fc is None:
        raise AppError(SystemCode.VALIDATION_INVALID_WKT)

    opts = AnalysisOptions.parse(raw_options)
    service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings)
    return api_response(result.code, data=result.data, context=result.context)


@router.post("/geo-ids")
async def submit_geo_ids(
    request: Request,
    settings: SettingsDep,
    api_key: ApiKey = Depends(api_key_dependency),
) -> JSONResponse:
    body = await _read_json(request, settings)
    geo_ids = body.get("geoIds")
    if not isinstance(geo_ids, list) or not geo_ids:
        raise AppError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, ["geoIds"])

    raw_options: dict[str, Any] = dict(body.get("analysisOptions") or {})
    raw_options.setdefault("externalIdColumn", "geoid")
    opts = AnalysisOptions.parse(raw_options)

    collection = (body.get("geoidOptions") or {}).get("collection")
    resolved = await geoid.resolve_geo_ids(geo_ids, collection, settings)

    missing = [gid for gid, feat in zip(geo_ids, resolved) if feat is None]
    if missing:
        raise AppError(
            SystemCode.VALIDATION_GEO_ID_NOT_FOUND,
            cause="The following GeoIDs were not found:\n" + "\n".join(missing),
        )

    fc = {"type": "FeatureCollection", "features": [f for f in resolved if f is not None]}
    service.validate_feature_collection(fc, opts, settings)

    ctx = _build_context(request, api_key)

    token = service.new_token()
    result = await service.submit(token, fc, opts, ctx, settings)
    return api_response(result.code, data=result.data, context=result.context)
