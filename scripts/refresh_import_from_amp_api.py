"""Refresh data/import/*.json from AMP public API (own source of truth).

This script enriches seed/import snapshots using live API data from AMP, while
preserving existing FK slug hints (developer_slug/area_slug) from older JSON rows
when the API list payload does not expose those fields.

Usage:
  python scripts/refresh_import_from_amp_api.py
  python scripts/refresh_import_from_amp_api.py --base-url https://amppattaya.com/api --limit 200
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"
DEFAULT_WRITE = REPO_ROOT / "ops" / "logs" / "b13_refresh_import_report.json"


def _http_get_json(url: str, timeout: int = 45) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "flowbiz-import-refresh/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _read_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and isinstance(raw.get("data"), list):
        return raw["data"]
    return []


def _write_json(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _read_cover_source_map(path: Path) -> dict[str, dict[str, Any]]:
    rows = _read_json(path)
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        slug = str(row.get("project_slug") or "").strip()
        if not slug:
            continue
        out[slug] = row
    return out


def _is_real_media(url: str | None) -> bool:
    if not url:
        return False
    u = str(url).strip().lower()
    if not u:
        return False
    if u.startswith("/images/"):
        return False
    if "placeholder" in u:
        return False
    return (
        "/media/" in u or u.startswith("http://") or u.startswith("https://") or u.startswith("/")
    )


def _to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int_if_whole(value: Any) -> int | None:
    f = _to_float(value)
    if f is None:
        return None
    if float(f).is_integer():
        return int(f)
    return int(round(f))


def _dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        s = str(item).strip()
        if not s or s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


def _normalize_text(value: Any) -> str:
    return " ".join(
        "".join(ch.lower() if str(ch).isalnum() else " " for ch in str(value or "")).split()
    )


@dataclass
class FetchSummary:
    developers: int = 0
    areas: int = 0
    projects: int = 0
    properties: int = 0
    property_details_ok: int = 0
    property_details_failed: int = 0


def _extract_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        data = payload.get("data") or payload.get("items")
        if isinstance(data, list):
            return [row for row in data if isinstance(row, dict)]
    return []


def _coalesce(*values: Any) -> Any:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, (list, dict)) and not value:
            continue
        return value
    return None


def fetch_projects(base_url: str) -> list[dict[str, Any]]:
    limits_to_try = (200, 100, 50)
    payload = None
    last_error: Exception | None = None
    for limit in limits_to_try:
        try:
            url = f"{base_url.rstrip('/')}/v1/projects?limit={limit}"
            payload = _http_get_json(url)
            break
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code != 422:
                raise
    if payload is None:
        if last_error:
            raise last_error
        return []
    return _extract_rows(payload)


def fetch_areas(base_url: str) -> list[dict[str, Any]]:
    return _extract_rows(_http_get_json(f"{base_url.rstrip('/')}/v1/areas"))


def fetch_developers(base_url: str) -> list[dict[str, Any]]:
    return _extract_rows(_http_get_json(f"{base_url.rstrip('/')}/v1/developers"))


def fetch_all_properties(base_url: str, *, limit: int) -> list[dict[str, Any]]:
    base = f"{base_url.rstrip('/')}/v1/properties/"
    page = 1
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    while True:
        url = f"{base}?page={page}&limit={limit}&sort=newest"
        payload = _http_get_json(url)
        data = payload.get("data") if isinstance(payload, dict) else None
        meta = payload.get("meta") if isinstance(payload, dict) else None
        if not isinstance(data, list) or not data:
            break

        for item in data:
            pid = str(item.get("id") or "").strip()
            if pid and pid in seen_ids:
                continue
            if pid:
                seen_ids.add(pid)
            rows.append(item)

        total = None
        if isinstance(meta, dict):
            total_val = meta.get("total")
            try:
                total = int(total_val)
            except (TypeError, ValueError):
                total = None

        if total is not None and len(rows) >= total:
            break
        if len(data) < limit:
            break
        page += 1

    return rows


def fetch_property_detail(base_url: str, slug: str) -> dict[str, Any] | None:
    if not slug:
        return None
    safe_slug = urllib.parse.quote(slug, safe="")
    url = f"{base_url.rstrip('/')}/v1/properties/slug/{safe_slug}"
    try:
        payload = _http_get_json(url)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        raise
    return payload if isinstance(payload, dict) else None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Refresh data/import JSON snapshots from AMP public API."
    )
    parser.add_argument(
        "--base-url",
        default="https://amppattaya.com/api",
        help="Base public API URL (default: %(default)s)",
    )
    parser.add_argument(
        "--limit", type=int, default=100, help="Properties page size (default: %(default)s)"
    )
    parser.add_argument(
        "--skip-property-details",
        action="store_true",
        help="Do not call property detail endpoint (faster, less metadata)",
    )
    parser.add_argument("--import-dir", default=str(IMPORT_DIR), help="Import data directory")
    parser.add_argument(
        "--strict", action="store_true", help="Fail when refresh produced empty API datasets"
    )
    parser.add_argument(
        "--fail-on-warn", action="store_true", dest="fail_on_warn", help="Fail on warnings too"
    )
    parser.add_argument(
        "--no-write", action="store_true", dest="no_write", help="Do not write refreshed JSON files"
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress human-readable summary")
    parser.add_argument(
        "--skip-mirror", action="store_true", help="Do not invoke mirror step after refresh"
    )
    parser.add_argument(
        "--skip-report", action="store_true", help="Do not invoke B13 report step after refresh"
    )
    parser.add_argument(
        "--skip-asset-mirror",
        action="store_true",
        help="Do not mirror missing project/unit media assets into local frontend public storage",
    )
    parser.add_argument(
        "--write",
        nargs="?",
        const=str(DEFAULT_WRITE),
        help="Write refresh execution report JSON",
    )
    args = parser.parse_args()

    import_dir = Path(args.import_dir)
    import_dir.mkdir(parents=True, exist_ok=True)

    old_developers = _read_json(import_dir / "developers.json")
    old_areas = _read_json(import_dir / "areas.json")
    old_projects = _read_json(import_dir / "projects.json")
    old_buy = _read_json(import_dir / "units_buy.json")
    old_rent = _read_json(import_dir / "units_rent.json")
    cover_source_map = _read_cover_source_map(import_dir / "project_cover_sources.json")

    old_developers_by_slug = {
        str(r.get("slug") or "").strip(): r
        for r in old_developers
        if str(r.get("slug") or "").strip()
    }
    old_areas_by_slug = {
        str(r.get("slug") or "").strip(): r for r in old_areas if str(r.get("slug") or "").strip()
    }
    old_projects_by_slug = {
        str(r.get("slug") or "").strip(): r
        for r in old_projects
        if str(r.get("slug") or "").strip()
    }
    old_units_by_source = {
        str(r.get("source_id") or "").strip(): r
        for r in [*old_buy, *old_rent]
        if str(r.get("source_id") or "").strip()
    }

    summary = FetchSummary()

    try:
        api_developers = fetch_developers(args.base_url)
        api_areas = fetch_areas(args.base_url)
        api_projects = fetch_projects(args.base_url)
        api_properties = fetch_all_properties(args.base_url, limit=min(100, max(20, args.limit)))
    except Exception as exc:  # noqa: BLE001
        print(f"[ERROR] Failed fetching AMP API data: {exc}", file=sys.stderr)
        return 1

    summary.developers = len(api_developers)
    summary.areas = len(api_areas)
    summary.projects = len(api_projects)
    summary.properties = len(api_properties)

    property_details_by_id: dict[str, dict[str, Any]] = {}
    if not args.skip_property_details:
        for prop in api_properties:
            pid = str(prop.get("id") or "").strip()
            slug = str(prop.get("slug") or "").strip()
            if not pid or not slug:
                continue
            try:
                detail = fetch_property_detail(args.base_url, slug)
                if detail:
                    property_details_by_id[pid] = detail
                    summary.property_details_ok += 1
            except Exception:
                summary.property_details_failed += 1

    # Build project image + starting price hints from real property media.
    project_media_hints: dict[str, dict[str, Any]] = {}
    project_ids = {
        str(p.get("id") or "").strip() for p in api_projects if str(p.get("id") or "").strip()
    }
    project_name_index = [
        {
            "id": str(p.get("id") or "").strip(),
            "normalized_name": _normalize_text(p.get("name")),
        }
        for p in api_projects
        if str(p.get("id") or "").strip() and _normalize_text(p.get("name"))
    ]

    def apply_project_hint(
        project_id: str, *, real_img: str | None, price_num: float | None, include_price: bool
    ) -> None:
        if not project_id or project_id not in project_ids:
            return
        hint = project_media_hints.setdefault(project_id, {})
        if real_img and not hint.get("cover_image_url"):
            hint["cover_image_url"] = real_img
        if include_price:
            current_price = _to_float(hint.get("starting_price"))
            hint["starting_price"] = (
                price_num if current_price is None else min(current_price, price_num)
            )

    for prop in api_properties:
        images = []
        for key in ("cover_image",):
            value = prop.get(key)
            if value:
                images.append(str(value))
        for key in ("local_images", "images"):
            vals = prop.get(key)
            if isinstance(vals, list):
                images.extend(str(v) for v in vals if v)

        real_img = next((img for img in images if _is_real_media(img)), None)
        price_num = _to_float(prop.get("price"))
        prop_type = str(prop.get("type") or "").strip().lower()
        include_in_project_price = (
            prop_type in {"new", "resale"} and price_num is not None and price_num > 0
        )

        project_id = str(prop.get("project_id") or "").strip()
        if project_id:
            apply_project_hint(
                project_id,
                real_img=real_img,
                price_num=price_num,
                include_price=include_in_project_price,
            )
            continue

        haystack = _normalize_text(f"{prop.get('title') or ''} {prop.get('address') or ''}")
        if not haystack:
            continue
        matches = [
            row["id"]
            for row in project_name_index
            if len(row["normalized_name"]) >= 8 and row["normalized_name"] in haystack
        ]
        if len(matches) == 1:
            apply_project_hint(
                matches[0],
                real_img=real_img,
                price_num=price_num,
                include_price=include_in_project_price,
            )

    # Merge developers
    old_developer_order = {str(r.get("slug") or ""): i for i, r in enumerate(old_developers)}
    merged_developers: list[dict[str, Any]] = []
    seen_developer_slugs: set[str] = set()

    for row in sorted(
        api_developers, key=lambda r: old_developer_order.get(str(r.get("slug") or ""), 10_000)
    ):
        slug = str(row.get("slug") or "").strip()
        name = str(row.get("name") or "").strip()
        if not slug or not name:
            continue
        seen_developer_slugs.add(slug)
        old = old_developers_by_slug.get(slug, {})
        merged_developers.append(
            {
                "name": name,
                "slug": slug,
                "website": str(_coalesce(row.get("website"), old.get("website")) or "").strip()
                or None,
                "summary": _coalesce(row.get("summary"), old.get("summary")),
                "profile": _coalesce(row.get("profile"), old.get("profile")),
                "source_note": str(
                    _coalesce(row.get("source_note"), old.get("source_note")) or ""
                ).strip()
                or None,
                "trust_proof": _coalesce(row.get("trust_proof"), old.get("trust_proof")),
                "tier": str(_coalesce(row.get("tier"), old.get("tier")) or "").strip() or None,
                "logo_url": str(_coalesce(row.get("logo_url"), old.get("logo_url")) or "").strip()
                or None,
                "cover_image_url": str(
                    _coalesce(row.get("cover_image_url"), old.get("cover_image_url")) or ""
                ).strip()
                or None,
                "status": str(_coalesce(row.get("status"), old.get("status"), "active")),
            }
        )

    for old in old_developers:
        slug = str(old.get("slug") or "").strip()
        if slug and slug not in seen_developer_slugs:
            merged_developers.append(old)

    # Merge areas
    old_area_order = {str(r.get("slug") or ""): i for i, r in enumerate(old_areas)}
    merged_areas: list[dict[str, Any]] = []
    seen_area_slugs: set[str] = set()

    for row in sorted(
        api_areas, key=lambda r: old_area_order.get(str(r.get("slug") or ""), 10_000)
    ):
        slug = str(row.get("slug") or "").strip()
        name = str(row.get("name") or "").strip()
        if not slug or not name:
            continue
        seen_area_slugs.add(slug)
        old = old_areas_by_slug.get(slug, {})
        merged_areas.append(
            {
                "name": name,
                "slug": slug,
                "city": str(_coalesce(row.get("city"), old.get("city"), "Pattaya")).strip(),
                "status": str(_coalesce(row.get("status"), old.get("status"), "published")),
                "content": _coalesce(row.get("content"), old.get("content")),
                "summary": _coalesce(row.get("summary"), old.get("summary")),
                "source_note": str(
                    _coalesce(row.get("source_note"), old.get("source_note")) or ""
                ).strip()
                or None,
                "map_center": _coalesce(row.get("map_center"), old.get("map_center")),
                "hero_image_url": str(
                    _coalesce(row.get("hero_image_url"), old.get("hero_image_url")) or ""
                ).strip()
                or None,
                "cover_image_url": str(
                    _coalesce(row.get("cover_image_url"), old.get("cover_image_url")) or ""
                ).strip()
                or None,
            }
        )

    for old in old_areas:
        slug = str(old.get("slug") or "").strip()
        if slug and slug not in seen_area_slugs:
            merged_areas.append(old)

    # Merge projects
    old_order = {str(r.get("slug") or ""): i for i, r in enumerate(old_projects)}
    merged_projects: list[dict[str, Any]] = []
    seen_project_slugs: set[str] = set()

    for p in sorted(api_projects, key=lambda r: old_order.get(str(r.get("slug") or ""), 10_000)):
        slug = str(p.get("slug") or "").strip()
        name = str(p.get("name") or "").strip()
        if not slug or not name:
            continue
        seen_project_slugs.add(slug)
        old = old_projects_by_slug.get(slug, {})
        project_id = str(p.get("id") or "").strip()
        hint = project_media_hints.get(project_id, {})

        cover = str(p.get("cover_image_url") or "").strip() or None
        if not _is_real_media(cover):
            cover = hint.get("cover_image_url") or cover or None

        manual_cover = cover_source_map.get(slug, {})
        if bool(manual_cover.get("approved_for_seed")):
            mapped_cover = str(manual_cover.get("cover_image_url") or "").strip() or None
            if _is_real_media(mapped_cover):
                cover = mapped_cover

        live_starting = _to_float(p.get("starting_price"))
        hint_starting = _to_float(hint.get("starting_price"))
        old_starting = _to_float(old.get("starting_price"))
        starting_price = live_starting or hint_starting or old_starting

        nested_area = p.get("area") if isinstance(p.get("area"), dict) else {}
        nested_developer = p.get("developer") if isinstance(p.get("developer"), dict) else {}
        row: dict[str, Any] = {
            "name": name,
            "slug": slug,
            "developer_slug": str(
                _coalesce(
                    nested_developer.get("slug"),
                    p.get("developer_slug"),
                    old.get("developer_slug"),
                )
                or ""
            ).strip()
            or None,
            "area_slug": str(
                _coalesce(nested_area.get("slug"), p.get("area_slug"), old.get("area_slug")) or ""
            ).strip()
            or None,
            "cover_image_url": cover or old.get("cover_image_url") or None,
            "status": str(p.get("status") or old.get("status") or "published"),
            "property_type": str(
                _coalesce(p.get("property_type"), old.get("property_type"), "condo")
            ).strip()
            or "condo",
            "hero_image_url": str(
                _coalesce(p.get("hero_image_url"), old.get("hero_image_url")) or ""
            ).strip()
            or None,
            "images": _coalesce(p.get("images"), old.get("images")) or None,
            "summary": _coalesce(p.get("summary"), old.get("summary")) or {},
            "description": _coalesce(p.get("description"), old.get("description")) or None,
            "badges": _coalesce(p.get("badges"), old.get("badges")) or None,
            "highlights": _coalesce(p.get("highlights"), old.get("highlights")) or None,
            "quick_facts": _coalesce(p.get("quick_facts"), old.get("quick_facts")) or None,
            "amenities": _coalesce(p.get("amenities"), old.get("amenities")) or None,
            "trust_proof": _coalesce(p.get("trust_proof"), old.get("trust_proof")) or None,
            "source_notes": _coalesce(p.get("source_notes"), old.get("source_notes")) or None,
            "claims_updated_at": _coalesce(
                p.get("claims_updated_at"), old.get("claims_updated_at")
            ),
            "investment_snapshot": _coalesce(
                p.get("investment_snapshot"), old.get("investment_snapshot")
            )
            or None,
            "location": _coalesce(p.get("location"), old.get("location")) or None,
            "delivery_date": _coalesce(p.get("delivery_date"), old.get("delivery_date")),
            "unit_count": _to_int_if_whole(_coalesce(p.get("unit_count"), old.get("unit_count"))),
            "floors": _to_int_if_whole(_coalesce(p.get("floors"), old.get("floors"))),
            "year_built": _to_int_if_whole(_coalesce(p.get("year_built"), old.get("year_built"))),
            "is_featured": bool(_coalesce(p.get("is_featured"), old.get("is_featured"), False)),
        }
        if starting_price is not None and starting_price > 0:
            row["starting_price"] = int(round(starting_price))
        merged_projects.append(row)

    # Keep legacy-only projects not present in live API
    for old in old_projects:
        slug = str(old.get("slug") or "").strip()
        if slug and slug not in seen_project_slugs:
            merged_projects.append(old)

    project_slug_by_id = {
        str(p.get("id") or "").strip(): str(p.get("slug") or "").strip() for p in api_projects
    }
    project_meta_by_slug = {
        str(r.get("slug") or "").strip(): r
        for r in merged_projects
        if str(r.get("slug") or "").strip()
    }

    def build_unit_row(prop: dict[str, Any]) -> dict[str, Any] | None:
        source_id = str(prop.get("source_id") or "").strip()
        title = str(prop.get("title") or "").strip()
        ptype = str(prop.get("type") or "").strip().lower()
        if not source_id or not title or ptype not in {"new", "resale", "rent"}:
            return None

        pid = str(prop.get("id") or "").strip()
        slug = str(prop.get("slug") or "").strip() or None
        detail = property_details_by_id.get(pid, {})
        old = old_units_by_source.get(source_id, {})

        project_slug = project_slug_by_id.get(str(prop.get("project_id") or "").strip()) or old.get(
            "project_slug"
        )
        project_meta = project_meta_by_slug.get(str(project_slug or "").strip(), {})

        price = _to_float(prop.get("price"))
        if price is None or price <= 0:
            return None

        bedrooms = detail.get("bedrooms") if detail else None
        bathrooms = detail.get("bathrooms") if detail else None
        size_sqm = None
        if detail:
            size_sqm = detail.get("size_sqm", detail.get("size"))
        if size_sqm is None:
            size_sqm = old.get("size_sqm") or old.get("size")

        raw_images: list[str] = []
        for key in ("cover_image",):
            v = detail.get(key) if detail else None
            if v:
                raw_images.append(str(v))
            elif prop.get(key):
                raw_images.append(str(prop.get(key)))
        for key in ("local_images", "images"):
            vals = (detail.get(key) if detail else None) or prop.get(key)
            if isinstance(vals, list):
                raw_images.extend(str(v) for v in vals if v)
        images = _dedupe_keep_order(raw_images)[:8]

        description = None
        if detail and detail.get("description"):
            description = str(detail["description"]).strip() or None
        elif old.get("description"):
            description = old.get("description")

        row: dict[str, Any] = {
            "source_id": source_id,
            "title": title,
            "type": ptype,
            "price": int(round(price)),
            "address": str(prop.get("address") or old.get("address") or "").strip(),
            "city": str(prop.get("city") or old.get("city") or "Pattaya").strip(),
            "images": images,
            "project_slug": project_slug or None,
            "area_slug": old.get("area_slug") or project_meta.get("area_slug") or None,
            "developer_slug": old.get("developer_slug")
            or project_meta.get("developer_slug")
            or None,
            "slug": slug or old.get("slug") or None,
            "status": str(prop.get("status") or old.get("status") or "active").strip() or "active",
        }
        if description:
            row["description"] = description
        if _to_int_if_whole(bedrooms) is not None:
            row["bedrooms"] = _to_int_if_whole(bedrooms)
        if _to_int_if_whole(bathrooms) is not None:
            row["bathrooms"] = _to_int_if_whole(bathrooms)
        if _to_float(size_sqm) is not None:
            size_value = _to_float(size_sqm)
            if size_value is not None:
                row["size_sqm"] = (
                    int(round(size_value))
                    if float(size_value).is_integer()
                    else round(size_value, 2)
                )
        return row

    live_buy: list[dict[str, Any]] = []
    live_rent: list[dict[str, Any]] = []
    seen_sources: set[str] = set()
    for prop in api_properties:
        row = build_unit_row(prop)
        if not row:
            continue
        source_id = str(row["source_id"])
        if source_id in seen_sources:
            continue
        seen_sources.add(source_id)
        if row["type"] == "rent":
            live_rent.append(row)
        else:
            live_buy.append(row)

    # Preserve legacy rows not present in live API export
    def merge_legacy(
        live_rows: list[dict[str, Any]], legacy_rows: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        live_ids = {str(r.get("source_id") or "").strip() for r in live_rows}
        extra = [r for r in legacy_rows if str(r.get("source_id") or "").strip() not in live_ids]
        return live_rows + extra

    merged_buy = merge_legacy(live_buy, old_buy)
    merged_rent = merge_legacy(live_rent, old_rent)

    # Stable sorting for diffs: source_id asc.
    merged_developers.sort(key=lambda r: str(r.get("slug") or ""))
    merged_areas.sort(key=lambda r: str(r.get("slug") or ""))
    merged_buy.sort(key=lambda r: str(r.get("source_id") or ""))
    merged_rent.sort(key=lambda r: str(r.get("source_id") or ""))
    merged_projects.sort(key=lambda r: str(r.get("slug") or ""))

    if not args.no_write:
        _write_json(import_dir / "developers.json", merged_developers)
        _write_json(import_dir / "areas.json", merged_areas)
        _write_json(import_dir / "projects.json", merged_projects)
        _write_json(import_dir / "units_buy.json", merged_buy)
        _write_json(import_dir / "units_rent.json", merged_rent)

    mirror_gate_code = 0
    asset_mirror_gate_code = 0
    coverage_gate_code = 0

    # Mirror external project covers into local /media paths so import data never hotlinks.
    if not args.skip_mirror:
        try:
            mirror_cmd = [
                sys.executable,
                str(REPO_ROOT / "scripts" / "mirror_project_cover_images.py"),
                "--input-dir",
                str(import_dir),
                "--write-report",
            ]
            if args.strict:
                mirror_cmd.append("--strict")
            if args.fail_on_warn:
                mirror_cmd.append("--fail-on-warn")
            mirror_proc = subprocess.run(mirror_cmd, check=False)
            mirror_gate_code = int(mirror_proc.returncode)
        except Exception:
            if args.strict or args.fail_on_warn:
                mirror_gate_code = 1

    if not args.skip_asset_mirror:
        try:
            asset_mirror_cmd = [
                sys.executable,
                str(REPO_ROOT / "scripts" / "mirror_import_media_assets.py"),
                "--input-dir",
                str(import_dir),
                "--write-report",
            ]
            asset_mirror_proc = subprocess.run(asset_mirror_cmd, check=False)
            asset_mirror_gate_code = int(asset_mirror_proc.returncode)
        except Exception:
            if args.strict or args.fail_on_warn:
                asset_mirror_gate_code = 1

    # Auto-generate coverage report after refresh so homepage media quality can be tracked over time.
    if not args.skip_report:
        try:
            report_cmd = [
                sys.executable,
                str(REPO_ROOT / "scripts" / "report_project_cover_coverage.py"),
                "--input-dir",
                str(import_dir),
                "--write",
            ]
            if args.strict:
                report_cmd.append("--strict")
            if args.fail_on_warn:
                report_cmd.append("--fail-on-warn")
            report_proc = subprocess.run(report_cmd, check=False)
            coverage_gate_code = int(report_proc.returncode)
        except Exception:
            if args.strict or args.fail_on_warn:
                coverage_gate_code = 1

    warnings: list[str] = []
    if summary.projects == 0 and summary.properties == 0:
        warnings.append("dataset_empty")
    if mirror_gate_code != 0:
        warnings.append("mirror_gate_failed")
    if asset_mirror_gate_code != 0:
        warnings.append("asset_mirror_gate_failed")
    if coverage_gate_code != 0:
        warnings.append("coverage_gate_failed")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": args.base_url,
        "fetched": {
            "developers": summary.developers,
            "areas": summary.areas,
            "projects": summary.projects,
            "properties": summary.properties,
            "property_details_ok": summary.property_details_ok,
            "property_details_failed": summary.property_details_failed,
        },
        "written": {
            "developers": len(merged_developers),
            "areas": len(merged_areas),
            "projects": len(merged_projects),
            "units_buy": len(merged_buy),
            "units_rent": len(merged_rent),
            "write_enabled": not bool(args.no_write),
        },
        "warnings": warnings,
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not args.quiet:
        print(
            "B13 Refresh Summary | "
            f"developers={summary.developers} areas={summary.areas} "
            f"projects={summary.projects} properties={summary.properties} "
            f"writes={'on' if not args.no_write else 'off'}"
        )

    if args.write:
        out = Path(args.write)
        if not out.is_absolute():
            out = REPO_ROOT / out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"WROTE:{out}")

    has_warn = bool(report["warnings"])
    has_error = summary.projects == 0 and summary.properties == 0
    gate_failed = (
        (mirror_gate_code != 0) or (asset_mirror_gate_code != 0) or (coverage_gate_code != 0)
    )
    if args.fail_on_warn and (has_warn or has_error or gate_failed):
        return 2
    if args.strict and (has_error or gate_failed):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
