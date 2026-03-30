"""Data Import Sequence — Blueprint Doc 14.

Imports real data into the platform in the correct FK-dependency order:

  1. Developers  (no FK dependencies)
  2. Areas       (no FK dependencies)
  3. Projects    (depends on: developers, areas)
  4. Units - Buy (depends on: projects, areas, developers)
  5. Units - Rent(depends on: projects, areas, developers)
  6. Team/Agents (no FK dependencies)

Usage:
    python scripts/import_seed_data.py --input data/import --dry-run
    python scripts/import_seed_data.py --input data/import
    python scripts/import_seed_data.py --input data/import --step developers
    python scripts/import_seed_data.py --input data/import --step areas --step projects
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path so ``packages.core`` resolves.
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from packages.core.database import DATABASE_URL, SessionLocal  # noqa: E402
from packages.core.models import (  # noqa: E402
    Agent,
    Area,
    Developer,
    Project,
    Property,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("import_seed_data")

# ── Step registry (ordered) ──────────────────────────────────────────────
STEP_ORDER = [
    "developers",
    "areas",
    "projects",
    "units_buy",
    "units_rent",
    "team",
]

# Optional steps may be missing in lean source snapshots. We do not count these as
# warning failures unless explicitly requested.
OPTIONAL_SKIP_WARNING_STEPS = {"developers", "areas", "team"}


# ── Result tracking ──────────────────────────────────────────────────────
@dataclass
class StepResult:
    step: str
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0


# ── Validation helpers ───────────────────────────────────────────────────
def _require_str(row: dict, key: str, label: str) -> str | None:
    val = row.get(key)
    if not val or not str(val).strip():
        return f"{label}: missing required field '{key}'"
    return None


def _require_positive_number(row: dict, key: str, label: str) -> str | None:
    val = row.get(key)
    if val is None:
        return f"{label}: missing required field '{key}'"
    try:
        if float(val) <= 0:
            return f"{label}: '{key}' must be > 0"
    except (ValueError, TypeError):
        return f"{label}: '{key}' is not a valid number"
    return None


def _check_slug_unique(slugs_seen: set[str], slug: str, label: str) -> str | None:
    if slug in slugs_seen:
        return f"{label}: duplicate slug '{slug}'"
    slugs_seen.add(slug)
    return None


def _coerce_json_object(value: Any) -> dict[str, Any] | None:
    return value if isinstance(value, dict) else None


def _coerce_json_list(value: Any) -> list[Any] | None:
    return value if isinstance(value, list) else None


def _coerce_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def _coerce_bool(value: Any, *, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value in (None, ""):
        return default
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "y", "on"}:
        return True
    if text in {"0", "false", "no", "n", "off"}:
        return False
    return default


def _normalize_flag(value: Any) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def _write_json_with_fallback(
    path: Path, payload: dict[str, Any], *, quiet: bool = False, label: str = "Summary"
) -> None:
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    targets = [path]
    fallback = Path(tempfile.gettempdir()) / path.name
    if fallback not in targets:
        targets.append(fallback)

    last_error: Exception | None = None
    for target in targets:
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(serialized, encoding="utf-8")
            if not quiet:
                if target == path:
                    log.info("%s written -> %s", label, target)
                else:
                    log.warning(
                        "%s path %s was not writable; wrote fallback artifact -> %s",
                        label,
                        path,
                        target,
                    )
            return
        except OSError as exc:
            last_error = exc

    if not quiet:
        log.warning(
            "%s could not be written to %s or fallback temp path (%s)",
            label,
            path,
            last_error,
        )


def _parse_optional_date(value: Any) -> date | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return None


def _parse_optional_datetime(value: Any) -> datetime | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _truncate_optional_text(value: Any, max_length: int) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    return text[:max_length]


def _normalize_property_view(value: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None

    normalized = raw.lower().replace("-", " ").replace("_", " ")
    normalized = " ".join(normalized.split())
    if "sea view" in normalized:
        return "Sea View"
    if "bay view" in normalized:
        return "Bay View"
    if "city view" in normalized:
        return "City View"
    if "garden view" in normalized:
        return "Garden View"
    if "pool view" in normalized:
        return "Pool View"
    if "river view" in normalized:
        return "River View"
    return _truncate_optional_text(raw, 20)


def _resolve_fk(
    db: Session,
    model: type,
    slug: str | None,
    field_name: str,
    label: str,
    *,
    dry_run: bool = False,
) -> tuple[UUID | None, str | None]:
    """Look up a FK by slug.  Returns (id, error_or_none).

    In dry-run mode, skips the DB lookup and returns a placeholder UUID
    so validation can continue without requiring a live database.
    """
    if not slug:
        return None, None  # nullable FK — allowed
    if dry_run:
        return None, None  # skip DB lookup in dry-run; format-only validation
    row = db.scalar(select(model).where(model.slug == slug))  # type: ignore[attr-defined]
    if row is None:
        return None, f"{label}: {field_name} slug '{slug}' not found in DB"
    return row.id, None


# ── Step implementations ─────────────────────────────────────────────────


def _upsert_by_slug(
    db: Session,
    model: type,
    slug: str,
    defaults: dict[str, Any],
) -> tuple[Any, bool]:
    """Insert or update a row by slug.  Returns (row, is_new)."""
    row = db.scalar(select(model).where(model.slug == slug))  # type: ignore[attr-defined]
    if row is None:
        row = model(slug=slug, **defaults)  # type: ignore[call-arg]
        db.add(row)
        db.flush()
        return row, True
    else:
        for k, v in defaults.items():
            setattr(row, k, v)
        db.flush()
        return row, False


def import_developers(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    """Step 1: Import developers (no FK dependencies)."""
    result = StepResult(step="developers")
    slugs_seen: set[str] = set()

    for i, row in enumerate(rows, 1):
        label = f"developers[{i}]"
        errs: list[str] = []

        for req in ("name", "slug"):
            e = _require_str(row, req, label)
            if e:
                errs.append(e)

        slug = str(row.get("slug", "")).strip()
        if slug:
            e = _check_slug_unique(slugs_seen, slug, label)
            if e:
                errs.append(e)

        if errs:
            result.errors.extend(errs)
            continue

        if dry_run:
            result.inserted += 1
            continue

        status = str(row.get("status") or "active").strip().lower()
        if status not in ("active", "inactive"):
            status = "active"

        _, is_new = _upsert_by_slug(
            db,
            Developer,
            slug,
            {
                "name": str(row["name"]).strip(),
                "website": str(row.get("website") or "").strip() or None,
                "summary": _coerce_json_object(row.get("summary")),
                "profile": _coerce_json_object(row.get("profile")),
                "source_note": str(row.get("source_note") or "").strip() or None,
                "trust_proof": _coerce_json_object(row.get("trust_proof")),
                "tier": str(row.get("tier") or "").strip() or None,
                "logo_url": str(row.get("logo_url") or "").strip() or None,
                "cover_image_url": str(row.get("cover_image_url") or "").strip() or None,
                "status": status,
            },
        )
        if is_new:
            result.inserted += 1
        else:
            result.updated += 1

    return result


def import_areas(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    """Step 2: Import areas (no FK dependencies)."""
    result = StepResult(step="areas")
    slugs_seen: set[str] = set()

    for i, row in enumerate(rows, 1):
        label = f"areas[{i}]"
        errs: list[str] = []

        for req in ("name", "slug"):
            e = _require_str(row, req, label)
            if e:
                errs.append(e)

        slug = str(row.get("slug", "")).strip()
        if slug:
            e = _check_slug_unique(slugs_seen, slug, label)
            if e:
                errs.append(e)

        if errs:
            result.errors.extend(errs)
            continue

        if dry_run:
            result.inserted += 1
            continue

        status = str(row.get("status") or "published").strip().lower()
        if status not in ("draft", "published", "archived"):
            status = "published"

        _, is_new = _upsert_by_slug(
            db,
            Area,
            slug,
            {
                "name": str(row["name"]).strip(),
                "city": str(row.get("city") or "Pattaya").strip(),
                "content": _coerce_json_object(row.get("content")),
                "summary": _coerce_json_object(row.get("summary")),
                "source_note": str(row.get("source_note") or "").strip() or None,
                "map_center": _coerce_json_object(row.get("map_center")),
                "hero_image_url": str(row.get("hero_image_url") or "").strip() or None,
                "cover_image_url": str(row.get("cover_image_url") or "").strip() or None,
                "status": status,
            },
        )
        if is_new:
            result.inserted += 1
        else:
            result.updated += 1

    return result


def import_projects(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    """Step 3: Import projects (depends on developers, areas)."""
    result = StepResult(step="projects")
    slugs_seen: set[str] = set()

    for i, row in enumerate(rows, 1):
        label = f"projects[{i}]"
        errs: list[str] = []

        for req in ("name", "slug"):
            e = _require_str(row, req, label)
            if e:
                errs.append(e)

        slug = str(row.get("slug", "")).strip()
        if slug:
            e = _check_slug_unique(slugs_seen, slug, label)
            if e:
                errs.append(e)

        # Resolve FK dependencies
        developer_id, err = _resolve_fk(
            db,
            Developer,
            str(row.get("developer_slug") or "").strip() or None,
            "developer_slug",
            label,
            dry_run=dry_run,
        )
        if err:
            errs.append(err)

        area_id, err = _resolve_fk(
            db,
            Area,
            str(row.get("area_slug") or "").strip() or None,
            "area_slug",
            label,
            dry_run=dry_run,
        )
        if err:
            errs.append(err)

        if errs:
            result.errors.extend(errs)
            continue

        if dry_run:
            result.inserted += 1
            continue

        status = str(row.get("status") or "published").strip()
        if status not in ("draft", "published", "archived"):
            status = "published"

        property_type = str(row.get("property_type") or "condo").strip().lower() or "condo"
        if property_type not in {"condo", "villa", "house", "land", "hotel", "shop", "office"}:
            property_type = "condo"

        starting_price = None
        raw_starting_price = row.get("starting_price")
        if raw_starting_price not in (None, ""):
            try:
                starting_price = Decimal(str(raw_starting_price))
            except (InvalidOperation, ValueError):
                result.errors.append(f"{label}: invalid starting_price '{raw_starting_price}'")
                continue

        delivery_date = _parse_optional_date(row.get("delivery_date"))
        claims_updated_at = _parse_optional_datetime(row.get("claims_updated_at"))

        _, is_new = _upsert_by_slug(
            db,
            Project,
            slug,
            {
                "name": str(row["name"]).strip(),
                "developer_id": developer_id,
                "area_id": area_id,
                "property_type": property_type,
                "delivery_date": delivery_date,
                "cover_image_url": str(row.get("cover_image_url") or "").strip() or None,
                "hero_image_url": str(row.get("hero_image_url") or "").strip() or None,
                "images": _coerce_json_list(row.get("images")),
                "summary": _coerce_json_object(row.get("summary")) or {},
                "description": _coerce_json_object(row.get("description")),
                "badges": _coerce_json_list(row.get("badges")),
                "highlights": _coerce_json_list(row.get("highlights")),
                "quick_facts": _coerce_json_list(row.get("quick_facts")),
                "amenities": _coerce_json_list(row.get("amenities")),
                "trust_proof": _coerce_json_list(row.get("trust_proof")),
                "source_notes": _coerce_json_object(row.get("source_notes")),
                "claims_updated_at": claims_updated_at,
                "investment_snapshot": _coerce_json_object(row.get("investment_snapshot")),
                "location": _coerce_json_object(row.get("location")),
                "unit_count": _coerce_int(row.get("unit_count")),
                "floors": _coerce_int(row.get("floors")),
                "year_built": _coerce_int(row.get("year_built")),
                "is_featured": _coerce_bool(row.get("is_featured")),
                "starting_price": starting_price,
                "status": status,
            },
        )
        if is_new:
            result.inserted += 1
        else:
            result.updated += 1

    return result


def _import_units(
    db: Session,
    rows: list[dict],
    *,
    dry_run: bool,
    step_name: str,
    default_type: str,
) -> StepResult:
    """Step 4/5: Import property units (depends on projects, areas, developers)."""
    result = StepResult(step=step_name)
    source_ids_seen: set[str] = set()

    for i, row in enumerate(rows, 1):
        label = f"{step_name}[{i}]"
        errs: list[str] = []

        for req in ("source_id", "title", "address", "city"):
            e = _require_str(row, req, label)
            if e:
                errs.append(e)

        e = _require_positive_number(row, "price", label)
        if e:
            errs.append(e)

        source_id = str(row.get("source_id", "")).strip()
        if source_id:
            if source_id in source_ids_seen:
                errs.append(f"{label}: duplicate source_id '{source_id}'")
            source_ids_seen.add(source_id)

        # Validate type
        prop_type = str(row.get("type") or default_type).strip()
        if prop_type not in ("new", "resale", "rent"):
            errs.append(f"{label}: invalid type '{prop_type}' (must be new/resale/rent)")

        # Validate status
        prop_status = str(row.get("status") or "active").strip()
        if prop_status not in ("active", "inactive", "archived"):
            errs.append(f"{label}: invalid status '{prop_status}' (must be active/inactive/archived)")

        # Resolve FK dependencies (all optional)
        project_id, err = _resolve_fk(
            db,
            Project,
            str(row.get("project_slug") or "").strip() or None,
            "project_slug",
            label,
            dry_run=dry_run,
        )
        if err:
            errs.append(err)

        area_id, err = _resolve_fk(
            db,
            Area,
            str(row.get("area_slug") or "").strip() or None,
            "area_slug",
            label,
            dry_run=dry_run,
        )
        if err:
            errs.append(err)

        developer_id, err = _resolve_fk(
            db,
            Developer,
            str(row.get("developer_slug") or "").strip() or None,
            "developer_slug",
            label,
            dry_run=dry_run,
        )
        if err:
            errs.append(err)

        if errs:
            result.errors.extend(errs)
            continue

        if dry_run:
            result.inserted += 1
            continue

        # Upsert by source_id
        existing = db.scalar(select(Property).where(Property.source_id == source_id))
        try:
            price = Decimal(str(row["price"]))
        except (InvalidOperation, ValueError):
            price = Decimal("0")

        bedrooms = row.get("bedrooms")
        bathrooms = row.get("bathrooms")
        size_val = row.get("size_sqm") or row.get("size")
        floor = row.get("floor")
        floor_number = row.get("floor_number")
        floors = row.get("floors")
        property_type = str(row.get("property_type") or "condo").strip().lower() or "condo"
        if property_type not in {"condo", "villa", "house", "land", "hotel", "shop", "office"}:
            property_type = "condo"
        last_synced_at = _parse_optional_datetime(row.get("last_synced_at"))

        values = {
            "title": str(row["title"]).strip(),
            "description": str(row.get("description") or "").strip() or None,
            "title_i18n": _coerce_json_object(row.get("title_i18n")),
            "description_i18n": _coerce_json_object(row.get("description_i18n")),
            "type": prop_type,
            "property_type": property_type,
            "price": price,
            "currency": str(row.get("currency") or "THB").strip() or "THB",
            "price_period": _truncate_optional_text(row.get("price_period"), 20),
            "bedrooms": int(bedrooms) if bedrooms is not None else None,
            "bathrooms": int(bathrooms) if bathrooms is not None else None,
            "size_sqm": Decimal(str(size_val)) if size_val is not None else None,
            "size": Decimal(str(size_val)) if size_val is not None else None,
            "floor": _coerce_int(floor),
            "floor_number": _coerce_int(floor_number if floor_number is not None else floor),
            "floors": _coerce_int(floors),
            "furnishing": _truncate_optional_text(row.get("furnishing"), 32),
            "unit_type": _truncate_optional_text(row.get("unit_type"), 20),
            "view": _normalize_property_view(row.get("view") or row.get("view_label")),
            "address": str(row["address"]).strip(),
            "city": str(row["city"]).strip(),
            "area_id": area_id,
            "developer_id": developer_id,
            "project_id": project_id,
            "slug": str(row.get("slug") or "").strip() or None,
            "ownership_notes": str(row.get("ownership_notes") or "").strip() or None,
            "fee_notes": str(row.get("fee_notes") or "").strip() or None,
            "cover_image_url": str(row.get("cover_image_url") or "").strip() or None,
            "cover_image": str(row.get("cover_image") or "").strip() or None,
            "status": prop_status,
            "local_images": _coerce_json_list(row.get("local_images")),
            "features": _coerce_json_object(row.get("features")),
            "source_meta": _coerce_json_object(row.get("source_meta")),
            "last_synced_at": last_synced_at,
        }

        images = row.get("images")
        if images and isinstance(images, list):
            values["images"] = images

        if existing is None:
            prop = Property(source_id=source_id, **values)
            db.add(prop)
            result.inserted += 1
        else:
            for k, v in values.items():
                setattr(existing, k, v)
            result.updated += 1

        db.flush()

    return result


def import_units_buy(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    return _import_units(db, rows, dry_run=dry_run, step_name="units_buy", default_type="resale")


def import_units_rent(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    return _import_units(db, rows, dry_run=dry_run, step_name="units_rent", default_type="rent")


def import_team(db: Session, rows: list[dict], *, dry_run: bool) -> StepResult:
    """Step 6: Import team members / agents (no FK dependencies)."""
    result = StepResult(step="team")

    for i, row in enumerate(rows, 1):
        label = f"team[{i}]"
        errs: list[str] = []

        e = _require_str(row, "name", label)
        if e:
            errs.append(e)

        if errs:
            result.errors.extend(errs)
            continue

        if dry_run:
            result.inserted += 1
            continue

        name = str(row["name"]).strip()
        email = str(row.get("email") or "").strip() or None

        # Try to find existing agent by email (if provided) or by name
        existing = None
        if email:
            existing = db.scalar(select(Agent).where(Agent.email == email))
        if existing is None:
            existing = db.scalar(select(Agent).where(Agent.name == name))

        values = {
            "name": name,
            "email": email,
            "phone": str(row.get("phone") or "").strip() or None,
            "line_id": str(row.get("line_id") or "").strip() or None,
        }

        if existing is None:
            agent = Agent(**values)
            db.add(agent)
            result.inserted += 1
        else:
            for k, v in values.items():
                setattr(existing, k, v)
            result.updated += 1

        db.flush()

    return result


# ── Step dispatcher ──────────────────────────────────────────────────────
STEP_HANDLERS = {
    "developers": import_developers,
    "areas": import_areas,
    "projects": import_projects,
    "units_buy": import_units_buy,
    "units_rent": import_units_rent,
    "team": import_team,
}


# ── File loading ─────────────────────────────────────────────────────────
def _load_json(path: Path) -> list[dict]:
    """Load a JSON file.  Expects a top-level array of objects."""
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and "data" in raw:
        return raw["data"]
    return []


def _find_external_project_covers(path: Path) -> list[dict[str, str]]:
    rows = _load_json(path)
    out: list[dict[str, str]] = []
    for row in rows:
        cover = str(row.get("cover_image_url") or "").strip()
        if cover.startswith("http://") or cover.startswith("https://"):
            out.append(
                {
                    "slug": str(row.get("slug") or "").strip(),
                    "cover_image_url": cover,
                }
            )
    return out


def _warning_skipped_steps(results: list[StepResult], *, warn_on_optional_skip: bool) -> list[str]:
    skipped_steps = [r.step for r in results if r.skipped > 0]
    if warn_on_optional_skip:
        return skipped_steps
    return [s for s in skipped_steps if s not in OPTIONAL_SKIP_WARNING_STEPS]


def _purge_preview_demo_rows(db: Session, *, dry_run: bool) -> dict[str, int]:
    demo_project_ids = [
        row[0]
        for row in db.query(Project.id).filter(Project.slug.like("demo-%")).all()
    ]

    property_filters = [Property.slug.like("demo-%"), Property.source_id.like("demo-local-%")]
    if demo_project_ids:
        property_filters.append(Property.project_id.in_(demo_project_ids))

    property_query = db.query(Property).filter(or_(*property_filters))
    project_query = db.query(Project).filter(Project.slug.like("demo-%"))
    developer_query = db.query(Developer).filter(
        or_(
            Developer.slug.like("demo-%"),
            Developer.source_note.ilike("%preview reseed%"),
        )
    )

    counts = {
        "properties": property_query.count(),
        "projects": project_query.count(),
        "developers": developer_query.count(),
    }

    if dry_run:
        return counts

    counts["properties"] = property_query.delete(synchronize_session=False)
    counts["projects"] = project_query.delete(synchronize_session=False)
    counts["developers"] = developer_query.delete(synchronize_session=False)
    db.flush()
    return counts


# ── Main ─────────────────────────────────────────────────────────────────
def main() -> int:
    parser = argparse.ArgumentParser(
        description="Data import per Blueprint Doc 14 sequence.",
    )
    parser.add_argument(
        "--input",
        default="data/import",
        help="Directory containing JSON files (developers.json, areas.json, etc.)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate data without writing to DB",
    )
    parser.add_argument(
        "--validate-fk-json",
        action="store_true",
        help=(
            "Validate foreign-key slugs by cross-checking JSON files (developers/areas/projects) "
            "before touching the database. Useful in --dry-run to catch slug mismatches early."
        ),
    )
    parser.add_argument(
        "--step",
        action="append",
        dest="steps",
        default=None,
        help=f"Import only specific step(s). Can be repeated. Options: {', '.join(STEP_ORDER)}",
    )
    parser.add_argument(
        "--strict", action="store_true", help="Exit non-zero when import result has errors"
    )
    parser.add_argument(
        "--fail-on-warn",
        action="store_true",
        dest="fail_on_warn",
        help="Exit non-zero on warnings (default warns on skipped non-optional steps only)",
    )
    parser.add_argument(
        "--warn-on-optional-skip",
        action="store_true",
        dest="warn_on_optional_skip",
        help="Treat missing optional steps (developers/areas/team) as warnings too",
    )
    parser.add_argument("--db-path", default=None, help="SQLite DB path override")
    parser.add_argument(
        "--database-url",
        default=None,
        help="SQLAlchemy database URL override (higher priority than --db-path)",
    )
    parser.add_argument("--quiet", action="store_true", help="Reduce human log output to summary")
    parser.add_argument(
        "--no-write", action="store_true", dest="no_write", help="Do not write summary JSON file"
    )
    parser.add_argument(
        "--write",
        default="ops/logs/b13_import_seed_summary.json",
        help="Summary JSON path (default: %(default)s)",
    )
    parser.add_argument(
        "--purge-preview-demo",
        action="store_true",
        dest="purge_preview_demo",
        help="Delete preview reseed demo projects/properties/developers before importing real data",
    )
    args = parser.parse_args()

    input_dir = Path(args.input)
    dry_run: bool = args.dry_run
    validate_fk_json: bool = args.validate_fk_json

    if not input_dir.exists():
        log.error("Input directory does not exist: %s", input_dir)
        return 1

    # Safety: refuse production without explicit opt-in
    env = (os.environ.get("APP_ENV") or "").lower().strip()
    if env in ("prod", "production") and not os.environ.get("AMP_ALLOW_IMPORT", "").strip():
        log.error("Set AMP_ALLOW_IMPORT=1 to run imports when APP_ENV=%s", env)
        return 1

    effective_database_url = str(args.database_url or "").strip()
    if not effective_database_url and args.db_path:
        db_path = Path(args.db_path).expanduser().resolve()
        effective_database_url = f"sqlite:///{db_path.as_posix()}"
    if not effective_database_url:
        effective_database_url = DATABASE_URL

    # Determine which steps to run
    steps_to_run = args.steps or STEP_ORDER
    for s in steps_to_run:
        if s not in STEP_HANDLERS:
            log.error("Unknown step: '%s'. Valid: %s", s, ", ".join(STEP_ORDER))
            return 1

    # Map step names to JSON filenames
    file_map = {
        "developers": "developers.json",
        "areas": "areas.json",
        "projects": "projects.json",
        "units_buy": "units_buy.json",
        "units_rent": "units_rent.json",
        "team": "team.json",
    }

    # Best-effort media mirroring before any import step touches DB.
    # This keeps project cover_image_url local (/media/...) and prevents public hotlinks.
    project_rows_path = input_dir / "projects.json"
    external_project_covers = _find_external_project_covers(project_rows_path)
    project_public_root = _PROJECT_ROOT / "admin-app" / "public"
    skip_project_cover_mirror = _normalize_flag(os.environ.get("AMP_SKIP_PROJECT_COVER_MIRROR"))

    if "projects" in steps_to_run and not (
        skip_project_cover_mirror or (not project_public_root.exists() and not external_project_covers)
    ):
        try:
            mirror_cmd = [
                sys.executable,
                str(_PROJECT_ROOT / "scripts" / "mirror_project_cover_images.py"),
                "--input-dir",
                str(input_dir),
            ]
            # In strict/fail-on-warn mode we must verify on-disk files, not trust stale local URLs.
            if not args.strict and not args.fail_on_warn:
                mirror_cmd.append("--skip-local-file-check")
            if dry_run:
                mirror_cmd.append("--dry-run")
            if args.strict:
                mirror_cmd.append("--strict")
            if args.fail_on_warn:
                mirror_cmd.append("--fail-on-warn")
            mirror_cmd.extend(["--write-report"])
            mirror_proc = subprocess.run(
                mirror_cmd,
                check=False,
            )
            if (args.strict or args.fail_on_warn) and int(mirror_proc.returncode) != 0:
                log.error(
                    "Preflight cover mirror gate failed (exit=%d).",
                    int(mirror_proc.returncode),
                )
                return 2 if args.fail_on_warn and int(mirror_proc.returncode) == 2 else 1
        except Exception:
            if args.strict or args.fail_on_warn:
                log.exception("Preflight cover mirror gate failed.")
                return 1
    elif "projects" in steps_to_run:
        log.info(
            "Skipping project cover mirror preflight (skip=%s public_root_exists=%s external_covers=%d).",
            skip_project_cover_mirror,
            project_public_root.exists(),
            len(external_project_covers),
        )

    if (
        external_project_covers
        and not os.environ.get("AMP_ALLOW_EXTERNAL_PROJECT_COVERS", "").strip()
    ):
        log.error(
            "Refusing import: %d project cover(s) still use external URLs. "
            "Run scripts/mirror_project_cover_images.py or set AMP_ALLOW_EXTERNAL_PROJECT_COVERS=1 to override.",
            len(external_project_covers),
        )
        for row in external_project_covers[:20]:
            log.error("  - %s -> %s", row.get("slug"), row.get("cover_image_url"))
        if len(external_project_covers) > 20:
            log.error("  ... and %d more", len(external_project_covers) - 20)
        return 1

    def _slug_set(filename: str) -> set[str]:
        rows = _load_json(input_dir / filename)
        out: set[str] = set()
        for row in rows:
            slug = str(row.get("slug") or "").strip()
            if slug:
                out.add(slug)
        return out

    def _validate_fk_cross_refs() -> list[str]:
        """Optional cross-file FK validation based on JSON slug sets."""
        errs: list[str] = []

        dev_slugs = _slug_set("developers.json")
        area_slugs = _slug_set("areas.json")
        project_slugs = _slug_set("projects.json")

        def _check(label: str, field: str, value: str | None, allowed: set[str]) -> None:
            v = str(value or "").strip()
            if not v:
                return
            if v not in allowed:
                errs.append(f"{label}: {field} slug '{v}' not found in JSON")

        # projects.json references
        if "projects" in steps_to_run:
            rows = _load_json(input_dir / "projects.json")
            for i, row in enumerate(rows, 1):
                label = f"projects[{i}]"
                _check(label, "developer_slug", row.get("developer_slug"), dev_slugs)
                _check(label, "area_slug", row.get("area_slug"), area_slugs)

        # units_* references
        for step_name, filename in (
            ("units_buy", "units_buy.json"),
            ("units_rent", "units_rent.json"),
        ):
            if step_name not in steps_to_run:
                continue
            rows = _load_json(input_dir / filename)
            for i, row in enumerate(rows, 1):
                label = f"{step_name}[{i}]"
                _check(label, "project_slug", row.get("project_slug"), project_slugs)
                _check(label, "developer_slug", row.get("developer_slug"), dev_slugs)
                _check(label, "area_slug", row.get("area_slug"), area_slugs)

        return errs

    log.info("=" * 60)
    log.info("DATA IMPORT — Blueprint Doc 14")
    log.info("Input dir : %s", input_dir.resolve())
    log.info("Dry-run   : %s", dry_run)
    log.info("Steps     : %s", ", ".join(steps_to_run))
    log.info("Validate FK JSON: %s", validate_fk_json)
    log.info(
        "DB        : %s",
        effective_database_url[:50] + "..."
        if len(effective_database_url) > 50
        else effective_database_url,
    )
    log.info("=" * 60)

    if validate_fk_json:
        fk_errs = _validate_fk_cross_refs()
        if fk_errs:
            log.error("Preflight FK(JSON) validation failed — %d error(s):", len(fk_errs))
            for err in fk_errs:
                log.error("  - %s", err)
            return 1

    all_results: list[StepResult] = []

    def _session_factory():
        if args.database_url:
            connect_args = (
                {"check_same_thread": False}
                if str(args.database_url).startswith("sqlite:///")
                else {}
            )
            engine = create_engine(args.database_url, connect_args=connect_args, future=True)
            return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
        if args.db_path:
            db_path = Path(args.db_path).expanduser().resolve()
            database_url = f"sqlite:///{db_path.as_posix()}"
            engine = create_engine(
                database_url, connect_args={"check_same_thread": False}, future=True
            )
            return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
        return SessionLocal

    db = _session_factory()()

    try:
        purge_preview_demo = bool(args.purge_preview_demo) or _normalize_flag(os.environ.get("AMP_PURGE_PREVIEW_DEMO"))
        if purge_preview_demo:
            purged = _purge_preview_demo_rows(db, dry_run=dry_run)
            log.info(
                "Preview demo purge %s — properties=%d projects=%d developers=%d",
                "planned" if dry_run else "applied",
                purged["properties"],
                purged["projects"],
                purged["developers"],
            )

        for step in steps_to_run:
            filename = file_map[step]
            filepath = input_dir / filename
            rows = _load_json(filepath)

            if not rows:
                log.info("[%s] No data found (%s) — skipping", step, filepath.name)
                sr = StepResult(step=step)
                sr.skipped = 1
                all_results.append(sr)
                continue

            log.info("[%s] Loading %d rows from %s ...", step, len(rows), filepath.name)
            t0 = time.perf_counter()

            handler = STEP_HANDLERS[step]
            result = handler(db, rows, dry_run=dry_run)

            elapsed = time.perf_counter() - t0

            if result.errors:
                log.error(
                    "[%s] VALIDATION FAILED — %d error(s):",
                    step,
                    len(result.errors),
                )
                for err in result.errors:
                    log.error("  - %s", err)
                # Rollback this step and stop — FK order means later steps
                # would also fail.
                db.rollback()
                all_results.append(result)
                log.error("Stopping import due to validation errors in step '%s'.", step)
                break
            else:
                log.info(
                    "[%s] OK — inserted=%d  updated=%d  (%.1fs)",
                    step,
                    result.inserted,
                    result.updated,
                    elapsed,
                )
                all_results.append(result)

        # Commit or rollback
        if dry_run:
            db.rollback()
            log.info("DRY-RUN complete — no changes written to DB.")
        else:
            has_errors = any(r.errors for r in all_results)
            if has_errors:
                db.rollback()
                log.warning("Rolled back due to errors.")
            else:
                db.commit()
                log.info("All steps committed successfully.")

    except Exception:
        db.rollback()
        log.exception("Unexpected error during import — rolled back.")
        return 1
    finally:
        db.close()

    # ── Summary ──────────────────────────────────────────────────────
    log.info("")
    log.info("=" * 60)
    log.info("IMPORT SUMMARY")
    log.info("-" * 60)

    total_inserted = 0
    total_updated = 0
    total_errors = 0

    for r in all_results:
        status = "OK" if r.ok else "FAIL"
        if r.skipped:
            status = "SKIP"
        log.info(
            "  %-14s  %s  inserted=%-4d  updated=%-4d  errors=%d",
            r.step,
            status,
            r.inserted,
            r.updated,
            len(r.errors),
        )
        total_inserted += r.inserted
        total_updated += r.updated
        total_errors += len(r.errors)

    log.info("-" * 60)
    log.info(
        "  TOTAL           inserted=%-4d  updated=%-4d  errors=%d",
        total_inserted,
        total_updated,
        total_errors,
    )
    log.info("=" * 60)

    # Write summary JSON
    warning_skipped_steps = _warning_skipped_steps(
        all_results,
        warn_on_optional_skip=bool(args.warn_on_optional_skip),
    )

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ok": total_errors == 0,
        "dry_run": dry_run,
        "input_dir": str(input_dir),
        "steps": [
            {
                "step": r.step,
                "inserted": r.inserted,
                "updated": r.updated,
                "skipped": r.skipped,
                "errors": r.errors,
            }
            for r in all_results
        ],
        "totals": {
            "inserted": total_inserted,
            "updated": total_updated,
            "errors": total_errors,
            "warnings": len(warning_skipped_steps),
            "warning_skipped_steps": warning_skipped_steps,
        },
    }

    if not args.no_write:
        out_path = Path(args.write)
        if not out_path.is_absolute():
            out_path = _PROJECT_ROOT / out_path
        _write_json_with_fallback(
            out_path,
            summary,
            quiet=bool(args.quiet),
            label="Summary",
        )

    coverage_gate_code = 0
    # Auto-generate project cover coverage report after refresh/import cycles.
    # In strict/fail-on-warn mode this becomes a gate.
    try:
        coverage_cmd = [
            sys.executable,
            str(_PROJECT_ROOT / "scripts" / "report_project_cover_coverage.py"),
            "--input-dir",
            str(input_dir),
        ]
        if args.strict:
            coverage_cmd.append("--strict")
        if args.fail_on_warn:
            coverage_cmd.append("--fail-on-warn")
        if args.no_write:
            coverage_cmd.append("--no-write")
        else:
            coverage_cmd.append("--write")

        coverage_proc = subprocess.run(coverage_cmd, check=False)
        coverage_gate_code = int(coverage_proc.returncode)
    except Exception:
        if args.strict or args.fail_on_warn:
            log.exception("B13 coverage gate execution failed.")
            coverage_gate_code = 1

    warnings_count = int(summary.get("totals", {}).get("warnings", 0))
    if args.fail_on_warn and (total_errors > 0 or warnings_count > 0 or coverage_gate_code != 0):
        return 2
    if args.strict and (total_errors > 0 or coverage_gate_code != 0):
        return 1
    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
