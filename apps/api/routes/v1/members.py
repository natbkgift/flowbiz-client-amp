from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_user
from packages.core.database import get_db
from packages.core.models import Member, User
from packages.core.schemas.members import MemberMeResponse

router = APIRouter(prefix="/v1/members", tags=["members"])


@router.get("/me", response_model=MemberMeResponse)
async def me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MemberMeResponse:
    member = db.scalar(select(Member).where(Member.user_id == user.id))
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member profile not found",
        )

    return MemberMeResponse(
        member_type=member.member_type,
        created_at=member.created_at,
        updated_at=member.updated_at,
    )
