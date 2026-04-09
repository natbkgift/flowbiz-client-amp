from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from packages.core.schemas.crm import SalesAutomationItem

AIPageType = Literal[
    "home",
    "listing",
    "project",
    "property",
    "shortlist",
    "compare",
    "smart_finder",
    "contact",
    "shared",
]
AIBuyerType = Literal["buyer", "renter", "investor", "seller", "undecided"]
AIIntent = Literal[
    "buy",
    "rent",
    "invest",
    "sell",
    "general",
    "project_consultation",
    "project_compare",
    "project_shortlist",
    "viewing",
]
AIContactPreference = Literal["email", "phone", "whatsapp", "line"]
AIChatStatus = Literal["needs_input", "ready_for_handoff", "guardrail_blocked"]
AIConversationOutcome = Literal["active", "converted", "dropped", "unqualified"]
AIOptimizationDropOffStage = Literal[
    "healthy",
    "chat_to_lead",
    "recommendation_to_handoff",
    "lead_to_viewing",
]


class AIPageContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: Literal["en", "th"] = "en"
    page_type: AIPageType = "shared"
    source_page: str | None = Field(default=None, max_length=500)
    source_route: str | None = Field(default=None, max_length=64)
    entity_type: str | None = Field(default=None, max_length=64)
    entity_id: str | None = Field(default=None, max_length=64)
    entity_slug: str | None = Field(default=None, max_length=255)
    entity_name: str | None = Field(default=None, max_length=255)
    property_id: str | None = Field(default=None, max_length=64)
    project_id: str | None = Field(default=None, max_length=64)
    area_id: str | None = Field(default=None, max_length=64)
    shortlist_property_ids: list[str] = Field(default_factory=list, max_length=12)
    shortlist_project_ids: list[str] = Field(default_factory=list, max_length=12)
    compare_property_ids: list[str] = Field(default_factory=list, max_length=12)
    compare_project_ids: list[str] = Field(default_factory=list, max_length=12)
    smart_finder_answers: dict[str, str] | None = None
    metadata: dict[str, str] = Field(default_factory=dict)


class AILeadProfile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    intent: AIIntent | None = None
    buyer_type: AIBuyerType | None = None
    budget_range: str | None = Field(default=None, max_length=64)
    timeframe: str | None = Field(default=None, max_length=64)
    preferred_area: str | None = Field(default=None, max_length=120)
    property_type: str | None = Field(default=None, max_length=64)
    nationality: str | None = Field(default=None, max_length=80)
    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    contact_preference: AIContactPreference | None = None


class AIGuardrails(BaseModel):
    max_message_chars: int
    max_history_messages: int
    locale_locked: bool
    require_contact_before_handoff: bool
    inventory_claim_policy: Literal["verified_only"]
    disallowed_patterns: list[str] = Field(default_factory=list)
    disallowed_claims: list[str] = Field(default_factory=list)
    required_handoff_fields: list[str] = Field(default_factory=list)


class AIAgentDefinition(BaseModel):
    id: str
    locale: Literal["en", "th"]
    label: str
    description: str
    supported_page_types: list[AIPageType]
    capabilities: list[str]
    handoff_destination: str
    guardrails: AIGuardrails


AILeadCaptureTier = Literal["hot", "warm", "cool"]
AIConversionSignalCode = Literal[
    "budget_defined",
    "viewing_requested",
    "price_requested",
    "details_requested",
    "contact_ready",
    "entity_context",
]


class AIConversionSignal(BaseModel):
    tier: AILeadCaptureTier = "cool"
    is_high_intent: bool = False
    should_prompt_contact_capture: bool = False
    signals: list[AIConversionSignalCode] = Field(default_factory=list)
    recommended_ctas: list[str] = Field(default_factory=list)
    summary: str = Field(max_length=280)


AIRecommendationSource = Literal[
    "live_inventory",
    "project_context",
    "property_context",
    "shortlist_context",
    "compare_context",
    "smart_finder_context",
]
AIMatchingMode = Literal["weighted", "strict"]


class AIRecommendationItem(BaseModel):
    property_id: str
    slug: str
    title: str
    href: str
    source: AIRecommendationSource
    score: int = Field(ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)
    project: str | None = Field(default=None, max_length=255)
    area: str | None = Field(default=None, max_length=255)
    price_text: str | None = Field(default=None, max_length=64)
    image: str | None = Field(default=None, max_length=500)


class AIRecommendationPreview(BaseModel):
    strategy: str = Field(max_length=64)
    matching_mode: AIMatchingMode = "weighted"
    purpose: str | None = Field(default=None, max_length=64)
    budget_range: str | None = Field(default=None, max_length=64)
    timeframe: str | None = Field(default=None, max_length=64)
    preferred_area: str | None = Field(default=None, max_length=120)
    items: list[AIRecommendationItem] = Field(default_factory=list, max_length=8)


class AISuggestedAction(BaseModel):
    type: Literal["continue_chat", "open_compare", "open_shortlist", "open_contact", "handoff"]
    label: str
    href: str | None = Field(default=None, max_length=500)
    intent: str | None = Field(default=None, max_length=64)


class AIMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1600)
    created_at: datetime | None = None


class AIRecentAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: str = Field(min_length=1, max_length=64)
    page_type: AIPageType | None = None
    source_route: str | None = Field(default=None, max_length=64)
    entity_type: str | None = Field(default=None, max_length=64)
    entity_id: str | None = Field(default=None, max_length=64)
    created_at: datetime | None = None


class AISessionMemory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lead_profile: AILeadProfile = Field(default_factory=AILeadProfile)
    viewed_property_ids: list[str] = Field(default_factory=list, max_length=12)
    viewed_project_ids: list[str] = Field(default_factory=list, max_length=12)
    viewed_area_ids: list[str] = Field(default_factory=list, max_length=12)
    recent_paths: list[str] = Field(default_factory=list, max_length=8)
    recent_actions: list[AIRecentAction] = Field(default_factory=list, max_length=12)
    asked_question_keys: list[str] = Field(default_factory=list, max_length=12)
    last_recommendation_slugs: list[str] = Field(default_factory=list, max_length=6)
    conversation_outcome: AIConversationOutcome | None = None
    message_count: int = Field(default=0, ge=0, le=100)
    last_updated_at: datetime | None = None


class AIOptimizationFunnel(BaseModel):
    conversations: int = 0
    leads: int = 0
    booked_viewings: int = 0


class AIOptimizationOutcomeCounts(BaseModel):
    active: int = 0
    converted: int = 0
    dropped: int = 0
    unqualified: int = 0


class AIOptimizationTuning(BaseModel):
    cta_mode: Literal["balanced", "assertive", "viewing_first"] = "balanced"
    recommendation_limit: int = Field(default=3, ge=1, le=3)
    question_budget: int = Field(default=2, ge=1, le=3)
    force_cta_after_recommendation: bool = True
    fallback_mode: Literal["inventory_first", "advisor_handoff"] = "inventory_first"


class AIOptimizationSummary(BaseModel):
    lookback_days: int = Field(default=30, ge=1, le=90)
    funnel: AIOptimizationFunnel = Field(default_factory=AIOptimizationFunnel)
    outcome_counts: AIOptimizationOutcomeCounts = Field(default_factory=AIOptimizationOutcomeCounts)
    drop_off_stage: AIOptimizationDropOffStage = "healthy"
    chat_to_lead_rate: float | None = None
    lead_to_viewing_rate: float | None = None
    tuning: AIOptimizationTuning = Field(default_factory=AIOptimizationTuning)


class AISessionCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    locale: Literal["en", "th"] = "en"
    page_context: AIPageContext
    lead_profile: AILeadProfile = Field(default_factory=AILeadProfile)
    session_memory: AISessionMemory | None = None
    initial_message: str | None = Field(default=None, max_length=1600)


class AISessionItem(BaseModel):
    session_id: str
    agent_id: str
    locale: Literal["en", "th"]
    page_context: AIPageContext
    lead_profile: AILeadProfile
    session_memory: AISessionMemory = Field(default_factory=AISessionMemory)
    recommendation_preview: AIRecommendationPreview | None = None
    missing_fields: list[str]
    next_question_key: str | None = None
    guardrails: AIGuardrails


class AIChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str | None = Field(default=None, max_length=64)
    locale: Literal["en", "th"] = "en"
    page_context: AIPageContext
    lead_profile: AILeadProfile = Field(default_factory=AILeadProfile)
    session_memory: AISessionMemory | None = None
    message: str = Field(min_length=1, max_length=1600)
    history: list[AIMessage] = Field(default_factory=list, max_length=12)


class AIHandoffPreview(BaseModel):
    recommended_intent: str
    missing_fields: list[str]
    recommended_contact_fields: list[str]
    summary_lines: list[str]
    tags: list[str]
    sales_automation: SalesAutomationItem


class AIChatResponse(BaseModel):
    session_id: str
    agent_id: str
    locale: Literal["en", "th"]
    status: AIChatStatus
    reply: str
    lead_profile: AILeadProfile
    session_memory: AISessionMemory = Field(default_factory=AISessionMemory)
    captured_fields: list[str]
    conversion_signal: AIConversionSignal
    recommendation_preview: AIRecommendationPreview | None = None
    missing_fields: list[str]
    next_question_key: str | None = None
    guardrails: AIGuardrails
    handoff_preview: AIHandoffPreview
    optimization_summary: AIOptimizationSummary | None = None
    suggested_actions: list[AISuggestedAction] = Field(default_factory=list)
