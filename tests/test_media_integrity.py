from __future__ import annotations

import hashlib
from collections.abc import Generator
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal, init_db
from packages.core.media_integrity import (
    SEVERITY_ERROR,
    SEVERITY_WARN,
    IntegrityFinding,
    IntegrityReport,
    run_scan,
)
from packages.core.models import Area, Developer, MediaAsset, Project, Property, TeamMember, User


@pytest.fixture(autouse=True)
def _cleanup_tables() -> Generator[None, None, None]:
    init_db()
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(TeamMember).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()
    yield
    with SessionLocal() as db:
        db.query(Property).delete()
        db.query(Project).delete()
        db.query(Area).delete()
        db.query(Developer).delete()
        db.query(TeamMember).delete()
        db.query(MediaAsset).delete()
        db.query(User).delete()
        db.commit()


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _make_property(*, cover_image: str | None, local_images: list[str] | None) -> Property:
    token = str(uuid4())[:8]
    return Property(
        source_id=f"src-b2-{token}",
        slug=f"b2-prop-{token}",
        title=f"B2 Property {token}",
        description=None,
        type="new",
        property_type="condo",
        status="active",
        price=Decimal("1234567.00"),
        currency="THB",
        bedrooms=1,
        bathrooms=1,
        size=Decimal("30.00"),
        size_sqm=Decimal("30.00"),
        address="1 Test Road",
        city="Pattaya",
        cover_image=cover_image,
        cover_image_url=cover_image,
        local_images=local_images,
        images=local_images,
    )


def test_integrity_report_requires_auth(client: TestClient) -> None:
    response = client.get("/admin/media/integrity-report")
    assert response.status_code in {401, 403, 422}


def test_integrity_report_endpoint_returns_shape(client: TestClient, tmp_path: Path) -> None:
    headers = _make_admin_headers()
    media_root = tmp_path / "media"
    media_root.mkdir(parents=True, exist_ok=True)

    response = client.get(
        f"/admin/media/integrity-report?media_root={media_root.as_posix()}&orphan_sample_limit=5",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert "summary" in payload
    assert "findings" in payload
    assert isinstance(payload["findings"], list)


def test_run_scan_detects_checksum_mismatch(tmp_path: Path) -> None:
    media_root = tmp_path / "media"
    target = media_root / "library" / f"{uuid4()}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = b"checksum-mismatch"
    target.write_bytes(payload)
    real_checksum = hashlib.sha256(payload).hexdigest()
    wrong_checksum = ("0" * 63) + ("1" if real_checksum[-1] != "1" else "2")

    with SessionLocal() as db:
        asset = MediaAsset(
            storage_path=f"/media/library/{target.name}",
            kind="image",
            mime_type="image/png",
            file_size_bytes=len(payload),
            checksum_sha256=wrong_checksum,
            status="active",
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

        report = run_scan(db, media_root=media_root, media_public_prefix="/media")
        finding = next(
            (
                item
                for item in report.findings
                if item.category == "checksum_mismatch" and item.value.endswith(target.name)
            ),
            None,
        )

    assert finding is not None
    assert report.summary.checksum_mismatch_count >= 1


def test_run_scan_detects_external_leakage_and_missing_local_file(tmp_path: Path) -> None:
    media_root = tmp_path / "media"
    media_root.mkdir(parents=True, exist_ok=True)

    missing_path = f"/media/library/missing-{uuid4()}.jpg"
    with SessionLocal() as db:
        prop = _make_property(
            cover_image="https://cdn.example.test/hotlink.jpg",
            local_images=[missing_path],
        )
        db.add(prop)
        db.commit()
        source_id = prop.source_id

        report = run_scan(db, media_root=media_root, media_public_prefix="/media")

    leak = next(
        (
            item
            for item in report.findings
            if item.category == "external_leakage"
            and item.record_id == source_id
            and item.entity == "properties.cover_image"
        ),
        None,
    )
    missing = next(
        (
            item
            for item in report.findings
            if item.category == "missing_local_file"
            and item.record_id == source_id
            and item.value == missing_path
        ),
        None,
    )
    assert leak is not None
    assert missing is not None


def test_run_scan_flags_invalid_media_asset_storage_path(tmp_path: Path) -> None:
    media_root = tmp_path / "media"
    media_root.mkdir(parents=True, exist_ok=True)

    with SessionLocal() as db:
        asset = MediaAsset(
            storage_path="library/not-prefixed.jpg",
            kind="image",
            mime_type="image/jpeg",
            file_size_bytes=123,
            checksum_sha256="a" * 64,
            status="active",
        )
        db.add(asset)
        db.commit()

        report = run_scan(db, media_root=media_root, media_public_prefix="/media")

    finding = next(
        (
            item
            for item in report.findings
            if item.category == "invalid_path_format"
            and item.entity == "media_assets.storage_path"
            and item.value == "library/not-prefixed.jpg"
        ),
        None,
    )
    assert finding is not None
    assert report.summary.invalid_path_format_count >= 1


def test_run_scan_detects_orphan_files(tmp_path: Path) -> None:
    media_root = tmp_path / "media"
    orphan = media_root / "library" / f"orphan-{uuid4()}.jpg"
    orphan.parent.mkdir(parents=True, exist_ok=True)
    orphan.write_bytes(b"orphan")

    with SessionLocal() as db:
        report = run_scan(db, media_root=media_root, media_public_prefix="/media")

    assert report.summary.orphan_file_count >= 1
    orphan_finding = next((item for item in report.findings if item.category == "orphan_file"), None)
    assert orphan_finding is not None
    assert orphan_finding.severity == SEVERITY_WARN
    assert orphan_finding.suggestion is not None


def test_run_scan_detects_duplicate_checksum_groups(tmp_path: Path) -> None:
    media_root = tmp_path / "media"
    payload = b"same-bytes"
    first = media_root / "library" / f"{uuid4()}.jpg"
    second = media_root / "library" / f"{uuid4()}.jpg"
    first.parent.mkdir(parents=True, exist_ok=True)
    first.write_bytes(payload)
    second.write_bytes(payload)
    checksum = hashlib.sha256(payload).hexdigest()

    with SessionLocal() as db:
        db.add_all(
            [
                MediaAsset(
                    storage_path=f"/media/library/{first.name}",
                    kind="image",
                    mime_type="image/jpeg",
                    file_size_bytes=len(payload),
                    checksum_sha256=checksum,
                    status="active",
                ),
                MediaAsset(
                    storage_path=f"/media/library/{second.name}",
                    kind="image",
                    mime_type="image/jpeg",
                    file_size_bytes=len(payload),
                    checksum_sha256=checksum,
                    status="active",
                ),
            ]
        )
        db.commit()

        report = run_scan(db, media_root=media_root, media_public_prefix="/media")

    finding = next((item for item in report.findings if item.category == "duplicate_checksum"), None)
    assert finding is not None
    assert finding.severity == SEVERITY_WARN
    assert report.summary.duplicate_checksum_groups >= 1


def test_cli_strict_exits_nonzero_on_errors() -> None:
    report = IntegrityReport()
    report.add(
        IntegrityFinding(
            severity=SEVERITY_ERROR,
            category="missing_file",
            entity="media_assets.storage_path",
            record_id="test-id",
            value="/media/library/ghost.jpg",
        )
    )
    with patch("ops.scan_media_integrity._scan_with_default_session", return_value=report):
        from ops.scan_media_integrity import main

        code = main(["--strict", "--no-write", "--quiet"])
    assert code == 1


def test_cli_fail_on_warn_exits_2() -> None:
    report = IntegrityReport()
    report.add(
        IntegrityFinding(
            severity=SEVERITY_WARN,
            category="orphan_file",
            entity="filesystem.media",
            record_id="orphan.jpg",
            value="/media/library/orphan.jpg",
        )
    )
    with patch("ops.scan_media_integrity._scan_with_default_session", return_value=report):
        from ops.scan_media_integrity import main

        code = main(["--fail-on-warn", "--no-write", "--quiet"])
    assert code == 2
