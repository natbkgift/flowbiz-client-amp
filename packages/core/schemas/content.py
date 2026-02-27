from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class LocalizedText(BaseModel):
    en: str = ""
    th: str = ""


class ContentLink(BaseModel):
    label: LocalizedText
    href: str


class ContentSummaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: LocalizedText
    excerpt: LocalizedText | None = None
    category: LocalizedText | None = None
    read_time: LocalizedText | None = None
    published_at: datetime | None = None
    updated_at: datetime
    hero_image_url: str | None = None


class BlogPostDetailResponse(ContentSummaryItem):
    body: dict[str, list[str]]
    related_guides: list[str] = []
    links: list[ContentLink] = []


class GuideDetailResponse(ContentSummaryItem):
    summary: LocalizedText | None = None
    checklist: dict[str, list[str]]
    related_blog_posts: list[str] = []
    links: list[ContentLink] = []


class ContentHeroIngestRequest(BaseModel):
    source_url: HttpUrl
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
    title: str | None = Field(default=None, max_length=255)
    tags: list[str] | None = None
    publish_now: bool = False


class ContentHeroIngestResponse(BaseModel):
    article_id: UUID
    article_slug: str
    hero_image_url: str
    hero_media_asset_id: UUID
    deduped: bool = False
    published: bool = False
