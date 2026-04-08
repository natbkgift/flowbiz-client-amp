from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from sqlalchemy import select

from packages.core.data_cleanup_utilities import (
    apply_property_canonical_legacy_alignment,
    audit_project_missing_publish_fields,
    audit_property_canonical_misalignment,
    audit_property_missing_location_context,
)
from packages.core.database import SessionLocal, init_db
from packages.core.models import Project, Property

_DEFAULT_REPORT_PATH = Path("ops/logs/cleanup_canonical_field_alignment_report.json")


def run_cleanup(*, apply: bool, report_path: str | Path = _DEFAULT_REPORT_PATH) -> dict[str, Any]:
    init_db()
    with SessionLocal() as db:
        properties = db.scalars(
            select(Property)
            .where(Property.deleted_at.is_(None))
            .order_by(Property.created_at.asc(), Property.id.asc())
        ).all()
        projects = db.scalars(
            select(Project)
            .where(Project.deleted_at.is_(None))
            .order_by(Project.created_at.asc(), Project.id.asc())
        ).all()

        property_alignment_findings = audit_property_canonical_misalignment(properties)
        property_location_findings = audit_property_missing_location_context(properties)
        project_publish_findings = audit_project_missing_publish_fields(projects)

        updated = 0
        if apply:
            for prop in properties:
                changes = apply_property_canonical_legacy_alignment(prop)
                if not changes:
                    continue
                updated += 1
                db.add(prop)
            if updated:
                db.commit()

    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "apply": apply,
        "summary": {
            "properties_scanned": len(properties),
            "projects_scanned": len(projects),
            "properties_with_canonical_misalignment": len(property_alignment_findings),
            "properties_missing_location_context": len(property_location_findings),
            "projects_missing_publish_fields": len(project_publish_findings),
            "properties_updated": updated,
        },
        "findings": {
            "property_canonical_misalignment": property_alignment_findings,
            "property_missing_location_context": property_location_findings,
            "project_missing_publish_fields": project_publish_findings,
        },
    }

    output_path = Path(report_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    mode = "APPLY" if apply else "DRY-RUN"
    print(
        f"[{mode}] properties={len(properties)} misaligned={len(property_alignment_findings)} "
        f"updated={updated} report={output_path}"
    )
    if not apply:
        print("Use --apply to persist canonical alignment updates.")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit and optionally align legacy property fields to canonical storage."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist canonical alignment updates (default: dry-run audit only).",
    )
    parser.add_argument(
        "--report",
        default=str(_DEFAULT_REPORT_PATH),
        help="Write JSON report to this path.",
    )
    args = parser.parse_args()
    run_cleanup(apply=args.apply, report_path=args.report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
