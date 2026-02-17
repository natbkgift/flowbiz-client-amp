from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import Project, User
from packages.core.schemas.projects import ProjectCreate, ProjectItem, ProjectUpdate

router = APIRouter(prefix="/v1", tags=["projects"])


@router.get("/projects", response_model=list[ProjectItem])
async def list_projects(
    status_filter: str | None = Query(default="published"),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[ProjectItem]:
    q = select(Project)
    if status_filter:
        q = q.where(Project.status == status_filter)
    rows = db.scalars(q.order_by(desc(Project.created_at)).limit(limit)).all()
    return [ProjectItem.model_validate(r) for r in rows]


@router.get("/projects/{project_id}", response_model=ProjectItem)
async def get_project(project_id: UUID, db: Session = Depends(get_db)) -> ProjectItem:
    row = db.get(Project, project_id)
    if row is None or row.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectItem.model_validate(row)


@router.get("/projects/slug/{slug}", response_model=ProjectItem)
async def get_project_by_slug(slug: str, db: Session = Depends(get_db)) -> ProjectItem:
    row = db.scalar(select(Project).where(Project.slug == slug))
    if row is None or row.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectItem.model_validate(row)


@router.post("/projects", response_model=ProjectItem, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectItem:
    existing = db.scalar(select(Project).where(Project.slug == payload.slug))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug exists")

    row = Project(
        slug=payload.slug,
        name=payload.name,
        cover_image_url=payload.cover_image_url,
        developer_id=payload.developer_id,
        area_id=payload.area_id,
        status=payload.status,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ProjectItem.model_validate(row)


@router.patch("/projects/{project_id}", response_model=ProjectItem)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectItem:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.name is not None:
        row.name = payload.name
    if payload.cover_image_url is not None:
        row.cover_image_url = payload.cover_image_url
    if payload.developer_id is not None:
        row.developer_id = payload.developer_id
    if payload.area_id is not None:
        row.area_id = payload.area_id
    if payload.status is not None:
        row.status = payload.status

    db.add(row)
    db.commit()
    db.refresh(row)
    return ProjectItem.model_validate(row)
