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
import time
from dataclasses import dataclass, field
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path so ``packages.core`` resolves.
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from packages.core.config import settings  # noqa: E402
from packages.core.database import SessionLocal  # noqa: E402
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

        _, is_new = _upsert_by_slug(
            db,
            Developer,
            slug,
            {
                "name": str(row["name"]).strip(),
                "website": str(row.get("website") or "").strip() or None,
                "logo_url": str(row.get("logo_url") or "").strip() or None,
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

        _, is_new = _upsert_by_slug(
            db,
            Area,
            slug,
            {
                "name": str(row["name"]).strip(),
                "city": str(row.get("city") or "Pattaya").strip(),
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

        starting_price = None
        raw_starting_price = row.get("starting_price")
        if raw_starting_price not in (None, ""):
            try:
                starting_price = Decimal(str(raw_starting_price))
            except (InvalidOperation, ValueError):
                result.errors.append(f"{label}: invalid starting_price '{raw_starting_price}'")
                continue

        _, is_new = _upsert_by_slug(
            db,
            Project,
            slug,
            {
                "name": str(row["name"]).strip(),
                "developer_id": developer_id,
                "area_id": area_id,
                "cover_image_url": str(row.get("cover_image_url") or "").strip() or None,
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
        if prop_status not in ("active", "inactive"):
            errs.append(f"{label}: invalid status '{prop_status}' (must be active/inactive)")

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

        values = {
            "title": str(row["title"]).strip(),
            "description": str(row.get("description") or "").strip() or None,
            "type": prop_type,
            "price": price,
            "bedrooms": int(bedrooms) if bedrooms is not None else None,
            "bathrooms": int(bathrooms) if bathrooms is not None else None,
            "size": Decimal(str(size_val)) if size_val is not None else None,
            "address": str(row["address"]).strip(),
            "city": str(row["city"]).strip(),
            "area_id": area_id,
            "developer_id": developer_id,
            "project_id": project_id,
            "slug": str(row.get("slug") or "").strip() or None,
            "status": prop_status,
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
    args = parser.parse_args()

    input_dir = Path(args.input)
    dry_run: bool = args.dry_run
    validate_fk_json: bool = args.validate_fk_json

    if not input_dir.exists():
        log.error("Input directory does not exist: %s", input_dir)
        return 1

    # Safety: refuse production without explicit opt-in
    env = (settings.app_env or "").lower().strip()
    if env in ("prod", "production") and not os.environ.get("AMP_ALLOW_IMPORT", "").strip():
        log.error("Set AMP_ALLOW_IMPORT=1 to run imports when APP_ENV=%s", env)
        return 1

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
    if "projects" in steps_to_run:
        try:
            subprocess.run(
                [
                    sys.executable,
                    str(_PROJECT_ROOT / "scripts" / "mirror_project_cover_images.py"),
                    "--input-dir",
                    str(input_dir),
                    "--skip-local-file-check",
                    "--write-report",
                ],
                check=False,
            )
        except Exception:
            pass

        external_project_covers = _find_external_project_covers(input_dir / "projects.json")
        if external_project_covers and not os.environ.get("AMP_ALLOW_EXTERNAL_PROJECT_COVERS", "").strip():
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
        settings.database_url[:50] + "..."
        if len(settings.database_url) > 50
        else settings.database_url,
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
    db = SessionLocal()

    try:
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
    summary = {
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
        },
    }

    out = Path("output")
    out.mkdir(parents=True, exist_ok=True)
    (out / "import_seed_data.summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Auto-generate project cover coverage report after refresh/import cycles.
    # Non-fatal by design: reporting should not block data import.
    try:
        subprocess.run(
            [
                sys.executable,
                str(_PROJECT_ROOT / "scripts" / "report_project_cover_coverage.py"),
                "--write",
            ],
            check=False,
        )
    except Exception:
        pass

    return 0 if total_errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
