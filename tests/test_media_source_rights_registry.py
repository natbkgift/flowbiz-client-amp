from __future__ import annotations

import json
import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.models import MediaAsset, User
from packages.core.source_rights_registry import build_source_rights_report


@pytest.fixture(autouse=True)
def _cleanup_media_assets() -> None:
    init_db()
    with SessionLocal() as db:
        db.query(MediaAsset).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(MediaAsset).delete()
        db.commit()



def _make_admin_headers() -> dict[str, str]:
    init_db()
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}



def _add_media_asset(
    *,
    storage_path: str,
    source_url: str | None = None,
    source_domain: str | None = None,
    source_type: str | None = None,
    rights_status: str | None = None,
    approval_status: str | None = None,
    is_exception: bool = False,
    exception_reason: str | None = None,
) -> str:
    init_db()
    with SessionLocal() as db:
        row = MediaAsset(
            storage_path=storage_path,
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=100,
            checksum_sha256=(str(uuid4()).replace("-", "") + str(uuid4()).replace("-", ""))[:64],
            source_url=source_url,
            source_domain=source_domain,
            source_type=source_type,
            rights_status=rights_status,
            approval_status=approval_status,
            is_exception=is_exception,
            exception_reason=exception_reason,
            status="active",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return str(row.id)



def test_backfill_normalization_from_mapping(tmp_path: Path) -> None:
    init_db()
    storage_path = "/media/project-covers/case-official/cover_abc.jpg"
    _add_media_asset(storage_path=storage_path)

    mapping = [
        {
            "project_slug": "case-official",
            "mirrored_local_path": storage_path,
            "cover_image_url": "https://official.example/cover.jpg",
            "source_page_url": "https://official.example/project",
            "source_domain": "official.example",
            "source_type": "official_project_website",
            "rights_status": "verify_reuse_permission_required",
            "approved_for_seed": True,
            "credit": "Official Example",
            "notes": "Backfill test",
        }
    ]
    mapping_path = tmp_path / "mapping.json"
    mapping_path.write_text(json.dumps(mapping), encoding="utf-8")
    report_path = tmp_path / "backfill_report.json"

    from ops import backfill_source_rights_registry as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "backfill_source_rights_registry.py",
            "--mapping",
            str(mapping_path),
            "--write",
            str(report_path),
            "--apply",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code == 0
    assert report_path.exists()

    with SessionLocal() as db:
        row = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == storage_path))
        assert row is not None
        assert row.source_type == "official"
        assert row.rights_status == "pending_review"
        assert row.approval_status == "pending"
        assert row.source_domain == "official.example"
        assert row.source_page_url == "https://official.example/project"



def test_source_rights_report_summary_and_errors() -> None:
    init_db()
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://official.example/a.jpg",
        source_domain="official.example",
        source_type="official",
        rights_status="approved",
        approval_status="approved",
    )
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://market.example/b.jpg",
        source_domain="market.example",
        source_type="marketplace_exception",
        rights_status="exception_allowed",
        approval_status="pending",
        is_exception=True,
        exception_reason=None,
    )
    _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url=None,
        source_domain=None,
        source_type=None,
        rights_status=None,
        approval_status="pending",
    )

    with SessionLocal() as db:
        report = build_source_rights_report(db, pending_threshold=0)

    assert report.summary.total_media_assets >= 3
    assert report.summary.missing_source_metadata_count >= 1
    assert report.summary.pending_approval_count >= 2
    assert report.summary.exception_count >= 1
    categories = {f.category for f in report.findings}
    assert "marketplace_exception_missing_reason" in categories
    assert "pending_threshold_exceeded" in categories



def test_source_rights_cli_strict_exit_behavior() -> None:
    init_db()
    from ops import scan_source_rights_registry as mod

    original_argv = sys.argv
    try:
        sys.argv = [
            "scan_source_rights_registry.py",
            "--strict",
            "--no-write",
            "--pending-threshold",
            "0",
            "--quiet",
        ]
        exit_code = mod.main()
    finally:
        sys.argv = original_argv

    assert exit_code in {0, 1}



def test_admin_source_rights_patch_and_filters(client: TestClient) -> None:
    media_id = _add_media_asset(
        storage_path=f"/media/library/{uuid4()}.jpg",
        source_url="https://pending.example/item.jpg",
        source_domain="pending.example",
        source_type="unknown",
        rights_status="pending_review",
        approval_status="pending",
    )

    headers = _make_admin_headers()

    patch = client.patch(
        f"/admin/media-assets/{media_id}/source-rights",
        json={
            "source_type": "official_project_website",
            "source_page_url": "https://pending.example/project",
            "rights_status": "approved",
            "approval_status": "approved",
            "credit": "Pending Example",
        },
        headers=headers,
    )
    assert patch.status_code == 200, patch.text
    body = patch.json()
    assert body["source_type"] == "official"
    assert body["approval_status"] == "approved"

    filtered = client.get(
        "/admin/media-assets/source-rights?approval_status=approved&source_type=official",
        headers=headers,
    )
    assert filtered.status_code == 200, filtered.text
    data = filtered.json()["data"]
    assert any(item["id"] == media_id for item in data)



def test_admin_source_rights_report_endpoint(client: TestClient) -> None:
    headers = _make_admin_headers()
    res = client.get("/admin/media-assets/source-rights/report", headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert "summary" in body
    assert "top_domains" in body
