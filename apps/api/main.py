from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from apps.api.routes import admin_content, admin_crm, admin_domain, admin_home_composer, admin_projects, admin_properties
from apps.api.routes.v1 import auth, content, crm, domain, home_composer, projects, properties
from packages.core.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="FlowBiz API", version="0.1.0", lifespan=lifespan)


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

app.include_router(admin_crm.router)
app.include_router(admin_properties.router)
app.include_router(admin_domain.router)
app.include_router(admin_projects.router)
app.include_router(admin_content.router)
app.include_router(admin_home_composer.router)
