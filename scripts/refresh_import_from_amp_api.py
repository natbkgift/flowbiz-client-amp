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
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = REPO_ROOT / "data" / "import"


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
    return "/media/" in u or u.startswith("http://") or u.startswith("https://") or u.startswith("/")


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


@dataclass
class FetchSummary:
    projects: int = 0
    properties: int = 0
    property_details_ok: int = 0
    property_details_failed: int = 0


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
    if isinstance(payload, dict):
        data = payload.get("data") or payload.get("items")
        if isinstance(data, list):
            return data
    if isinstance(payload, list):
        return payload
    return []


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
    parser = argparse.ArgumentParser(description="Refresh data/import JSON snapshots from AMP public API.")
    parser.add_argument("--base-url", default="https://amppattaya.com/api", help="Base public API URL (default: %(default)s)")
    parser.add_argument("--limit", type=int, default=100, help="Properties page size (default: %(default)s)")
    parser.add_argument("--skip-property-details", action="store_true", help="Do not call property detail endpoint (faster, less metadata)")
    args = parser.parse_args()

    IMPORT_DIR.mkdir(parents=True, exist_ok=True)

    old_projects = _read_json(IMPORT_DIR / "projects.json")
    old_buy = _read_json(IMPORT_DIR / "units_buy.json")
    old_rent = _read_json(IMPORT_DIR / "units_rent.json")

    old_projects_by_slug = {
        str(r.get("slug") or "").strip(): r for r in old_projects if str(r.get("slug") or "").strip()
    }
    old_units_by_source = {
        str(r.get("source_id") or "").strip(): r
        for r in [*old_buy, *old_rent]
        if str(r.get("source_id") or "").strip()
    }

    summary = FetchSummary()

    try:
        api_projects = fetch_projects(args.base_url)
        api_properties = fetch_all_properties(args.base_url, limit=min(100, max(20, args.limit)))
    except Exception as exc:  # noqa: BLE001
        print(f"[ERROR] Failed fetching AMP API data: {exc}", file=sys.stderr)
        return 1

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
    for prop in api_properties:
        project_id = str(prop.get("project_id") or "").strip()
        if not project_id:
            continue

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
        include_in_project_price = prop_type in {"new", "resale"} and price_num is not None and price_num > 0

        hint = project_media_hints.setdefault(project_id, {})
        if real_img and not hint.get("cover_image_url"):
            hint["cover_image_url"] = real_img
        if include_in_project_price:
            current_price = _to_float(hint.get("starting_price"))
            hint["starting_price"] = price_num if current_price is None else min(current_price, price_num)

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

        live_starting = _to_float(p.get("starting_price"))
        hint_starting = _to_float(hint.get("starting_price"))
        old_starting = _to_float(old.get("starting_price"))
        starting_price = live_starting or hint_starting or old_starting

        row: dict[str, Any] = {
            "name": name,
            "slug": slug,
            "developer_slug": old.get("developer_slug"),
            "area_slug": old.get("area_slug"),
            "cover_image_url": cover or old.get("cover_image_url") or None,
            "status": str(p.get("status") or old.get("status") or "published"),
        }
        if starting_price is not None and starting_price > 0:
            row["starting_price"] = int(round(starting_price))
        merged_projects.append(row)

    # Keep legacy-only projects not present in live API
    for old in old_projects:
        slug = str(old.get("slug") or "").strip()
        if slug and slug not in seen_project_slugs:
            merged_projects.append(old)

    project_slug_by_id = {str(p.get("id") or "").strip(): str(p.get("slug") or "").strip() for p in api_projects}
    project_meta_by_slug = {str(r.get("slug") or "").strip(): r for r in merged_projects if str(r.get("slug") or "").strip()}

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

        project_slug = project_slug_by_id.get(str(prop.get("project_id") or "").strip()) or old.get("project_slug")
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
            "developer_slug": old.get("developer_slug") or project_meta.get("developer_slug") or None,
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
                row["size_sqm"] = int(round(size_value)) if float(size_value).is_integer() else round(size_value, 2)
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
    def merge_legacy(live_rows: list[dict[str, Any]], legacy_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        live_ids = {str(r.get("source_id") or "").strip() for r in live_rows}
        extra = [r for r in legacy_rows if str(r.get("source_id") or "").strip() not in live_ids]
        return live_rows + extra

    merged_buy = merge_legacy(live_buy, old_buy)
    merged_rent = merge_legacy(live_rent, old_rent)

    # Stable sorting for diffs: source_id asc.
    merged_buy.sort(key=lambda r: str(r.get("source_id") or ""))
    merged_rent.sort(key=lambda r: str(r.get("source_id") or ""))
    merged_projects.sort(key=lambda r: str(r.get("slug") or ""))

    _write_json(IMPORT_DIR / "projects.json", merged_projects)
    _write_json(IMPORT_DIR / "units_buy.json", merged_buy)
    _write_json(IMPORT_DIR / "units_rent.json", merged_rent)

    print(
        json.dumps(
            {
                "base_url": args.base_url,
                "fetched": {
                    "projects": summary.projects,
                    "properties": summary.properties,
                    "property_details_ok": summary.property_details_ok,
                    "property_details_failed": summary.property_details_failed,
                },
                "written": {
                    "projects": len(merged_projects),
                    "units_buy": len(merged_buy),
                    "units_rent": len(merged_rent),
                },
                "notes": [
                    "Merged live AMP API data into data/import JSON snapshots.",
                    "Preserved existing developer_slug/area_slug hints when API payload lacked FK slugs.",
                    "Project cover/starting_price enriched from related property media/prices when possible.",
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
