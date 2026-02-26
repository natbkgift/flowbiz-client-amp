"""
B2 — Media Integrity Scanner tests.

Covers:
  - GET /admin/media-assets/integrity-report (API endpoint)
  - run_scan() direct unit tests
  - External leakage detection in entity image fields
  - Missing local file detection (entity refs)
  - Invalid storage_path in media_assets
  - Missing file for a registered media asset
  - CLI strict-mode exit codes (via mocked run_scan)
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.media_integrity import (
    SEVERITY_ERROR,
    SEVERITY_INFO,
    SEVERITY_WARN,
    IntegrityReport,
    IntegritySummary,
    run_scan,
)
from packages.core.models import MediaAsset, Property, User

_ONE_BY_ONE_PNG = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0bIDAT\x08\xd7c\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\xb1"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid.uuid4()}@b2test.example"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _set_test_media_dir(tmp_path: Path) -> None:
    target = tmp_path / "media"
    target.mkdir(parents=True, exist_ok=True)
    settings.media_storage_dir = str(target)


def _make_property(extra: dict | None = None) -> Property:
    """Return an unsaved Property with enough required fields for tests."""
    token = str(uuid.uuid4())[:8]
    defaults: dict = {
        "source_id": f"src-b2-{token}",
        "title": f"B2 Test Property {token}",
        "description": None,
        "type": "new",
        "price": Decimal("1000000.00"),
        "bedrooms": 1,
        "bathrooms": 1,
        "size": Decimal("30.00"),
        "address": "1 Test Rd",
        "city": "Pattaya",
        "slug": f"b2-prop-{token}",
        "status": "active",
        "images": None,
        "local_images": None,
        "cover_image": None,
        "cover_image_url": None,
    }
    if extra:
        defaults.update(extra)
    return Property(**defaults)


def _make_media_asset(storage_path: str, size: int = 1) -> MediaAsset:
    return MediaAsset(
        storage_path=storage_path,
        kind="image",
        mime_type="image/png",
        file_size_bytes=size,
        checksum_sha256="aabbccdd" + str(uuid.uuid4()).replace("-", "")[:54],
        status="active",
    )


# ---------------------------------------------------------------------------
# 1. Endpoint: clean DB — no errors
# ---------------------------------------------------------------------------


def test_integrity_report_endpoint_clean_db(client: TestClient, tmp_path: Path) -> None:
    """GET /admin/media-assets/integrity-report returns 200 with valid schema on empty DB."""
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert "summary" in body
    assert "findings" in body
    assert isinstance(body["findings"], list)
    # A fresh/clean test DB should have no errors
    assert body["summary"]["error_count"] == 0


# ---------------------------------------------------------------------------
# 2. External leakage detection via API (property.cover_image = http://...)
# ---------------------------------------------------------------------------


def test_integrity_detects_external_leakage_property_cover(
    client: TestClient, tmp_path: Path
) -> None:
    """Property with external http:// cover_image is reported as external_leakage error/warn."""
    _set_test_media_dir(tmp_path)

    with SessionLocal() as db:
        prop = _make_property({"cover_image": "https://cdn.hotlink.invalid/photo.jpg"})
        db.add(prop)
        db.commit()

    headers = _make_admin_headers()
    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    categories = [f["category"] for f in body["findings"]]
    assert "external_leakage" in categories, body["findings"]

    leak = next(f for f in body["findings"] if f["category"] == "external_leakage")
    assert "cover_image" in leak["entity"]
    assert "cdn.hotlink.invalid" in leak["value"]


# ---------------------------------------------------------------------------
# 3. Missing local file via entity image field
# ---------------------------------------------------------------------------


def test_integrity_detects_missing_local_file_in_property(
    client: TestClient, tmp_path: Path
) -> None:
    """Property with /media/nonexistent.jpg is reported as missing_local_file error."""
    _set_test_media_dir(tmp_path)
    # Do NOT create the file — it should be reported as missing

    with SessionLocal() as db:
        prop = _make_property(
            {
                "cover_image": "/media/library/does-not-exist.jpg",
            }
        )
        db.add(prop)
        db.commit()

    headers = _make_admin_headers()
    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    categories = [f["category"] for f in body["findings"]]
    assert "missing_local_file" in categories, body["findings"]

    finding = next(f for f in body["findings"] if f["category"] == "missing_local_file")
    assert "does-not-exist.jpg" in finding["value"]
    assert finding["severity"] == "error"


# ---------------------------------------------------------------------------
# 4. Valid local file — no missing_local_file finding
# ---------------------------------------------------------------------------


def test_integrity_no_error_for_valid_local_file(
    client: TestClient, tmp_path: Path
) -> None:
    """Property with /media/... path where file EXISTS is not reported as missing."""
    _set_test_media_dir(tmp_path)

    # Create dummy file in the media dir
    media_root = Path(settings.media_storage_dir)
    (media_root / "library").mkdir(parents=True, exist_ok=True)
    test_file = media_root / "library" / "validfile.jpg"
    test_file.write_bytes(b"fake-image-data")

    with SessionLocal() as db:
        prop = _make_property({"cover_image": "/media/library/validfile.jpg"})
        db.add(prop)
        db.commit()

    headers = _make_admin_headers()
    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    # No missing_local_file for this file
    missing = [
        f for f in body["findings"]
        if f["category"] == "missing_local_file" and "validfile.jpg" in f["value"]
    ]
    assert missing == [], missing


# ---------------------------------------------------------------------------
# 5. MediaAsset with external URL storage_path
# ---------------------------------------------------------------------------


def test_integrity_detects_invalid_storage_path_in_media_asset(
    client: TestClient, tmp_path: Path
) -> None:
    """MediaAsset where storage_path is an external URL is invalid_path_format error."""
    _set_test_media_dir(tmp_path)

    with SessionLocal() as db:
        bad = _make_media_asset("https://cdn.external.invalid/img.jpg", size=1024)
        db.add(bad)
        db.commit()

    headers = _make_admin_headers()
    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    categories = [f["category"] for f in body["findings"]]
    assert "invalid_path_format" in categories or "external_leakage" in categories, body["findings"]

    # error_count must be non-zero
    assert body["summary"]["error_count"] > 0


# ---------------------------------------------------------------------------
# 6. MediaAsset with valid /media/ path but file missing on disk
# ---------------------------------------------------------------------------


def test_integrity_detects_missing_file_for_media_asset(
    client: TestClient, tmp_path: Path
) -> None:
    """MediaAsset with /media/... path but missing disk file is reported as missing_file error."""
    _set_test_media_dir(tmp_path)
    # Do NOT create the file on disk

    with SessionLocal() as db:
        asset = _make_media_asset("/media/library/ghost-file.png", size=512)
        db.add(asset)
        db.commit()

    headers = _make_admin_headers()
    resp = client.get("/admin/media-assets/integrity-report", headers=headers)
    assert resp.status_code == 200

    body = resp.json()
    categories = [f["category"] for f in body["findings"]]
    assert "missing_file" in categories, body["findings"]

    finding = next(f for f in body["findings"] if f["category"] == "missing_file")
    assert "ghost-file" in finding["value"]
    assert finding["severity"] == "error"


# ---------------------------------------------------------------------------
# 7. Unit test: run_scan on isolated DB session
# ---------------------------------------------------------------------------


def test_run_scan_returns_integrity_report(tmp_path: Path) -> None:
    """run_scan() returns an IntegrityReport with valid summary structure."""
    _set_test_media_dir(tmp_path)

    with SessionLocal() as db:
        report = run_scan(db)

    assert isinstance(report, IntegrityReport)
    assert isinstance(report.summary, IntegritySummary)
    assert report.summary.error_count >= 0
    assert isinstance(report.findings, list)
    assert report.summary.scanned_at != ""


# ---------------------------------------------------------------------------
# 8. CLI strict-mode exit code
# ---------------------------------------------------------------------------


def test_cli_strict_mode_exits_nonzero_on_errors(tmp_path: Path) -> None:
    """--strict causes exit code 1 when errors exist."""
    _set_test_media_dir(tmp_path)

    # Build a report with one error finding
    from packages.core.media_integrity import IntegrityFinding

    report = IntegrityReport()
    report.add(
        IntegrityFinding(
            severity=SEVERITY_ERROR,
            category="missing_file",
            entity="media_assets.storage_path",
            record_id="test-id",
            value="/media/ghost.jpg",
            detail="Test error",
        )
    )

    with patch("ops.scan_media_integrity.run_scan", return_value=report):
        with patch("ops.scan_media_integrity.SessionLocal") as mock_sl:
            mock_sl.return_value.__enter__ = MagicMock(return_value=MagicMock())
            mock_sl.return_value.__exit__ = MagicMock(return_value=False)

            from ops.scan_media_integrity import main

            exit_code = main(["--strict", "--no-write", "--quiet"])
            assert exit_code == 1


def test_cli_fail_on_warn_exits_2_on_warnings(tmp_path: Path) -> None:
    """--fail-on-warn causes exit code 2 when only warnings exist."""
    _set_test_media_dir(tmp_path)

    from packages.core.media_integrity import IntegrityFinding

    report = IntegrityReport()
    report.add(
        IntegrityFinding(
            severity=SEVERITY_WARN,
            category="duplicate_checksum",
            entity="media_assets.checksum_sha256",
            record_id="id1,id2",
            value="deadbeef",
            detail="2 assets share this checksum",
        )
    )

    with patch("ops.scan_media_integrity.run_scan", return_value=report):
        with patch("ops.scan_media_integrity.SessionLocal") as mock_sl:
            mock_sl.return_value.__enter__ = MagicMock(return_value=MagicMock())
            mock_sl.return_value.__exit__ = MagicMock(return_value=False)

            from ops.scan_media_integrity import main

            exit_code = main(["--fail-on-warn", "--no-write", "--quiet"])
            assert exit_code == 2


def test_cli_clean_exits_zero(tmp_path: Path) -> None:
    """Clean report with no findings exits 0 even with --strict."""
    _set_test_media_dir(tmp_path)

    report = IntegrityReport()  # no findings

    with patch("ops.scan_media_integrity.run_scan", return_value=report):
        with patch("ops.scan_media_integrity.SessionLocal") as mock_sl:
            mock_sl.return_value.__enter__ = MagicMock(return_value=MagicMock())
            mock_sl.return_value.__exit__ = MagicMock(return_value=False)

            from ops.scan_media_integrity import main

            exit_code = main(["--strict", "--fail-on-warn", "--no-write", "--quiet"])
            assert exit_code == 0


# ---------------------------------------------------------------------------
# 9. Integrity report requires auth
# ---------------------------------------------------------------------------


def test_integrity_report_requires_auth(client: TestClient) -> None:
    """/admin/media-assets/integrity-report requires authentication."""
    resp = client.get("/admin/media-assets/integrity-report")
    assert resp.status_code in {401, 403, 422}
