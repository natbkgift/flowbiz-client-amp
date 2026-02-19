"""Lightweight in-process TTL cache for read-heavy data.

Suitable for single-process deployments (uvicorn with multiple workers
each get their own cache — acceptable for the current scale).
"""

from __future__ import annotations

import threading
import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")


class TTLCache:
    """Thread-safe, key-value TTL cache."""

    def __init__(self, *, default_ttl: int = 300, max_keys: int = 500) -> None:
        self._default_ttl = default_ttl
        self._max_keys = max_keys
        self._data: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._data.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if time.monotonic() > expires_at:
                del self._data[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expires_at = time.monotonic() + (ttl or self._default_ttl)
        with self._lock:
            self._data[key] = (expires_at, value)
            # Evict expired keys if cache is too large.
            if len(self._data) > self._max_keys:
                self._evict_expired()

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._data.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    def _evict_expired(self) -> None:
        now = time.monotonic()
        expired = [k for k, (exp, _) in self._data.items() if now > exp]
        for k in expired:
            del self._data[k]

    def get_or_set(self, key: str, factory: Callable[[], T], ttl: int | None = None) -> T:
        """Return cached value or compute and cache it."""
        value = self.get(key)
        if value is not None:
            return value
        value = factory()
        self.set(key, value, ttl)
        return value


# Shared cache instances for common read-heavy data.
response_cache = TTLCache(default_ttl=300, max_keys=200)
