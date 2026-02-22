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
    """Catalog property type -- Blueprint Doc 06 canonical 7 values.

    Used on both projects.property_type and properties.property_type
    columns (text column, application-level validation, no PostgreSQL ENUM).
    """

    CONDO = "condo"
    VILLA = "villa"
    HOUSE = "house"
    LAND = "land"
    HOTEL = "hotel"
    SHOP = "shop"
    OFFICE = "office"


class TransactionType(str, Enum):
    """Transaction type (properties.type column) -- Blueprint Doc 06."""

    NEW = "new"  # New development from developer
    RESALE = "resale"  # Secondary market / owner listing
    RENT = "rent"  # Rental listing


class PropertyStatus(str, Enum):
    """Property listing status -- Blueprint Doc 06 canonical values."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


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
    EUROPEAN_BUYER = "european_buyer"
    HOLIDAY_HOME_SEEKER = "holiday_home_seeker"
    THAI_LUXURY_BUYER = "thai_luxury_buyer"
    THAI_GENERAL_BUYER = "thai_general_buyer"


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


class MediaType(str, Enum):
    """Media content types for property listings."""

    PHOTO = "photo"
    VIDEO = "video"
    VIRTUAL_TOUR = "virtual_tour"


class FurnishingType(str, Enum):
    """Property furnishing status -- Blueprint Doc 06 canonical values."""

    UNFURNISHED = "unfurnished"
    PARTIAL = "partial"
    FULLY_FURNISHED = "fully_furnished"


class ViewType(str, Enum):
    """Property view types -- Blueprint Doc 06 canonical values."""

    SEA = "sea"
    CITY = "city"
    GARDEN = "garden"
    POOL = "pool"


class Language(str, Enum):
    """Supported languages for communication."""

    THAI = "th"
    ENGLISH = "en"
    CHINESE = "zh"
    RUSSIAN = "ru"


class ContactPreference(str, Enum):
    """Preferred contact method."""

    PHONE = "phone"
    EMAIL = "email"
    LINE = "line"
    WHATSAPP = "whatsapp"


class Timeline(str, Enum):
    """Lead timeline for purchase/rental."""

    IMMEDIATE = "immediate"
    ONE_TO_THREE_MONTHS = "1-3months"
    THREE_TO_SIX_MONTHS = "3-6months"
    SIX_MONTHS_PLUS = "6months+"


class Purpose(str, Enum):
    """Lead purpose for property."""

    INVESTMENT = "investment"
    RESIDENCE = "residence"
    BOTH = "both"
