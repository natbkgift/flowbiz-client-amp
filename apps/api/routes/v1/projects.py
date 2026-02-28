from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session
from uuid import UUID

from packages.core.database import get_db
from packages.core.models import Area, Developer, Project

router = APIRouter(prefix="/v1", tags=["projects"])


def _public_projects_base_query():
    return select(Project).where(Project.deleted_at.is_(None), Project.status == "published")


def _linked_area(row: Project, db: Session) -> dict | None:
    if row.area_id is None:
        return None
    area = db.get(Area, row.area_id)
    if area is None or area.deleted_at is not None:
        return {"id": str(row.area_id), "slug": None, "name": None}
    return {"id": str(area.id), "slug": area.slug, "name": area.name}


def _linked_developer(row: Project, db: Session) -> dict | None:
    if row.developer_id is None:
        return None
    developer = db.get(Developer, row.developer_id)
    if developer is None or developer.deleted_at is not None:
        return {"id": str(row.developer_id), "slug": None, "name": None}
    return {"id": str(developer.id), "slug": developer.slug, "name": developer.name}


def _safe_media_path(value: object | None) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = value.strip()
    if not candidate or "://" in candidate:
        return None
    return candidate


def _safe_media_list(value: object | None) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        path = _safe_media_path(item)
        if path is None or path in seen:
            continue
        seen.add(path)
        out.append(path)
    return out


@router.get("/projects")
def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict:
    base = _public_projects_base_query()

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
                "area": _linked_area(row, db),
                "developer": _linked_developer(row, db),
                "starting_price": float(row.starting_price)
                if row.starting_price is not None
                else None,
                "cover_image_url": _safe_media_path(row.cover_image_url),
                "hero_image_url": _safe_media_path(row.hero_image_url),
                "images": _safe_media_list(row.images),
                "summary": row.summary or {},
                "description": row.description or {},
                "badges": row.badges or [],
                "highlights": row.highlights or [],
                "quick_facts": row.quick_facts or [],
                "amenities": row.amenities or [],
                "trust_proof": row.trust_proof or [],
                "source_notes": row.source_notes or {},
                "claims_updated_at": row.claims_updated_at.isoformat()
                if row.claims_updated_at
                else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
            for row in rows
        ],
        "meta": {"page": page, "limit": limit, "total": int(total)},
    }


def _project_or_404(
    db: Session, *, project_ref: str | None = None, slug: str | None = None
) -> Project:
    q = _public_projects_base_query()
    if project_ref is not None:
        ref = project_ref.strip()
        try:
            q = q.where(Project.id == UUID(ref))
        except ValueError:
            q = q.where(Project.slug == ref)
    if slug is not None:
        q = q.where(Project.slug == slug)
    row = db.scalar(q)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return row


@router.get("/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, project_ref=project_id)
    return {
        "project": {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "status": row.status,
            "area_id": str(row.area_id) if row.area_id else None,
            "developer_id": str(row.developer_id) if row.developer_id else None,
            "area": _linked_area(row, db),
            "developer": _linked_developer(row, db),
            "property_type": row.property_type,
            "summary": row.summary or {},
            "description": row.description or {},
            "cover_image_url": _safe_media_path(row.cover_image_url),
            "hero_image_url": _safe_media_path(row.hero_image_url),
            "images": _safe_media_list(row.images),
            "badges": row.badges or [],
            "highlights": row.highlights or [],
            "quick_facts": row.quick_facts or [],
            "amenities": row.amenities or [],
            "trust_proof": row.trust_proof or [],
            "source_notes": row.source_notes or {},
            "claims_updated_at": row.claims_updated_at.isoformat()
            if row.claims_updated_at
            else None,
        }
    }


@router.get("/projects/slug/{slug}")
def get_project_by_slug(slug: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, slug=slug)
    return {
        "project": {
            "id": str(row.id),
            "slug": row.slug,
            "name": row.name,
            "status": row.status,
            "area_id": str(row.area_id) if row.area_id else None,
            "developer_id": str(row.developer_id) if row.developer_id else None,
            "area": _linked_area(row, db),
            "developer": _linked_developer(row, db),
        }
    }


@router.get("/projects/{project_id}/evaluation")
def get_project_evaluation(project_id: str, db: Session = Depends(get_db)) -> dict:
    row = _project_or_404(db, project_ref=project_id)
    snapshot = row.investment_snapshot or {}
    return {"project_id": str(row.id), "evaluation": snapshot}
