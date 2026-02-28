from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.models import MediaAsset, Project, Property

SOURCE_TYPE_NORMALIZATION = {
    "official_project_website": "official",
    "official_developer_website": "official",
    "official_project_website_archive": "archive",
    "marketplace_exception_non_official": "marketplace_exception",
    "external_url": "unknown",
    "remediation_mirror": "internal",
    "internal": "internal",
    "unknown": "unknown",
}

RIGHTS_STATUS_NORMALIZATION = {
    "verify_reuse_permission_required": "pending_review",
    "verify_reuse_permission_required_archive_source": "exception_allowed",
    "replace_with_official_source_when_available": "exception_allowed",
    "pending_review": "pending_review",
    "approved": "approved",
    "licensed": "licensed",
    "restricted": "restricted",
    "rejected": "rejected",
    "exception_allowed": "exception_allowed",
    "unverified": "pending_review",
}

APPROVAL_STATUS_NORMALIZATION = {
    "pending": "pending",
    "pending_review": "pending",
    "approved": "approved",
    "rejected": "rejected",
    "blocked": "blocked",
}


@dataclass
class SourceRightsFinding:
    severity: str
    category: str
    media_id: str
    storage_path: str
    detail: str
    suggested_fix: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class SourceRightsSummary:
    scanned_at: str = ""
    total_media_assets: int = 0
    missing_source_metadata_count: int = 0
    pending_approval_count: int = 0
    exception_count: int = 0
    rejected_or_restricted_count: int = 0
    unknown_source_type_count: int = 0
    missing_last_checked_count: int = 0
    blocked_items_count: int = 0
    linked_projects_count: int = 0
    linked_properties_count: int = 0
    errors: int = 0
    warnings: int = 0


@dataclass
class SourceRightsReport:
    summary: SourceRightsSummary = field(default_factory=SourceRightsSummary)
    findings: list[SourceRightsFinding] = field(default_factory=list)
    top_domains: list[dict[str, int | str]] = field(default_factory=list)
    top_source_types: list[dict[str, int | str]] = field(default_factory=list)
    exception_report: list[dict[str, Any]] = field(default_factory=list)

    def add(self, finding: SourceRightsFinding) -> None:
        self.findings.append(finding)
        if finding.severity == "error":
            self.summary.errors += 1
        elif finding.severity == "warn":
            self.summary.warnings += 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": asdict(self.summary),
            "top_domains": self.top_domains,
            "top_source_types": self.top_source_types,
            "exception_report": self.exception_report,
            "findings": [f.to_dict() for f in self.findings],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


def normalize_source_type(value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip().lower()
    if not v:
        return None
    return SOURCE_TYPE_NORMALIZATION.get(v, v)


def normalize_rights_status(value: str | None) -> str | None:
    if value is None:
        return None
    v = value.strip().lower()
    if not v:
        return None
    return RIGHTS_STATUS_NORMALIZATION.get(v, v)


def normalize_approval_status(value: str | None) -> str:
    if value is None:
        return "pending"
    v = value.strip().lower()
    if not v:
        return "pending"
    return APPROVAL_STATUS_NORMALIZATION.get(v, "pending")


def _contains_path(value: Any, path: str) -> bool:
    if isinstance(value, str):
        return value == path
    if isinstance(value, list):
        return any(isinstance(item, str) and item == path for item in value)
    return False


def _build_link_index(db: Session) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    project_links: dict[str, set[str]] = {}
    property_links: dict[str, set[str]] = {}

    for project in db.scalars(select(Project)).all():
        slug = project.slug or str(project.id)
        for value in [project.cover_image_url, project.hero_image_url, project.images]:
            if isinstance(value, str) and value.startswith("/media/"):
                project_links.setdefault(value, set()).add(slug)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str) and item.startswith("/media/"):
                        project_links.setdefault(item, set()).add(slug)

    for prop in db.scalars(select(Property)).all():
        key = prop.slug or prop.source_id or str(prop.id)
        for value in [prop.cover_image_url, prop.cover_image, prop.images, prop.local_images]:
            if isinstance(value, str) and value.startswith("/media/"):
                property_links.setdefault(value, set()).add(key)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str) and item.startswith("/media/"):
                        property_links.setdefault(item, set()).add(key)

    return project_links, property_links


def build_source_rights_report(
    db: Session,
    *,
    pending_threshold: int = 5,
    findings_limit: int = 250,
) -> SourceRightsReport:
    report = SourceRightsReport()
    report.summary.scanned_at = datetime.now(timezone.utc).isoformat()

    rows = db.scalars(select(MediaAsset).order_by(MediaAsset.created_at.desc())).all()
    report.summary.total_media_assets = len(rows)

    domain_counter: Counter[str] = Counter()
    source_type_counter: Counter[str] = Counter()
    project_links, property_links = _build_link_index(db)

    for row in rows:
        source_type = normalize_source_type(row.source_type)
        rights_status = normalize_rights_status(row.rights_status)
        approval_status = normalize_approval_status(row.approval_status)
        source_domain = (row.source_domain or "").strip().lower()

        if source_domain:
            domain_counter[source_domain] += 1

        normalized_type = source_type or "unknown"
        source_type_counter[normalized_type] += 1

        missing_fields = []
        if not (row.source_page_url or "").strip():
            missing_fields.append("source_page_url")
        if not source_domain:
            missing_fields.append("source_domain")
        if not source_type:
            missing_fields.append("source_type")
        if not rights_status:
            missing_fields.append("rights_status")
        if not approval_status:
            missing_fields.append("approval_status")
        if not (row.credit or "").strip():
            missing_fields.append("credit")
        if not ((row.rights_note or "").strip() or (row.approval_note or "").strip()):
            missing_fields.append("notes")

        if missing_fields:
            report.summary.missing_source_metadata_count += 1
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="warn",
                        category="missing_source_metadata",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail=f"missing fields: {', '.join(missing_fields)}",
                        suggested_fix="เติม source/rights metadata และ notes ให้ครบ",
                    )
                )

        if row.last_checked_at is None:
            report.summary.missing_last_checked_count += 1
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="warn",
                        category="missing_last_checked",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail="last_checked_at is empty",
                        suggested_fix="ตั้งค่า last_checked_at หลัง audit",
                    )
                )

        if approval_status == "pending":
            report.summary.pending_approval_count += 1

        if source_type in {None, "unknown"}:
            report.summary.unknown_source_type_count += 1

        is_exception = bool(row.is_exception) or source_type in {"archive", "marketplace_exception"}
        if is_exception:
            report.summary.exception_count += 1
            report.exception_report.append(
                {
                    "media_id": str(row.id),
                    "storage_path": row.storage_path,
                    "source_type": source_type,
                    "exception_reason": row.exception_reason,
                    "approval_status": approval_status,
                    "rights_status": rights_status,
                }
            )

        if source_type in {"archive", "marketplace_exception", "unknown"} and not bool(
            row.is_exception
        ):
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="warn",
                        category="non_official_source_missing_exception_flag",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail=f"source_type={source_type or 'unknown'} should be marked as exception",
                        suggested_fix="ตั้ง is_exception=true พร้อม reason เมื่อเป็นแหล่ง non-official",
                    )
                )

        if source_type == "marketplace_exception" and not (row.exception_reason or "").strip():
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="error",
                        category="marketplace_exception_missing_reason",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail="marketplace exception asset must include exception_reason",
                        suggested_fix="เติม exception_reason พร้อมหลักฐานอนุมัติ",
                    )
                )

        rights_blocked = rights_status in {"rejected", "restricted"}
        approval_blocked = approval_status in {"rejected", "blocked"}
        if rights_blocked or approval_blocked:
            report.summary.rejected_or_restricted_count += 1
            report.summary.blocked_items_count += 1
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="error",
                        category="blocked_rights_or_approval",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail=f"rights_status={rights_status} approval_status={approval_status}",
                        suggested_fix="แทนที่ asset หรือขออนุมัติใหม่ก่อนใช้งาน",
                    )
                )

        if approval_status == "approved" and rights_status not in {
            "approved",
            "licensed",
            "exception_allowed",
        }:
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="error",
                        category="approval_rights_mismatch",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail=f"approval_status=approved but rights_status={rights_status}",
                        suggested_fix="ปรับ rights_status ให้สอดคล้องหรือ revert approval",
                    )
                )

        if rights_status in {"approved", "licensed"} and approval_status not in {"approved"}:
            if len(report.findings) < findings_limit:
                report.add(
                    SourceRightsFinding(
                        severity="warn",
                        category="rights_approval_mismatch",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail=f"rights_status={rights_status} but approval_status={approval_status}",
                        suggested_fix="อนุมัติ approval_status หรือคืน rights_status เป็น pending_review",
                    )
                )

        linked_projects = project_links.get(row.storage_path, set())
        linked_properties = property_links.get(row.storage_path, set())

        if (row.linked_entity_hint or "").startswith("project:"):
            linked_projects.add((row.linked_entity_hint or "").split(":", 1)[1])
        if (row.linked_entity_hint or "").startswith("property:"):
            linked_properties.add((row.linked_entity_hint or "").split(":", 1)[1])

        report.summary.linked_projects_count += len(linked_projects)
        report.summary.linked_properties_count += len(linked_properties)

    if report.summary.pending_approval_count > pending_threshold:
        report.add(
            SourceRightsFinding(
                severity="error",
                category="pending_threshold_exceeded",
                media_id="summary",
                storage_path="",
                detail=(
                    f"pending approvals={report.summary.pending_approval_count} exceeds "
                    f"threshold={pending_threshold}"
                ),
                suggested_fix="เคลียร์ approval queue หรือปรับ threshold ตาม policy",
            )
        )

    report.top_domains = [
        {"source_domain": domain, "count": count}
        for domain, count in domain_counter.most_common(10)
    ]
    report.top_source_types = [
        {"source_type": source_type, "count": count}
        for source_type, count in source_type_counter.most_common(10)
    ]

    return report


def print_source_rights_summary(report: SourceRightsReport) -> None:
    s = report.summary
    print(f"\n=== Source & Rights Registry Report — {s.scanned_at} ===")
    print(f"  Total media assets         : {s.total_media_assets}")
    print(f"  Errors / Warnings          : {s.errors} / {s.warnings}")
    print(f"  Missing source metadata    : {s.missing_source_metadata_count}")
    print(f"  Missing last_checked       : {s.missing_last_checked_count}")
    print(f"  Exception count            : {s.exception_count}")
    print(f"  Pending approval           : {s.pending_approval_count}")
    print(f"  Blocked items              : {s.blocked_items_count}")
    print(f"  Linked projects/properties : {s.linked_projects_count}/{s.linked_properties_count}")
    print(f"  Unknown source_type        : {s.unknown_source_type_count}")
    print("  ----------------------------------------")
    if report.top_domains:
        print("  Top domains:")
        for item in report.top_domains[:5]:
            print(f"    - {item['source_domain']}: {item['count']}")
    else:
        print("  Top domains: (none)")
    print("===========================================")
