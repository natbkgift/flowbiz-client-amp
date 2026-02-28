from __future__ import annotations

from contextlib import asynccontextmanager
import mimetypes
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from apps.api.routes import (
    admin_content,
    admin_crm,
    admin_domain,
    admin_home_composer,
    admin_media,
    admin_projects,
    admin_properties,
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
)
from packages.core.database import init_db


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


app.include_router(auth.router)
app.include_router(crm.router)
app.include_router(domain.router)
app.include_router(projects.router)
app.include_router(content.router)
app.include_router(home_composer.router)
app.include_router(properties.router)
app.include_router(events.router)
app.include_router(home_runtime.router)

app.include_router(admin_crm.router)
app.include_router(admin_properties.router)
app.include_router(admin_domain.router)
app.include_router(admin_projects.router)
app.include_router(admin_content.router)
app.include_router(admin_home_composer.router)
app.include_router(admin_media.router)

media_root = _pick_media_root()
if media_root is not None:
    app.mount("/media", StaticFiles(directory=media_root), name="media")
