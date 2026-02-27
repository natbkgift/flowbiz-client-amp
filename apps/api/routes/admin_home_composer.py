from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, or_, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.home_composer import validate_home_composer_config
from packages.core.models import Area, Developer, HomeComposerConfig, Project, Property, User
from packages.core.schemas.home_composer import (
    HomeComposerBundleResponse,
    HomeComposerCandidateArea,
    HomeComposerCandidateDeveloper,
    HomeComposerCandidateProject,
    HomeComposerCandidateProperty,
    HomeComposerItem,
    HomeComposerPatchRequest,
    HomeComposerPublishResponse,
    HomeComposerUpsertRequest,
    HomeComposerValidationResult,
)

router = APIRouter(prefix="/admin", tags=["admin"])


VALID_LOCALES = {"en", "th"}


def _normalize_locale(value: str) -> str:
    locale = value.strip().lower()
    if locale not in VALID_LOCALES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="locale must be en or th",
        )
    return locale


def _bundle_for_locale(db: Session, *, page_key: str, locale: str) -> HomeComposerBundleResponse:
    draft = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "draft",
        )
    )
    published = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "published",
        )
    )

    return HomeComposerBundleResponse(
        page_key=page_key,
        locale=locale,
        draft=HomeComposerItem.model_validate(draft) if draft else None,
        published=HomeComposerItem.model_validate(published) if published else None,
    )


def _admin_actor_email(admin: User) -> str | None:
    value = str(getattr(admin, "email", "") or "").strip()
    return value or None


@router.get("/home-composer", response_model=HomeComposerBundleResponse)
def get_home_composer(
    page_key: str = Query(default="home"),
    locale: str = Query(default="en"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> HomeComposerBundleResponse:
    return _bundle_for_locale(db, page_key=page_key, locale=_normalize_locale(locale))


@router.post("/home-composer", response_model=HomeComposerItem, status_code=status.HTTP_201_CREATED)
def create_home_composer_draft(
    payload: HomeComposerUpsertRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> HomeComposerItem:
    locale = _normalize_locale(payload.locale)
    page_key = payload.page_key.strip().lower() or "home"

    existing = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "draft",
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Draft already exists")

    validation = validate_home_composer_config(
        db,
        locale=locale,
        config=payload.config,
        publish=False,
    )
    if validation.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "home_composer_invalid_payload",
                "errors": validation.errors,
                "warnings": validation.warnings,
                "media_warnings": validation.media_warnings,
            },
        )

    row = HomeComposerConfig(
        page_key=page_key,
        locale=locale,
        status="draft",
        version=1,
        config=validation.normalized_config,
        updated_by=_admin_actor_email(admin),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return HomeComposerItem.model_validate(row)


@router.patch("/home-composer/{composer_id}", response_model=HomeComposerPublishResponse)
def update_home_composer_draft(
    composer_id: UUID,
    payload: HomeComposerPatchRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> HomeComposerPublishResponse:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None or row.status != "draft":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft home composer not found")

    validation = validate_home_composer_config(
        db,
        locale=row.locale,
        config=payload.config,
        publish=False,
    )
    if validation.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "home_composer_invalid_payload",
                "errors": validation.errors,
                "warnings": validation.warnings,
                "media_warnings": validation.media_warnings,
            },
        )

    row.version = (row.version or 1) + 1
    row.config = validation.normalized_config
    row.updated_by = _admin_actor_email(admin)

    db.add(row)
    db.commit()
    db.refresh(row)

    return HomeComposerPublishResponse(
        item=HomeComposerItem.model_validate(row),
        validation=HomeComposerValidationResult(
            errors=validation.errors,
            warnings=validation.warnings,
            media_warnings=validation.media_warnings,
        ),
    )


@router.post("/home-composer/{composer_id}/publish", response_model=HomeComposerPublishResponse)
def publish_home_composer(
    composer_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> HomeComposerPublishResponse:
    draft = db.get(HomeComposerConfig, composer_id)
    if draft is None or draft.status != "draft":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft home composer not found")

    validation = validate_home_composer_config(
        db,
        locale=draft.locale,
        config=draft.config,
        publish=True,
    )
    if validation.errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "home_composer_publish_blocked",
                "errors": validation.errors,
                "warnings": validation.warnings,
                "media_warnings": validation.media_warnings,
            },
        )

    published = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == draft.page_key,
            HomeComposerConfig.locale == draft.locale,
            HomeComposerConfig.status == "published",
        )
    )

    if published is None:
        published = HomeComposerConfig(
            page_key=draft.page_key,
            locale=draft.locale,
            status="published",
            version=draft.version,
            config=validation.normalized_config,
            updated_by=_admin_actor_email(admin),
            published_at=draft.updated_at,
        )
        db.add(published)
    else:
        published.version = (published.version or 1) + 1
        published.config = validation.normalized_config
        published.updated_by = _admin_actor_email(admin)
        published.published_at = draft.updated_at
        db.add(published)

    draft.version = (draft.version or 1) + 1
    draft.config = validation.normalized_config
    draft.updated_by = _admin_actor_email(admin)
    db.add(draft)

    db.commit()
    db.refresh(published)

    return HomeComposerPublishResponse(
        item=HomeComposerItem.model_validate(published),
        validation=HomeComposerValidationResult(
            errors=[],
            warnings=validation.warnings,
            media_warnings=validation.media_warnings,
        ),
    )


@router.post("/home-composer/{composer_id}/unpublish", response_model=HomeComposerItem)
def unpublish_home_composer(
    composer_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> HomeComposerItem:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")

    target = row
    if row.status == "draft":
        target = db.scalar(
            select(HomeComposerConfig).where(
                HomeComposerConfig.page_key == row.page_key,
                HomeComposerConfig.locale == row.locale,
                HomeComposerConfig.status == "published",
            )
        )
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published home composer not found")

    existing_archived = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == target.page_key,
            HomeComposerConfig.locale == target.locale,
            HomeComposerConfig.status == "archived",
            HomeComposerConfig.id != target.id,
        )
    )
    if existing_archived is not None:
        db.delete(existing_archived)

    target.status = "archived"
    target.updated_by = _admin_actor_email(admin)
    db.add(target)
    db.commit()
    db.refresh(target)
    return HomeComposerItem.model_validate(target)


@router.get("/home-composer/candidates/projects", response_model=list[HomeComposerCandidateProject])
def candidate_projects(
    search: str | None = Query(default=None),
    limit: int = Query(default=80, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[HomeComposerCandidateProject]:
    query = select(Project)
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(or_(Project.name.ilike(pattern), Project.slug.ilike(pattern)))

    rows = db.scalars(query.order_by(desc(Project.updated_at), asc(Project.slug)).limit(limit)).all()
    return [
        HomeComposerCandidateProject(
            id=row.id,
            slug=row.slug,
            name=row.name,
            status=row.status,
            cover_image_url=row.cover_image_url,
        )
        for row in rows
    ]


@router.get("/home-composer/candidates/properties", response_model=list[HomeComposerCandidateProperty])
def candidate_properties(
    search: str | None = Query(default=None),
    limit: int = Query(default=120, ge=1, le=300),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[HomeComposerCandidateProperty]:
    query = select(Property)
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Property.title.ilike(pattern),
                Property.slug.ilike(pattern),
                Property.source_id.ilike(pattern),
                Property.address.ilike(pattern),
            )
        )

    rows = db.scalars(query.order_by(desc(Property.updated_at), desc(Property.id)).limit(limit)).all()
    return [
        HomeComposerCandidateProperty(
            id=row.id,
            source_id=row.source_id,
            slug=row.slug,
            title=row.title,
            type=row.type,
            status=row.status,
            cover_image=row.cover_image or row.cover_image_url,
        )
        for row in rows
    ]


@router.get("/home-composer/candidates/areas", response_model=list[HomeComposerCandidateArea])
def candidate_areas(
    search: str | None = Query(default=None),
    limit: int = Query(default=80, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[HomeComposerCandidateArea]:
    query = select(Area).where(Area.deleted_at.is_(None))
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(or_(Area.name.ilike(pattern), Area.slug.ilike(pattern)))

    rows = db.scalars(query.order_by(asc(Area.slug)).limit(limit)).all()
    return [HomeComposerCandidateArea(id=row.id, slug=row.slug, name=row.name, status=row.status) for row in rows]


@router.get("/home-composer/candidates/developers", response_model=list[HomeComposerCandidateDeveloper])
def candidate_developers(
    search: str | None = Query(default=None),
    limit: int = Query(default=80, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> list[HomeComposerCandidateDeveloper]:
    query = select(Developer).where(Developer.deleted_at.is_(None))
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(or_(Developer.name.ilike(pattern), Developer.slug.ilike(pattern)))

    rows = db.scalars(query.order_by(asc(Developer.slug)).limit(limit)).all()
    return [
        HomeComposerCandidateDeveloper(id=row.id, slug=row.slug, name=row.name, status=row.status)
        for row in rows
    ]
