from __future__ import annotations

from dataclasses import asdict, dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.models import MediaAsset


@dataclass
class GovernanceMessage:
    level: str
    path: str
    detail: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


@dataclass
class GovernanceResult:
    errors: list[GovernanceMessage]
    warnings: list[GovernanceMessage]

    def as_dict(self) -> dict[str, list[dict[str, str]]]:
        return {
            "errors": [item.to_dict() for item in self.errors],
            "warnings": [item.to_dict() for item in self.warnings],
        }


def collect_project_media_paths(
    *,
    cover_image_url: str | None,
    hero_image_url: str | None,
    images: list[str] | None,
) -> list[str]:
    ordered: list[str] = []
    for value in [cover_image_url, hero_image_url, *(images or [])]:
        path = str(value or "").strip()
        if not path:
            continue
        if path not in ordered:
            ordered.append(path)
    return ordered


def _is_local_media_path(value: str) -> bool:
    return value.startswith("/media/")


def evaluate_project_media_governance(
    db: Session,
    *,
    paths: list[str],
) -> GovernanceResult:
    errors: list[GovernanceMessage] = []
    warnings: list[GovernanceMessage] = []

    for path in paths:
        if not _is_local_media_path(path):
            errors.append(
                GovernanceMessage(
                    level="error",
                    path=path,
                    detail="media path must be local and start with /media/",
                )
            )

    local_paths = [path for path in paths if _is_local_media_path(path)]
    if not local_paths:
        return GovernanceResult(errors=errors, warnings=warnings)

    assets = db.scalars(select(MediaAsset).where(MediaAsset.storage_path.in_(local_paths))).all()
    by_path = {asset.storage_path: asset for asset in assets}

    for path in local_paths:
        asset = by_path.get(path)
        if asset is None:
            errors.append(
                GovernanceMessage(
                    level="error",
                    path=path,
                    detail="media asset not found in registry",
                )
            )
            continue

        if asset.status != "active":
            errors.append(
                GovernanceMessage(
                    level="error",
                    path=path,
                    detail=f"media asset status={asset.status} is not publishable",
                )
            )

        rights_status = (asset.rights_status or "").strip().lower()
        approval_status = (asset.approval_status or "pending").strip().lower() or "pending"

        if rights_status in {"restricted", "rejected"} or approval_status == "rejected":
            errors.append(
                GovernanceMessage(
                    level="error",
                    path=path,
                    detail=(
                        "rights governance blocked this asset "
                        f"(rights_status={rights_status or 'unknown'}, approval_status={approval_status})"
                    ),
                )
            )
            continue

        if approval_status == "pending" or rights_status in {"pending_review", "exception_allowed"}:
            warnings.append(
                GovernanceMessage(
                    level="warn",
                    path=path,
                    detail=(
                        "asset is still pending governance review "
                        f"(rights_status={rights_status or 'unknown'}, approval_status={approval_status})"
                    ),
                )
            )

        if bool(asset.is_exception):
            warnings.append(
                GovernanceMessage(
                    level="warn",
                    path=path,
                    detail="asset is marked as rights exception",
                )
            )

    return GovernanceResult(errors=errors, warnings=warnings)
