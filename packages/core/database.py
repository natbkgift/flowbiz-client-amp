from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DB_PATH = Path("test_flowbiz.db").resolve()
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


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
