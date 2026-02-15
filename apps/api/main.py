from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from apps.api.routes import admin, health
from apps.api.routes.v1 import auth, meta
from apps.api.routes.v1.phase1 import router as phase1_router
from packages.core.auth import hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal, init_db
from packages.core.logging import setup_logging
from packages.core.models import User

setup_logging()

app = FastAPI(
    title=settings.flowbiz_service_name,
    version=settings.flowbiz_version,
    docs_url="/docs" if settings.app_env == "dev" else None,
    redoc_url="/redoc" if settings.app_env == "dev" else None,
)

app.include_router(health.router)
app.include_router(meta.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(phase1_router)


def bootstrap_admin_user() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == settings.admin_bootstrap_email))
        if existing is None:
            db.add(
                User(
                    email=settings.admin_bootstrap_email,
                    password_hash=hash_password(settings.admin_bootstrap_password),
                    role="admin",
                )
            )
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
async def startup_event() -> None:
    init_db()
    bootstrap_admin_user()


static_dir = Path(__file__).resolve().parents[2] / "demo-website"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="site")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_env == "dev",
    )
