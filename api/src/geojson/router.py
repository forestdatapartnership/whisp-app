import logging
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse, Response
from starlette.concurrency import run_in_threadpool

from src.codes import SystemCode
from src.config import SettingsDep
from src.geojson import csv_export, html_export
from src.io import files
from src.result_fields.csv_export import fetch_result_fields
from src.responses import api_response
from src.schemas import route_responses

router = APIRouter(tags=["geojson"])
logger = logging.getLogger(__name__)

_WHISP_NAME = {
    "en": "WHISP Plots",
    "fr": "Parcelles WHISP",
    "pt": "Parcelas WHISP",
    "es": "Parcelas WHISP",
}

_SEARCH_FIELDS = ("plotId", "external_id", "Country", "Admin_Level_1")


def _keep(props: dict, ids: set[str] | None, search: str | None, equals: dict[str, str]) -> bool:
    if ids is not None and str(props.get("plotId")) not in ids:
        return False
    if search and not any(search in str(props.get(key) or "").lower() for key in _SEARCH_FIELDS):
        return False
    # Names that aren't result properties are ignored, so unrelated parameters can't empty the result.
    return all(str(props[key]).lower() == value.lower() for key, value in equals.items() if key in props)


@router.get(
    "/generate-geojson/{token}",
    deprecated=True,
    response_model=None,
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
@router.get(
    "/results/{token}.geojson",
    response_model=None,
    description=(
        "Analysis results as GeoJSON. Optional filters, all combined: `ids` (comma-separated plotIds), "
        "`q` (text in plotId, external_id, Country or Admin_Level_1) and any result property as "
        "`name=value`, e.g. `risk_pcrop=more_info_needed`."
    ),
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
async def generate_geojson(
    token: str, request: Request, settings: SettingsDep, ids: str | None = None, q: str | None = None
) -> JSONResponse:
    if not csv_export.valid_token(token):
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    path = files.result_path(token, settings)
    if not path.exists():
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    try:
        parsed = files.read_json(path)
    except Exception:
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)

    if not parsed:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    plot_ids = {plot_id.strip() for plot_id in ids.split(",")} if ids else None
    search = q.lower() if q else None
    equals = {key: value for key, value in request.query_params.items() if key not in ("ids", "q")}
    features = [
        feature for feature in parsed.get("features") or []
        if _keep(feature.get("properties") or {}, plot_ids, search, equals)
    ]
    geojson = {**parsed, "features": features, "name": _WHISP_NAME}
    return JSONResponse(content=geojson)


@router.get(
    "/download-csv/{token}",
    deprecated=True,
    response_model=None,
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
@router.get(
    "/results/{token}.csv",
    response_model=None,
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
async def download_csv(token: str) -> Response:
    if not csv_export.valid_token(token):
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    csv, err = csv_export.load_or_build_csv(token)
    if err == "not_found":
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    if err or csv is None:
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)

    filename = csv_export.timestamp_filename("csv")
    return Response(
        content=csv,
        media_type="text/csv; charset=utf-8",
        headers=csv_export.csv_attachment_headers(filename),
    )


@router.get(
    "/results/{token}.html",
    response_model=None,
    response_class=HTMLResponse,
    description=(
        "Download a self-contained risk report for all plots in a completed analysis. "
        "Includes risk mix, indicators, decision trees and a plot table; works offline. "
        "Language selects commodity and indicator labels, as in the browser report; "
        "the report shell uses English. Results are temporary and may have expired."
    ),
    responses={
        200: {"content": {"text/html": {"schema": {"type": "string"}}}},
        **route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
    },
)
async def download_html(
    token: str,
    settings: SettingsDep,
    language: Literal["en", "fr", "es", "pt-BR"] = "en",
    theme: Literal["light", "dark"] = "light",
) -> Response:
    if not csv_export.valid_token(token):
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    try:
        result = await run_in_threadpool(files.read_json, files.result_path(token, settings))
    except FileNotFoundError:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    except Exception:
        logger.exception("Failed to read report result")
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)
    if not result:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)
    try:
        fields = await fetch_result_fields()
        report = await run_in_threadpool(html_export.build_report, result, fields, token, language)
        html = await run_in_threadpool(html_export.render_report, report, theme, language)
    except Exception:
        logger.exception("Failed to export risk report")
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)
    filename = csv_export.timestamp_filename("html", "report")
    return Response(
        content=html,
        media_type="text/html; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": html_export.content_security_policy(),
        },
    )
