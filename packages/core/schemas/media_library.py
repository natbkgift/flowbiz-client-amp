from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class MediaAssetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    storage_path: str
    kind: str
    mime_type: str
    file_size_bytes: int
    width: int | None = None
    height: int | None = None
    checksum_sha256: str

    title: str | None = None
    alt_text_en: str | None = None
    alt_text_th: str | None = None
    caption_en: str | None = None
    caption_th: str | None = None
    tags: list[str] | None = None

    source_url: str | None = None
    source_page_url: str | None = None
    source_domain: str | None = None
    source_type: str | None = None
    rights_status: str | None = None
    approval_status: str | None = None
    approval_note: str | None = None
    approved_by: str | None = None
    approved_at: datetime | None = None
    last_checked_at: datetime | None = None
    rights_note: str | None = None
    license_evidence_url: str | None = None
    exception_reason: str | None = None
    is_exception: bool = False
    usage_scope: str | None = None
    linked_entity_hint: str | None = None
    credit: str | None = None

    focal_x: Decimal | None = None
    focal_y: Decimal | None = None

    status: str
    created_at: datetime
    updated_at: datetime


class MediaAssetListResponse(BaseModel):
    data: list[MediaAssetItem]
    meta: dict[str, int]


class MediaAssetUploadResponse(BaseModel):
    item: MediaAssetItem
    deduped: bool = False


class MediaAssetUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    alt_text_en: str | None = Field(default=None, max_length=500)
    alt_text_th: str | None = Field(default=None, max_length=500)
    caption_en: str | None = None
    caption_th: str | None = None
    tags: list[str] | None = None
    source_url: HttpUrl | None = None
    source_page_url: HttpUrl | None = None
    source_type: str | None = Field(default=None, max_length=64)
    rights_status: str | None = Field(default=None, max_length=64)
    approval_status: str | None = Field(default=None, max_length=32)
    approval_note: str | None = None
    approved_by: str | None = Field(default=None, max_length=255)
    approved_at: datetime | None = None
    last_checked_at: datetime | None = None
    rights_note: str | None = None
    license_evidence_url: HttpUrl | None = None
    exception_reason: str | None = None
    is_exception: bool | None = None
    usage_scope: str | None = Field(default=None, max_length=255)
    linked_entity_hint: str | None = Field(default=None, max_length=255)
    credit: str | None = Field(default=None, max_length=255)
    focal_x: Decimal | None = Field(default=None, ge=0, le=100)
    focal_y: Decimal | None = Field(default=None, ge=0, le=100)


class MediaAssetIngestRequest(BaseModel):
    source_url: HttpUrl
    title: str | None = Field(default=None, max_length=255)
    source_page_url: HttpUrl | None = None
    source_type: str | None = Field(default=None, max_length=64)
    rights_status: str | None = Field(default=None, max_length=64)
    approval_status: str | None = Field(default=None, max_length=32)
    approval_note: str | None = None
    rights_note: str | None = None
    license_evidence_url: HttpUrl | None = None
    exception_reason: str | None = None
    is_exception: bool | None = None
    usage_scope: str | None = Field(default=None, max_length=255)
    linked_entity_hint: str | None = Field(default=None, max_length=255)
    credit: str | None = Field(default=None, max_length=255)
    tags: list[str] | None = None


class MediaAssetAssignPropertyRequest(BaseModel):
    property_source_id: str = Field(min_length=1, max_length=255)
    set_as_cover: bool = True
    append_to_local_images: bool = True


class MediaAssetAssignResponse(BaseModel):
    property_id: UUID
    property_source_id: str
    assigned_path: str
    cover_image: str | None
    local_images: list[str] | None


class MediaSourceRightsReportResponse(BaseModel):
    summary: dict[str, int]
    top_domains: list[dict[str, int | str]]


class MediaSourceRightsUpdate(BaseModel):
    source_url: HttpUrl | None = None
    source_page_url: HttpUrl | None = None
    source_type: str | None = Field(default=None, max_length=64)
    rights_status: str | None = Field(default=None, max_length=64)
    approval_status: str | None = Field(default=None, max_length=32)
    approval_note: str | None = None
    approved_by: str | None = Field(default=None, max_length=255)
    approved_at: datetime | None = None
    last_checked_at: datetime | None = None
    rights_note: str | None = None
    license_evidence_url: HttpUrl | None = None
    exception_reason: str | None = None
    is_exception: bool | None = None
    usage_scope: str | None = Field(default=None, max_length=255)
    linked_entity_hint: str | None = Field(default=None, max_length=255)
    credit: str | None = Field(default=None, max_length=255)
