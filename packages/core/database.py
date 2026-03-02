from __future__ import annotations

from collections.abc import Generator
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

def _default_sqlite_path() -> Path:
    app_env = (os.getenv("APP_ENV") or "").strip().lower()
    is_test_env = app_env in {"test", "ci"} or bool(os.getenv("PYTEST_CURRENT_TEST"))
    if is_test_env:
        return Path("test_flowbiz.db").resolve()
    return Path("flowbiz.db").resolve()


DB_PATH = _default_sqlite_path()
DEFAULT_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite://") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def _ensure_sqlite_columns() -> None:
    if not DATABASE_URL.startswith("sqlite://"):
        return

    table_columns = {
        "areas": {
            "summary": "JSON",
            "source_note": "TEXT",
            "cover_image_url": "VARCHAR(500)",
        },
        "developers": {
            "profile": "JSON",
            "source_note": "TEXT",
            "trust_proof": "JSON",
            "cover_image_url": "VARCHAR(500)",
        },
        "inquiries": {
            "follow_up_status": "VARCHAR(32) NOT NULL DEFAULT 'pending'",
            "follow_up_due_at": "DATETIME",
        },
        "seo_page_overrides": {
            "schema_org_url": "VARCHAR(500)",
            "schema_org_logo_url": "VARCHAR(500)",
            "schema_org_same_as": "JSON",
            "schema_local_business_url": "VARCHAR(500)",
            "schema_local_business_phone": "VARCHAR(80)",
            "schema_local_business_price_range": "VARCHAR(120)",
            "schema_local_business_address": "VARCHAR(500)",
            "schema_website_name": "VARCHAR(255)",
            "schema_website_url": "VARCHAR(500)",
            "schema_website_search_path": "VARCHAR(500)",
            "schema_article_author_url": "VARCHAR(500)",
        },
    }

    with engine.begin() as conn:
        for table_name, columns in table_columns.items():
            existing_rows = conn.exec_driver_sql(f"PRAGMA table_info('{table_name}')").fetchall()
            existing = {str(row[1]) for row in existing_rows}
            for column_name, column_ddl in columns.items():
                if column_name in existing:
                    continue
                conn.exec_driver_sql(
                    f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_ddl}"
                )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Import models lazily to avoid circular import at module load time.
    from packages.core import models  # noqa: F401
    from packages.core.auth import hash_password
    from packages.core.models import User

    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()

    with SessionLocal() as db:
        admin = db.query(User).filter(User.email == "admin@local.dev").first()
        if admin is None:
            db.add(
                User(
                    email="admin@local.dev",
                    password_hash=hash_password("admin123"),
                    role="admin",
                )
            )
            db.commit()
