from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any


class _ResponseCache:
    def __init__(self) -> None:
        self._data: dict[str, tuple[datetime, Any]] = {}

    def get(self, key: str) -> Any | None:
        row = self._data.get(key)
        if row is None:
            return None
        expires_at, value = row
        if expires_at <= datetime.now(UTC):
            self._data.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, *, ttl: int = 60) -> None:
        self._data[key] = (datetime.now(UTC) + timedelta(seconds=max(ttl, 1)), value)

    def clear(self) -> None:
        self._data.clear()


response_cache = _ResponseCache()
