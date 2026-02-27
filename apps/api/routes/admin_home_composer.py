from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Area, Developer, HomeComposerConfig, Project, Property, User

router = APIRouter(prefix="/admin", tags=["admin"])


class HomeComposerUpsertRequest(BaseModel):
    page_key: str = "home"
    locale: str = "en"
    status: str = "draft"
    version: int = 1
    config: dict = Field(default_factory=dict)


class HomeComposerPatchRequest(BaseModel):
    page_key: str | None = None
    locale: str | None = None
    status: str | None = None
    config: dict | None = None
    version: int | None = None


def _to_payload(row: HomeComposerConfig) -> dict:
    return {
        "id": str(row.id),
        "page_key": row.page_key,
        "locale": row.locale,
        "status": row.status,
        "version": row.version,
        "config": row.config,
        "updated_by": row.updated_by,
        "published_at": row.published_at.isoformat() if row.published_at else None,
    }


@router.get("/home-composer")
def list_home_composer(
    page_key: str | None = Query(default=None),
    locale: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    q = select(HomeComposerConfig)
    if page_key:
        q = q.where(HomeComposerConfig.page_key == page_key)
    if locale:
        q = q.where(HomeComposerConfig.locale == locale)
    rows = db.scalars(q.order_by(desc(HomeComposerConfig.updated_at))).all()
    return {"data": [_to_payload(row) for row in rows]}


@router.post("/home-composer", status_code=status.HTTP_201_CREATED)
def create_home_composer(
    payload: HomeComposerUpsertRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    row = HomeComposerConfig(
        page_key=payload.page_key,
        locale=payload.locale,
        status=payload.status,
        version=payload.version,
        config=payload.config,
        updated_by=admin.email,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_payload(row)


@router.patch("/home-composer/{composer_id}")
def patch_home_composer(
    composer_id: UUID,
    payload: HomeComposerPatchRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    row.updated_by = admin.email
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_payload(row)


@router.post("/home-composer/{composer_id}/publish")
def publish_home_composer(
    composer_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")
    row.status = "published"
    row.published_at = datetime.now(UTC)
    row.updated_by = admin.email
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_payload(row)


@router.post("/home-composer/{composer_id}/unpublish")
def unpublish_home_composer(
    composer_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")
    row.status = "draft"
    row.updated_by = admin.email
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_payload(row)


@router.get("/home-composer/candidates/projects")
def candidate_projects(
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(Project).order_by(desc(Project.updated_at)).limit(limit)).all()
    return [{"id": str(r.id), "slug": r.slug, "name": r.name} for r in rows]


@router.get("/home-composer/candidates/properties")
def candidate_properties(
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(Property).order_by(desc(Property.updated_at)).limit(limit)).all()
    return [{"id": str(r.id), "slug": r.slug, "title": r.title} for r in rows]


@router.get("/home-composer/candidates/areas")
def candidate_areas(
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(Area).order_by(desc(Area.updated_at)).limit(limit)).all()
    return [{"id": str(r.id), "slug": r.slug, "name": r.name} for r in rows]


@router.get("/home-composer/candidates/developers")
def candidate_developers(
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[dict]:
    rows = db.scalars(select(Developer).order_by(desc(Developer.updated_at)).limit(limit)).all()
    return [{"id": str(r.id), "slug": r.slug, "name": r.name} for r in rows]
