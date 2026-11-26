import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from src.io import files


def result_csv_path(token: str) -> Path:
    return files.result_path(token).parent / f"{token}-result.csv"


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


def write_csv(token: str) -> bool:
    json_path = files.result_path(token)
    if not json_path.is_file():
        return False

    csv = geojson_to_csv_string(files.read_json(json_path))
    if csv is None:
        raise ValueError(f"Result {token} has no features to export")

    csv_path = result_csv_path(token)
    tmp = csv_path.with_name(f"{csv_path.name}.{uuid4().hex}.tmp")
    tmp.write_text(csv, encoding="utf-8")
    tmp.replace(csv_path)
    return True
