from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from packages.core.audit import write_audit_log
from packages.core.database import get_db
from packages.core.models import Developer, Project, RedirectRule, SeoPageOverride, User
from packages.core.schemas.admin_api import (
    RedirectRuleCreate,
    RedirectRuleItem,
    RedirectRuleUpdate,
    SeoOverrideItem,
    SeoOverrideUpsert,
)
from packages.core.schemas.pagination import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/admin", tags=["admin"])


def _normalize_path(value: str) -> str:
    raw = value.strip()
    if not raw.startswith("/"):
        raw = f"/{raw}"
    if len(raw) > 1 and raw.endswith("/"):
        raw = raw[:-1]
    return raw


def _validate_redirect(old_path: str, new_path: str, status_code: int) -> None:
    if status_code not in {301, 302}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="status_code must be 301 or 302")
    if old_path == new_path:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Self redirect is not allowed")


def _would_create_loop(db: Session, old_path: str, new_path: str, *, ignore_id: UUID | None = None) -> bool:
    seen: set[str] = {old_path}
    current = new_path
    for _ in range(12):
        if current in seen:
            return True
        seen.add(current)
        rule = db.scalar(select(RedirectRule).where(RedirectRule.old_path == current, RedirectRule.enabled.is_(True)))
        if rule is None:
            return False
        if ignore_id is not None and rule.id == ignore_id:
            return False
        current = rule.new_path
    return True


@router.get("/seo-overrides", response_model=PaginatedResponse[SeoOverrideItem])
def list_seo_overrides(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    locale: str | None = Query(default=None),
    path: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[SeoOverrideItem]:
    base = select(SeoPageOverride)
    if locale:
        base = base.where(SeoPageOverride.locale == locale.strip().lower())
    if path:
        base = base.where(SeoPageOverride.path == _normalize_path(path))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(asc(SeoPageOverride.path)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[SeoOverrideItem.model_validate(row) for row in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.put("/seo-overrides", response_model=SeoOverrideItem)
def upsert_seo_override(
    payload: SeoOverrideUpsert,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> SeoOverrideItem:
    path = _normalize_path(payload.path)
    locale = payload.locale.strip().lower()

    row = db.scalar(select(SeoPageOverride).where(SeoPageOverride.path == path, SeoPageOverride.locale == locale))
    created = False
    if row is None:
        created = True
        row = SeoPageOverride(path=path, locale=locale)
        db.add(row)

    row.title = payload.title
    row.description = payload.description
    row.canonical = payload.canonical
    row.robots_index = payload.robots_index
    row.robots_follow = payload.robots_follow
    row.schema_org_name = payload.schema_org_name
    row.schema_local_business_name = payload.schema_local_business_name
    row.schema_article_author = payload.schema_article_author
    row.enabled = payload.enabled

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="seo_override",
        entity_id=str(row.id),
        action="create" if created else "update",
        diff={"path": path, "locale": locale, "enabled": payload.enabled},
    )

    db.commit()
    db.refresh(row)
    return SeoOverrideItem.model_validate(row)


@router.get("/redirects", response_model=PaginatedResponse[RedirectRuleItem])
def list_redirects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    enabled: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> PaginatedResponse[RedirectRuleItem]:
    base = select(RedirectRule)
    if enabled is not None:
        base = base.where(RedirectRule.enabled.is_(enabled))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(base.order_by(desc(RedirectRule.updated_at)).offset((page - 1) * limit).limit(limit)).all()
    return PaginatedResponse(
        data=[RedirectRuleItem.model_validate(r) for r in rows],
        meta=PaginationMeta(page=page, limit=limit, total=total),
    )


@router.post("/redirects", response_model=RedirectRuleItem, status_code=status.HTTP_201_CREATED)
def create_redirect(
    payload: RedirectRuleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> RedirectRuleItem:
    old_path = _normalize_path(payload.old_path)
    new_path = _normalize_path(payload.new_path)
    _validate_redirect(old_path, new_path, payload.status_code)

    exists = db.scalar(select(RedirectRule).where(RedirectRule.old_path == old_path))
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Redirect old_path already exists")

    if _would_create_loop(db, old_path, new_path):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Redirect loop detected")

    row = RedirectRule(
        old_path=old_path,
        new_path=new_path,
        status_code=payload.status_code,
        enabled=payload.enabled,
        preserve_query=payload.preserve_query,
    )
    db.add(row)
    db.flush()

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="redirect_rule",
        entity_id=str(row.id),
        action="create",
        diff={"old_path": old_path, "new_path": new_path, "status_code": payload.status_code},
    )

    db.commit()
    db.refresh(row)
    return RedirectRuleItem.model_validate(row)


@router.patch("/redirects/{rule_id}", response_model=RedirectRuleItem)
def update_redirect(
    rule_id: UUID,
    payload: RedirectRuleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> RedirectRuleItem:
    row = db.get(RedirectRule, rule_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redirect not found")

    new_path = _normalize_path(payload.new_path) if payload.new_path is not None else row.new_path
    status_code = payload.status_code if payload.status_code is not None else row.status_code
    _validate_redirect(row.old_path, new_path, status_code)
    if _would_create_loop(db, row.old_path, new_path, ignore_id=row.id):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Redirect loop detected")

    row.new_path = new_path
    row.status_code = status_code
    if payload.enabled is not None:
        row.enabled = payload.enabled
    if payload.preserve_query is not None:
        row.preserve_query = payload.preserve_query
    db.add(row)

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="redirect_rule",
        entity_id=str(row.id),
        action="update",
        diff={
            "new_path": row.new_path,
            "status_code": row.status_code,
            "enabled": row.enabled,
            "preserve_query": row.preserve_query,
        },
    )

    db.commit()
    db.refresh(row)
    return RedirectRuleItem.model_validate(row)


@router.delete("/redirects/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_redirect(
    rule_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    row = db.get(RedirectRule, rule_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redirect not found")

    write_audit_log(
        db,
        actor_user_id=admin.id,
        entity_type="redirect_rule",
        entity_id=str(row.id),
        action="delete",
        diff={"old_path": row.old_path, "new_path": row.new_path},
    )
    db.delete(row)
    db.commit()


@router.get("/broken-links/report")
def broken_links_report(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    issues: list[dict] = []

    redirects = db.scalars(select(RedirectRule).where(RedirectRule.enabled.is_(True))).all()
    for rule in redirects:
        if rule.old_path == rule.new_path:
            issues.append({"severity": "high", "kind": "redirect_self", "path": rule.old_path})

    known_project_paths = {
        f"/en/projects/{slug}" for slug in db.scalars(select(Project.slug).where(Project.slug.is_not(None))).all()
    }
    known_project_paths.update(
        {f"/th/projects/{slug}" for slug in db.scalars(select(Project.slug).where(Project.slug.is_not(None))).all()}
    )
    known_developer_paths = {
        f"/en/developers/{slug}" for slug in db.scalars(select(Developer.slug).where(Developer.slug.is_not(None))).all()
    }
    known_developer_paths.update(
        {f"/th/developers/{slug}" for slug in db.scalars(select(Developer.slug).where(Developer.slug.is_not(None))).all()}
    )

    for rule in redirects:
        if "/projects/" in rule.new_path and rule.new_path not in known_project_paths:
            issues.append({"severity": "medium", "kind": "redirect_target_missing_project", "path": rule.new_path})
        if "/developers/" in rule.new_path and rule.new_path not in known_developer_paths:
            issues.append({"severity": "medium", "kind": "redirect_target_missing_developer", "path": rule.new_path})

    summary = {
        "high": sum(1 for item in issues if item["severity"] == "high"),
        "medium": sum(1 for item in issues if item["severity"] == "medium"),
        "low": sum(1 for item in issues if item["severity"] == "low"),
        "total": len(issues),
    }

    return {"summary": summary, "issues": issues}

