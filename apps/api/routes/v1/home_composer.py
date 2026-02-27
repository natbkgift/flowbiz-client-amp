from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import HomeComposerConfig
from packages.core.schemas.home_composer import HomeComposerPublicResponse

router = APIRouter(prefix="/v1", tags=["home-composer"])


@router.get("/home-composer", response_model=HomeComposerPublicResponse)
def get_home_composer_public(
    page_key: str = Query(default="home"),
    locale: str = Query(default="en"),
    db: Session = Depends(get_db),
) -> HomeComposerPublicResponse:
    locale_clean = locale.strip().lower()
    if locale_clean not in {"en", "th"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="locale must be en or th")

    item = db.scalar(
        select(HomeComposerConfig)
        .where(
            HomeComposerConfig.page_key == page_key.strip().lower(),
            HomeComposerConfig.locale == locale_clean,
            HomeComposerConfig.status == "published",
        )
        .order_by(desc(HomeComposerConfig.updated_at))
        .limit(1)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")

    return HomeComposerPublicResponse(
        page_key=item.page_key,
        locale=item.locale,
        version=item.version,
        updated_at=item.updated_at,
        config=item.config,
    )
