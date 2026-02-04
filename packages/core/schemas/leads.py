"""
Lead schemas for AMP Property Marketing System.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from packages.core.schemas.base import BaseResponse
from packages.core.schemas.enums import (
    LeadPriority,
    LeadSource,
    LeadStatus,
    PropertyIntent,
)


class LeadContact(BaseModel):
    """Lead contact information."""

    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    preferred_contact: str = "phone"  # phone, email, line, whatsapp
    language: str = "th"  # th, en, zh, ru


class LeadUTM(BaseModel):
    """UTM tracking parameters."""

    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    utm_term: Optional[str] = None


class LeadQualification(BaseModel):
    """Lead qualification data."""

    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    timeline: Optional[str] = None  # immediate, 1-3months, 3-6months, 6months+
    purpose: Optional[str] = None  # investment, residence, both
    property_type_preference: Optional[str] = None
    area_preference: Optional[str] = None
    bedrooms_preference: Optional[int] = Field(default=None, ge=0)


class LeadNotificationStatus(BaseModel):
    """Status of notifications sent for this lead."""

    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    line_sent: bool = False
    line_sent_at: Optional[datetime] = None
    sms_sent: bool = False
    sms_sent_at: Optional[datetime] = None


class LeadBase(BaseModel):
    """Base lead model."""

    lead_id: Optional[str] = None  # Auto-generated if not provided

    # Source
    source: LeadSource
    source_campaign: Optional[str] = None
    source_property_id: Optional[str] = None
    source_property_intent: Optional[PropertyIntent] = None

    # Contact
    contact: LeadContact

    # Qualification
    qualification: LeadQualification = LeadQualification()

    # UTM
    utm: LeadUTM = LeadUTM()

    # Status
    status: LeadStatus = LeadStatus.NEW
    priority: LeadPriority = LeadPriority.WARM

    # Assignment
    assigned_agent: Optional[str] = None

    # Notes
    message: Optional[str] = None
    notes: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    next_follow_up: Optional[datetime] = None


class LeadCreate(LeadBase):
    """Schema for creating a new lead."""

    pass


class LeadUpdate(BaseModel):
    """Schema for updating a lead."""

    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    assigned_agent: Optional[str] = None
    notes: Optional[str] = None
    next_follow_up: Optional[datetime] = None
    contact: Optional[LeadContact] = None
    qualification: Optional[LeadQualification] = None


class LeadResponse(LeadBase, BaseResponse):
    """Response model for a single lead."""

    notification_status: LeadNotificationStatus = LeadNotificationStatus()


class LeadListResponse(BaseResponse):
    """Response model for lead list."""

    items: list[LeadResponse]
    total: int
    page: int = 1
    limit: int = 20


class LeadWebhookPayload(BaseModel):
    """Payload received from Make.com webhook for new leads."""

    # Source info
    source: str  # fb_lead_form, fb_messenger, whatsapp, etc.
    source_campaign: Optional[str] = None
    property_id: Optional[str] = None
    property_intent: Optional[str] = None

    # Contact info
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: str
    language: Optional[str] = "en"

    # Qualification
    budget: Optional[str] = None
    timeline: Optional[str] = None
    purpose: Optional[str] = None
    message: Optional[str] = None

    # UTM
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None

    # Meta
    timestamp: Optional[str] = None
    page_url: Optional[str] = None
