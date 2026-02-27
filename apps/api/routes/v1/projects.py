from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Project

router = APIRouter(prefix="/v1", tags=["projects"])


@router.get("/projects")
def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    status_filter: str = Query("published"),
    db: Session = Depends(get_db),
) -> dict:
    base = select(Project).where(Project.deleted_at.is_(None))
    if status_filter:
        base = base.where(Project.status == status_filter)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(desc(Project.updated_at), asc(Project.id))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return {
        "data": [
            {
                "id": str(row.id),
                "slug": row.slug,
                "name": row.name,
                "status": row.status,
                "property_type": row.property_type,
                "area_id": str(row.area_id) if row.area_id else None,
                "developer_id": str(row.developer_id) if row.developer_id else None,
                "starting_price": float(row.starting_price) if row.starting_price is not None else None,
                "cover_image_url": row.cover_image_url,
                "hero_image_url": row.hero_image_url,
                "images": row.images or [],
                "summary": row.summary or {},
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
            for row in rows
        ],
        "meta": {"page": page, "limit": limit, "total": int(total)},
    }


def _project_or_404(db: Session, *, project_id=None, slug=None) -> Project:
    q = select(Project).where(Project.deleted_at.is_(None), Project.status == "published")
    if project_id is not None:
        q = q.where(Project.id == project_id)
    if slug is not None:
        q = q.where(Project.slug == slug)
    row = db.scalar(q)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return row


@router.get("/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, project_id=project_id)
    return {
        "project": {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "status": row.status,
            "property_type": row.property_type,
            "summary": row.summary or {},
            "description": row.description or {},
            "cover_image_url": row.cover_image_url,
            "hero_image_url": row.hero_image_url,
            "images": row.images or [],
        }
    }


@router.get("/projects/slug/{slug}")
def get_project_by_slug(slug: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, slug=slug)
    return {"project": {"id": str(row.id), "slug": row.slug, "name": row.name, "status": row.status}}


@router.get("/projects/{project_id}/evaluation")
def get_project_evaluation(project_id: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, project_id=project_id)
    snapshot = row.investment_snapshot or {}
    return {"project_id": str(row.id), "evaluation": snapshot}
