from __future__ import annotations

from contextlib import asynccontextmanager
import json
import mimetypes
import os
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

DEFAULT_DEPLOY_TELEMETRY_PATH = Path("/app/ops/logs/deploy_telemetry.json")
DEFAULT_DEPLOY_HISTORY_DIR = Path("/app/ops/logs/deploy-history")
MAX_DEPLOY_HISTORY_LIMIT = 50


def _pick_media_root() -> Path | None:
    candidates = [Path("storage/media"), Path("admin-app/public/media")]
    for candidate in candidates:
        if candidate.exists() and any(path.is_file() for path in candidate.rglob("*")):
            return candidate
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def _read_deploy_telemetry() -> dict | None:
    telemetry_path = Path(
        os.getenv("FLOWBIZ_DEPLOY_TELEMETRY_PATH", str(DEFAULT_DEPLOY_TELEMETRY_PATH))
    )
    try:
        payload = json.loads(telemetry_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _normalize_deploy_history_dir(candidate: Path) -> Path:
    if candidate.name == "deploy_telemetry.json":
        return candidate.parent / "deploy-history"
    if candidate.name.startswith("run-") and candidate.parent.name == "deploy-history":
        return candidate.parent
    return candidate


def _get_deploy_history_dir() -> Path:
    configured = os.getenv("FLOWBIZ_DEPLOY_HISTORY_DIR")
    if configured:
        return _normalize_deploy_history_dir(Path(configured))

    telemetry_path = Path(
        os.getenv("FLOWBIZ_DEPLOY_TELEMETRY_PATH", str(DEFAULT_DEPLOY_TELEMETRY_PATH))
    )
    fallback_history = telemetry_path.parent / "deploy-history"
    if telemetry_path == DEFAULT_DEPLOY_TELEMETRY_PATH:
        fallback_history = DEFAULT_DEPLOY_HISTORY_DIR
    return _normalize_deploy_history_dir(fallback_history)


def _parse_deploy_history_limit(raw_limit: int) -> int:
    return min(max(int(raw_limit or 10), 1), MAX_DEPLOY_HISTORY_LIMIT)


def _read_deploy_history(limit: int) -> list[dict]:
    history_dir = _get_deploy_history_dir()
    if not history_dir.exists():
        return []

    history: list[dict] = []
    for telemetry_path in sorted(history_dir.glob("*/telemetry.json"), reverse=True):
        try:
            payload = json.loads(telemetry_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        if not isinstance(payload, dict):
            continue

        run_dir = telemetry_path.parent
        history.append(
            {
                **payload,
                "history_id": payload.get("history_id") or run_dir.name,
                "history_dir": payload.get("history_dir") or str(run_dir),
                "log_path": payload.get("log_path") or str(run_dir / "deploy.log"),
                "lifecycle_log_path": payload.get("lifecycle_log_path")
                or str(run_dir / "lifecycle.log"),
            }
        )
        if len(history) >= limit:
            break

    return history


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.get("/ping")
def ping() -> dict:
    return {"ok": True}


@app.get("/platform/version")
def platform_version() -> dict:
    telemetry = _read_deploy_telemetry() or {}
    return {
        "ok": True,
        "deployed_at": telemetry.get("deployed_at"),
        "deploy_status": telemetry.get("deploy_status") or "unknown",
        "smoke_passed": telemetry.get("smoke_passed"),
        "build_sha": telemetry.get("build_sha") or os.getenv("FLOWBIZ_BUILD_SHA"),
    }


@app.get("/platform/deploy-history")
def platform_deploy_history(limit: int = 10) -> JSONResponse:
    history_dir = _get_deploy_history_dir()
    items = _read_deploy_history(_parse_deploy_history_limit(limit))
    return JSONResponse(
        status_code=200,
        content={
            "ok": True,
            "count": len(items),
            "history_dir": str(history_dir),
            "items": items,
        },
    )


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

app.add_api_route(
    "/search", properties.search_properties, methods=["GET"], response_model=SearchResponse
)
app.add_api_route(
    "/search/", properties.search_properties, methods=["GET"], response_model=SearchResponse
)

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
