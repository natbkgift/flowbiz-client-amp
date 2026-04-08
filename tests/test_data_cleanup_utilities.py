from __future__ import annotations

from decimal import Decimal
from pathlib import Path

from packages.core.data_cleanup_utilities import (
    apply_property_canonical_legacy_alignment,
    audit_project_missing_publish_fields,
    audit_property_canonical_misalignment,
    audit_property_missing_location_context,
    inspect_property_canonical_alignment,
)
from packages.core.database import SessionLocal, init_db
from packages.core.models import Project, Property
from scripts.cleanup_canonical_field_alignment import run_cleanup


def _make_property(*, suffix: str, **overrides) -> Property:
    payload = {
        "source_id": f"cleanup-src-{suffix}",
        "slug": f"cleanup-{suffix}",
        "title": f"Cleanup {suffix}",
        "type": "new",
        "property_type": "condo",
        "status": "inactive",
        "price": Decimal("2500000"),
        "currency": "THB",
        "address": "Pattaya Sai 2",
        "city": "Pattaya",
    }
    payload.update(overrides)
    return Property(**payload)


def _make_project(*, suffix: str, **overrides) -> Project:
    payload = {
        "slug": f"cleanup-project-{suffix}",
        "name": f"Cleanup Project {suffix}",
        "status": "draft",
        "property_type": "condo",
        "summary": {},
    }
    payload.update(overrides)
    return Project(**payload)


def _clear_tables() -> None:
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.commit()


def _get_property(source_id: str) -> Property:
    with SessionLocal() as db:
        row = db.query(Property).filter(Property.source_id == source_id).one()
        db.expunge(row)
        return row


def _persist_rows(*rows: Project | Property) -> None:
    with SessionLocal() as db:
        for row in rows:
            db.add(row)
        db.commit()


def _read_report(path: Path) -> dict:
    import json

    return json.loads(path.read_text(encoding="utf-8"))


def setup_function() -> None:
    init_db()
    _clear_tables()


def teardown_function() -> None:
    _clear_tables()


def test_property_canonical_alignment_audit_and_apply_are_deterministic() -> None:
    prop = _make_property(
        suffix="misaligned",
        cover_image="/media/library/legacy.jpg",
        cover_image_url=None,
        size=Decimal("45.00"),
        size_sqm=None,
        floor=None,
        floor_number=7,
    )

    changes = inspect_property_canonical_alignment(prop)
    assert set(changes.keys()) == {"cover_image_url", "size_sqm", "floor"}
    assert changes["cover_image_url"]["to"] == "/media/library/legacy.jpg"
    assert changes["size_sqm"]["to"] == "45.00"
    assert changes["floor"]["to"] == 7

    audit = audit_property_canonical_misalignment([prop])
    assert len(audit) == 1
    assert audit[0]["source_id"] == "cleanup-src-misaligned"

    first_apply = apply_property_canonical_legacy_alignment(prop)
    assert first_apply == changes
    assert prop.cover_image_url == "/media/library/legacy.jpg"
    assert prop.size_sqm == Decimal("45.00")
    assert prop.floor == 7

    second_apply = apply_property_canonical_legacy_alignment(prop)
    assert second_apply == {}


def test_audit_project_and_property_readiness_gaps() -> None:
    project = _make_project(
        suffix="incomplete",
        cover_image_url=None,
        hero_image_url=None,
        highlights=[],
        amenities=[],
        investment_snapshot={},
        location={},
        starting_price=None,
    )
    prop_missing_location = _make_property(
        suffix="missing-location",
        address="",
        city="",
        area_id=None,
        project_id=None,
    )

    project_findings = audit_project_missing_publish_fields([project])
    assert len(project_findings) == 1
    assert project_findings[0]["missing"] == [
        "facilities",
        "hero_media",
        "highlights",
        "investment_snapshot.source",
        "investment_snapshot.updated_at",
        "location",
        "starting_price",
        "summary",
    ]

    property_findings = audit_property_missing_location_context([prop_missing_location])
    assert len(property_findings) == 1
    assert property_findings[0]["missing"] == ["location"]


def test_cleanup_canonical_field_alignment_script_reports_and_applies(tmp_path: Path) -> None:
    report_path = tmp_path / "cleanup-report.json"
    misaligned = _make_property(
        suffix="script-misaligned",
        cover_image=None,
        cover_image_url="/media/library/canonical.jpg",
        size=Decimal("52.00"),
        size_sqm=None,
        floor=12,
        floor_number=None,
    )
    aligned = _make_property(
        suffix="script-aligned",
        cover_image="/media/library/aligned.jpg",
        cover_image_url="/media/library/aligned.jpg",
        size=Decimal("40.00"),
        size_sqm=Decimal("40.00"),
        floor=8,
        floor_number=8,
    )
    incomplete_project = _make_project(
        suffix="script-project",
        cover_image_url=None,
        hero_image_url=None,
        highlights=[],
        amenities=[],
        investment_snapshot={},
        location={},
        starting_price=None,
    )
    _persist_rows(misaligned, aligned, incomplete_project)

    dry_run = run_cleanup(apply=False, report_path=report_path)
    assert dry_run["summary"]["properties_scanned"] == 2
    assert dry_run["summary"]["projects_scanned"] == 1
    assert dry_run["summary"]["properties_with_canonical_misalignment"] == 1
    assert dry_run["summary"]["properties_updated"] == 0
    assert len(dry_run["findings"]["project_missing_publish_fields"]) == 1
    assert report_path.exists()

    unchanged = _get_property("cleanup-src-script-misaligned")
    assert unchanged.cover_image == "/media/library/canonical.jpg" or unchanged.cover_image is None
    assert unchanged.floor_number is None

    applied = run_cleanup(apply=True, report_path=report_path)
    assert applied["summary"]["properties_updated"] == 1
    report_body = _read_report(report_path)
    assert report_body["summary"]["properties_updated"] == 1

    updated = _get_property("cleanup-src-script-misaligned")
    assert updated.cover_image == "/media/library/canonical.jpg"
    assert updated.cover_image_url == "/media/library/canonical.jpg"
    assert updated.size == Decimal("52.00")
    assert updated.size_sqm == Decimal("52.00")
    assert updated.floor == 12
    assert updated.floor_number == 12
