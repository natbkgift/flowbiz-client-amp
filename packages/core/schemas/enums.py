"""
Core enums for AMP Property Marketing System.
Defines property types, audiences, channels, and campaign configurations.
"""

from enum import Enum


class PropertyIntent(str, Enum):
    """Property listing intent/purpose."""

    SALE_NEW = "sale_new"  # โครงการใหม่
    SALE_RESALE = "sale_resale"  # Resale มือสอง
    RENT_LONG = "rent_long"  # เช่าระยะยาว (6+ months)
    RENT_SHORT = "rent_short"  # เช่าระยะสั้น (vacation/holiday)


class PropertyType(str, Enum):
    """Type of property."""

    CONDO = "condo"
    HOUSE = "house"
    VILLA = "villa"
    TOWNHOME = "townhome"
    LAND = "land"
    COMMERCIAL = "commercial"
    OTHER = "other"


class PropertyStatus(str, Enum):
    """Property listing status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"
    SOLD = "sold"
    RENTED = "rented"


class TargetAudience(str, Enum):
    """Target audience segments for marketing."""

    THAI_INVESTOR = "thai_investor"
    THAI_BUYER = "thai_buyer"
    EXPAT_BUYER = "expat_buyer"
    EXPAT_RENTER = "expat_renter"
    WORKING_EXPAT = "working_expat"
    DIGITAL_NOMAD = "digital_nomad"
    RETIREE = "retiree"
    TOURIST = "tourist"
    CHINESE_INVESTOR = "chinese_investor"
    RUSSIAN_BUYER = "russian_buyer"


class AdChannel(str, Enum):
    """Advertising/marketing channels."""

    FB_ADS = "fb_ads"
    FB_MARKETPLACE = "fb_marketplace"
    FB_GROUPS = "fb_groups"
    FB_PAGE = "fb_page"
    FB_PROFILE = "fb_profile"
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORY = "instagram_story"
    INSTAGRAM_REELS = "instagram_reels"
    GOOGLE_ADS = "google_ads"
    LINE_OA = "line_oa"
    WHATSAPP = "whatsapp"
    WEBSITE = "website"


class ContentFormat(str, Enum):
    """Content format types for ads/posts."""

    VIDEO = "video"
    CAROUSEL = "carousel"
    SINGLE_IMAGE = "single_image"
    STORY = "story"
    REEL = "reel"
    ALBUM = "album"
    TEXT_ONLY = "text_only"


class LeadSource(str, Enum):
    """Source of lead acquisition."""

    FB_LEAD_FORM = "fb_lead_form"
    FB_MESSENGER = "fb_messenger"
    FB_MARKETPLACE = "fb_marketplace"
    FB_COMMENT = "fb_comment"
    INSTAGRAM_DM = "instagram_dm"
    WHATSAPP_QR = "whatsapp_qr"
    WHATSAPP_DIRECT = "whatsapp_direct"
    LINE_OA = "line_oa"
    WEBSITE_FORM = "website_form"
    PHONE_CALL = "phone_call"
    WALK_IN = "walk_in"
    REFERRAL = "referral"


class LeadStatus(str, Enum):
    """Lead pipeline status."""

    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    VIEWING_SCHEDULED = "viewing_scheduled"
    VIEWING_DONE = "viewing_done"
    NEGOTIATING = "negotiating"
    CONVERTED = "converted"
    LOST = "lost"
    ARCHIVED = "archived"


class LeadPriority(str, Enum):
    """Lead priority/temperature."""

    HOT = "hot"  # Ready to buy/rent now
    WARM = "warm"  # Interested, needs nurturing
    COLD = "cold"  # Early stage, browsing
    DEAD = "dead"  # No response/not qualified


class LeadFormType(str, Enum):
    """Type of lead form based on property intent."""

    FULL_QUALIFICATION = "full_qualification"  # For new projects
    SIMPLE = "simple"  # For resale
    RENTAL_QUALIFICATION = "rental_qualification"  # For long-term rental
    BOOKING = "booking"  # For short-term rental


class NotificationChannel(str, Enum):
    """Notification delivery channels."""

    EMAIL = "email"
    LINE_NOTIFY = "line_notify"
    LINE_OA = "line_oa"
    TELEGRAM = "telegram"
    SLACK = "slack"
    WHATSAPP = "whatsapp"
    SMS = "sms"
