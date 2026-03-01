from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, field_validator
from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.database import get_db
from packages.core.media_library import require_local_media_path
from packages.core.models import RedirectRule, SeoBrokenLinkReport, SeoPageOverride, User
from packages.core.seo_controls import (
    get_effective_broken_link_policy,
    normalize_locale,
    normalize_path,
    normalize_redirect_target,
    run_broken_internal_link_check,
    upsert_redirect_rule,
)
from packages.core.seo_cutover_profiles import (
    load_production_broken_link_policy,
    load_production_legacy_redirect_rows,
    load_production_schema_profile,
    load_production_schema_profiles,
)

router = APIRouter(prefix="/admin/seo", tags=["admin"])


def _coerce_optional_text(value: str | None) -> str | None:
    text = str(value or "").strip()
    return text or None


def _coerce_same_as(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    out: list[str] = []
    seen: set[str] = set()
    for raw in value:
        item = str(raw or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out or None


def _coerce_logo_path(value: str | None) -> str | None:
    text = _coerce_optional_text(value)
    if not text:
        return None
    return require_local_media_path(text, field_name="schema_org_logo_url")


def _serialize_override(row: SeoPageOverride) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "path": row.path,
        "locale": row.locale,
        "title": row.title,
        "description": row.description,
        "canonical": row.canonical,
        "robots_index": bool(row.robots_index),
        "robots_follow": bool(row.robots_follow),
        "enabled": bool(row.enabled),
        "schema_org_name": row.schema_org_name,
        "schema_org_url": row.schema_org_url,
        "schema_org_logo_url": row.schema_org_logo_url,
        "schema_org_same_as": row.schema_org_same_as or [],
        "schema_local_business_name": row.schema_local_business_name,
        "schema_local_business_url": row.schema_local_business_url,
        "schema_local_business_phone": row.schema_local_business_phone,
        "schema_local_business_price_range": row.schema_local_business_price_range,
        "schema_local_business_address": row.schema_local_business_address,
        "schema_website_name": row.schema_website_name,
        "schema_website_url": row.schema_website_url,
        "schema_website_search_path": row.schema_website_search_path,
        "schema_article_author": row.schema_article_author,
        "schema_article_author_url": row.schema_article_author_url,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_redirect(row: RedirectRule) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "old_path": row.old_path,
        "new_path": row.new_path,
        "status_code": int(row.status_code),
        "enabled": bool(row.enabled),
        "preserve_query": bool(row.preserve_query),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _serialize_report(row: SeoBrokenLinkReport) -> dict[str, Any]:
    checked_at = row.created_at
    if checked_at is None:
        checked_at = datetime.now(tz=UTC)
    default_policy = load_production_broken_link_policy()
    scope = {
        "seed_paths": default_policy.get("seed_paths") or [],
        "max_depth": int(default_policy.get("max_depth") or 0),
        "max_pages": int(default_policy.get("max_pages") or 0),
        "max_link_checks": int(default_policy.get("max_link_checks") or 0),
    }
    return {
        "id": str(row.id),
        "checked_at": checked_at.isoformat(),
        "checked_pages": row.checked_pages or [],
        "total_links": int(row.total_links or 0),
        "broken_links": row.broken_links or [],
        "scope": scope,
        "checker_version": row.checker_version,
    }


class SeoOverrideWrite(BaseModel):
    path: str
    locale: str = "en"
    title: str | None = None
    description: str | None = None
    canonical: str | None = None
    robots_index: bool = True
    robots_follow: bool = True
    enabled: bool = True
    schema_org_name: str | None = None
    schema_org_url: str | None = None
    schema_org_logo_url: str | None = None
    schema_org_same_as: list[str] | None = None
    schema_local_business_name: str | None = None
    schema_local_business_url: str | None = None
    schema_local_business_phone: str | None = None
    schema_local_business_price_range: str | None = None
    schema_local_business_address: str | None = None
    schema_website_name: str | None = None
    schema_website_url: str | None = None
    schema_website_search_path: str | None = None
    schema_article_author: str | None = None
    schema_article_author_url: str | None = None

    @field_validator("path")
    @classmethod
    def _validate_path(cls, value: str) -> str:
        return normalize_path(value)

    @field_validator("locale")
    @classmethod
    def _validate_locale(cls, value: str) -> str:
        return normalize_locale(value)


class SeoOverridePatch(BaseModel):
    path: str | None = None
    locale: str | None = None
    title: str | None = None
    description: str | None = None
    canonical: str | None = None
    robots_index: bool | None = None
    robots_follow: bool | None = None
    enabled: bool | None = None
    schema_org_name: str | None = None
    schema_org_url: str | None = None
    schema_org_logo_url: str | None = None
    schema_org_same_as: list[str] | None = None
    schema_local_business_name: str | None = None
    schema_local_business_url: str | None = None
    schema_local_business_phone: str | None = None
    schema_local_business_price_range: str | None = None
    schema_local_business_address: str | None = None
    schema_website_name: str | None = None
    schema_website_url: str | None = None
    schema_website_search_path: str | None = None
    schema_article_author: str | None = None
    schema_article_author_url: str | None = None

    @field_validator("path")
    @classmethod
    def _validate_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_path(value)

    @field_validator("locale")
    @classmethod
    def _validate_locale(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_locale(value)


class RedirectWrite(BaseModel):
    old_path: str
    new_path: str
    status_code: int = 301
    preserve_query: bool = True
    enabled: bool = True

    @field_validator("old_path")
    @classmethod
    def _validate_old_path(cls, value: str) -> str:
        return normalize_path(value)

    @field_validator("status_code")
    @classmethod
    def _validate_status_code(cls, value: int) -> int:
        if value not in {301, 302}:
            raise ValueError("status_code must be 301 or 302")
        return value


class RedirectPatch(BaseModel):
    old_path: str | None = None
    new_path: str | None = None
    status_code: int | None = None
    preserve_query: bool | None = None
    enabled: bool | None = None

    @field_validator("old_path")
    @classmethod
    def _validate_old_path(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_path(value)

    @field_validator("status_code")
    @classmethod
    def _validate_status_code(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value not in {301, 302}:
            raise ValueError("status_code must be 301 or 302")
        return value


class SchemaSourceUpdate(BaseModel):
    locale: str = "en"
    schema_org_name: str | None = None
    schema_org_url: str | None = None
    schema_org_logo_url: str | None = None
    schema_org_same_as: list[str] | None = None
    schema_local_business_name: str | None = None
    schema_local_business_url: str | None = None
    schema_local_business_phone: str | None = None
    schema_local_business_price_range: str | None = None
    schema_local_business_address: str | None = None
    schema_website_name: str | None = None
    schema_website_url: str | None = None
    schema_website_search_path: str | None = None
    schema_article_author: str | None = None
    schema_article_author_url: str | None = None
    enabled: bool = True

    @field_validator("locale")
    @classmethod
    def _validate_locale(cls, value: str) -> str:
        return normalize_locale(value)


class SchemaSourceBootstrap(BaseModel):
    locale: str | None = None
    overwrite_existing: bool = False

    @field_validator("locale")
    @classmethod
    def _validate_locale(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_locale(value)


class RedirectPreloadRequest(BaseModel):
    dry_run: bool = False
    overwrite_existing: bool = True


class BrokenLinksRunRequest(BaseModel):
    seed_paths: list[str] | None = None
    max_depth: int | None = None
    max_pages: int | None = None
    max_link_checks: int | None = None

    @field_validator("seed_paths")
    @classmethod
    def _validate_seed_paths(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        deduped: list[str] = []
        seen: set[str] = set()
        for raw in value:
            normalized = normalize_path(raw)
            if normalized in seen:
                continue
            seen.add(normalized)
            deduped.append(normalized)
        return deduped

    @field_validator("max_depth", "max_pages", "max_link_checks")
    @classmethod
    def _validate_positive_int(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if int(value) < 0:
            raise ValueError("must be >= 0")
        return int(value)


@router.get("/overrides")
def list_seo_overrides(
    locale: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    query = select(SeoPageOverride)
    if locale:
        query = query.where(SeoPageOverride.locale == normalize_locale(locale))
    rows = db.scalars(
        query.order_by(SeoPageOverride.path.asc(), SeoPageOverride.locale.asc())
    ).all()
    return {"data": [_serialize_override(row) for row in rows]}


@router.post("/overrides", status_code=status.HTTP_201_CREATED)
def create_seo_override(
    payload: SeoOverrideWrite,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = SeoPageOverride(
        path=payload.path,
        locale=payload.locale,
        title=_coerce_optional_text(payload.title),
        description=_coerce_optional_text(payload.description),
        canonical=_coerce_optional_text(payload.canonical),
        robots_index=bool(payload.robots_index),
        robots_follow=bool(payload.robots_follow),
        enabled=bool(payload.enabled),
        schema_org_name=_coerce_optional_text(payload.schema_org_name),
        schema_org_url=_coerce_optional_text(payload.schema_org_url),
        schema_org_logo_url=_coerce_logo_path(payload.schema_org_logo_url),
        schema_org_same_as=_coerce_same_as(payload.schema_org_same_as),
        schema_local_business_name=_coerce_optional_text(payload.schema_local_business_name),
        schema_local_business_url=_coerce_optional_text(payload.schema_local_business_url),
        schema_local_business_phone=_coerce_optional_text(payload.schema_local_business_phone),
        schema_local_business_price_range=_coerce_optional_text(
            payload.schema_local_business_price_range
        ),
        schema_local_business_address=_coerce_optional_text(payload.schema_local_business_address),
        schema_website_name=_coerce_optional_text(payload.schema_website_name),
        schema_website_url=_coerce_optional_text(payload.schema_website_url),
        schema_website_search_path=_coerce_optional_text(payload.schema_website_search_path),
        schema_article_author=_coerce_optional_text(payload.schema_article_author),
        schema_article_author_url=_coerce_optional_text(payload.schema_article_author_url),
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SEO override already exists for this path + locale",
        ) from exc
    db.refresh(row)
    return {"override": _serialize_override(row)}


@router.patch("/overrides/{override_id}")
def patch_seo_override(
    override_id: UUID,
    payload: SeoOverridePatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = db.get(SeoPageOverride, override_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SEO override not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "title":
            row.title = _coerce_optional_text(value)
            continue
        if key == "description":
            row.description = _coerce_optional_text(value)
            continue
        if key == "canonical":
            row.canonical = _coerce_optional_text(value)
            continue
        if key == "schema_org_logo_url":
            row.schema_org_logo_url = _coerce_logo_path(value)
            continue
        if key == "schema_org_same_as":
            row.schema_org_same_as = _coerce_same_as(value)
            continue
        if key in {
            "schema_org_name",
            "schema_org_url",
            "schema_local_business_name",
            "schema_local_business_url",
            "schema_local_business_phone",
            "schema_local_business_price_range",
            "schema_local_business_address",
            "schema_website_name",
            "schema_website_url",
            "schema_website_search_path",
            "schema_article_author",
            "schema_article_author_url",
        }:
            setattr(row, key, _coerce_optional_text(value))
            continue
        setattr(row, key, value)
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SEO override already exists for this path + locale",
        ) from exc
    db.refresh(row)
    return {"override": _serialize_override(row)}


@router.delete("/overrides/{override_id}")
def delete_seo_override(
    override_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    row = db.get(SeoPageOverride, override_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SEO override not found")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.get("/schema-source")
def get_schema_source(
    locale: str = Query(default="en"),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    normalized_locale = normalize_locale(locale)
    row = db.scalar(
        select(SeoPageOverride).where(
            SeoPageOverride.path == "/",
            SeoPageOverride.locale == normalized_locale,
        )
    )
    if row is None:
        return {
            "source": {
                "path": "/",
                "locale": normalized_locale,
                "enabled": True,
            }
        }
    return {"source": _serialize_override(row)}


@router.put("/schema-source")
def upsert_schema_source(
    payload: SchemaSourceUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = db.scalar(
        select(SeoPageOverride).where(
            SeoPageOverride.path == "/",
            SeoPageOverride.locale == payload.locale,
        )
    )
    if row is None:
        row = SeoPageOverride(path="/", locale=payload.locale)
    row.enabled = bool(payload.enabled)
    row.schema_org_name = _coerce_optional_text(payload.schema_org_name)
    row.schema_org_url = _coerce_optional_text(payload.schema_org_url)
    row.schema_org_logo_url = _coerce_logo_path(payload.schema_org_logo_url)
    row.schema_org_same_as = _coerce_same_as(payload.schema_org_same_as)
    row.schema_local_business_name = _coerce_optional_text(payload.schema_local_business_name)
    row.schema_local_business_url = _coerce_optional_text(payload.schema_local_business_url)
    row.schema_local_business_phone = _coerce_optional_text(payload.schema_local_business_phone)
    row.schema_local_business_price_range = _coerce_optional_text(
        payload.schema_local_business_price_range
    )
    row.schema_local_business_address = _coerce_optional_text(payload.schema_local_business_address)
    row.schema_website_name = _coerce_optional_text(payload.schema_website_name)
    row.schema_website_url = _coerce_optional_text(payload.schema_website_url)
    row.schema_website_search_path = _coerce_optional_text(payload.schema_website_search_path)
    row.schema_article_author = _coerce_optional_text(payload.schema_article_author)
    row.schema_article_author_url = _coerce_optional_text(payload.schema_article_author_url)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"source": _serialize_override(row)}


@router.post("/schema-source/bootstrap-production")
def bootstrap_schema_source(
    payload: SchemaSourceBootstrap,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    profiles = load_production_schema_profiles()
    if not profiles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No production schema profile file found",
        )

    target_locales = [payload.locale] if payload.locale else sorted(profiles.keys())
    results: list[dict[str, Any]] = []
    for locale in target_locales:
        profile = load_production_schema_profile(locale)
        if profile is None:
            results.append({"locale": locale, "status": "missing_profile"})
            continue
        row = db.scalar(
            select(SeoPageOverride).where(
                SeoPageOverride.path == "/",
                SeoPageOverride.locale == locale,
            )
        )
        if row is not None and not payload.overwrite_existing:
            results.append({"locale": locale, "status": "skipped_existing"})
            continue
        if row is None:
            row = SeoPageOverride(path="/", locale=locale)

        row.enabled = bool(profile.get("enabled", True))
        row.schema_org_name = _coerce_optional_text(profile.get("schema_org_name"))
        row.schema_org_url = _coerce_optional_text(profile.get("schema_org_url"))
        row.schema_org_logo_url = _coerce_logo_path(profile.get("schema_org_logo_url"))
        row.schema_org_same_as = _coerce_same_as(profile.get("schema_org_same_as"))
        row.schema_local_business_name = _coerce_optional_text(
            profile.get("schema_local_business_name")
        )
        row.schema_local_business_url = _coerce_optional_text(
            profile.get("schema_local_business_url")
        )
        row.schema_local_business_phone = _coerce_optional_text(
            profile.get("schema_local_business_phone")
        )
        row.schema_local_business_price_range = _coerce_optional_text(
            profile.get("schema_local_business_price_range")
        )
        row.schema_local_business_address = _coerce_optional_text(
            profile.get("schema_local_business_address")
        )
        row.schema_website_name = _coerce_optional_text(profile.get("schema_website_name"))
        row.schema_website_url = _coerce_optional_text(profile.get("schema_website_url"))
        row.schema_website_search_path = _coerce_optional_text(
            profile.get("schema_website_search_path")
        )
        row.schema_article_author = _coerce_optional_text(profile.get("schema_article_author"))
        row.schema_article_author_url = _coerce_optional_text(
            profile.get("schema_article_author_url")
        )
        db.add(row)
        results.append({"locale": locale, "status": "upserted"})

    db.commit()
    return {"results": results}


@router.get("/redirects")
def list_redirect_rules(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    rows = db.scalars(select(RedirectRule).order_by(RedirectRule.old_path.asc())).all()
    return {"data": [_serialize_redirect(row) for row in rows]}


@router.post("/redirects", status_code=status.HTTP_201_CREATED)
def create_redirect_rule(
    payload: RedirectWrite,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    try:
        row = upsert_redirect_rule(
            db,
            old_path=payload.old_path,
            new_path=payload.new_path,
            status_code=payload.status_code,
            preserve_query=payload.preserve_query,
            enabled=payload.enabled,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    db.refresh(row)
    return {"redirect": _serialize_redirect(row)}


@router.patch("/redirects/{rule_id}")
def patch_redirect_rule(
    rule_id: UUID,
    payload: RedirectPatch,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = db.get(RedirectRule, rule_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redirect rule not found")

    updates = payload.model_dump(exclude_unset=True)
    old_path = updates.get("old_path", row.old_path)
    new_path = updates.get("new_path", row.new_path)
    status_code = updates.get("status_code", row.status_code)
    preserve_query = updates.get("preserve_query", row.preserve_query)
    enabled = updates.get("enabled", row.enabled)

    if old_path != row.old_path:
        row.old_path = normalize_path(old_path)
    try:
        row.new_path = normalize_redirect_target(new_path, old_path=row.old_path)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    row.status_code = int(status_code)
    row.preserve_query = bool(preserve_query)
    row.enabled = bool(enabled)
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="old_path already exists",
        ) from exc
    db.refresh(row)
    return {"redirect": _serialize_redirect(row)}


@router.delete("/redirects/{rule_id}")
def delete_redirect_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, bool]:
    row = db.get(RedirectRule, rule_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redirect rule not found")
    db.delete(row)
    db.commit()
    return {"deleted": True}


@router.post("/redirects/preload-production")
def preload_production_redirects(
    payload: RedirectPreloadRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    rows = load_production_legacy_redirect_rows()
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No production legacy redirect profile found",
        )

    created = 0
    updated = 0
    skipped = 0
    failed = 0
    failures: list[dict[str, str]] = []

    for row in rows:
        old_path = normalize_path(row.get("old_path"))
        new_path = str(row.get("new_path") or "").strip()
        status_code_value = int(row.get("status_code") or 301)
        preserve_query_value = bool(row.get("preserve_query", True))
        enabled_value = bool(row.get("enabled", True))
        existing = db.scalar(select(RedirectRule).where(RedirectRule.old_path == old_path))

        if existing is not None and not payload.overwrite_existing:
            skipped += 1
            continue

        if payload.dry_run:
            if existing is None:
                created += 1
            else:
                updated += 1
            continue

        try:
            upsert_redirect_rule(
                db,
                old_path=old_path,
                new_path=new_path,
                status_code=status_code_value,
                preserve_query=preserve_query_value,
                enabled=enabled_value,
            )
            if existing is None:
                created += 1
            else:
                updated += 1
        except ValueError as exc:
            failed += 1
            failures.append({"old_path": old_path, "error": str(exc)})

    if not payload.dry_run:
        db.commit()

    return {
        "summary": {
            "total_rows": len(rows),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "failed": failed,
            "dry_run": bool(payload.dry_run),
            "overwrite_existing": bool(payload.overwrite_existing),
        },
        "failures": failures[:50],
    }


@router.get("/broken-links/policy")
def get_broken_links_policy(
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    return {"policy": load_production_broken_link_policy()}


@router.post("/broken-links/run")
def run_broken_links_report(
    request: Request,
    payload: BrokenLinksRunRequest | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    override_scope = payload.model_dump(exclude_unset=True) if payload is not None else {}
    policy = get_effective_broken_link_policy(
        seed_paths=override_scope.get("seed_paths"),
        max_depth=override_scope.get("max_depth"),
        max_pages=override_scope.get("max_pages"),
        max_link_checks=override_scope.get("max_link_checks"),
    )
    report = run_broken_internal_link_check(
        request.app,
        seed_paths=policy["seed_paths"],
        max_depth=policy["max_depth"],
        max_pages=policy["max_pages"],
        max_link_checks=policy["max_link_checks"],
    )
    row = SeoBrokenLinkReport(
        checked_pages=report["checked_pages"],
        total_links=report["total_links"],
        broken_links=report["broken_links"],
        checker_version=str(report.get("checker_version") or "b10-v1"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    serialized = _serialize_report(row)
    serialized["scope"] = report.get("scope", serialized.get("scope"))
    serialized["checker_version"] = str(
        report.get("checker_version") or serialized["checker_version"]
    )
    return {"report": serialized}


@router.get("/broken-links/latest")
def get_latest_broken_links_report(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict[str, Any]:
    row = db.scalar(
        select(SeoBrokenLinkReport).order_by(desc(SeoBrokenLinkReport.created_at)).limit(1)
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No report found")
    return {"report": _serialize_report(row)}
