from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from packages.core.config import settings


class Base(DeclarativeBase):
    pass


_engine_kwargs: dict = {"future": True, "pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL pool tuning.
    # def handlers run in a threadpool (default 40 threads), so pool_size should
    # accommodate typical concurrency without queuing.
    _engine_kwargs.update(
        {
            "pool_size": settings.db_pool_size,
            "max_overflow": settings.db_max_overflow,
            "pool_recycle": settings.db_pool_recycle,
            "pool_timeout": settings.db_pool_timeout,
        }
    )

engine = create_engine(settings.database_url, **_engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from packages.core import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _apply_sqlite_compat_migrations()


def _apply_sqlite_compat_migrations() -> None:
    """Backfill critical columns for local SQLite dev DBs not tracked by Alembic history."""
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(articles)"))
            existing = {str(row[1]) for row in result.fetchall()}
        except Exception:
            return

        if "hero_image_url" not in existing:
            conn.execute(text("ALTER TABLE articles ADD COLUMN hero_image_url VARCHAR(512)"))
        if "hero_media_asset_id" not in existing:
            conn.execute(text("ALTER TABLE articles ADD COLUMN hero_media_asset_id CHAR(32)"))
