import json
import math
from datetime import datetime, timezone
from decimal import Decimal
from functools import lru_cache
from pathlib import Path
from typing import Any


SUMMARY_KEYS = (
    "plotId", "external_id", "Country", "Admin_Level_1", "In_waterbody",
    "risk_pcrop", "risk_acrop", "risk_timber",
)
RISK_TONES = {"low": "low", "more_info_needed": "medium", "high": "high"}
LANGUAGES = ("en", "fr", "es", "pt-BR")


@lru_cache
def _asset(name: str) -> Any:
    packaged = Path(__file__).with_name("report_assets") / name
    # Wheels bundle the frontend's assets; a source checkout reads the originals.
    if packaged.is_file():
        return json.loads(packaged.read_text(encoding="utf-8"))
    app = Path(__file__).resolve().parents[3] / "app"
    source = app / name if name.startswith("messages/") else app / "src/lib/results/report-assets" / name
    return json.loads(source.read_text(encoding="utf-8"))


def _yes(value: Any) -> bool:
    return value is True or isinstance(value, str) and value.lower() in ("yes", "true")


def _cell(value: Any) -> Any:
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    # Match String(value) in the browser export, including array-valued fields.
    if isinstance(value, list):
        parts = []
        for item in value:
            if item is None:
                parts.append("")
            elif isinstance(item, bool):
                parts.append("true" if item else "false")
            elif isinstance(item, (int, float)):
                parts.append(_number_string(item))
            else:
                parts.append(str(_cell(item)))
        return ",".join(parts)
    return "[object Object]"


def _number_string(value: int | float) -> str:
    number = float(value)
    if math.isnan(number):
        return "NaN"
    if math.isinf(number):
        return "Infinity" if number > 0 else "-Infinity"
    if number == 0:
        return "0"
    text = repr(number)
    if 1e-6 <= abs(number) < 1e21:
        fixed = format(Decimal(text), "f")
        return fixed.rstrip("0").rstrip(".") if "." in fixed else fixed
    mantissa, exponent = text.lower().split("e")
    if mantissa.endswith(".0"):
        mantissa = mantissa[:-2]
    return f"{mantissa}e{int(exponent):+d}"


def _indicators(tree: dict, seen: dict | None = None) -> dict:
    if seen is None:
        seen = {}
    for rule in tree["rules"]:
        outcome = rule["then"]
        tone = RISK_TONES.get(outcome) if rule["is"] == "yes" and isinstance(outcome, str) else None
        for column in rule["columns"]:
            seen.setdefault(column, tone)
        if isinstance(outcome, dict):
            _indicators(outcome, seen)
    return seen


def _walk(tree: dict, rows: list[dict], labels: dict) -> list[dict]:
    steps = []
    rest = rows
    for index, rule in enumerate(tree["rules"]):
        match, remaining = [], []
        for row in rest:
            yes = any(_yes(row.get(column)) for column in rule["columns"])
            (match if yes == (rule["is"] == "yes") else remaining).append(row)
        rest = remaining
        indicators = labels["predicateOr"].join(labels["indicator"].get(c, c) for c in rule["columns"])
        steps.append({
            "columns": rule["columns"],
            "is": rule["is"],
            "matchCount": len(match),
            "restCount": len(rest),
            "then": rule["then"] if isinstance(rule["then"], str) else _walk(rule["then"], match, labels),
            "otherwise": tree["otherwise"] if index == len(tree["rules"]) - 1 else "continue",
            "selected": None,
            "disabled": False,
            "question": labels["question"].replace("{indicators}", indicators),
        })
    return steps


def build_report(
    geojson: dict, fields: list[dict], token: str, language: str = "en", *, exported_at: str | None = None
) -> dict:
    if language not in LANGUAGES:
        raise ValueError("Unsupported report language")
    if geojson.get("type") != "FeatureCollection" or not isinstance(geojson.get("features"), list):
        raise ValueError("Invalid result FeatureCollection")
    rows = [feature.get("properties") or {} for feature in geojson["features"]]
    labels = _asset(f"messages/{language}.json")["Results"]
    by_id = {field["id"]: field for field in fields}
    keys = sorted(
        (key for key in (rows[0] if rows else {}) if key != "geo"),
        key=lambda key: by_id.get(key, {}).get("order") if by_id.get(key, {}).get("order") is not None else float("inf"),
    )
    columns = []
    for key in keys:
        metadata = by_id.get(key, {}).get("display_metadata") or {}
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        name = metadata.get("displayName")
        columns.append({"key": key, "header": name if name is not None else key})
    headers = {column["key"]: column["header"] for column in columns}

    def count(key: str) -> int:
        return sum(_yes(row.get(key)) for row in rows)

    def present(key: str) -> bool:
        return any(key in row for row in rows)

    commodities = []
    for option in _asset("risk-trees.json"):
        mix = {"low": 0, "medium": 0, "high": 0, "total": len(rows)}
        for row in rows:
            tone = RISK_TONES.get(str(row.get(option["riskField"])))
            if tone:
                mix[tone] += 1
        commodities.append({
            "key": option["key"],
            "label": labels["commodity"][option["key"]],
            "riskField": option["riskField"],
            "mix": mix,
            "indicators": [
                {"key": key, "label": labels["indicator"].get(key, key), "yesTone": tone, "yes": count(key), "total": len(rows)}
                for key, tone in _indicators(option["tree"]).items() if present(key)
            ],
            "tree": _walk(option["tree"], rows, labels),
        })
    return {
        "exportedAt": exported_at or datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "title": f"WHISP risk report · {token}",
        "plotCount": len(rows),
        "columns": columns,
        "summaryColumns": [
            {"key": key, "header": headers.get(key, labels["indicator"][key] if key == "In_waterbody" else key)}
            for key in SUMMARY_KEYS if present(key)
        ],
        "rows": [{key: _cell(row.get(key)) for key in keys} for row in rows],
        "otherIndicators": [
            {"key": "In_waterbody", "label": labels["indicator"]["In_waterbody"], "yes": count("In_waterbody"), "total": len(rows)}
        ] if present("In_waterbody") else [],
        "commodities": commodities,
    }


def render_report(report: dict, theme: str = "light", language: str = "en") -> str:
    if theme not in ("light", "dark") or language not in LANGUAGES:
        raise ValueError("Unsupported report theme or language")
    template = "\n".join(_asset("shell.json"))
    # Replace data last so user values cannot become template substitutions or close the script element.
    data = json.dumps(report, ensure_ascii=True, allow_nan=False).replace("<", "\\u003c")
    return (template.replace("__WHISP_THEME__", theme)
            .replace("__WHISP_LANG__", language)
            .replace("__WHISP_CSP__", _asset("policy.json"))
            .replace("__WHISP_DATA__", data))


def content_security_policy() -> str:
    return _asset("policy.json")
