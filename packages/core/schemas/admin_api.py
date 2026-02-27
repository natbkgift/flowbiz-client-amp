from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LeadAdminItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    score: int
    status: str
    source_page: str | None = None
    purpose: str | None = None
    owner_user_id: UUID | None = None
    follow_up_due_at: datetime | None = None
    is_duplicate_hint: bool = False
    is_spam_hint: bool = False
    created_at: datetime
    updated_at: datetime | None = None


class LeadStatusUpdate(BaseModel):
    status: str


class LeadAssignRequest(BaseModel):
    owner_user_id: UUID | None = None
    reason: str | None = Field(default=None, max_length=200)


class LeadNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class LeadNoteUpdate(BaseModel):
    note: str = Field(min_length=1, max_length=2000)


class LeadTimelineEvent(BaseModel):
    id: UUID
    lead_id: UUID
    action: str
    actor_user_id: UUID | None = None
    note_id: str | None = None
    note: str | None = None
    diff: dict | None = None
    created_at: datetime


class SeoOverrideItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    path: str
    locale: str
    title: str | None = None
    description: str | None = None
    canonical: str | None = None
    robots_index: bool
    robots_follow: bool
    schema_org_name: str | None = None
    schema_local_business_name: str | None = None
    schema_article_author: str | None = None
    enabled: bool
    created_at: datetime
    updated_at: datetime


class SeoOverrideUpsert(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    locale: str = Field(min_length=2, max_length=8)
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    canonical: str | None = Field(default=None, max_length=1000)
    robots_index: bool = True
    robots_follow: bool = True
    schema_org_name: str | None = Field(default=None, max_length=255)
    schema_local_business_name: str | None = Field(default=None, max_length=255)
    schema_article_author: str | None = Field(default=None, max_length=255)
    enabled: bool = True


class RedirectRuleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    old_path: str
    new_path: str
    status_code: int
    enabled: bool
    preserve_query: bool
    created_at: datetime
    updated_at: datetime


class RedirectRuleCreate(BaseModel):
    old_path: str = Field(min_length=1, max_length=500)
    new_path: str = Field(min_length=1, max_length=500)
    status_code: int = Field(default=301)
    enabled: bool = True
    preserve_query: bool = True


class RedirectRuleUpdate(BaseModel):
    new_path: str | None = Field(default=None, min_length=1, max_length=500)
    status_code: int | None = None
    enabled: bool | None = None
    preserve_query: bool | None = None
