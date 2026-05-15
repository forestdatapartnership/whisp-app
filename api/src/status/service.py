import json
import os
from pathlib import Path
from typing import Any

from src.config import get_settings


def _temp() -> Path:
    return get_settings().temp_dir


def input_path(token: str) -> Path:
    return _temp() / f"{token}.json"


def result_path(token: str) -> Path:
    return _temp() / f"{token}-result.json"




def atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data), encoding="utf-8")
    os.replace(tmp, path)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))
