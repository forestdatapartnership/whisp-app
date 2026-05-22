from fastapi import APIRouter

from src.config import SettingsDep
from fastapi.responses import JSONResponse, Response

from src.geojson import csv_export
from src.io import files

router = APIRouter(tags=["geojson"])

_WHISP_NAME = {
    "en": "WHISP Plots",
    "fr": "Parcelles WHISP",
    "pt": "Parcelas WHISP",
    "es": "Parcelas WHISP",
}


@router.get("/generate-geojson/{token}")
async def generate_geojson(token: str, settings: SettingsDep) -> JSONResponse:
    if not token:
        return JSONResponse(status_code=400, content={"error": "ID parameter is missing."})

    path = files.result_path(token, settings)
    if not path.exists():
        return JSONResponse(status_code=404, content={"error": "Report not found."})

    try:
        parsed = files.read_json(path)
    except Exception:
        return JSONResponse(status_code=500, content={"error": "Failed to parse JSON data."})

    if not parsed:
        return JSONResponse(status_code=400, content={"error": "No report was found."})

    geojson = {**parsed, "name": _WHISP_NAME}
    return JSONResponse(content=geojson)


@router.get("/download-csv/{token}")
async def download_csv(token: str) -> Response:
    if not csv_export.valid_token(token):
        return JSONResponse(status_code=404, content={"error": "Report not found."})

    csv, err = csv_export.load_or_build_csv(token)
    if err == "not_found":
        return JSONResponse(status_code=404, content={"error": "Report not found."})
    if err or csv is None:
        return JSONResponse(status_code=400, content={"error": "No exportable features."})

    filename = csv_export.timestamp_filename("csv")
    return Response(
        content=csv,
        media_type="text/csv; charset=utf-8",
        headers=csv_export.csv_attachment_headers(filename),
    )
