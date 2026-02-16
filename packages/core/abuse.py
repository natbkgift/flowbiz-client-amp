from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass
from threading import Lock


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after_seconds: int


class SlidingWindowRateLimiter:
    def __init__(self, *, limit: int, window_seconds: int) -> None:
        self._limit = max(1, int(limit))
        self._window_seconds = max(1, int(window_seconds))
        self._events: dict[str, deque[float]] = {}
        self._lock = Lock()

    def check(self, key: str) -> RateLimitResult:
        now = time.time()
        window_start = now - self._window_seconds

        with self._lock:
            q = self._events.get(key)
            if q is None:
                q = deque()
                self._events[key] = q

            while q and q[0] < window_start:
                q.popleft()

            if len(q) >= self._limit:
                oldest = q[0]
                retry_after = max(1, int((oldest + self._window_seconds) - now))
                return RateLimitResult(
                    allowed=False,
                    remaining=0,
                    retry_after_seconds=retry_after,
                )

            q.append(now)
            remaining = max(0, self._limit - len(q))
            return RateLimitResult(
                allowed=True,
                remaining=remaining,
                retry_after_seconds=0,
            )
