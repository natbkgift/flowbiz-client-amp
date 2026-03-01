from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[2]
_DATA_DIR = _REPO_ROOT / "data" / "seo"
_SCHEMA_FILE = _DATA_DIR / "schema_source_production.json"
_REDIRECT_FILE = _DATA_DIR / "legacy_redirects_preload.assetmp_2026-03-01.json"
_POLICY_FILE = _DATA_DIR / "broken_link_checker_policy.production.json"

_FALLBACK_BROKEN_LINK_POLICY: dict[str, Any] = {
    "version": "b10-prod-fallback",
    "seed_paths": [
        "/",
        "/en",
        "/th",
        "/en/projects",
        "/en/areas",
        "/en/developers",
        "/en/blog",
        "/en/guides",
        "/en/contact",
    ],
    "max_depth": 2,
    "max_pages": 120,
    "max_link_checks": 600,
}


def _normalize_path(value: str | None) -> str:
    text = str(value or "").strip()
    if not text:
        return "/"
    path = "/" + text.lstrip("/")
    while "//" in path:
        path = path.replace("//", "/")
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return path or "/"


def _safe_int(value: Any, default: int, *, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(parsed, maximum))


def _read_json(path: Path) -> Any:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


@lru_cache(maxsize=1)
def load_production_schema_profiles() -> dict[str, dict[str, Any]]:
    payload = _read_json(_SCHEMA_FILE)
    if not isinstance(payload, dict):
        return {}
    profiles = payload.get("profiles")
    if not isinstance(profiles, dict):
        return {}
    out: dict[str, dict[str, Any]] = {}
    for raw_locale, raw_profile in profiles.items():
        locale = str(raw_locale or "").strip().lower()
        if locale not in {"en", "th"}:
            continue
        if not isinstance(raw_profile, dict):
            continue
        profile = dict(raw_profile)
        profile["locale"] = locale
        out[locale] = profile
    return out


def load_production_schema_profile(locale: str) -> dict[str, Any] | None:
    normalized_locale = str(locale or "en").strip().lower()
    if normalized_locale not in {"en", "th"}:
        normalized_locale = "en"
    return load_production_schema_profiles().get(normalized_locale)


@lru_cache(maxsize=1)
def load_production_legacy_redirect_rows() -> list[dict[str, Any]]:
    payload = _read_json(_REDIRECT_FILE)
    if not isinstance(payload, dict):
        return []
    rows = payload.get("redirects")
    if not isinstance(rows, list):
        return []
    out: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        old_path = _normalize_path(row.get("old_path"))
        new_path = str(row.get("new_path") or "").strip()
        if not old_path or not new_path:
            continue
        out.append(
            {
                "old_path": old_path,
                "new_path": new_path,
                "status_code": _safe_int(row.get("status_code"), 301, minimum=301, maximum=302),
                "preserve_query": bool(row.get("preserve_query", True)),
                "enabled": bool(row.get("enabled", True)),
                "mapping_strategy": str(row.get("mapping_strategy") or "").strip() or None,
                "source_url": str(row.get("source_url") or "").strip() or None,
            }
        )
    return out


@lru_cache(maxsize=1)
def load_production_broken_link_policy() -> dict[str, Any]:
    payload = _read_json(_POLICY_FILE)
    if not isinstance(payload, dict):
        payload = dict(_FALLBACK_BROKEN_LINK_POLICY)

    seed_paths = payload.get("seed_paths")
    if not isinstance(seed_paths, list):
        seed_paths = _FALLBACK_BROKEN_LINK_POLICY["seed_paths"]
    normalized_seed_paths: list[str] = []
    seen: set[str] = set()
    for raw_path in seed_paths:
        normalized = _normalize_path(str(raw_path or ""))
        if normalized in seen:
            continue
        seen.add(normalized)
        normalized_seed_paths.append(normalized)
    if not normalized_seed_paths:
        normalized_seed_paths = list(_FALLBACK_BROKEN_LINK_POLICY["seed_paths"])

    return {
        "version": str(payload.get("version") or _FALLBACK_BROKEN_LINK_POLICY["version"]),
        "seed_paths": normalized_seed_paths,
        "max_depth": _safe_int(payload.get("max_depth"), 2, minimum=0, maximum=6),
        "max_pages": _safe_int(payload.get("max_pages"), 120, minimum=1, maximum=2000),
        "max_link_checks": _safe_int(
            payload.get("max_link_checks"),
            600,
            minimum=1,
            maximum=10000,
        ),
    }
