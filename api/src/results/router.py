import asyncio
import json
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, Response

from src.codes import SystemCode
from src.config import SettingsDep
from src.io import files
from src.responses import api_response, attachment_headers
from src.results import csv_export, html_report
from src.schemas import route_responses

router = APIRouter(tags=["results"])

_SEARCH_FIELDS = ("plotId", "external_id", "Country", "Admin_Level_1")

# Exports that parse a result hold all of it in memory, so only two run at once
_EXPORTS = asyncio.Semaphore(2)


async def _export(work: Callable[..., Any], *args: Any) -> Any:
    async with _EXPORTS:
        return await run_in_threadpool(work, *args)


def _keep(props: dict, ids: set[str] | None, search: str | None, equals: dict[str, str]) -> bool:
    if ids is not None and str(props.get("plotId")) not in ids:
        return False
    if search and not any(search in str(props.get(key) or "").lower() for key in _SEARCH_FIELDS):
        return False
    # Names that aren't result properties are ignored, so unrelated parameters can't empty the result.
    return all(str(props[key]).lower() == value.lower() for key, value in equals.items() if key in props)


def _filtered_geojson(path: Path, ids: str | None, q: str | None, params: dict[str, str]) -> bytes:
    parsed = files.read_json(path)
    plot_ids = {plot_id.strip() for plot_id in ids.split(",")} if ids else None
    search = q.lower() if q else None
    equals = {key: value for key, value in params.items() if key not in ("ids", "q")}
    features = [
        feature for feature in parsed.get("features") or []
        if _keep(feature.get("properties") or {}, plot_ids, search, equals)
    ]
    return json.dumps({**parsed, "features": features}, ensure_ascii=False, separators=(",", ":")).encode()


def _valid_token(token: str) -> bool:
    return bool(token) and ".." not in token and "/" not in token and "\\" not in token


def _filename(ext: str, suffix: str | None = None) -> str:
    name = f"whisp_analysis_{datetime.now():%Y_%m_%d_%H_%M}"
    return f"{name}-{suffix}.{ext}" if suffix else f"{name}.{ext}"


@router.get("/generate-geojson/{token}", response_model=None, deprecated=True)
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
async def download_geojson(
    token: str, request: Request, settings: SettingsDep, ids: str | None = None, q: str | None = None
) -> Response:
    path = files.result_path(token, settings)
    if not _valid_token(token) or not path.exists():
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    headers = attachment_headers(_filename("geojson"))
    if not request.query_params:
        return FileResponse(path, media_type="application/json", headers=headers)

    body = await _export(_filtered_geojson, path, ids, q, dict(request.query_params))
    return Response(body, media_type="application/json", headers=headers)


@router.get("/download-csv/{token}", response_model=None, deprecated=True)
@router.get(
    "/results/{token}.csv",
    response_model=None,
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
async def download_csv(token: str) -> Response:
    if not _valid_token(token):
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    path = csv_export.result_csv_path(token)
    if not path.is_file() and not await _export(csv_export.write_csv, token):
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    return FileResponse(path, media_type="text/csv; charset=utf-8", headers=attachment_headers(_filename("csv")))


@router.get(
    "/results/{token}.html",
    response_model=None,
    description="Offline HTML risk report of a completed analysis: risk mix, indicators, decision trees and plot table.",
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
async def download_report(
    token: str,
    settings: SettingsDep,
    language: html_report.Language = "en",
    theme: html_report.Theme = "light",
) -> Response:
    path = files.result_path(token, settings)
    if not _valid_token(token) or not path.exists():
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    fields = await html_report.result_fields()
    title = f"WHISP risk report · {token}"
    html = await _export(
        lambda: html_report.render(html_report.build(files.read_json(path), fields, title, language), theme)
    )
    return Response(
        content=html, media_type="text/html; charset=utf-8", headers=attachment_headers(_filename("html", "report"))
    )
