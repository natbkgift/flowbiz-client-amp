from __future__ import annotations

import hashlib
import io
import os
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from packages.core.auth import create_access_token, hash_password
from packages.core.database import SessionLocal
from packages.core.models import Property, PropertyImportAudit, User


def _venv_python() -> str:
    """Return the Python executable from the project venv.

    When pytest is launched via the system Python (not the venv
    interpreter), ``sys.executable`` may point outside the venv, causing
    subprocesses that need venv-installed packages (e.g. alembic) to fail.
    This helper resolves the venv Python reliably.
    """
    venv_dir = Path(__file__).resolve().parent.parent / ".venv"
    if (venv_dir / "Scripts" / "python.exe").exists():
        return str(venv_dir / "Scripts" / "python.exe")
    if (venv_dir / "bin" / "python").exists():
        return str(venv_dir / "bin" / "python")
    return sys.executable


def _make_admin_headers() -> dict[str, str]:
    headers, _email = _make_admin_headers_and_email()
    return headers


def _make_admin_headers_and_email() -> tuple[dict[str, str], str]:
    email = f"admin-{uuid4()}@example.test"
    with SessionLocal() as db:
        db.add(User(email=email, password_hash=hash_password("pw"), role="admin"))
        db.commit()
    token = create_access_token(subject=email, role="admin")
    return {"Authorization": f"Bearer {token}"}, email


def _latest_audit(db) -> PropertyImportAudit | None:
    return db.scalar(
        select(PropertyImportAudit).order_by(
            PropertyImportAudit.created_at.desc(),
            PropertyImportAudit.id.desc(),
        )
    )


def _audit_for_upload(db, *, admin_email: str, file_bytes: bytes) -> PropertyImportAudit | None:
    sha = hashlib.sha256(file_bytes).hexdigest()
    return db.scalar(
        select(PropertyImportAudit)
        .where(PropertyImportAudit.admin_email == admin_email)
        .where(PropertyImportAudit.file_sha256 == sha)
        .order_by(PropertyImportAudit.created_at.desc())
    )


def _csv_bytes(rows: list[dict[str, str]]) -> bytes:
    header = "source_id,title,type,price,address,city,status,bedrooms,bathrooms,size,slug\n"
    buf = io.StringIO()
    buf.write(header)
    for r in rows:
        buf.write(
            "{source_id},{title},{type},{price},{address},{city},{status},{bedrooms},{bathrooms},{size},{slug}\n".format(
                source_id=r.get("source_id", ""),
                title=r.get("title", ""),
                type=r.get("type", ""),
                price=r.get("price", ""),
                address=r.get("address", ""),
                city=r.get("city", ""),
                status=r.get("status", ""),
                bedrooms=r.get("bedrooms", ""),
                bathrooms=r.get("bathrooms", ""),
                size=r.get("size", ""),
                slug=r.get("slug", ""),
            )
        )
    return buf.getvalue().encode("utf-8")


def test_valid_csv_inserts_new_rows(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "123.45",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "1",
                "bathrooms": "1",
                "size": "35.5",
                "slug": "slug-1",
            }
        ]
    )

    headers, admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "false"},
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["inserted"] == 1
    assert body["updated"] == 0
    assert body["total_rows"] == 1
    assert body["dry_run"] is False

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None

        audit = _audit_for_upload(db, admin_email=admin_email, file_bytes=content)
        assert audit is not None
        assert audit.admin_email == admin_email
        assert audit.filename == "props.csv"
        assert audit.file_sha256 == hashlib.sha256(content).hexdigest()
        assert audit.file_size_bytes == len(content)
        assert audit.rows_total == 1
        assert audit.rows_created == 1
        assert audit.rows_updated == 0
        assert audit.rows_errors == 0
        assert str(audit.status) == "success"
        assert audit.dry_run is False
        assert audit.duration_ms > 0
        assert audit.error_summary is None


def test_valid_csv_updates_existing_rows(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=sid,
                title="Old",
                description=None,
                type="new",
                price=100,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=None,
                slug=None,
                status="active",
            )
        )
        db.commit()

    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "NewTitle",
                "type": "resale",
                "price": "999.99",
                "address": "Addr2",
                "city": "City2",
                "status": "inactive",
                "bedrooms": "2",
                "bathrooms": "1",
                "size": "40",
                "slug": "slug-2",
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["inserted"] == 0
    assert body["updated"] == 1

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None
        assert prop.title == "NewTitle"
        assert prop.type == "resale"
        assert str(prop.status) == "inactive"


def test_dry_run_does_not_persist(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "rent",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        params={"dry_run": "true"},
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["dry_run"] is True

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is None

        audit = _audit_for_upload(db, admin_email=_admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "success"
        assert audit.dry_run is True
        assert audit.rows_created == 1
        assert audit.rows_updated == 0
        assert audit.duration_ms > 0


def test_invalid_enum_rejects_entire_import(client: TestClient) -> None:
    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T1",
                "type": "bad",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["inserted"] == 0
    assert body["updated"] == 0
    assert body["errors"]

    with SessionLocal() as db:
        audit = _audit_for_upload(db, admin_email=_admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "partial"
        assert audit.rows_errors > 0
        assert audit.duration_ms > 0


def test_missing_required_column_rejects(client: TestClient) -> None:
    header = "source_id,title,type,price,address,status,bedrooms,bathrooms,size,slug\n"
    content = (header + "a,T,new,1,Addr,active,,,,\n").encode("utf-8")

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_duplicate_source_id_inside_csv_rejects(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            },
            {
                "source_id": sid,
                "title": "T2",
                "type": "new",
                "price": "20",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            },
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_oversized_file_rejected(client: TestClient) -> None:
    content = b"x" * (5 * 1024 * 1024 + 1)
    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == ["File exceeds maximum size limit"]


def test_row_count_gt_5000_rejected(client: TestClient) -> None:
    rows = []
    for i in range(5001):
        rows.append(
            {
                "source_id": f"src-{i}",
                "title": "T",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        )
    content = _csv_bytes(rows)

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]


def test_unauthorized_returns_401_or_403(client: TestClient) -> None:
    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    resp = client.post(
        "/admin/properties/import",
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code in (401, 403)


def test_update_preserves_description_and_images(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    unique_slug = f"slug-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=sid,
                title="Old",
                description="keep-me",
                type="new",
                price=100,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=["img-1", "img-2"],
                slug=None,
                status="active",
            )
        )
        db.commit()

    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "NewTitle",
                "type": "resale",
                "price": "999.99",
                "address": "Addr2",
                "city": "City2",
                "status": "inactive",
                "bedrooms": "2",
                "bathrooms": "1",
                "size": "40",
                "slug": unique_slug,
            }
        ]
    )

    headers, _admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"] == []
    assert body["updated"] == 1

    with SessionLocal() as db:
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None
        assert prop.description == "keep-me"
        assert prop.images == ["img-1", "img-2"]


def test_alembic_migration_aborts_when_duplicate_source_id_exists() -> None:
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        db_path = os.path.join(tmp, "dup_source_id.db")
        db_url = f"sqlite:///{db_path}"

        env = os.environ.copy()
        env["DATABASE_URL"] = db_url

        # Bring schema up to 0002 (no UNIQUE on source_id)
        up_to_0002 = subprocess.run(
            [
                _venv_python(),
                "-m",
                "alembic",
                "-c",
                "alembic.ini",
                "upgrade",
                "0002_properties_company",
            ],
            env=env,
            capture_output=True,
            text=True,
        )
        assert up_to_0002.returncode == 0, up_to_0002.stderr

        import sqlite3
        from uuid import uuid4

        dup_sid = "dup-source-id"
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                INSERT INTO properties (
                    id,
                    source_id,
                    title,
                    description,
                    type,
                    price,
                    bedrooms,
                    bathrooms,
                    size,
                    address,
                    city,
                    images,
                    slug,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    dup_sid,
                    "T1",
                    None,
                    "new",
                    1.0,
                    None,
                    None,
                    None,
                    "A",
                    "C",
                    None,
                    None,
                    "active",
                ),
            )
            conn.execute(
                """
                INSERT INTO properties (
                    id,
                    source_id,
                    title,
                    description,
                    type,
                    price,
                    bedrooms,
                    bathrooms,
                    size,
                    address,
                    city,
                    images,
                    slug,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    dup_sid,
                    "T2",
                    None,
                    "new",
                    2.0,
                    None,
                    None,
                    None,
                    "A",
                    "C",
                    None,
                    None,
                    "active",
                ),
            )
            conn.commit()

        # Upgrade to head should fail at 0003 with a RuntimeError
        upgrade_head = subprocess.run(
            [_venv_python(), "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
            env=env,
            capture_output=True,
            text=True,
        )
        assert upgrade_head.returncode != 0
        assert "Cannot enforce UNIQUE on source_id" in (upgrade_head.stdout + upgrade_head.stderr)


def test_failed_import_still_creates_audit_row(client: TestClient) -> None:
    # Force a DB error by violating the unique slug constraint.
    existing_slug = f"dup-slug-{uuid4()}"
    with SessionLocal() as db:
        db.add(
            Property(
                source_id=f"src-{uuid4()}",
                title="Existing",
                description=None,
                type="new",
                price=1,
                bedrooms=None,
                bathrooms=None,
                size=None,
                address="Addr",
                city="City",
                images=None,
                slug=existing_slug,
                status="active",
            )
        )
        db.commit()

    content = _csv_bytes(
        [
            {
                "source_id": f"src-{uuid4()}",
                "title": "T1",
                "type": "new",
                "price": "10",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": existing_slug,
            }
        ]
    )

    headers, admin_email = _make_admin_headers_and_email()
    resp = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["errors"]

    with SessionLocal() as db:
        audit = _audit_for_upload(db, admin_email=admin_email, file_bytes=content)
        assert audit is not None
        assert str(audit.status) == "failed"
        assert audit.rows_errors > 0
        assert audit.duration_ms > 0


def test_duplicate_file_sha256_allowed_and_detectable(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": f"slug-{uuid4()}",
            }
        ]
    )

    headers, admin_email = _make_admin_headers_and_email()
    resp1 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp1.status_code == 200

    resp2 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert resp2.status_code == 409
    body2 = resp2.json()
    assert body2["errors"] == ["File already imported successfully"]
    assert body2["inserted"] == 0
    assert body2["updated"] == 0
    assert body2["total_rows"] == 0

    sha = hashlib.sha256(content).hexdigest()
    with SessionLocal() as db:
        count = db.scalar(
            select(func.count())
            .select_from(PropertyImportAudit)
            .where(PropertyImportAudit.admin_email == admin_email)
            .where(PropertyImportAudit.file_sha256 == sha)
            .where(PropertyImportAudit.status == "success")
        )
        assert count == 1


def test_import_idempotency_conflict(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    content = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": f"slug-{uuid4()}",
            }
        ]
    )

    headers = _make_admin_headers()
    r1 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert r1.status_code == 200

    r2 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", content, "text/csv")},
    )
    assert r2.status_code == 409


def test_on_conflict_upsert_no_duplicate_rows(client: TestClient) -> None:
    sid = f"src-{uuid4()}"
    headers = _make_admin_headers()

    c1 = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T1",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": f"slug-{uuid4()}",
            }
        ]
    )
    r1 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", c1, "text/csv")},
    )
    assert r1.status_code == 200

    c2 = _csv_bytes(
        [
            {
                "source_id": sid,
                "title": "T2",
                "type": "resale",
                "price": "2",
                "address": "A2",
                "city": "C2",
                "status": "inactive",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": f"slug-{uuid4()}",
            }
        ]
    )
    r2 = client.post(
        "/admin/properties/import",
        headers=headers,
        files={"file": ("props.csv", c2, "text/csv")},
    )
    assert r2.status_code == 200

    with SessionLocal() as db:
        count = db.scalar(
            select(func.count()).select_from(Property).where(Property.source_id == sid)
        )
        assert count == 1
        prop = db.scalar(select(Property).where(Property.source_id == sid))
        assert prop is not None
        assert prop.title == "T2"


def test_concurrent_import_lock() -> None:
    from apps.api.main import app

    finish_order: list[str] = []
    finish_lock = threading.Lock()

    headers = _make_admin_headers()

    rows_t1 = [
        {
            "source_id": f"src-t1-{i}-{uuid4()}",
            "title": "T",
            "type": "new",
            "price": "1",
            "address": "A",
            "city": "C",
            "status": "active",
            "bedrooms": "",
            "bathrooms": "",
            "size": "",
            "slug": "",
        }
        for i in range(5000)
    ]
    content_t1 = _csv_bytes(rows_t1)

    content_t2 = _csv_bytes(
        [
            {
                "source_id": f"src-t2-{uuid4()}",
                "title": "T",
                "type": "new",
                "price": "1",
                "address": "A",
                "city": "C",
                "status": "active",
                "bedrooms": "",
                "bathrooms": "",
                "size": "",
                "slug": "",
            }
        ]
    )

    def run_import(content: bytes, out: dict, key: str) -> None:
        with TestClient(app) as c:
            resp = c.post(
                "/admin/properties/import",
                headers=headers,
                files={"file": (f"{key}.csv", content, "text/csv")},
            )
            out[key] = {
                "status": resp.status_code,
            }

        with finish_lock:
            finish_order.append(key)

    results: dict[str, dict] = {}
    t1_started = threading.Event()

    def t1_target() -> None:
        t1_started.set()
        run_import(content_t1, results, "t1")

    t1 = threading.Thread(target=t1_target)
    t2 = threading.Thread(target=run_import, args=(content_t2, results, "t2"))

    t1.start()
    assert t1_started.wait(timeout=5), "t1 failed to start within timeout"
    time.sleep(0.05)  # brief pause so t1 can acquire the import lock before t2
    t2.start()
    t1.join()
    t2.join()

    assert results["t1"]["status"] == 200
    assert results["t2"]["status"] == 200
    # With a global lock, t2 (tiny import) should not complete before t1 (large import).
    assert finish_order == ["t1", "t2"]


def test_sha_unique_constraint_db_level() -> None:
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        db_path = os.path.join(tmp, "sha_unique.db")
        db_url = f"sqlite:///{db_path}"

        env = os.environ.copy()
        env["DATABASE_URL"] = db_url

        up = subprocess.run(
            [_venv_python(), "-m", "alembic", "-c", "alembic.ini", "upgrade", "head"],
            env=env,
            capture_output=True,
            text=True,
        )
        assert up.returncode == 0, up.stderr

        import sqlite3
        from uuid import uuid4

        sha = "deadbeef" * 8
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                INSERT INTO property_import_audits (
                    id, admin_email, filename, file_sha256, file_size_bytes,
                    rows_total, rows_created, rows_updated, rows_errors,
                    dry_run, status, duration_ms, error_summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid4()),
                    "a@example.test",
                    "f.csv",
                    sha,
                    1,
                    1,
                    1,
                    0,
                    0,
                    0,
                    "success",
                    1,
                    None,
                ),
            )
            conn.commit()

            try:
                conn.execute(
                    """
                    INSERT INTO property_import_audits (
                        id, admin_email, filename, file_sha256, file_size_bytes,
                        rows_total, rows_created, rows_updated, rows_errors,
                        dry_run, status, duration_ms, error_summary
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid4()),
                        "b@example.test",
                        "f.csv",
                        sha,
                        1,
                        1,
                        1,
                        0,
                        0,
                        0,
                        "success",
                        1,
                        None,
                    ),
                )
                conn.commit()
                raise AssertionError("Expected unique constraint failure")
            except sqlite3.IntegrityError:
                pass
