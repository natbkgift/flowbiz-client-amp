from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import HomeComposerConfig

router = APIRouter(prefix="/v1", tags=["home-composer"])


@router.get("/home-composer")
def get_home_composer(
    page_key: str = Query("home"),
    locale: str = Query("en"),
    db: Session = Depends(get_db),
) -> dict:
    if locale not in {"en", "th"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid locale")

    row = db.scalar(
        select(HomeComposerConfig)
        .where(
            HomeComposerConfig.page_key == page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "published",
        )
        .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
        .limit(1)
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published home composer not found")
    return {
        "page_key": row.page_key,
        "locale": row.locale,
        "version": row.version,
        "config": row.config,
        "published_at": row.published_at.isoformat() if row.published_at else None,
    }
