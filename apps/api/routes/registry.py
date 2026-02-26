"""Centralised route registry — keeps main.py focused on app factory & middleware."""

from fastapi import FastAPI

from apps.api.routes import admin, health
from apps.api.routes.admin_analytics_v2 import router as admin_analytics_router
from apps.api.routes.admin_crm import router as admin_crm_router
from apps.api.routes.admin_domain import router as admin_domain_router
from apps.api.routes.admin_home_composer import router as admin_home_composer_router
from apps.api.routes.admin_media import router as admin_media_router
from apps.api.routes.admin_marketplace import router as admin_marketplace_router
from apps.api.routes.admin_properties import router as admin_properties_router
from apps.api.routes.admin_projects import router as admin_projects_router
from apps.api.routes.admin_rbac import router as admin_rbac_router
from apps.api.routes.admin_seller import router as admin_seller_router
from apps.api.routes.auth_me import router as auth_me_router
from apps.api.routes.v1 import auth, meta
from apps.api.routes.v1.analytics import router as analytics_router
from apps.api.routes.v1.booking import router as booking_router
from apps.api.routes.v1.compare import router as compare_router
from apps.api.routes.v1.crm import router as crm_router
from apps.api.routes.v1.db_stats import router as db_stats_router
from apps.api.routes.v1.domain import router as domain_router
from apps.api.routes.v1.finder import router as finder_router
from apps.api.routes.v1.home_composer import router as home_composer_router
from apps.api.routes.v1.investment import router as investment_router
from apps.api.routes.v1.marketplace import router as marketplace_router
from apps.api.routes.v1.members import router as members_router
from apps.api.routes.v1.phase1 import router as phase1_router
from apps.api.routes.v1.projects import router as projects_router
from apps.api.routes.v1.properties import router as properties_router
from apps.api.routes.v1.recommendations import router as recommendations_router
from apps.api.routes.v1.seller import router as seller_router
from apps.api.routes.v1.smart_finder import router as smart_finder_router

# Admin routers that are also mounted under /v1 prefix for backwards compat.
_ADMIN_ROUTERS = [
    admin_seller_router,
    admin_marketplace_router,
    admin.router,
    admin_crm_router,
    admin_analytics_router,
    admin_domain_router,
    admin_home_composer_router,
    admin_media_router,
    admin_rbac_router,
    admin_properties_router,
    admin_projects_router,
]


def register_routes(app: FastAPI) -> None:
    """Attach all API routers to *app*."""

    # Core / public
    app.include_router(health.router)
    app.include_router(meta.router)
    app.include_router(auth.router)
    app.include_router(auth_me_router)

    # Admin
    for r in _ADMIN_ROUTERS:
        app.include_router(r)

    # V1 public
    app.include_router(phase1_router)
    app.include_router(properties_router)
    app.include_router(crm_router)
    app.include_router(compare_router)
    app.include_router(analytics_router)
    app.include_router(booking_router)
    app.include_router(domain_router)
    app.include_router(finder_router)
    app.include_router(home_composer_router)
    app.include_router(smart_finder_router)
    app.include_router(investment_router)
    app.include_router(recommendations_router)
    app.include_router(members_router)
    app.include_router(projects_router)
    app.include_router(seller_router)
    app.include_router(marketplace_router)
    app.include_router(db_stats_router)

    # Compatibility: mirror admin APIs under /v1/admin/*
    for r in _ADMIN_ROUTERS:
        app.include_router(r, prefix="/v1")
