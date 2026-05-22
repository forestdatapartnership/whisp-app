import json
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote

from src.io import files


def valid_token(token: str) -> bool:
    return bool(token) and ".." not in token and "/" not in token and "\\" not in token


def result_csv_path(token: str) -> Path:
    return files.result_path(token).parent / f"{token}-result.csv"


def timestamp_filename(ext: str, suffix: str | None = None) -> str:
    now = datetime.now()
    base = (
        f"whisp_analysis_{now.year}_{now.month:02d}_{now.day:02d}_"
        f"{now.hour:02d}_{now.minute:02d}"
    )
    suffix_part = f"-{suffix}" if suffix else ""
    return f"{base}{suffix_part}.{ext}"


def _to_csv_value(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (dict, list)):
        return json.dumps(value)
    return str(value)


def _column_order(properties: dict[str, Any]) -> list[str]:
    keys = list(properties.keys())
    try:
        whisp_idx = keys.index("whisp_processing_metadata")
        return keys[:whisp_idx] + ["geo"] + keys[whisp_idx:]
    except ValueError:
        return keys + ["geo"]


def _escape_csv(value: str) -> str:
    if "," in value or '"' in value or "\n" in value:
        escaped = value.replace('"', '""')
        return f'"{escaped}"'
    return value


def geojson_to_csv_string(geojson: dict[str, Any]) -> str | None:
    if geojson.get("type") != "FeatureCollection":
        return None
    features = geojson.get("features")
    if not isinstance(features, list) or not features:
        return None

    first = features[0] if isinstance(features[0], dict) else {}
    props = first.get("properties") if isinstance(first.get("properties"), dict) else {}
    header = _column_order(props)
    if not header:
        return None

    rows: list[list[str]] = []
    for feature in features:
        if not isinstance(feature, dict):
            continue
        feature_props = feature.get("properties") if isinstance(feature.get("properties"), dict) else {}
        row = []
        for col in header:
            if col == "geo":
                row.append(_to_csv_value(feature.get("geometry")))
            else:
                row.append(_to_csv_value(feature_props.get(col)))
        rows.append(row)

    lines = [",".join(header)]
    lines.extend(",".join(_escape_csv(cell) for cell in row) for row in rows)
    return "\n".join(lines)


def csv_attachment_headers(filename: str) -> dict[str, str]:
    encoded = quote(filename)
    return {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": (
            f"attachment; filename*=UTF-8''{encoded}; filename=\"{filename}\""
        ),
        "Cache-Control": "no-cache",
    }


def load_or_build_csv(token: str) -> tuple[str | None, str | None]:
    csv_path = result_csv_path(token)
    if csv_path.is_file():
        cached = csv_path.read_text(encoding="utf-8")
        if cached:
            return cached, None

    json_path = files.result_path(token)
    if not json_path.is_file():
        return None, "not_found"

    try:
        geojson = files.read_json(json_path)
    except Exception:
        return None, "invalid_json"

    csv = geojson_to_csv_string(geojson)
    if csv is None:
        return None, "no_features"

    csv_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = csv_path.with_suffix(csv_path.suffix + ".tmp")
    tmp.write_text(csv, encoding="utf-8")
    tmp.replace(csv_path)

    return csv, None
