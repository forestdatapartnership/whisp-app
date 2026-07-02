import csv
import io
import json
from typing import Any

from src.db import get_pool


def _jsonb(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}

_HEADER = [
    "name",
    "order",
    "ISO2_code",
    "theme",
    "theme_timber",
    "use_for_risk_pcrop",
    "use_for_risk_acrop",
    "use_for_risk_timber",
    "exclude_from_output",
    "col_type",
    "is_nullable",
    "is_required",
    "corresponding_variable",
]

_CONTEXT_CORRESPONDING_VARS = {
    "plot_id_column",
    "external_id_column",
    "geometry_area_column",
    "geometry_type_column",
    "iso3_country_column",
    "iso2_country_column",
    "admin_1_column",
    "centroid_x_coord_column",
    "centroid_y_coord_column",
    "stats_unit_type_column",
    "water_flag",
    "geometry_column",
}


async def fetch_result_fields() -> list[dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            'SELECT id, category, "order", iso2_code, commodity_metadata, analysis_metadata '
            "FROM result_fields ORDER BY \"order\" NULLS LAST, id"
        )
    return [dict(row) for row in rows]


def _is_context_field(field: dict[str, Any]) -> bool:
    if field.get("category") == "context_and_metadata":
        return True
    cv = _jsonb(field.get("analysis_metadata")).get("correspondingVariable")
    if cv:
        return cv in _CONTEXT_CORRESPONDING_VARS or cv.endswith("_column")
    return False


def _normalize_theme(value: str | None) -> str:
    if not value:
        return "NA"
    
    clean_value = str(value).strip()
    lower_value = clean_value.lower()
    
    if "disturbance" in lower_value:
        return "disturbance_after" if "after" in lower_value else "disturbance_before"

    return clean_value


def _to_csv_value(value: Any) -> str:
    if value is None:
        return ""
    return str(value)


def _bool_cell(value: bool | None) -> str:
    if value is None:
        return ""
    return "1" if value else "0"


def _to_csv_row(field: dict[str, Any]) -> list[str]:
    is_context = _is_context_field(field)
    category = field.get("category") or ""
    analysis = _jsonb(field.get("analysis_metadata"))
    commodity = _jsonb(field.get("commodity_metadata"))

    acrop_theme = (commodity.get("acrop") or {}).get("dataTheme")
    pcrop_theme = (commodity.get("pcrop") or {}).get("dataTheme")
    
    raw_theme = acrop_theme or pcrop_theme
    theme = "context_and_metadata" if is_context else _normalize_theme(raw_theme)

    raw_theme_timber = (commodity.get("timber") or {}).get("dataTheme")
    theme_timber = (
        "context_and_metadata"
        if is_context
        else _normalize_theme(raw_theme_timber)
    )

    if is_context:
        use_pcrop = ""
        use_acrop = ""
        use_timber = "NA"
    else:
        use_pcrop = _bool_cell((commodity.get("pcrop") or {}).get("usedForRisk"))
        use_acrop = _bool_cell((commodity.get("acrop") or {}).get("usedForRisk"))
        use_timber = _bool_cell((commodity.get("timber") or {}).get("usedForRisk"))

    return [
        _to_csv_value(field.get("id")),
        str(field.get("order") or 0),
        _to_csv_value(field.get("iso2_code")),
        theme,
        theme_timber,
        use_pcrop,
        use_acrop,
        use_timber,
        "1" if analysis.get("excludeFromOutput") else "0",
        _to_csv_value(analysis.get("type")) or "float32",
        "0" if analysis.get("isNullable") is False else "1",
        "1" if analysis.get("isRequired") else "0",
        _to_csv_value(analysis.get("correspondingVariable")),
    ]


def build_csv(fields: list[dict[str, Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(_HEADER)
    for field in fields:
        if field.get("category") == "Analysis results":
            continue
        writer.writerow(_to_csv_row(field))
    return output.getvalue()
