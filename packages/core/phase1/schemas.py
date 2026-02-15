from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Purpose(str, Enum):
    BUY_LIVE = "buy_live"
    BUY_INVEST = "buy_invest"
    RENT = "rent"
    EXPLORING = "exploring"


class LeadTemperature(str, Enum):
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"
    FIRE = "fire"


class ContactChannel(str, Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    LINE = "line"


class ChatState(str, Enum):
    GREETING = "0_greeting"
    PURPOSE = "1_purpose"
    BUYER = "2a_buyer"
    INVESTOR = "2b_investor"
    RENTER = "2c_renter"
    EXPLORER = "2d_explorer"
    CONTACT = "3_contact"
    CONFIRMATION = "4_confirmation"
    END = "5_end"
    ESCALATION = "escalation"


class Phase1LeadPayload(BaseModel):
    source_page: str
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None

    purpose: Purpose
    budget_range: str
    area_preference: str | None = None
    timeline: str
    in_thailand: str | None = None
    investment_goal: str | None = None
    first_time_investor: Literal["yes", "no"] | None = None
    rental_duration: str | None = None

    first_name: str
    preferred_channel: ContactChannel
    contact_value: str
    country: str

    chat_started: bool = True
    chat_completed: bool = True
    lead_magnet_downloaded: bool = False
    returned_within_48h: bool = False
    viewed_3plus_properties: bool = False
    replied_whatsapp_within_2h: bool = False
    requested_viewing: bool = False
    opened_followup_email: bool = False
    clicked_followup_email: bool = False
    referred_by_client: bool = False


class Phase1ScoreResult(BaseModel):
    lead_score: int = Field(ge=0, le=100)
    lead_temp: LeadTemperature
    scoring_version: str
    assigned_pipeline: str
    tags: list[str]
    priority_flag: bool
    line_notification_mode: Literal["urgent", "priority", "standard", "batch"]


class ChatProgress(BaseModel):
    state: ChatState = ChatState.GREETING
    purpose: Purpose | None = None
    budget_range: str | None = None
    area_preference: str | None = None
    timeline: str | None = None
    in_thailand: str | None = None
    contact_captured: bool = False
    attempts_unparsed: int = 0
    user_requested_human: bool = False
    contains_restricted_question: bool = False
