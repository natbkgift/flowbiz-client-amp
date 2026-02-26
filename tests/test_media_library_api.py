from __future__ import annotations

from decimal import Decimal
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from packages.core.auth import create_access_token, hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal
from packages.core.models import Property, User

_ONE_BY_ONE_PNG = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0bIDAT\x08\xd7c\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\xb1"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _make_admin_headers() -> dict[str, str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}


def _set_test_media_dir(tmp_path: Path) -> None:
    target = tmp_path / "media"
    target.mkdir(parents=True, exist_ok=True)
    settings.media_storage_dir = str(target)


def test_admin_upload_media_asset_success(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    media_root = Path(settings.media_storage_dir)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/upload",
        files={"file": ("tiny.png", _ONE_BY_ONE_PNG, "image/png")},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["item"]["storage_path"].startswith("/media/")
    assert body["item"]["mime_type"] == "image/png"
    assert body["deduped"] is False

    # Local persistence proof
    stored_rel = body["item"]["storage_path"].removeprefix("/media/")
    stored_file = media_root / stored_rel
    assert stored_file.exists()
    assert stored_file.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def test_admin_upload_media_asset_rejects_non_image(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/upload",
        files={"file": ("bad.txt", b"not-an-image", "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 415


def test_media_metadata_update_and_archive_restore(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    upload = client.post(
        "/admin/media-assets/upload",
        files={"file": ("tiny.png", _ONE_BY_ONE_PNG, "image/png")},
        headers=headers,
    )
    media_id = upload.json()["item"]["id"]

    patch = client.patch(
        f"/admin/media-assets/{media_id}",
        json={
            "title": "Lobby photo",
            "alt_text_en": "Project lobby",
            "alt_text_th": "ล็อบบี้โครงการ",
            "caption_en": "Main lobby",
            "caption_th": "โถงต้อนรับ",
            "tags": ["lobby", "project"],
            "source_url": "https://example.com/original.jpg",
            "source_type": "owner_upload",
            "rights_status": "licensed",
            "credit": "AMP Team",
        },
        headers=headers,
    )
    assert patch.status_code == 200, patch.text
    data = patch.json()
    assert data["title"] == "Lobby photo"
    assert data["source_domain"] == "example.com"

    archive = client.post(f"/admin/media-assets/{media_id}/archive", headers=headers)
    assert archive.status_code == 200
    assert archive.json()["status"] == "archived"

    restore = client.post(f"/admin/media-assets/{media_id}/restore", headers=headers)
    assert restore.status_code == 200
    assert restore.json()["status"] == "active"


def test_media_assign_to_property_flow(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    token = str(uuid4())
    source_id = f"src-{token}"

    with SessionLocal() as db:
        db.add(
            Property(
                source_id=source_id,
                    title=f"Test Property {token}",
                description=None,
                type="new",
                price=Decimal("3500000.00"),
                bedrooms=1,
                bathrooms=1,
                size=Decimal("32.00"),
                address="123 Test St",
                city="Pattaya",
                images=None,
                slug=f"prop-{token}",
                status="active",
            )
        )
        db.commit()

    upload = client.post(
        "/admin/media-assets/upload",
        files={"file": ("tiny.png", _ONE_BY_ONE_PNG, "image/png")},
        headers=headers,
    )
    assert upload.status_code == 201, upload.text
    item = upload.json()["item"]

    assign = client.post(
        f"/admin/media-assets/{item['id']}/assign/property",
        json={
            "property_source_id": source_id,
            "set_as_cover": True,
            "append_to_local_images": True,
        },
        headers=headers,
    )
    assert assign.status_code == 200, assign.text
    assigned_path = assign.json()["assigned_path"]
    assert assigned_path.startswith("/media/")

    public = client.get(f"/v1/properties?search={token}")
    assert public.status_code == 200
    rows = public.json()["data"]
    assert len(rows) == 1
    assert rows[0]["cover_image"] == assigned_path
    assert assigned_path in (rows[0]["local_images"] or [])


def test_ingest_url_rejects_localhost(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/ingest-url",
        json={"source_url": "http://localhost/image.png"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "host is not allowed" in resp.text


def test_ingest_url_rejects_loopback_ip(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/ingest-url",
        json={"source_url": "http://127.0.0.1/image.png"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "host is not allowed" in resp.text


def test_ingest_url_rejects_private_ip(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/ingest-url",
        json={"source_url": "http://192.168.1.7/image.png"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "host is not allowed" in resp.text


def test_ingest_url_rejects_invalid_scheme(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    resp = client.post(
        "/admin/media-assets/ingest-url",
        json={"source_url": "ftp://example.com/image.png"},
        headers=headers,
    )
    assert resp.status_code == 422


def test_ingest_url_accepts_public_https_with_mock(client: TestClient, tmp_path: Path) -> None:
    _set_test_media_dir(tmp_path)
    headers = _make_admin_headers()

    class _DummyResponse:
        def __init__(self) -> None:
            self.headers = {"Content-Type": "image/png"}

        def read(self, _max_bytes: int) -> bytes:
            return _ONE_BY_ONE_PNG

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb) -> bool:
            return False

    class _DummyOpener:
        def open(self, _req, timeout: int = 20):
            return _DummyResponse()

    with patch(
        "packages.core.media_storage.socket.getaddrinfo",
        return_value=[(2, 1, 6, "", ("93.184.216.34", 443))],
    ), patch(
        "packages.core.media_storage.build_opener",
        return_value=_DummyOpener(),
    ):
        resp = client.post(
            "/admin/media-assets/ingest-url",
            json={"source_url": "https://example.com/image.png"},
            headers=headers,
        )

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["item"]["storage_path"].startswith("/media/")
    assert body["item"]["source_url"].startswith("https://example.com/")
