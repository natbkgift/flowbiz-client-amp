from __future__ import annotations

from contextlib import asynccontextmanager
import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from apps.api.routes import (
    admin_dashboard,
    admin_content,
    admin_crm,
    admin_domain,
    admin_home_composer,
    admin_media,
    admin_projects,
    admin_properties,
    admin_seo,
    tools,
    admin_users,
)
from apps.api.routes.v1 import (
    auth,
    content,
    crm,
    domain,
    events,
    home_composer,
    home_runtime,
    projects,
    properties,
    shortlists,
)
from packages.core.database import SessionLocal, init_db
from packages.core.schemas.property_api import SearchResponse
from packages.core.seo_controls import resolve_redirect_rule


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="FlowBiz API", version="0.1.0", lifespan=lifespan)

mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")


def _pick_media_root() -> Path | None:
    candidates = [Path("storage/media"), Path("admin-app/public/media")]
    for candidate in candidates:
        if candidate.exists() and any(path.is_file() for path in candidate.rglob("*")):
            return candidate
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_error", "message": str(exc)}},
    )


@app.middleware("http")
async def runtime_redirect_middleware(request: Request, call_next):
    if request.method in {"GET", "HEAD"}:
        with SessionLocal() as db:
            rule = resolve_redirect_rule(db, path=request.url.path)
        if rule is not None:
            target = str(rule.new_path or "").strip()
            if rule.preserve_query and request.url.query:
                delimiter = "&" if "?" in target else "?"
                target = f"{target}{delimiter}{request.url.query}"
            return RedirectResponse(url=target, status_code=int(rule.status_code))
    return await call_next(request)


app.include_router(auth.router)
app.include_router(crm.router)
app.include_router(domain.router)
app.include_router(projects.router)
app.include_router(content.router)
app.include_router(home_composer.router)
app.include_router(properties.router)
app.include_router(shortlists.router)
app.include_router(events.router)
app.include_router(home_runtime.router)
app.include_router(tools.router)

app.add_api_route("/search", properties.search_properties, methods=["GET"], response_model=SearchResponse)
app.add_api_route("/search/", properties.search_properties, methods=["GET"], response_model=SearchResponse)

app.include_router(admin_crm.router)
app.include_router(admin_properties.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_domain.router)
app.include_router(admin_projects.router)
app.include_router(admin_content.router)
app.include_router(admin_home_composer.router)
app.include_router(admin_media.router)
app.include_router(admin_seo.router)
app.include_router(admin_users.router)

media_root = _pick_media_root()
if media_root is not None:
    app.mount("/media", StaticFiles(directory=media_root), name="media")
