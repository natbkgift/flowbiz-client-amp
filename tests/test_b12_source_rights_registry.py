from __future__ import annotations

import json
import sys
from collections.abc import Generator
from pathlib import Path
from uuid import uuid4

import pytest

from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, Project, Property
from packages.core.source_rights_registry import build_source_rights_report


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(MediaAsset).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(MediaAsset).delete()
        db.commit()


def _add_media_asset(
    *,
    storage_path: str,
    source_url: str | None = None,
    source_page_url: str | None = None,
    source_domain: str | None = None,
    source_type: str | None = None,
    rights_status: str | None = None,
    approval_status: str | None = None,
    credit: str | None = None,
    rights_note: str | None = None,
    approval_note: str | None = None,
    is_exception: bool = False,
    exception_reason: str | None = None,
) -> str:
    with SessionLocal() as db:
        row = MediaAsset(
            storage_path=storage_path,
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=128,
            checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
            source_url=source_url,
            source_page_url=source_page_url,
            source_domain=source_domain,
            source_type=source_type,
            rights_status=rights_status,
            approval_status=approval_status,
            credit=credit,
            rights_note=rights_note,
            approval_note=approval_note,
            is_exception=is_exception,
            exception_reason=exception_reason,
            status="active",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return str(row.id)


def test_b12_cli_strict_exit_code_on_error() -> None:
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://market.example/item.jpg",
        source_page_url="https://market.example/item",
        source_domain="market.example",
        source_type="marketplace_exception",
        rights_status="exception_allowed",
        approval_status="pending",
        credit="Market Place",
        rights_note="exception path",
        is_exception=True,
        exception_reason=None,
    )

    from ops import scan_source_rights_registry as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "scan_source_rights_registry.py",
            "--strict",
            "--no-write",
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 1


def test_b12_cli_fail_on_warn_exit_code() -> None:
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://official.example/a.jpg",
        source_page_url="https://official.example/project",
        source_domain="official.example",
        source_type="official",
        rights_status="approved",
        approval_status="approved",
        credit=None,
        rights_note=None,
        approval_note=None,
    )

    from ops import scan_source_rights_registry as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "scan_source_rights_registry.py",
            "--fail-on-warn",
            "--no-write",
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 2


def test_b12_cli_write_json_report(tmp_path: Path) -> None:
    _add_media_asset(storage_path=f"/media/library/{uuid4()}.jpg")

    out = tmp_path / "b12-report.json"
    from ops import scan_source_rights_registry as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "scan_source_rights_registry.py",
            "--write",
            str(out),
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 0
    payload = json.loads(out.read_text(encoding="utf-8"))
    assert "summary" in payload
    assert "findings" in payload


def test_rule_missing_source_metadata() -> None:
    _add_media_asset(storage_path=f"/media/library/{uuid4()}.jpg")

    with SessionLocal() as db:
        report = build_source_rights_report(db)

    categories = {finding.category for finding in report.findings}
    assert "missing_source_metadata" in categories


def test_rule_non_official_source_exception_flag() -> None:
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://archive.example/a.jpg",
        source_page_url="https://archive.example/page",
        source_domain="archive.example",
        source_type="archive",
        rights_status="exception_allowed",
        approval_status="pending",
        credit="Archive",
        rights_note="legacy",
        is_exception=False,
    )

    with SessionLocal() as db:
        report = build_source_rights_report(db)

    categories = {finding.category for finding in report.findings}
    assert "non_official_source_missing_exception_flag" in categories


def test_rule_approval_rights_mismatch() -> None:
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://official.example/b.jpg",
        source_page_url="https://official.example/project",
        source_domain="official.example",
        source_type="official",
        rights_status="pending_review",
        approval_status="approved",
        credit="Official",
        rights_note="pending legal",
    )

    with SessionLocal() as db:
        report = build_source_rights_report(db)

    categories = {finding.category for finding in report.findings}
    assert "approval_rights_mismatch" in categories
