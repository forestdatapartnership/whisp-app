import json
import os
from datetime import datetime, timezone
from functools import cache
from pathlib import Path
from typing import Any, Literal

from src.db import get_pool

Language = Literal["en", "fr", "es", "pt-BR"]
Theme = Literal["light", "dark"]

_APP_DIR = Path(os.environ.get("WHISP_APP_DIR") or Path(__file__).resolve().parents[3] / "app")

_WATERBODY = "In_waterbody"
_SUMMARY_KEYS = (
    "plotId", "external_id", "Country", "Admin_Level_1", _WATERBODY, "risk_pcrop", "risk_acrop", "risk_timber",
)
_TONES = {"low": "low", "high": "high", "more_info_needed": "medium"}


async def result_fields() -> dict[str, Any]:
    async with get_pool().acquire() as conn:
        rows = await conn.fetch("SELECT id, \"order\", display_metadata->>'displayName' AS name FROM result_fields")
    return {row["id"]: row for row in rows}


def _ordered_keys(properties: dict[str, Any], fields: dict[str, Any]) -> list[str]:
    def order(key: str) -> float:
        field = fields.get(key)
        return field["order"] if field and field["order"] is not None else float("inf")

    return sorted((key for key in properties if key != "geo"), key=order)


@cache
def _app_json(path: str) -> Any:
    return json.loads((_APP_DIR / path).read_text(encoding="utf-8"))


@cache
def _template() -> str:
    return Path(__file__).with_name("report.html").read_text(encoding="utf-8")


def _lookup(messages: Any, key: str) -> str | None:
    for part in key.split("."):
        messages = messages.get(part) if isinstance(messages, dict) else None
    return messages if isinstance(messages, str) else None


def _translator(language: str):
    messages = _app_json(f"messages/{language}.json")["Results"]
    english = _app_json("messages/en.json")["Results"]

    def t(key: str, **values: str) -> str:
        text = _lookup(messages, key) or _lookup(english, key) or key
        for name, value in values.items():
            text = text.replace("{" + name + "}", value)
        return text

    return t


def _yes(value: Any) -> bool:
    return value is True or (isinstance(value, str) and value.lower() in ("yes", "true"))


def _cell(value: Any) -> Any:
    return value if value is None or isinstance(value, (str, int, float, bool)) else json.dumps(value)


def _indicators(tree: dict, seen: dict[str, str | None]) -> dict[str, str | None]:
    for rule in tree["rules"]:
        then = rule["then"]
        tone = _TONES.get(then) if rule["is"] == "yes" and isinstance(then, str) else None
        for column in rule["columns"]:
            seen.setdefault(column, tone)
        if isinstance(then, dict):
            _indicators(then, seen)
    return seen


def _walk(tree: dict, rows: list[dict], t) -> list[dict]:
    steps, rest = [], rows
    for index, rule in enumerate(tree["rules"]):
        matches = [any(_yes(row.get(c)) for c in rule["columns"]) == (rule["is"] == "yes") for row in rest]
        match = [row for row, hit in zip(rest, matches) if hit]
        rest = [row for row, hit in zip(rest, matches) if not hit]
        then = rule["then"]
        steps.append({
            "columns": rule["columns"],
            "is": rule["is"],
            "matchCount": len(match),
            "restCount": len(rest),
            "then": then if isinstance(then, str) else _walk(then, match, t),
            "otherwise": tree["otherwise"] if index == len(tree["rules"]) - 1 else "continue",
            "selected": None,
            "disabled": False,
            "question": t("question", indicators=t("predicateOr").join(t(f"indicator.{c}") for c in rule["columns"])),
        })
    return steps


def build(results: dict, fields: dict[str, Any], title: str, language: str) -> dict:
    rows = [feature.get("properties") or {} for feature in results.get("features") or []]
    t = _translator(language)

    keys = _ordered_keys(rows[0] if rows else {}, fields)
    headers = {key: fields[key]["name"] if key in fields and fields[key]["name"] is not None else key for key in keys}
    columns = [{"key": key, "header": headers[key]} for key in keys]

    def present(key: str) -> bool:
        return any(key in row for row in rows)

    def yes(key: str) -> int:
        return sum(_yes(row.get(key)) for row in rows)

    def mix(field: str) -> dict[str, int]:
        counts = {"low": 0, "medium": 0, "high": 0, "total": len(rows)}
        for row in rows:
            tone = _TONES.get(str(row.get(field)))
            if tone:
                counts[tone] += 1
        return counts

    return {
        "exportedAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "title": title,
        "plotCount": len(rows),
        "columns": columns,
        "summaryColumns": [
            {"key": key, "header": headers.get(key, t(f"indicator.{key}") if key == _WATERBODY else key)}
            for key in _SUMMARY_KEYS if present(key)
        ],
        "rows": [{key: _cell(row.get(key)) for key in keys} for row in rows],
        "otherIndicators": [
            {"key": _WATERBODY, "label": t(f"indicator.{_WATERBODY}"), "yes": yes(_WATERBODY), "total": len(rows)}
        ] if present(_WATERBODY) else [],
        "commodities": [
            {
                "key": option["key"],
                "label": t(f"commodity.{option['key']}"),
                "riskField": option["riskField"],
                "mix": mix(option["riskField"]),
                "indicators": [
                    {"key": key, "label": t(f"indicator.{key}"), "yesTone": tone, "yes": yes(key), "total": len(rows)}
                    for key, tone in _indicators(option["tree"], {}).items() if present(key)
                ],
                "tree": _walk(option["tree"], rows, t),
            }
            for option in _app_json("src/lib/results/risk-trees.json")
        ],
    }


def render(report: dict, theme: str) -> bytes:
    data = json.dumps(report, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    return _template().replace("__WHISP_THEME__", theme).replace("__WHISP_DATA__", data).encode()
