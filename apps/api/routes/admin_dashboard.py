from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from apps.api.dependencies.auth import get_current_admin
from apps.api.routes.home_composer_contract import normalize_home_config
from packages.core.database import get_db
from packages.core.media_integrity import run_scan
from packages.core.models import (
    Area,
    Article,
    Developer,
    HomeComposerConfig,
    Inquiry,
    MarketplaceItem,
    MediaAsset,
    Project,
    PropertyImportAudit,
    TeamMember,
    Testimonial,
    User,
)
from packages.core.source_rights_registry import normalize_approval_status, normalize_rights_status

router = APIRouter(prefix="/admin", tags=["admin"])

REPO_ROOT = Path(__file__).resolve().parents[3]
PROJECT_COVER_REPORT_PATH = REPO_ROOT / "ops" / "logs" / "project_cover_coverage.json"
MIRROR_REPORT_PATH = REPO_ROOT / "ops" / "logs" / "project_cover_mirror_report.json"
DEFAULT_DEPLOY_TELEMETRY_PATH = REPO_ROOT / "ops" / "logs" / "deploy_telemetry.json"
DEFAULT_TRANSLATION_POLICY_PATH = REPO_ROOT / "ops" / "policies" / "translation_field_policy.json"
DEFAULT_DEPLOY_ARTIFACTS_DIR = REPO_ROOT / "ops" / "logs"
APPROVED_APPROVAL_STATUSES = {"approved"}
APPROVED_RIGHTS_STATUSES = {"approved", "licensed", "exception_allowed"}
SUPPORTED_LOCALES = ("en", "th")


def _to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC).isoformat()


def _parse_datetime(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    raw = value.strip()
    if not raw:
        return None
    candidate = raw.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _freshness(now: datetime, checked_at: datetime | None) -> dict[str, int | str | None]:
    if checked_at is None:
        return {"checked_at": None, "age_seconds": None}
    if checked_at.tzinfo is None:
        checked_at = checked_at.replace(tzinfo=UTC)
    else:
        checked_at = checked_at.astimezone(UTC)
    age_seconds = max(0, int((now - checked_at).total_seconds()))
    return {"checked_at": _to_iso(checked_at), "age_seconds": age_seconds}


def _load_json_report(path: Path) -> tuple[dict | None, datetime | None]:
    if not path.exists() or not path.is_file():
        return None, None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None, None
    if not isinstance(payload, dict):
        return None, None
    try:
        modified = datetime.fromtimestamp(path.stat().st_mtime, tz=UTC)
    except OSError:
        modified = None
    return payload, modified


def _resolve_path_from_env(env_key: str, default_path: Path) -> Path:
    raw = str(os.getenv(env_key) or "").strip()
    if not raw:
        return default_path
    return Path(raw)


def _coerce_bool(value: object) -> bool | None:
    if isinstance(value, bool):
        return value
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "y"}:
        return True
    if text in {"0", "false", "no", "n"}:
        return False
    return None


def _has_text(value: object) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict):
        return any(_has_text(item) for item in value.values())
    if isinstance(value, list):
        return any(_has_text(item) for item in value)
    return bool(str(value).strip())


def _missing_en_th(payload: object) -> bool:
    if not isinstance(payload, dict):
        return True
    return not (_has_text(payload.get("en")) and _has_text(payload.get("th")))


def _count_status(
    db: Session,
    model: type,
    *,
    status_value: str,
    has_deleted_at: bool = True,
) -> int:
    status_field = getattr(model, "status")
    stmt = select(func.count()).select_from(model).where(status_field == status_value)
    if has_deleted_at:
        deleted_at = getattr(model, "deleted_at")
        stmt = stmt.where(deleted_at.is_(None))
    return int(db.scalar(stmt) or 0)


def _collect_project_cover_metrics(db: Session) -> dict:
    report_payload, modified_at = _load_json_report(PROJECT_COVER_REPORT_PATH)
    if isinstance(report_payload, dict):
        summary = report_payload.get("summary")
        if isinstance(summary, dict):
            checked_at = _parse_datetime(summary.get("generated_at")) or _parse_datetime(
                report_payload.get("generated_at")
            )
            checked_at = checked_at or modified_at
            return {
                "source": "ops_report",
                "checked_at": checked_at,
                "projects_total": int(summary.get("projects_total") or 0),
                "projects_real_cover_count": int(summary.get("projects_real_cover_count") or 0),
                "projects_real_cover_pct": float(summary.get("projects_real_cover_pct") or 0.0),
                "projects_external_cover_count": int(
                    summary.get("projects_external_cover_count") or 0
                ),
                "projects_missing_cover_count": int(
                    summary.get("projects_missing_cover_count") or 0
                ),
                "projects_local_media_missing_file_count": int(
                    summary.get("projects_local_media_missing_file_count") or 0
                ),
                "dataset_empty": bool(summary.get("dataset_empty", False)),
            }

    rows = db.execute(
        select(Project.slug, Project.cover_image_url).where(Project.deleted_at.is_(None))
    ).all()
    total = len(rows)
    if total == 0:
        return {
            "source": "live_fallback",
            "checked_at": datetime.now(tz=UTC),
            "projects_total": 0,
            "projects_real_cover_count": 0,
            "projects_real_cover_pct": 0.0,
            "projects_external_cover_count": 0,
            "projects_missing_cover_count": 0,
            "projects_local_media_missing_file_count": 0,
            "dataset_empty": True,
        }

    real_count = 0
    external_count = 0
    missing_count = 0
    for _, cover_image_url in rows:
        cover = str(cover_image_url or "").strip()
        if not cover:
            missing_count += 1
            continue
        if cover.startswith("http://") or cover.startswith("https://"):
            external_count += 1
        real_count += 1

    pct = round((real_count / max(1, total)) * 100, 2)
    return {
        "source": "live_fallback",
        "checked_at": datetime.now(tz=UTC),
        "projects_total": total,
        "projects_real_cover_count": real_count,
        "projects_real_cover_pct": pct,
        "projects_external_cover_count": external_count,
        "projects_missing_cover_count": missing_count,
        "projects_local_media_missing_file_count": 0,
        "dataset_empty": False,
    }


def _collect_media_integrity_metrics(db: Session) -> dict:
    report = run_scan(db, orphan_sample_limit=0)
    summary = report.summary
    broken_media_count = (
        int(summary.missing_file_count or 0)
        + int(summary.checksum_mismatch_count or 0)
        + int(summary.invalid_path_format_count or 0)
        + int(summary.empty_file_count or 0)
    )
    return {
        "scanned_at": _parse_datetime(summary.scanned_at),
        "broken_media_count": broken_media_count,
        "external_image_leakage_count": int(summary.external_leakage_count or 0),
        "error_count": int(summary.error_count or 0),
        "warn_count": int(summary.warn_count or 0),
        "raw_summary": report.to_dict().get("summary", {}),
    }


def _default_translation_policy() -> dict:
    return {
        "version": "2026-03-01",
        "owner_team": "content-locale-owner",
        "approved": False,
        "required_locales": list(SUPPORTED_LOCALES),
        "entities": [
            {
                "key": "areas",
                "mode": "localized_fields",
                "model": "Area",
                "fields": [
                    {"path": "content.why_live_invest", "localized": True},
                    {"path": "content.transport", "localized": True},
                    {"path": "content.lifestyle", "localized": True},
                    {"path": "content.beach_proximity", "localized": True},
                    {"path": "content.metrics_update_cadence", "localized": True},
                ],
            },
            {
                "key": "developers",
                "mode": "localized_fields",
                "model": "Developer",
                "fields": [
                    {"path": "profile", "localized": True},
                ],
            },
            {
                "key": "projects",
                "mode": "localized_fields",
                "model": "Project",
                "fields": [
                    {"path": "summary", "localized": True},
                    {"path": "description", "localized": True},
                ],
            },
            {
                "key": "articles",
                "mode": "localized_fields",
                "model": "Article",
                "fields": [
                    {"path": "title", "localized": True},
                    {"path": "excerpt", "localized": True},
                    {"path": "body_md", "localized": True},
                ],
            },
            {
                "key": "team_members",
                "mode": "localized_fields",
                "model": "TeamMember",
                "fields": [
                    {"path": "bio", "localized": True},
                ],
            },
            {
                "key": "home_composer",
                "mode": "locale_pairs",
                "model": "HomeComposerConfig",
                "group_by": ["page_key", "status"],
                "statuses": ["draft", "published"],
            },
        ],
    }


def _read_nested_dict(value: object, segments: list[str]) -> object:
    current = value
    for segment in segments:
        if not isinstance(current, dict):
            return None
        current = current.get(segment)
    return current


def _model_from_name(name: str) -> type | None:
    models = {
        "Area": Area,
        "Developer": Developer,
        "Project": Project,
        "Article": Article,
        "TeamMember": TeamMember,
        "HomeComposerConfig": HomeComposerConfig,
    }
    return models.get(name)


def _row_field_value(row: object, path: str) -> object:
    parts = [segment for segment in path.split(".") if segment]
    if not parts:
        return None
    root = getattr(row, parts[0], None)
    if len(parts) == 1:
        return root
    return _read_nested_dict(root, parts[1:])


def _localized_row_field_has_text(row: object, path: str, locale: str) -> bool:
    parts = [segment for segment in path.split(".") if segment]
    if not parts:
        return False
    root = getattr(row, parts[0], None)

    if len(parts) == 1:
        if isinstance(root, dict) and locale in root:
            return _has_text(root.get(locale))
        if isinstance(root, dict) and any(candidate in root for candidate in SUPPORTED_LOCALES):
            return False
        return _has_text(root)

    if isinstance(root, dict):
        locale_payload = root.get(locale)
        if locale_payload is not None:
            return _has_text(_read_nested_dict(locale_payload, parts[1:]))
        if any(candidate in root for candidate in SUPPORTED_LOCALES):
            return False

    return _has_text(_read_nested_dict(root, parts[1:]))


def _collect_translation_metrics(db: Session) -> tuple[dict, list[str]]:
    warnings: list[str] = []
    policy_path = _resolve_path_from_env(
        "FLOWBIZ_TRANSLATION_POLICY_PATH", DEFAULT_TRANSLATION_POLICY_PATH
    )
    policy_payload, policy_modified_at = _load_json_report(policy_path)

    if isinstance(policy_payload, dict):
        policy = policy_payload
        policy_source = "file"
    else:
        policy = _default_translation_policy()
        policy_source = "default_fallback"
        warnings.append("translation_policy_missing_or_invalid")

    policy_required_locales = policy.get("required_locales")
    if isinstance(policy_required_locales, list) and all(
        isinstance(locale, str) and locale.strip() for locale in policy_required_locales
    ):
        required_locales = [locale.strip() for locale in policy_required_locales]
    else:
        required_locales = list(SUPPORTED_LOCALES)
        warnings.append("translation_policy_required_locales_invalid")

    policy_approved = _coerce_bool(policy.get("approved"))
    if policy_approved is not True:
        warnings.append("translation_policy_not_signed_off")

    entities_payload = policy.get("entities")
    if not isinstance(entities_payload, list):
        entities_payload = []
        warnings.append("translation_policy_entities_invalid")

    by_entity: dict[str, dict] = {}
    total_pending = 0

    for entity in entities_payload:
        if not isinstance(entity, dict):
            continue
        entity_key = str(entity.get("key") or "").strip()
        mode = str(entity.get("mode") or "").strip()
        model_name = str(entity.get("model") or "").strip()
        if not entity_key or not mode or not model_name:
            continue

        model = _model_from_name(model_name)
        if model is None:
            warnings.append(f"translation_policy_unknown_model:{model_name}")
            continue

        if mode == "localized_fields":
            fields_payload = entity.get("fields")
            if not isinstance(fields_payload, list):
                warnings.append(f"translation_policy_fields_invalid:{entity_key}")
                continue

            stmt = select(model)
            deleted_at_field = getattr(model, "deleted_at", None)
            if deleted_at_field is not None:
                stmt = stmt.where(deleted_at_field.is_(None))
            rows = db.scalars(stmt).all()

            rows_missing = 0
            samples: list[dict] = []
            for row in rows:
                row_missing: list[str] = []
                for field in fields_payload:
                    if isinstance(field, str):
                        field_path = field.strip()
                        localized = True
                    elif isinstance(field, dict):
                        field_path = str(field.get("path") or "").strip()
                        localized = _coerce_bool(field.get("localized"))
                        if localized is None:
                            localized = True
                    else:
                        continue

                    if not field_path:
                        continue

                    if localized:
                        for locale in required_locales:
                            if not _localized_row_field_has_text(row, field_path, locale):
                                row_missing.append(f"{field_path}.{locale}")
                    else:
                        if not _has_text(_row_field_value(row, field_path)):
                            row_missing.append(field_path)

                if row_missing:
                    rows_missing += 1
                    if len(samples) < 10:
                        samples.append(
                            {
                                "row_id": str(getattr(row, "slug", None) or getattr(row, "id", "")),
                                "missing": row_missing[:10],
                            }
                        )

            by_entity[entity_key] = {
                "mode": mode,
                "rows_total": len(rows),
                "pending_rows": rows_missing,
                "samples": samples,
            }
            total_pending += rows_missing
            continue

        if mode == "locale_pairs":
            group_by = entity.get("group_by")
            if not isinstance(group_by, list) or not all(
                isinstance(item, str) and item.strip() for item in group_by
            ):
                group_by = ["page_key", "status"]

            stmt = select(model)
            statuses = entity.get("statuses")
            status_field = getattr(model, "status", None)
            if isinstance(statuses, list) and status_field is not None:
                normalized_statuses = [str(item).strip() for item in statuses if str(item).strip()]
                if normalized_statuses:
                    stmt = stmt.where(status_field.in_(normalized_statuses))

            rows = db.scalars(stmt).all()
            grouped_locales: dict[tuple[str, ...], set[str]] = {}
            for row in rows:
                key_values = tuple(str(getattr(row, item, "") or "") for item in group_by)
                grouped_locales.setdefault(key_values, set()).add(str(getattr(row, "locale", "")))

            pending_pairs = 0
            samples: list[dict] = []
            for key_values, locales in grouped_locales.items():
                missing_locales = [locale for locale in required_locales if locale not in locales]
                if not missing_locales:
                    continue
                pending_pairs += 1
                if len(samples) < 10:
                    samples.append(
                        {
                            "group": {group_by[i]: key_values[i] for i in range(len(group_by))},
                            "missing_locales": missing_locales,
                        }
                    )

            by_entity[entity_key] = {
                "mode": mode,
                "rows_total": len(grouped_locales),
                "pending_rows": pending_pairs,
                "samples": samples,
            }
            total_pending += pending_pairs
            continue

        warnings.append(f"translation_policy_unknown_mode:{entity_key}:{mode}")

    return (
        {
            "total_pending_translations": int(total_pending),
            "policy": {
                "path": str(policy_path),
                "source": policy_source,
                "version": policy.get("version"),
                "approved": policy_approved,
                "owner_team": policy.get("owner_team"),
                "checked_at": _to_iso(policy_modified_at),
                "required_locales": required_locales,
            },
            "by_entity": by_entity,
            "areas_missing_en_th": int(by_entity.get("areas", {}).get("pending_rows", 0)),
            "developers_missing_en_th": int(by_entity.get("developers", {}).get("pending_rows", 0)),
            "projects_missing_en_th": int(by_entity.get("projects", {}).get("pending_rows", 0)),
            "articles_missing_en_th": int(by_entity.get("articles", {}).get("pending_rows", 0)),
            "team_members_missing_en_th": int(
                by_entity.get("team_members", {}).get("pending_rows", 0)
            ),
            "home_composer_missing_locale_pairs": int(
                by_entity.get("home_composer", {}).get("pending_rows", 0)
            ),
        },
        warnings,
    )


def _collect_unpublished_draft_metrics(db: Session) -> dict:
    drafts = {
        "projects_draft": _count_status(db, Project, status_value="draft"),
        "areas_draft": _count_status(db, Area, status_value="draft"),
        "articles_draft": _count_status(db, Article, status_value="draft"),
        "testimonials_draft": _count_status(db, Testimonial, status_value="draft"),
        "home_composer_draft": _count_status(
            db, HomeComposerConfig, status_value="draft", has_deleted_at=False
        ),
        "marketplace_items_draft": _count_status(
            db, MarketplaceItem, status_value="draft", has_deleted_at=False
        ),
    }
    drafts["total_unpublished_drafts"] = int(sum(drafts.values()))
    return drafts


def _collect_recent_inquiries(db: Session) -> dict:
    rows = db.scalars(
        select(Inquiry)
        .where(Inquiry.deleted_at.is_(None))
        .order_by(desc(Inquiry.created_at), desc(Inquiry.id))
        .limit(10)
    ).all()
    items = [
        {
            "id": str(row.id),
            "created_at": _to_iso(row.created_at),
            "name": row.name,
            "email": row.email,
            "phone": row.phone,
            "status": row.status,
            "intent": row.intent,
            "source_page": row.source_page,
        }
        for row in rows
    ]
    latest_at = rows[0].created_at if rows else None
    return {"count": len(items), "items": items, "latest_at": latest_at}


def _collect_inquiry_trend_series(db: Session, *, now: datetime) -> dict[str, list[dict[str, int | str]]]:
    end_date = now.astimezone(UTC).date()
    start_date = end_date - timedelta(days=29)
    start_at = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)

    # Let the database perform daily aggregation to avoid loading all rows into memory.
    bucket_date_expr = func.date(Inquiry.created_at)
    rows = db.execute(
        select(
            bucket_date_expr.label("bucket_date"),
            func.count().label("count"),
        ).where(
            Inquiry.deleted_at.is_(None),
            Inquiry.created_at.is_not(None),
            Inquiry.created_at >= start_at,
        ).group_by(bucket_date_expr)
    ).all()

    counts: dict[str, int] = {}
    for bucket_date, count in rows:
        if bucket_date is None:
            continue
        bucket_key = bucket_date if isinstance(bucket_date, str) else bucket_date.isoformat()
        counts[bucket_key] = int(count)

    def _build_series(days: int) -> list[dict[str, int | str]]:
        window_start = end_date - timedelta(days=days - 1)
        series: list[dict[str, int | str]] = []
        for offset in range(days):
            bucket_date = (window_start + timedelta(days=offset)).isoformat()
            series.append(
                {
                    "bucket_date": bucket_date,
                    "count": int(counts.get(bucket_date, 0)),
                }
            )
        return series

    return {"7d": _build_series(7), "30d": _build_series(30)}


def _latest_home_config_for_locale(db: Session, *, locale: str) -> HomeComposerConfig | None:
    for status_value in ("published", "draft"):
        row = db.scalar(
            select(HomeComposerConfig)
            .where(
                HomeComposerConfig.page_key == "home",
                HomeComposerConfig.locale == locale,
                HomeComposerConfig.status == status_value,
            )
            .order_by(desc(HomeComposerConfig.version), desc(HomeComposerConfig.updated_at))
            .limit(1)
        )
        if row is not None:
            return row
    return None


def _collect_review_video_verification_metrics(db: Session) -> dict:
    rows: list[HomeComposerConfig] = []
    for locale in ("en", "th"):
        row = _latest_home_config_for_locale(db, locale=locale)
        if row is not None:
            rows.append(row)

    if not rows:
        return {
            "total_pending": None,
            "reviews_pending": None,
            "videos_pending": None,
            "checked_at": None,
            "detail": "missing_home_composer_config",
        }

    review_requires_sources = False
    review_source_ids: set[str] = set()
    video_requires_sources = False
    video_paths: set[str] = set()
    checked_at: datetime | None = None
    for row in rows:
        if row.updated_at and (checked_at is None or row.updated_at > checked_at):
            checked_at = row.updated_at
        config = normalize_home_config(row.config if isinstance(row.config, dict) else {})

        if config.reviews.source == "manual":
            review_requires_sources = True
            for raw_id in config.reviews.source_ids:
                candidate = str(raw_id or "").strip()
                if candidate:
                    review_source_ids.add(candidate)

        if config.video.source == "manual":
            video_requires_sources = True

        for raw_path in config.video.video_paths:
            candidate = str(raw_path or "").strip()
            if candidate:
                video_paths.add(candidate)

        for item in config.video_items:
            for raw_path in [item.video_path, item.thumbnail_path, item.poster_path]:
                candidate = str(raw_path or "").strip()
                if candidate:
                    video_paths.add(candidate)

    reviews_pending = 0
    videos_pending = 0

    valid_testimonial_ids: list[UUID] = []
    for raw_id in sorted(review_source_ids):
        try:
            valid_testimonial_ids.append(UUID(raw_id))
        except ValueError:
            reviews_pending += 1

    if review_requires_sources and not review_source_ids:
        reviews_pending += 1

    testimonial_rows = db.scalars(
        select(Testimonial).where(Testimonial.id.in_(valid_testimonial_ids))
    ).all()
    testimonial_map = {str(row.id): row for row in testimonial_rows}
    for source_id in valid_testimonial_ids:
        row = testimonial_map.get(str(source_id))
        if (
            row is None
            or row.deleted_at is not None
            or str(row.status or "").lower() != "published"
        ):
            reviews_pending += 1

    if video_requires_sources and not video_paths:
        videos_pending += 1

    for path in sorted(video_paths):
        if not (path.startswith("/media/") or path.startswith("/storage/")):
            videos_pending += 1
            continue

        media = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == path))
        if media is None:
            videos_pending += 1
            continue

        approval_status = normalize_approval_status(media.approval_status)
        rights_status = normalize_rights_status(media.rights_status) or "pending_review"
        if (
            approval_status not in APPROVED_APPROVAL_STATUSES
            or rights_status not in APPROVED_RIGHTS_STATUSES
        ):
            videos_pending += 1

    total_pending = reviews_pending + videos_pending
    return {
        "total_pending": total_pending,
        "reviews_pending": reviews_pending,
        "videos_pending": videos_pending,
        "checked_at": checked_at,
        "detail": "home_composer_resolved",
    }


def _collect_last_import_status(db: Session) -> dict:
    row = db.scalar(
        select(PropertyImportAudit)
        .order_by(desc(PropertyImportAudit.created_at), desc(PropertyImportAudit.id))
        .limit(1)
    )
    if row is None:
        return {"status": None, "checked_at": None, "rows_total": None, "rows_errors": None}
    return {
        "status": str(row.status or "").lower() or None,
        "checked_at": row.created_at,
        "rows_total": int(row.rows_total or 0),
        "rows_errors": int(row.rows_errors or 0),
        "filename": row.filename,
    }


def _collect_last_mirror_status() -> dict:
    payload, modified_at = _load_json_report(MIRROR_REPORT_PATH)
    if not isinstance(payload, dict):
        return {"status": None, "checked_at": None, "failures_count": None, "ok": None}

    summary = payload.get("summary")
    if not isinstance(summary, dict):
        summary = {}
    checked_at = _parse_datetime(summary.get("generated_at")) or _parse_datetime(
        payload.get("generated_at")
    )
    checked_at = checked_at or modified_at
    ok_value = summary.get("ok")
    ok = bool(ok_value) if isinstance(ok_value, bool) else None
    failures_count = (
        int(summary.get("failures_count") or 0) if "failures_count" in summary else None
    )
    status = None
    if ok is True:
        status = "ok"
    elif ok is False:
        status = "failed"

    return {
        "status": status,
        "checked_at": checked_at,
        "failures_count": failures_count,
        "ok": ok,
    }


def _collect_deploy_artifact_status() -> dict:
    single_path = str(os.getenv("FLOWBIZ_DEPLOY_ARTIFACT_PATH") or "").strip()
    artifact_dir = str(os.getenv("FLOWBIZ_DEPLOY_ARTIFACTS_DIR") or "").strip()
    candidates: list[Path] = []
    if single_path:
        candidate = Path(single_path)
        if candidate.is_file():
            candidates.append(candidate)
    else:
        source_dir = Path(artifact_dir) if artifact_dir else DEFAULT_DEPLOY_ARTIFACTS_DIR
        if source_dir.exists() and source_dir.is_dir():
            patterns = [
                "b13_refresh_final*.json",
                "b13_refresh*.json",
                "phase3_home_smoke_report.json",
                "ci_*_report.json",
                "post_merge_*_report.json",
            ]
            for pattern in patterns:
                candidates.extend(source_dir.glob(pattern))

    if not candidates:
        return {
            "status": "unknown",
            "checked_at": None,
            "detail": "No deploy/CI artifact candidates found.",
            "artifact_path": None,
        }

    def _mtime(path: Path) -> float:
        try:
            return path.stat().st_mtime
        except OSError:
            return 0.0

    latest = sorted(candidates, key=_mtime, reverse=True)[0]
    payload, modified_at = _load_json_report(latest)
    if not isinstance(payload, dict):
        return {
            "status": "unknown",
            "checked_at": modified_at,
            "detail": f"Artifact exists but JSON is invalid: {latest}",
            "artifact_path": str(latest),
        }

    checked_at = (
        _parse_datetime(payload.get("generated_at"))
        or _parse_datetime(payload.get("generatedAt"))
        or modified_at
    )

    explicit_ok = _coerce_bool(payload.get("ok"))
    if explicit_ok is True:
        status = "ok"
    elif explicit_ok is False:
        status = "error"
    elif isinstance(payload.get("warnings"), list):
        status = "ok" if len(payload.get("warnings") or []) == 0 else "error"
    elif isinstance(payload.get("responsive"), list):
        status = "ok" if len(payload.get("responsive") or []) > 0 else "error"
    else:
        status = "unknown"

    return {
        "status": status,
        "checked_at": checked_at,
        "detail": f"Derived from artifact: {latest.name}",
        "artifact_path": str(latest),
    }


def _collect_deploy_health_status() -> dict:
    now = datetime.now(tz=UTC)
    telemetry_path = _resolve_path_from_env(
        "FLOWBIZ_DEPLOY_TELEMETRY_PATH", DEFAULT_DEPLOY_TELEMETRY_PATH
    )
    payload, modified_at = _load_json_report(telemetry_path)

    if not isinstance(payload, dict):
        artifact_hint = _collect_deploy_artifact_status()
        artifact_detail = str(artifact_hint.get("detail") or "").strip()
        return {
            "health_status": "ok",
            "health_checked_at": now,
            "deploy_status": "unknown",
            "deploy_checked_at": None,
            "detail": (
                f"Deploy telemetry file missing at {telemetry_path}. "
                "Run deploy script to generate deploy_telemetry.json. "
                f"{artifact_detail}"
            ),
            "source": "telemetry_file_missing",
            "telemetry_path": str(telemetry_path),
            "artifact_path": artifact_hint.get("artifact_path"),
            "build_sha": None,
            "record": {},
        }

    deploy_checked_at = _parse_datetime(payload.get("deployed_at")) or _parse_datetime(
        payload.get("generated_at")
    )
    deploy_checked_at = deploy_checked_at or modified_at

    raw_status = str(payload.get("deploy_status") or "").strip().lower()
    smoke_passed = _coerce_bool(payload.get("smoke_passed"))
    if smoke_passed is None:
        smoke_payload = payload.get("smoke")
        if isinstance(smoke_payload, dict):
            health_code = str(smoke_payload.get("healthz_code") or "").strip()
            properties_code = str(smoke_payload.get("properties_code") or "").strip()
            projects_code = str(smoke_payload.get("projects_code") or "").strip()
            smoke_passed = (
                health_code == "200" and properties_code == "200" and projects_code == "200"
            )

    if raw_status in {"ok", "success", "passed"}:
        deploy_status = "ok"
    elif raw_status in {"error", "failed", "failure"}:
        deploy_status = "error"
    elif smoke_passed is True:
        deploy_status = "ok"
    elif smoke_passed is False:
        deploy_status = "error"
    else:
        deploy_status = "unknown"

    build_sha = str(payload.get("build_sha") or payload.get("target_sha") or "").strip() or None
    detail = f"Deploy telemetry from {telemetry_path}" + (
        f" (build {build_sha})." if build_sha else "."
    )

    return {
        "health_status": "ok",
        "health_checked_at": now,
        "deploy_status": deploy_status,
        "deploy_checked_at": deploy_checked_at,
        "detail": detail,
        "source": "telemetry_file",
        "telemetry_path": str(telemetry_path),
        "artifact_path": None,
        "build_sha": build_sha,
        "record": payload,
    }


def _make_widget(
    *,
    key: str,
    title: str,
    value: int | float | str | dict | None,
    status: str,
    summary: str,
    actions: list[dict[str, str]],
) -> dict:
    return {
        "key": key,
        "title": title,
        "value": value,
        "status": status,
        "summary": summary,
        "actions": actions,
    }


@router.get("/dashboard/health-summary")
def admin_dashboard_health_summary(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> dict:
    now = datetime.now(tz=UTC)
    warnings: list[str] = []

    project_cover = _collect_project_cover_metrics(db)

    try:
        media_integrity = _collect_media_integrity_metrics(db)
    except Exception:
        media_integrity = {
            "scanned_at": None,
            "broken_media_count": None,
            "external_image_leakage_count": None,
            "error_count": None,
            "warn_count": None,
            "raw_summary": {},
        }
        warnings.append("media_integrity_scan_failed")

    translation_metrics, translation_warnings = _collect_translation_metrics(db)
    warnings.extend(translation_warnings)
    draft_metrics = _collect_unpublished_draft_metrics(db)
    recent_inquiries = _collect_recent_inquiries(db)
    trend_series = _collect_inquiry_trend_series(db, now=now)
    review_video = _collect_review_video_verification_metrics(db)
    last_import = _collect_last_import_status(db)
    last_mirror = _collect_last_mirror_status()
    deploy_health = _collect_deploy_health_status()

    coverage_pct = project_cover.get("projects_real_cover_pct")
    if project_cover.get("dataset_empty"):
        coverage_status = "unknown"
        coverage_summary = (
            "No projects found yet. TODO: publish at least one project with cover media."
        )
    elif coverage_pct is None:
        coverage_status = "unknown"
        coverage_summary = (
            "Coverage source unavailable. TODO: generate or refresh project coverage report."
        )
    elif float(coverage_pct) >= 95:
        coverage_status = "ok"
        coverage_summary = "Project cover coverage meets target."
    elif float(coverage_pct) >= 80:
        coverage_status = "warn"
        coverage_summary = "Coverage below target. TODO: fill missing project covers."
    else:
        coverage_status = "error"
        coverage_summary = (
            "Coverage critically low. TODO: fix project cover media before next deploy."
        )

    broken_media_count = media_integrity.get("broken_media_count")
    if broken_media_count is None:
        broken_media_status = "unknown"
        broken_media_summary = (
            "Media integrity summary unavailable. TODO: investigate integrity scan failures."
        )
    elif int(broken_media_count) == 0:
        broken_media_status = "ok"
        broken_media_summary = "No broken media detected."
    elif int(broken_media_count) <= 5:
        broken_media_status = "warn"
        broken_media_summary = (
            "Broken media found. TODO: repair missing/corrupt/invalid media paths."
        )
    else:
        broken_media_status = "error"
        broken_media_summary = "High broken media count. TODO: fix media integrity issues urgently."

    external_leakage_count = media_integrity.get("external_image_leakage_count")
    if external_leakage_count is None:
        external_leakage_status = "unknown"
        external_leakage_summary = (
            "External leakage metric unavailable. TODO: rerun integrity scan and verify results."
        )
    elif int(external_leakage_count) == 0:
        external_leakage_status = "ok"
        external_leakage_summary = "No external image leakage detected."
    else:
        external_leakage_status = "error"
        external_leakage_summary = (
            "External image leakage detected. TODO: mirror assets into local media and "
            "update references."
        )

    pending_translations = int(translation_metrics.get("total_pending_translations") or 0)
    translation_policy = (
        translation_metrics.get("policy")
        if isinstance(translation_metrics.get("policy"), dict)
        else {}
    )
    translation_policy_approved = _coerce_bool(translation_policy.get("approved"))
    if translation_policy_approved is not True:
        translation_status = "unknown"
        translation_summary = (
            "Pending translations is using draft policy. TODO: get content/locale owner "
            "field-level sign-off for translation policy."
        )
    elif pending_translations == 0:
        translation_status = "ok"
        translation_summary = "EN/TH coverage is complete for tracked content surfaces."
    else:
        translation_status = "warn"
        translation_summary = (
            "Missing EN/TH content found. TODO: complete translations on impacted records."
        )

    total_drafts = int(draft_metrics.get("total_unpublished_drafts") or 0)
    if total_drafts == 0:
        drafts_status = "ok"
        drafts_summary = "No unpublished drafts pending."
    else:
        drafts_status = "warn"
        drafts_summary = (
            "Unpublished drafts exist. TODO: review and publish/archive pending drafts."
        )

    recent_count = int(recent_inquiries.get("count") or 0)
    if recent_count == 0:
        recent_status = "unknown"
        recent_summary = "No recent inquiries found yet."
    else:
        recent_status = "ok"
        recent_summary = "Recent inquiries are available for immediate follow-up."

    review_video_pending = review_video.get("total_pending")
    if review_video_pending is None:
        review_video_status = "unknown"
        review_video_summary = (
            "Review/video verification source is unavailable. TODO: configure home composer "
            "source data."
        )
    elif int(review_video_pending) == 0:
        review_video_status = "ok"
        review_video_summary = "Review/video sources are verified."
    else:
        review_video_status = "warn"
        review_video_summary = (
            "Pending review/video verification found. TODO: approve rights and source references."
        )

    import_status = last_import.get("status")
    mirror_status = last_mirror.get("status")
    if import_status is None and mirror_status is None:
        import_mirror_state = "unknown"
        import_mirror_summary = (
            "Import/mirror status unavailable. TODO: run import and mirror pipeline at least once."
        )
    elif import_status in {"failed"} or mirror_status in {"failed"}:
        import_mirror_state = "error"
        import_mirror_summary = (
            "Latest import/mirror indicates failures. TODO: review pipeline reports."
        )
    elif import_status in {"partial"}:
        import_mirror_state = "warn"
        import_mirror_summary = (
            "Latest import partially succeeded. TODO: resolve import row errors."
        )
    else:
        import_mirror_state = "ok"
        import_mirror_summary = "Latest import/mirror checks are healthy."

    health_status = str(deploy_health.get("health_status") or "unknown")
    deploy_status = str(deploy_health.get("deploy_status") or "unknown")
    if health_status != "ok":
        deploy_health_state = "error"
        deploy_health_summary = "Health endpoint is not OK. TODO: restore runtime health."
    elif deploy_status == "ok":
        deploy_health_state = "ok"
        deploy_health_summary = "Health check OK and deploy telemetry reports healthy."
    elif deploy_status == "error":
        deploy_health_state = "error"
        deploy_health_summary = (
            "Latest deploy telemetry reports failure. TODO: review latest deploy artifact "
            "and rerun deployment."
        )
    else:
        deploy_health_state = "unknown"
        deploy_health_summary = (
            "Health check is OK, deploy telemetry status is unknown. TODO: run deploy script "
            "that writes telemetry record."
        )

    widgets = [
        _make_widget(
            key="project_cover_coverage",
            title="Project Cover Coverage %",
            value=coverage_pct,
            status=coverage_status,
            summary=coverage_summary,
            actions=[
                {"label": "Open domain workspace", "url": "/admin/domain"},
                {"label": "Open media workspace", "url": "/admin/media"},
            ],
        ),
        _make_widget(
            key="broken_media_count",
            title="Broken Media Count",
            value=broken_media_count,
            status=broken_media_status,
            summary=broken_media_summary,
            actions=[
                {"label": "Open media workspace", "url": "/admin/media"},
                {"label": "Open dashboard", "url": "/admin/dashboard"},
            ],
        ),
        _make_widget(
            key="external_image_leakage_count",
            title="External Image Leakage Count",
            value=external_leakage_count,
            status=external_leakage_status,
            summary=external_leakage_summary,
            actions=[
                {"label": "Open media workspace", "url": "/admin/media"},
                {"label": "Open dashboard", "url": "/admin/dashboard"},
            ],
        ),
        _make_widget(
            key="pending_translations_count",
            title="Pending Translations Count",
            value=pending_translations,
            status=translation_status,
            summary=translation_summary,
            actions=[
                {"label": "Open domain workspace", "url": "/admin/domain"},
                {"label": "Open dashboard", "url": "/admin/dashboard"},
            ],
        ),
        _make_widget(
            key="unpublished_drafts_count",
            title="Unpublished Drafts Count",
            value=total_drafts,
            status=drafts_status,
            summary=drafts_summary,
            actions=[
                {"label": "Open domain workspace", "url": "/admin/domain"},
                {"label": "Open dashboard", "url": "/admin/dashboard"},
            ],
        ),
        _make_widget(
            key="recent_leads_inquiries",
            title="Recent Leads/Inquiries",
            value=recent_count,
            status=recent_status,
            summary=recent_summary,
            actions=[
                {"label": "Open inquiries dashboard", "url": "/admin/inquiries"},
                {"label": "Open domain workspace", "url": "/admin/domain"},
            ],
        ),
        _make_widget(
            key="review_video_source_verification_pending",
            title="Review/Video Source Verification Pending",
            value=review_video_pending,
            status=review_video_status,
            summary=review_video_summary,
            actions=[
                {"label": "Open domain workspace", "url": "/admin/domain"},
                {"label": "Open media workspace", "url": "/admin/media"},
            ],
        ),
        _make_widget(
            key="last_import_mirror_status",
            title="Last Import/Mirror Status",
            value={
                "import_status": import_status,
                "mirror_status": mirror_status,
            },
            status=import_mirror_state,
            summary=import_mirror_summary,
            actions=[
                {"label": "Open imports workspace", "url": "/admin/imports"},
                {"label": "Open dashboard", "url": "/admin/dashboard"},
            ],
        ),
        _make_widget(
            key="last_deploy_health_status",
            title="Last Deploy/Health Status",
            value={"health_status": health_status, "deploy_status": deploy_status},
            status=deploy_health_state,
            summary=deploy_health_summary,
            actions=[
                {"label": "Open dashboard deploy section", "url": "/admin/dashboard?focus=deploy"},
                {"label": "Open imports workspace", "url": "/admin/imports"},
            ],
        ),
    ]

    raw_metrics = {
        "project_cover_coverage": project_cover,
        "media_integrity": media_integrity,
        "pending_translations": translation_metrics,
        "unpublished_drafts": draft_metrics,
        "recent_inquiries": {
            "count": recent_count,
            "latest_at": _to_iso(recent_inquiries.get("latest_at")),
        },
        "review_video_source_verification_pending": {
            "total_pending": review_video.get("total_pending"),
            "reviews_pending": review_video.get("reviews_pending"),
            "videos_pending": review_video.get("videos_pending"),
            "detail": review_video.get("detail"),
        },
        "last_import_status": {
            "status": import_status,
            "checked_at": _to_iso(last_import.get("checked_at")),
            "rows_total": last_import.get("rows_total"),
            "rows_errors": last_import.get("rows_errors"),
            "filename": last_import.get("filename"),
        },
        "last_mirror_status": {
            "status": mirror_status,
            "checked_at": _to_iso(last_mirror.get("checked_at")),
            "failures_count": last_mirror.get("failures_count"),
            "ok": last_mirror.get("ok"),
        },
        "last_deploy_health_status": {
            "health_status": health_status,
            "health_checked_at": _to_iso(deploy_health.get("health_checked_at")),
            "deploy_status": deploy_status,
            "deploy_checked_at": _to_iso(deploy_health.get("deploy_checked_at")),
            "detail": deploy_health.get("detail"),
            "source": deploy_health.get("source"),
            "telemetry_path": deploy_health.get("telemetry_path"),
            "artifact_path": deploy_health.get("artifact_path"),
            "build_sha": deploy_health.get("build_sha"),
        },
    }

    incomplete_widget_count = sum(1 for widget in widgets if widget["status"] != "ok")
    data_freshness = {
        "project_cover_coverage": _freshness(now, project_cover.get("checked_at")),
        "media_integrity": _freshness(now, media_integrity.get("scanned_at")),
        "recent_inquiries": _freshness(now, recent_inquiries.get("latest_at")),
        "review_video_verification": _freshness(now, review_video.get("checked_at")),
        "last_import_status": _freshness(now, last_import.get("checked_at")),
        "last_mirror_status": _freshness(now, last_mirror.get("checked_at")),
        "last_deploy_health_status": _freshness(
            now, deploy_health.get("deploy_checked_at") or deploy_health.get("health_checked_at")
        ),
    }

    return {
        "generated_at": _to_iso(now),
        "data_freshness": data_freshness,
        "raw_metrics": raw_metrics,
        "widgets": widgets,
        "trend_series": trend_series,
        "recent_inquiries": recent_inquiries.get("items", []),
        "incomplete_widget_count": incomplete_widget_count,
        "warnings": warnings,
    }
