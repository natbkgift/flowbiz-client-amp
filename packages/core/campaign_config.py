"""
Campaign configuration matrix for different property types.
Maps property intents to appropriate marketing strategies.
"""

from packages.core.schemas.enums import (
    AdChannel,
    ContentFormat,
    LeadFormType,
    LeadPriority,
    TargetAudience,
)

# Campaign configuration matrix
CAMPAIGN_MATRIX = {
    "sale_new": {
        "name": "New Project Campaign",
        "description": "For new development projects - focus on branding and qualified leads",
        "channels": [
            AdChannel.FB_ADS,
            AdChannel.INSTAGRAM_FEED,
            AdChannel.INSTAGRAM_REELS,
            AdChannel.GOOGLE_ADS,
        ],
        "formats": [
            ContentFormat.VIDEO,
            ContentFormat.CAROUSEL,
            ContentFormat.REEL,
        ],
        "audiences": [
            TargetAudience.THAI_INVESTOR,
            TargetAudience.EXPAT_BUYER,
            TargetAudience.CHINESE_INVESTOR,
            TargetAudience.RETIREE,
        ],
        "lead_form_type": LeadFormType.FULL_QUALIFICATION,
        "default_priority": LeadPriority.HOT,
        "budget_allocation": {
            "fb_ads": 0.50,
            "instagram": 0.25,
            "google_ads": 0.25,
        },
        "target_cpl_thb": 500,
        "follow_up_hours": 1,
        "notifications": ["email", "line_notify"],
    },
    "sale_resale": {
        "name": "Resale Property Campaign",
        "description": "For resale/secondary market - focus on quick sale and multiple inquiries",
        "channels": [
            AdChannel.FB_MARKETPLACE,
            AdChannel.FB_GROUPS,
            AdChannel.FB_PAGE,
            AdChannel.FB_PROFILE,
        ],
        "formats": [
            ContentFormat.SINGLE_IMAGE,
            ContentFormat.CAROUSEL,
            ContentFormat.ALBUM,
        ],
        "audiences": [
            TargetAudience.EXPAT_BUYER,
            TargetAudience.THAI_BUYER,
            TargetAudience.RETIREE,
        ],
        "lead_form_type": LeadFormType.SIMPLE,
        "default_priority": LeadPriority.WARM,
        "budget_allocation": {
            "fb_marketplace": 0.50,
            "fb_groups": 0.30,
            "fb_page": 0.20,
        },
        "target_cpl_thb": 200,
        "follow_up_hours": 2,
        "notifications": ["email", "line_notify"],
    },
    "rent_long": {
        "name": "Long-term Rental Campaign",
        "description": "For rentals 6+ months - focus on quality tenants",
        "channels": [
            AdChannel.FB_GROUPS,
            AdChannel.FB_MARKETPLACE,
            AdChannel.LINE_OA,
        ],
        "formats": [
            ContentFormat.SINGLE_IMAGE,
            ContentFormat.CAROUSEL,
        ],
        "audiences": [
            TargetAudience.WORKING_EXPAT,
            TargetAudience.EXPAT_RENTER,
            TargetAudience.DIGITAL_NOMAD,
            TargetAudience.RETIREE,
        ],
        "lead_form_type": LeadFormType.RENTAL_QUALIFICATION,
        "default_priority": LeadPriority.WARM,
        "budget_allocation": {
            "fb_groups": 0.60,
            "fb_marketplace": 0.40,
        },
        "target_cpl_thb": 100,
        "follow_up_hours": 4,
        "notifications": ["email", "line_notify"],
    },
    "rent_short": {
        "name": "Short-term Rental Campaign",
        "description": "For vacation/holiday rentals - focus on bookings",
        "channels": [
            AdChannel.INSTAGRAM_REELS,
            AdChannel.INSTAGRAM_STORY,
            AdChannel.FB_ADS,
        ],
        "formats": [
            ContentFormat.REEL,
            ContentFormat.STORY,
            ContentFormat.VIDEO,
        ],
        "audiences": [
            TargetAudience.TOURIST,
            TargetAudience.DIGITAL_NOMAD,
        ],
        "lead_form_type": LeadFormType.BOOKING,
        "default_priority": LeadPriority.HOT,
        "budget_allocation": {
            "instagram": 0.60,
            "fb_ads": 0.40,
        },
        "target_cpl_thb": 150,
        "follow_up_hours": 1,
        "notifications": ["email", "whatsapp"],
    },
}

# Hashtag configurations
HASHTAG_CONFIG = {
    "sale_new": {
        "primary": [
            "#PattayaProperty",
            "#PattayaCondo",
            "#NewProject",
            "#PropertyInvestment",
            "#ThailandRealEstate",
        ],
        "secondary": [
            "#ForeignOwnership",
            "#CondoForSale",
            "#InvestmentProperty",
            "#BeachProperty",
            "#PattayaNewLaunch",
        ],
    },
    "sale_resale": {
        "primary": [
            "#ขายคอนโดพัทยา",
            "#PattayaResale",
            "#CondoForSale",
            "#PattayaProperty",
            "#SeaViewCondo",
        ],
        "secondary": [
            "#JomtienCondo",
            "#PratumnakProperty",
            "#WongamatBeach",
            "#ForeignOwnership",
            "#ReadyToMove",
        ],
    },
    "rent_long": {
        "primary": [
            "#PattayaRental",
            "#ForRent",
            "#LongTermRental",
            "#PattayaForRent",
            "#ExpatRental",
        ],
        "secondary": [
            "#JomtienRental",
            "#CondoForRent",
            "#FullyFurnished",
            "#ExpatsInThailand",
            "#DigitalNomad",
        ],
    },
    "rent_short": {
        "primary": [
            "#PattayaVacation",
            "#HolidayRental",
            "#VacationRental",
            "#PattayaBeach",
            "#ThailandTravel",
        ],
        "secondary": [
            "#JomtienBeach",
            "#BeachVacation",
            "#PoolVilla",
            "#AirbnbPattaya",
            "#ThailandHoliday",
        ],
    },
}


def get_campaign_config(property_intent: str) -> dict:
    """Get campaign configuration for a property intent."""
    return CAMPAIGN_MATRIX.get(property_intent, CAMPAIGN_MATRIX["sale_resale"])


def get_hashtags(property_intent: str, include_secondary: bool = True) -> list[str]:
    """Get hashtags for a property intent."""
    config = HASHTAG_CONFIG.get(property_intent, HASHTAG_CONFIG["sale_resale"])
    hashtags = config["primary"].copy()
    if include_secondary:
        hashtags.extend(config["secondary"])
    return hashtags
