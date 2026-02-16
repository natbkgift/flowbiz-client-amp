from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.auth import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
)
from packages.core.config import settings
from packages.core.database import get_db
from packages.core.models import RefreshToken, User
from packages.core.schemas.admin_api import LoginRequest, LoginResponse
from packages.core.schemas.auth import RefreshRequest, TokenPairResponse

router = APIRouter(prefix="/v1/auth", tags=["auth"])


def _as_utc(dt: datetime) -> datetime:
    # SQLite often returns naive datetimes even when timezone=True.
    # Treat naive values as UTC to keep comparisons deterministic.
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=user.email, role=user.role)
    return LoginResponse(access_token=token)


@router.post("/login-with-refresh", response_model=TokenPairResponse)
async def login_with_refresh(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(subject=user.email, role=user.role)
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
async def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPairResponse:
    refresh_hash = hash_refresh_token(payload.refresh_token)

    token_row = db.scalar(
        select(RefreshToken)
        .where(RefreshToken.token_hash == refresh_hash)
        .with_for_update()
    )
    if token_row is None or token_row.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(UTC)
    if _as_utc(token_row.expires_at) <= now:
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
