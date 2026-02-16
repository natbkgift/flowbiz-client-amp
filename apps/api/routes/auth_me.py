from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_user, get_role_names
from packages.core.database import get_db
from packages.core.models import User
from packages.core.schemas.auth import MeResponse

router = APIRouter(tags=["auth"])


@router.get("/auth/me", response_model=MeResponse)
async def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    roles = sorted(get_role_names(user, db))
    return MeResponse(email=user.email, roles=roles)
