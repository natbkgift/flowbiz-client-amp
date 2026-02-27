"""Phase 1 light automation core modules."""

from packages.core.phase1.schemas import (
    ChatProgress,
    ChatState,
    ContactChannel,
    LeadTemperature,
    Phase1LeadPayload,
    Phase1ScoreResult,
    Purpose,
)
from packages.core.phase1.scoring import calculate_lead_score
from packages.core.phase1.state_machine import next_chat_state

__all__ = [
    "calculate_lead_score",
    "next_chat_state",
    "ChatProgress",
    "ChatState",
    "ContactChannel",
    "LeadTemperature",
    "Phase1LeadPayload",
    "Phase1ScoreResult",
    "Purpose",
]
