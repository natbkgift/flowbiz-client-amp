from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import AreaStatistic, Project, User
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta
from packages.core.schemas.projects import (
    AreaStatisticsSnapshot,
    ProjectCreate,
    ProjectEvaluationResponse,
    ProjectItem,
    ProjectUpdate,
    TrustBadge,
)

router = APIRouter(prefix="/v1", tags=["projects"])


@router.get("/projects", response_model=PaginatedResponse[ProjectItem])
def list_projects(
    status_filter: str | None = Query(default="published"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ProjectItem]:
    q = select(Project)
    if status_filter:
        q = q.where(Project.status == status_filter)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    # Determinism: add a stable tie-breaker so identical timestamps cannot reshuffle results.
    rows = db.scalars(
        q.order_by(desc(Project.created_at), desc(Project.id))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return PaginatedResponse(
        data=[ProjectItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.get("/projects/{project_id}", response_model=ProjectItem)
def get_project(project_id: UUID, db: Session = Depends(get_db)) -> ProjectItem:
    row = db.get(Project, project_id)
    if row is None or row.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectItem.model_validate(row)


@router.get("/projects/slug/{slug}", response_model=ProjectItem)
def get_project_by_slug(slug: str, db: Session = Depends(get_db)) -> ProjectItem:
    row = db.scalar(select(Project).where(Project.slug == slug))
    if row is None or row.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectItem.model_validate(row)


def _compute_project_trust_badges(
    *,
    project: Project,
    area_stat: AreaStatistic | None,
) -> list[TrustBadge]:
    badges: list[TrustBadge] = []

    # Deterministic ordering: sort by key at the end.
    if project.status == "published":
        badges.append(TrustBadge(key="published", label="Published"))
    if project.cover_image_url:
        badges.append(TrustBadge(key="has_cover_image", label="Cover image available"))
    if area_stat is not None:
        badges.append(TrustBadge(key="area_stats_available", label="Area statistics available"))
        if area_stat.roi_percent is not None:
            badges.append(TrustBadge(key="roi_snapshot", label="ROI snapshot available"))

    return sorted(badges, key=lambda b: b.key)


@router.get("/projects/{project_id}/evaluation", response_model=ProjectEvaluationResponse)
def get_project_evaluation(
    project_id: UUID,
    db: Session = Depends(get_db),
) -> ProjectEvaluationResponse:
    project = db.get(Project, project_id)
    if project is None or project.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    area_stat: AreaStatistic | None = None
    if project.area_id is not None:
        area_stat = db.scalar(select(AreaStatistic).where(AreaStatistic.area_id == project.area_id))

    snapshot: AreaStatisticsSnapshot | None = None
    if area_stat is not None:
        snapshot = AreaStatisticsSnapshot(
            area_id=area_stat.area_id,
            avg_price=area_stat.avg_price,
            avg_rent=area_stat.avg_rent,
            roi_percent=area_stat.roi_percent,
            as_of=area_stat.created_at,
        )

    return ProjectEvaluationResponse(
        evaluation_version="v1",
        project=ProjectItem.model_validate(project),
        area_statistics=snapshot,
        badges=_compute_project_trust_badges(project=project, area_stat=area_stat),
    )


@router.post("/projects", response_model=ProjectItem, status_code=status.HTTP_201_CREATED)
def create_project(
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
def update_project(
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
