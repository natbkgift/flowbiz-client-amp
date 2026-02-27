from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.models import MediaAsset

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
}


@dataclass
class SourceRightsFinding:
    severity: str
    category: str
    media_id: str
    storage_path: str
    detail: str

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
    errors: int = 0
    warnings: int = 0


@dataclass
class SourceRightsReport:
    summary: SourceRightsSummary = field(default_factory=SourceRightsSummary)
    findings: list[SourceRightsFinding] = field(default_factory=list)
    top_domains: list[dict[str, int | str]] = field(default_factory=list)

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



def _is_missing_source_metadata(row: MediaAsset) -> bool:
    return not (row.source_type and row.rights_status and row.source_domain and row.source_url)



def build_source_rights_report(
    db: Session,
    *,
    pending_threshold: int = 5,
    findings_limit: int = 200,
) -> SourceRightsReport:
    report = SourceRightsReport()
    report.summary.scanned_at = datetime.now(timezone.utc).isoformat()

    rows = db.scalars(select(MediaAsset).order_by(MediaAsset.created_at.desc())).all()
    report.summary.total_media_assets = len(rows)

    domain_counter: Counter[str] = Counter()

    for row in rows:
        source_type = normalize_source_type(row.source_type)
        rights_status = normalize_rights_status(row.rights_status)
        approval_status = normalize_approval_status(row.approval_status)
        source_domain = (row.source_domain or "").strip().lower()

        if source_domain:
            domain_counter[source_domain] += 1

        if source_type in {None, "unknown"}:
            report.summary.unknown_source_type_count += 1

        if _is_missing_source_metadata(row):
            report.summary.missing_source_metadata_count += 1
            if len(report.findings) < findings_limit:
                report.add(SourceRightsFinding(
                    severity="warn",
                    category="missing_source_metadata",
                    media_id=str(row.id),
                    storage_path=row.storage_path,
                    detail="source_type/rights_status/source_domain/source_url are incomplete",
                ))

        if approval_status == "pending":
            report.summary.pending_approval_count += 1

        is_exception = bool(row.is_exception) or source_type in {"archive", "marketplace_exception"}
        if is_exception:
            report.summary.exception_count += 1
            if source_type == "marketplace_exception" and not (row.exception_reason or "").strip():
                if len(report.findings) < findings_limit:
                    report.add(SourceRightsFinding(
                        severity="error",
                        category="marketplace_exception_missing_reason",
                        media_id=str(row.id),
                        storage_path=row.storage_path,
                        detail="marketplace exception asset must include exception_reason",
                    ))

        if rights_status in {"rejected", "restricted"}:
            report.summary.rejected_or_restricted_count += 1
            if len(report.findings) < findings_limit:
                report.add(SourceRightsFinding(
                    severity="error",
                    category="rejected_or_restricted_asset",
                    media_id=str(row.id),
                    storage_path=row.storage_path,
                    detail=f"rights_status={rights_status} requires replacement/approval",
                ))

    if report.summary.pending_approval_count > pending_threshold:
        report.add(SourceRightsFinding(
            severity="error",
            category="pending_threshold_exceeded",
            media_id="summary",
            storage_path="",
            detail=(
                f"pending approvals={report.summary.pending_approval_count} exceeds "
                f"threshold={pending_threshold}"
            ),
        ))

    report.top_domains = [
        {"source_domain": domain, "count": count}
        for domain, count in domain_counter.most_common(10)
    ]

    return report



def print_source_rights_summary(report: SourceRightsReport) -> None:
    s = report.summary
    print(f"\n=== Source & Rights Registry Report — {s.scanned_at} ===")
    print(f"  Total media assets         : {s.total_media_assets}")
    print(f"  Missing source metadata    : {s.missing_source_metadata_count}")
    print(f"  Pending approval           : {s.pending_approval_count}")
    print(f"  Exceptions                 : {s.exception_count}")
    print(f"  Rejected/Restricted        : {s.rejected_or_restricted_count}")
    print(f"  Unknown source_type        : {s.unknown_source_type_count}")
    print("  ----------------------------------------")
    print(f"  ERRORS                     : {s.errors}")
    print(f"  WARNINGS                   : {s.warnings}")
    print("===========================================")
