from fastapi import APIRouter
from fastapi.responses import Response

from src.geojson.csv_export import csv_attachment_headers
from src.result_fields import csv_export

router = APIRouter(prefix="/result-fields", tags=["result-fields"])


@router.get("/lookup-datasets")
async def export_lookup_datasets() -> Response:
    fields = await csv_export.fetch_result_fields()
    csv = csv_export.build_csv(fields)
    return Response(
        content=csv,
        media_type="text/csv; charset=utf-8",
        headers=csv_attachment_headers("lookup_datasets.csv"),
    )
