from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.media_path_policy import is_library_media_path, is_local_media_path
from packages.core.models import MediaAsset


@dataclass
class MediaGovernanceIssue:
    level: str
    path: str
    detail: str

    def to_dict(self) -> dict[str, str]:
        return {"level": self.level, "path": self.path, "detail": self.detail}


@dataclass
class MediaGovernanceResult:
    errors: list[MediaGovernanceIssue]
    warnings: list[MediaGovernanceIssue]


def evaluate_project_media_governance(db: Session, *, paths: list[str]) -> MediaGovernanceResult:
    errors: list[MediaGovernanceIssue] = []
    warnings: list[MediaGovernanceIssue] = []

    seen: set[str] = set()
    for path in paths:
        item = str(path or "").strip()
        if not item or item in seen:
            continue
        seen.add(item)
        if not is_local_media_path(item):
            errors.append(
                MediaGovernanceIssue(
                    level="error",
                    path=item,
                    detail="media path must use local /media/library/ path",
                )
            )
            continue

        if not is_library_media_path(item):
            errors.append(
                MediaGovernanceIssue(
                    level="error",
                    path=item,
                    detail="media path must use local /media/library/ path",
                )
            )
            continue

        asset = db.scalar(select(MediaAsset).where(MediaAsset.storage_path == item))
        if asset is None:
            warnings.append(
                MediaGovernanceIssue(
                    level="warning",
                    path=item,
                    detail="media asset not found in media library",
                )
            )
            continue

        rights = (asset.rights_status or "").lower()
        approval = (asset.approval_status or "").lower()

        if rights == "restricted" or approval in {"rejected", "blocked"}:
            errors.append(
                MediaGovernanceIssue(
                    level="error",
                    path=item,
                    detail="media rights are restricted",
                )
            )
            continue

        if approval != "approved" or rights not in {"approved", "licensed"}:
            warnings.append(
                MediaGovernanceIssue(
                    level="warning",
                    path=item,
                    detail="media rights are not fully approved",
                )
            )

        if bool(asset.is_exception):
            warnings.append(
                MediaGovernanceIssue(
                    level="warning",
                    path=item,
                    detail="media uses exception flow",
                )
            )

    return MediaGovernanceResult(errors=errors, warnings=warnings)
