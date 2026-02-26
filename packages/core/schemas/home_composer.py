from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HomeComposerGovernanceMessage(BaseModel):
    level: str
    path: str
    detail: str


class HomeComposerValidationResult(BaseModel):
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    media_warnings: list[HomeComposerGovernanceMessage] = Field(default_factory=list)


class HomeComposerUpsertRequest(BaseModel):
    page_key: str = Field(default="home", min_length=1, max_length=100)
    locale: str = Field(default="en", min_length=2, max_length=8)
    config: dict = Field(default_factory=dict)


class HomeComposerPatchRequest(BaseModel):
    config: dict


class HomeComposerItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_key: str
    locale: str
    status: str
    version: int
    config: dict
    updated_by: str | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class HomeComposerBundleResponse(BaseModel):
    page_key: str
    locale: str
    draft: HomeComposerItem | None = None
    published: HomeComposerItem | None = None


class HomeComposerPublishResponse(BaseModel):
    item: HomeComposerItem
    validation: HomeComposerValidationResult


class HomeComposerPublicResponse(BaseModel):
    page_key: str
    locale: str
    version: int
    updated_at: datetime
    config: dict


class HomeComposerCandidateProject(BaseModel):
    id: UUID
    slug: str
    name: str
    status: str
    cover_image_url: str | None = None


class HomeComposerCandidateProperty(BaseModel):
    id: UUID
    source_id: str
    slug: str | None
    title: str
    type: str
    status: str
    cover_image: str | None = None


class HomeComposerCandidateArea(BaseModel):
    id: UUID
    slug: str
    name: str
    status: str


class HomeComposerCandidateDeveloper(BaseModel):
    id: UUID
    slug: str
    name: str
    status: str
