import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.abuse import SlidingWindowRateLimiter
from packages.core.auth import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from packages.core.config import settings
from packages.core.database import get_db
from packages.core.models import Member, RefreshToken, User
from packages.core.schemas.admin_api import LoginRequest, LoginResponse
from packages.core.schemas.auth import RefreshRequest, TokenPairResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth", tags=["auth"])

_login_limiter = SlidingWindowRateLimiter(limit=10, window_seconds=60)


def _rate_limit_login(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    result = _login_limiter.check(key)
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Retry after {result.retry_after_seconds}s.",
            headers={"Retry-After": str(result.retry_after_seconds)},
        )


def _as_utc(dt: datetime) -> datetime:
    # SQLite often returns naive datetimes even when timezone=True.
    # Treat naive values as UTC to keep comparisons deterministic.
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> LoginResponse:
    _rate_limit_login(request)
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        logger.warning(
            "auth_login_failed email=%s ip=%s",
            payload.email,
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Ensure membership profile exists (core-only for V3).
    existing_member = db.scalar(select(Member).where(Member.user_id == user.id))
    if existing_member is None:
        db.add(Member(user_id=user.id, member_type="free"))
        db.commit()

    token = create_access_token(subject=user.email, role=user.role)
    logger.info(
        "auth_login_success email=%s ip=%s",
        user.email,
        request.client.host if request.client else "unknown",
    )
    return LoginResponse(access_token=token)


@router.post("/login-with-refresh", response_model=TokenPairResponse)
def login_with_refresh(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    _rate_limit_login(request)
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        logger.warning(
            "auth_login_failed email=%s ip=%s",
            payload.email,
            request.client.host if request.client else "unknown",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    existing_member = db.scalar(select(Member).where(Member.user_id == user.id))
    if existing_member is None:
        db.add(Member(user_id=user.id, member_type="free"))
        db.commit()

    access_token = create_access_token(subject=user.email, role=user.role)
    logger.info(
        "auth_login_with_refresh_success email=%s ip=%s",
        user.email,
        request.client.host if request.client else "unknown",
    )
    refresh_token = generate_refresh_token()
    refresh_hash = hash_refresh_token(refresh_token)
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=expires_at,
        )
    )
    db.commit()

    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPairResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPairResponse:
    refresh_hash = hash_refresh_token(payload.refresh_token)

    token_row = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == refresh_hash).with_for_update()
    )
    if token_row is None or token_row.revoked_at is not None:
        logger.warning(
            "auth_refresh_invalid revoked=%s",
            token_row.revoked_at is not None if token_row else "missing",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(UTC)
    if _as_utc(token_row.expires_at) <= now:
        logger.warning("auth_refresh_expired user_id=%s", token_row.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    user = db.scalar(select(User).where(User.id == token_row.user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_refresh_token = generate_refresh_token()
    new_refresh_hash = hash_refresh_token(new_refresh_token)
    new_expires_at = now + timedelta(days=settings.refresh_token_expire_days)
    new_row = RefreshToken(user_id=user.id, token_hash=new_refresh_hash, expires_at=new_expires_at)
    db.add(new_row)
    db.flush()  # allocate new_row.id for replaced_by

    token_row.revoked_at = now
    token_row.replaced_by_token_id = new_row.id
    db.add(token_row)
    db.commit()

    new_access_token = create_access_token(subject=user.email, role=user.role)
    return TokenPairResponse(access_token=new_access_token, refresh_token=new_refresh_token)
