from __future__ import annotations

from collections.abc import Generator
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DB_PATH = Path("test_flowbiz.db").resolve()
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
