"""Global rate-limiting middleware using the in-process SlidingWindowRateLimiter.

Two tiers:
  • Global (all endpoints):  200 requests / 60s per client IP
  • Auth (login/register):    10 requests / 60s per client IP
"""

from __future__ import annotations

from starlette.requests import Request
from starlette.responses import JSONResponse

from packages.core.abuse import SlidingWindowRateLimiter

# ── Instances ────────────────────────────────────────────────────────
_global_limiter = SlidingWindowRateLimiter(limit=200, window_seconds=60)
_auth_limiter = SlidingWindowRateLimiter(limit=10, window_seconds=60)

_AUTH_PREFIXES = ("/v1/auth/login", "/v1/auth/register", "/auth/login", "/auth/register")


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def rate_limit_middleware(request: Request, call_next):  # noqa: ANN001
    ip = _client_ip(request)
    path = request.url.path.lower()

    # ── Auth tier (stricter) ─────────────────────────────────────────
    if any(path.startswith(p) for p in _AUTH_PREFIXES):
        result = _auth_limiter.check(f"auth:{ip}")
        if not result.allowed:
            detail = f"Too many login attempts. Retry after {result.retry_after_seconds}s."
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "detail": detail,
                },
                headers={
                    "Retry-After": str(result.retry_after_seconds),
                    "X-RateLimit-Remaining": "0",
                },
            )

    # ── Global tier ──────────────────────────────────────────────────
    result = _global_limiter.check(f"global:{ip}")
    if not result.allowed:
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limited",
                "detail": f"Too many requests. Retry after {result.retry_after_seconds}s.",
            },
            headers={
                "Retry-After": str(result.retry_after_seconds),
                "X-RateLimit-Remaining": "0",
            },
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(result.remaining)
    return response
