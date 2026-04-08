from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from apps.api.routes.home_composer_contract import (
    default_home_config,
    deep_merge_dict,
    normalize_home_config,
    resolve_home_runtime,
)
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


def _validate_locale(value: str) -> str:
    if value not in {"en", "th"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid locale"
        )
    return value


def _validate_status(value: str) -> str:
    if value not in {"draft", "published"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid status"
        )
    return value


def _config_has_publishable_content(value: object) -> bool:
    if not isinstance(value, dict):
        return False

    normalized = normalize_home_config(value).model_dump(mode="json")
    return normalized != default_home_config().model_dump(mode="json")


def _ensure_home_composer_publishable(config: dict) -> None:
    if _config_has_publishable_content(config):
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        detail={
            "code": "home_composer_publish_requirements_missing",
            "errors": ["config must include at least one publishable content block"],
        },
    )


def _to_payload(row: HomeComposerConfig) -> dict:
    normalized = normalize_home_config(row.config).model_dump(mode="json")
    return {
        "id": str(row.id),
        "page_key": row.page_key,
        "locale": row.locale,
        "status": row.status,
        "version": row.version,
        "config": normalized,
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
    locale = _validate_locale(payload.locale)
    status_value = _validate_status(payload.status)

    try:
        normalized = normalize_home_config(payload.config).model_dump(mode="json")
    except (ValidationError, ValueError, TypeError) as exc:
        errors = exc.errors() if isinstance(exc, ValidationError) else [{"msg": str(exc)}]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=jsonable_encoder(errors),
        ) from exc

    if status_value == "published":
        _ensure_home_composer_publishable(normalized)

    row = db.scalar(
        select(HomeComposerConfig).where(
            HomeComposerConfig.page_key == payload.page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == status_value,
        )
    )
    if row is None:
        row = HomeComposerConfig(
            page_key=payload.page_key,
            locale=locale,
            status=status_value,
            version=payload.version,
            config=normalized,
            updated_by=admin.email,
            published_at=datetime.now(UTC) if status_value == "published" else None,
        )
    else:
        row.version = payload.version
        row.config = normalized
        row.updated_by = admin.email
        row.published_at = datetime.now(UTC) if status_value == "published" else row.published_at

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

    updates = payload.model_dump(exclude_unset=True)

    if "locale" in updates:
        row.locale = _validate_locale(str(updates["locale"]))
    if "status" in updates:
        row.status = _validate_status(str(updates["status"]))
    if "page_key" in updates:
        row.page_key = str(updates["page_key"])
    if "version" in updates and updates["version"] is not None:
        row.version = int(updates["version"])

    if "config" in updates and updates["config"] is not None:
        patch_config = updates["config"] if isinstance(updates["config"], dict) else {}
        merged = deep_merge_dict(row.config if isinstance(row.config, dict) else {}, patch_config)
        try:
            row.config = normalize_home_config(merged).model_dump(mode="json")
        except (ValidationError, ValueError, TypeError) as exc:
            errors = exc.errors() if isinstance(exc, ValidationError) else [{"msg": str(exc)}]
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=jsonable_encoder(errors),
            ) from exc

    if row.status == "published":
        _ensure_home_composer_publishable(row.config if isinstance(row.config, dict) else {})

    if row.status == "published" and row.published_at is None:
        row.published_at = datetime.now(UTC)

    row.updated_by = admin.email
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_payload(row)


@router.get("/home-composer/preview/draft")
def preview_home_composer(
    page_key: str = Query("home"),
    locale: str = Query("en"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    locale = _validate_locale(locale)
    row = db.scalar(
        select(HomeComposerConfig)
        .where(
            HomeComposerConfig.page_key == page_key,
            HomeComposerConfig.locale == locale,
            HomeComposerConfig.status == "draft",
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
                HomeComposerConfig.status == "draft",
            )
            .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
            .limit(1)
        )
        if row is not None:
            effective_locale = "en"

    if row is None:
        normalized = normalize_home_config({})
        return {
            "page_key": page_key,
            "requested_locale": locale,
            "resolved_locale": locale,
            "status": "draft",
            "version": 1,
            "config": normalized.model_dump(mode="json"),
            "resolved": resolve_home_runtime(db=db, config=normalized, locale=locale),
            "published_at": None,
            "source": "safe_default",
        }

    normalized = normalize_home_config(row.config)
    return {
        "id": str(row.id),
        "page_key": row.page_key,
        "requested_locale": locale,
        "resolved_locale": effective_locale,
        "status": row.status,
        "version": row.version,
        "config": normalized.model_dump(mode="json"),
        "resolved": resolve_home_runtime(db=db, config=normalized, locale=locale),
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "source": "draft",
    }


@router.post("/home-composer/{composer_id}/publish")
def publish_home_composer(
    composer_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> dict:
    row = db.get(HomeComposerConfig, composer_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home composer not found")
    _ensure_home_composer_publishable(row.config if isinstance(row.config, dict) else {})
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
