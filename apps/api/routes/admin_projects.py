from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.models import MediaAsset, Project, User
from packages.core.project_media_governance import (
    collect_project_media_paths,
    evaluate_project_media_governance,
)
from packages.core.schemas.media_library import MediaAssetItem
from packages.core.schemas.projects import (
    AdminProjectListResponse,
    ProjectAdminCreate,
    ProjectAdminItem,
    ProjectAdminUpdate,
    ProjectPublishResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _project_media_paths(row: Project) -> list[str]:
    raw_images = row.images if isinstance(row.images, list) else []
    images = [str(item).strip() for item in raw_images if str(item).strip()]
    return collect_project_media_paths(
        cover_image_url=row.cover_image_url,
        hero_image_url=row.hero_image_url,
        images=images,
    )


def _build_project_admin_item(db: Session, row: Project) -> ProjectAdminItem:
    governance = evaluate_project_media_governance(db, paths=_project_media_paths(row))
    payload = ProjectAdminItem.model_validate(row).model_dump()
    payload["media_warnings"] = [
        {
            "level": item.level,
            "path": item.path,
            "detail": item.detail,
        }
        for item in governance.warnings
    ]
    return ProjectAdminItem.model_validate(payload)


def _validate_payload_media(
    db: Session,
    *,
    cover_image_url: str | None,
    hero_image_url: str | None,
    images: list[str] | None,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    paths = collect_project_media_paths(
        cover_image_url=cover_image_url,
        hero_image_url=hero_image_url,
        images=images,
    )
    governance = evaluate_project_media_governance(db, paths=paths)
    errors = [item.to_dict() for item in governance.errors]
    warnings = [item.to_dict() for item in governance.warnings]
    return errors, warnings


def _raise_media_validation_error(errors: list[dict[str, str]]) -> None:
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={
            "code": "media_governance_blocked",
            "errors": errors,
        },
    )


@router.get("/projects", response_model=AdminProjectListResponse)
def admin_list_projects(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, ge=1, le=200),
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> AdminProjectListResponse:
    query = select(Project)
    if status_filter:
        query = query.where(Project.status == status_filter)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(or_(Project.name.ilike(pattern), Project.slug.ilike(pattern)))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(desc(Project.updated_at), desc(Project.id))
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return AdminProjectListResponse(
        data=[_build_project_admin_item(db, row) for row in rows],
        meta={"page": page, "limit": limit, "total": int(total)},
    )


@router.get("/projects/{project_id}", response_model=ProjectAdminItem)
def admin_get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectAdminItem:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _build_project_admin_item(db, row)


@router.post("/projects", response_model=ProjectAdminItem, status_code=status.HTTP_201_CREATED)
def admin_create_project(
    payload: ProjectAdminCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectAdminItem:
    exists = db.scalar(select(Project).where(Project.slug == payload.slug))
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug exists")

    errors, _warnings = _validate_payload_media(
        db,
        cover_image_url=payload.cover_image_url,
        hero_image_url=payload.hero_image_url,
        images=payload.images,
    )
    if errors:
        _raise_media_validation_error(errors)

    row = Project(
        slug=payload.slug,
        name=payload.name,
        status=payload.status,
        property_type=payload.property_type,
        delivery_date=payload.delivery_date,
        starting_price=payload.starting_price,
        cover_image_url=payload.cover_image_url,
        hero_image_url=payload.hero_image_url,
        images=payload.images,
        summary=payload.summary,
        description=payload.description,
        amenities=payload.amenities,
        investment_snapshot=payload.investment_snapshot,
        location=payload.location,
        unit_count=payload.unit_count,
        floors=payload.floors,
        year_built=payload.year_built,
        is_featured=payload.is_featured,
        developer_id=payload.developer_id,
        area_id=payload.area_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _build_project_admin_item(db, row)


@router.patch("/projects/{project_id}", response_model=ProjectAdminItem)
def admin_update_project(
    project_id: UUID,
    payload: ProjectAdminUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectAdminItem:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    data = payload.model_dump(exclude_unset=True)

    if "slug" in data and data["slug"] != row.slug:
        existing = db.scalar(select(Project).where(Project.slug == data["slug"]))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project slug exists")

    next_cover = data.get("cover_image_url", row.cover_image_url)
    next_hero = data.get("hero_image_url", row.hero_image_url)
    next_images = data.get("images", row.images)

    images_list = [str(item).strip() for item in (next_images or []) if str(item).strip()]
    errors, _warnings = _validate_payload_media(
        db,
        cover_image_url=next_cover,
        hero_image_url=next_hero,
        images=images_list,
    )
    if errors:
        _raise_media_validation_error(errors)

    if "images" in data:
        data["images"] = images_list

    for key, value in data.items():
        setattr(row, key, value)

    db.add(row)
    db.commit()
    db.refresh(row)
    return _build_project_admin_item(db, row)


@router.post("/projects/{project_id}/publish", response_model=ProjectPublishResponse)
def admin_publish_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> ProjectPublishResponse:
    row = db.get(Project, project_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    governance = evaluate_project_media_governance(db, paths=_project_media_paths(row))
    if governance.errors:
        _raise_media_validation_error([item.to_dict() for item in governance.errors])

    row.status = "published"
    db.add(row)
    db.commit()
    db.refresh(row)

    return ProjectPublishResponse(
        project=_build_project_admin_item(db, row),
        published=True,
    )


@router.get("/projects-media", response_model=list[MediaAssetItem])
def admin_list_project_media_candidates(
    search: str | None = Query(default=None),
    limit: int = Query(default=60, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[MediaAssetItem]:
    query = select(MediaAsset).where(MediaAsset.kind == "image", MediaAsset.status == "active")
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                MediaAsset.storage_path.ilike(pattern),
                MediaAsset.title.ilike(pattern),
                MediaAsset.source_domain.ilike(pattern),
            )
        )

    rows = db.scalars(query.order_by(desc(MediaAsset.created_at), desc(MediaAsset.id)).limit(limit)).all()
    return [MediaAssetItem.model_validate(item) for item in rows]
