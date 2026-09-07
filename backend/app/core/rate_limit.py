"""Simple in-memory rate limiting (no external Redis dependency)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from app.core.exceptions import RateLimitExceededError


def parse_rate_limit(spec: str) -> tuple[int, int]:
    """Parse ``5/minute`` or ``10/hour`` into (max_calls, period_seconds)."""
    raw = spec.strip().lower().replace(" ", "")
    count_str, _, period = raw.partition("/")
    if not count_str or not period:
        raise ValueError(f"Invalid rate limit spec: {spec!r}")
    max_calls = int(count_str)
    period_map = {
        "second": 1,
        "seconds": 1,
        "minute": 60,
        "minutes": 60,
        "hour": 3600,
        "hours": 3600,
    }
    if period not in period_map:
        raise ValueError(f"Unsupported rate limit period: {period!r}")
    return max_calls, period_map[period]


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, *, max_calls: int, period_seconds: int) -> None:
        now = time.monotonic()
        bucket = self._hits[key]
        while bucket and now - bucket[0] >= period_seconds:
            bucket.popleft()
        if len(bucket) >= max_calls:
            raise RateLimitExceededError("Too many login attempts. Try again later.")
        bucket.append(now)

    def reset(self) -> None:
        self._hits.clear()


login_rate_limiter = InMemoryRateLimiter()
