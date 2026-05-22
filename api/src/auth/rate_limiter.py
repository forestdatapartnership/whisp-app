import math
import threading
import time
from dataclasses import dataclass


@dataclass
class RateLimitResult:
    allowed: bool
    retry_after: int


_lock = threading.Lock()
_store: dict[str, tuple[int, int]] = {}


def _now_ms() -> int:
    return int(time.time() * 1000)


def check_rate_limit(key: str, window_ms: int, limit: int) -> RateLimitResult:
    now = _now_ms()
    with _lock:
        entry = _store.get(key)
        if entry is None or entry[1] <= now:
            reset_at = now + window_ms
            _store[key] = (1, reset_at)
            return RateLimitResult(True, 0)

        count, reset_at = entry
        if count >= limit:
            retry_after = max(1, math.ceil((reset_at - now) / 1000))
            return RateLimitResult(False, retry_after)

        _store[key] = (count + 1, reset_at)
        return RateLimitResult(True, 0)
