from fastapi import APIRouter
from fastapi.responses import Response

from src.responses import attachment_headers
from src.result_fields import csv_export

router = APIRouter(prefix="/result-fields", tags=["result-fields"], include_in_schema=False)


@router.get("/lookup-datasets")
async def export_lookup_datasets() -> Response:
    fields = await csv_export.fetch_result_fields()
    csv = csv_export.build_csv(fields)
    return Response(
        content=csv,
        media_type="text/csv; charset=utf-8",
        headers=attachment_headers("lookup_datasets.csv"),
    )
