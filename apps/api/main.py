from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from starlette.requests import Request

from apps.api.routes import admin, health
from apps.api.routes.admin_analytics_v2 import router as admin_analytics_router
from apps.api.routes.admin_crm import router as admin_crm_router
from apps.api.routes.admin_domain import router as admin_domain_router
from apps.api.routes.admin_marketplace import router as admin_marketplace_router
from apps.api.routes.admin_properties import router as admin_properties_router
from apps.api.routes.admin_rbac import router as admin_rbac_router
from apps.api.routes.admin_seller import router as admin_seller_router
from apps.api.routes.auth_me import router as auth_me_router
from apps.api.routes.v1 import auth, meta
from apps.api.routes.v1.analytics import router as analytics_router
from apps.api.routes.v1.compare import router as compare_router
from apps.api.routes.v1.crm import router as crm_router
from apps.api.routes.v1.domain import router as domain_router
from apps.api.routes.v1.finder import router as finder_router
from apps.api.routes.v1.investment import router as investment_router
from apps.api.routes.v1.marketplace import router as marketplace_router
from apps.api.routes.v1.members import router as members_router
from apps.api.routes.v1.phase1 import router as phase1_router
from apps.api.routes.v1.projects import router as projects_router
from apps.api.routes.v1.properties import router as properties_router
from apps.api.routes.v1.seller import router as seller_router
from packages.core.auth import hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal, init_db
from packages.core.logging import setup_logging
from packages.core.models import User
from packages.core.observability import configure_observability

setup_logging()

app = FastAPI(
    title=settings.flowbiz_service_name,
    version=settings.flowbiz_version,
    docs_url="/docs" if settings.app_env == "dev" else None,
    redoc_url="/redoc" if settings.app_env == "dev" else None,
)


configure_observability(app)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response


app.include_router(health.router)
app.include_router(meta.router)
app.include_router(auth.router)
app.include_router(admin_seller_router)
app.include_router(auth_me_router)
app.include_router(admin_marketplace_router)
app.include_router(admin.router)
app.include_router(admin_crm_router)
app.include_router(admin_analytics_router)
app.include_router(admin_domain_router)
app.include_router(admin_rbac_router)
app.include_router(phase1_router)
app.include_router(properties_router)
app.include_router(crm_router)
app.include_router(compare_router)
app.include_router(analytics_router)
app.include_router(domain_router)
app.include_router(finder_router)
app.include_router(investment_router)
app.include_router(members_router)
app.include_router(projects_router)
app.include_router(seller_router)
app.include_router(marketplace_router)
app.include_router(admin_properties_router)

# Compatibility: allow admin APIs under /v1/admin/* (behind nginx: /api/v1/admin/*)
app.include_router(admin_seller_router, prefix="/v1")
app.include_router(admin_marketplace_router, prefix="/v1")
app.include_router(admin.router, prefix="/v1")
app.include_router(admin_crm_router, prefix="/v1")
app.include_router(admin_analytics_router, prefix="/v1")
app.include_router(admin_domain_router, prefix="/v1")
app.include_router(admin_rbac_router, prefix="/v1")
app.include_router(admin_properties_router, prefix="/v1")


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
