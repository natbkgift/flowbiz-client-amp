from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.routes.home_composer_contract import normalize_home_config, resolve_home_runtime
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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid locale")

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
    effective_locale = locale
    if row is None and locale != "en":
        row = db.scalar(
            select(HomeComposerConfig)
            .where(
                HomeComposerConfig.page_key == page_key,
                HomeComposerConfig.locale == "en",
                HomeComposerConfig.status == "published",
            )
            .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
            .limit(1)
        )
        if row is not None:
            effective_locale = "en"

    normalized = normalize_home_config(row.config if row is not None else {})
    return {
        "page_key": page_key,
        "requested_locale": locale,
        "resolved_locale": effective_locale,
        "locale": effective_locale,
        "version": row.version if row is not None else 1,
        "config": normalized.model_dump(mode="json"),
        "resolved": resolve_home_runtime(db=db, config=normalized, locale=locale),
        "published_at": row.published_at.isoformat() if row and row.published_at else None,
        "source": "published" if row is not None else "safe_default",
    }
