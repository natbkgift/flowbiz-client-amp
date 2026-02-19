import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from apps.api.routes.registry import register_routes
from packages.core.auth import hash_password
from packages.core.config import settings
from packages.core.database import SessionLocal, init_db
from packages.core.logging import setup_logging
from packages.core.models import User
from packages.core.observability import configure_observability
from packages.core.rate_limit import rate_limit_middleware
from packages.core.schemas.error import ErrorResponse

logger = logging.getLogger(__name__)
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler — replaces deprecated @app.on_event."""
    init_db()
    bootstrap_admin_user()
    yield


app = FastAPI(
    title=settings.flowbiz_service_name,
    version=settings.flowbiz_version,
    docs_url="/docs" if settings.app_env == "dev" else None,
    redoc_url="/redoc" if settings.app_env == "dev" else None,
    lifespan=lifespan,
    responses={
        422: {"model": ErrorResponse, "description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Rate limited"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)


configure_observability(app)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.add_middleware(GZipMiddleware, minimum_size=500)


# --- Global Exception Handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="validation_error",
            detail=str(exc.errors()),
        ).model_dump(),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Wrap all HTTP errors in the unified ErrorResponse envelope."""
    status = exc.status_code
    error_slug = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        413: "payload_too_large",
        429: "rate_limited",
    }.get(status, f"http_{status}")
    headers = getattr(exc, "headers", None) or {}
    return JSONResponse(
        status_code=status,
        content=ErrorResponse(
            error=error_slug,
            detail=str(exc.detail) if exc.detail else None,
        ).model_dump(),
        headers=headers,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="internal_server_error",
            detail="An unexpected error occurred. Please try again later.",
        ).model_dump(),
    )


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://www.google-analytics.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'",
    )
    response.headers.setdefault(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()",
    )
    response.headers.setdefault(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
    )
    # Cache-Control for public GET reads (v1 API, not admin)
    path = request.url.path
    if request.method == "GET" and path.startswith("/v1/") and "/admin" not in path:
        response.headers.setdefault(
            "Cache-Control",
            "public, max-age=60, stale-while-revalidate=300",
        )
    return response


app.middleware("http")(rate_limit_middleware)


register_routes(app)


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
