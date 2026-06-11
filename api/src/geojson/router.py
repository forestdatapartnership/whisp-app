from fastapi import APIRouter

from src.codes import SystemCode
from src.config import SettingsDep
from fastapi.responses import JSONResponse, Response

from src.geojson import csv_export
from src.io import files
from src.responses import api_response
from src.schemas import route_responses

router = APIRouter(tags=["geojson"])

_WHISP_NAME = {
    "en": "WHISP Plots",
    "fr": "Parcelles WHISP",
    "pt": "Parcelas WHISP",
    "es": "Parcelas WHISP",
}


@router.get(
    "/generate-geojson/{token}",
    response_model=None,
    responses=route_responses(SystemCode.ANALYSIS_JOB_NOT_FOUND, SystemCode.SYSTEM_INTERNAL_SERVER_ERROR),
)
async def generate_geojson(token: str, settings: SettingsDep) -> JSONResponse:
    path = files.result_path(token, settings)
    if not path.exists():
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    try:
        parsed = files.read_json(path)
    except Exception:
        return api_response(SystemCode.SYSTEM_INTERNAL_SERVER_ERROR)

    if not parsed:
        return api_response(SystemCode.ANALYSIS_JOB_NOT_FOUND)

    geojson = {**parsed, "name": _WHISP_NAME}
    return JSONResponse(content=geojson)


@router.get(
    "/download-csv/{token}",
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
