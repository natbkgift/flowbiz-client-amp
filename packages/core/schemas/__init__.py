"""
Core schemas for AMP Property Marketing System.
"""

from packages.core.schemas.base import BaseResponse
from packages.core.schemas.enums import (
    AdChannel,
    ContentFormat,
    LeadFormType,
    LeadPriority,
    LeadSource,
    LeadStatus,
    NotificationChannel,
    PropertyIntent,
    PropertyStatus,
    PropertyType,
    TargetAudience,
)
from packages.core.schemas.error import ErrorResponse
from packages.core.schemas.health import HealthResponse, MetaResponse
from packages.core.schemas.leads import (
    LeadBase,
    LeadContact,
    LeadCreate,
    LeadListResponse,
    LeadNotificationStatus,
    LeadQualification,
    LeadResponse,
    LeadUpdate,
    LeadUTM,
    LeadWebhookPayload,
)
from packages.core.schemas.properties import (
    PropertyBase,
    PropertyCreate,
    PropertyListResponse,
    PropertyLocation,
    PropertyMarketingConfig,
    PropertyMedia,
    PropertyPricing,
    PropertyResponse,
    PropertySpecs,
    PropertyUpdate,
)

__all__ = [
    # Base
    "BaseResponse",
    "ErrorResponse",
    "HealthResponse",
    "MetaResponse",
    # Enums
    "PropertyIntent",
    "PropertyType",
    "PropertyStatus",
    "TargetAudience",
    "AdChannel",
    "ContentFormat",
    "LeadSource",
    "LeadStatus",
    "LeadPriority",
    "LeadFormType",
    "NotificationChannel",
    # Properties
    "PropertyMedia",
    "PropertyLocation",
    "PropertySpecs",
    "PropertyPricing",
    "PropertyMarketingConfig",
    "PropertyBase",
    "PropertyCreate",
    "PropertyUpdate",
    "PropertyResponse",
    "PropertyListResponse",
    # Leads
    "LeadContact",
    "LeadUTM",
    "LeadQualification",
    "LeadNotificationStatus",
    "LeadBase",
    "LeadCreate",
    "LeadUpdate",
    "LeadResponse",
    "LeadListResponse",
    "LeadWebhookPayload",
]
