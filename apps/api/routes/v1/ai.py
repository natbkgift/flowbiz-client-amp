from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from packages.core.ai_agent import (
    AI_SALES_AGENT_ID,
    build_ai_agent_definition,
    build_ai_chat_response,
    build_ai_handoff_preview,
    build_ai_optimization_summary,
    create_ai_session,
)
from packages.core.database import get_db
from packages.core.schemas.ai import (
    AIAgentDefinition,
    AIChatRequest,
    AIChatResponse,
    AIHandoffPreview,
    AIOptimizationSummary,
    AISessionCreateRequest,
    AISessionItem,
)

router = APIRouter(prefix="/v1/agents", tags=["ai"])


@router.get("/{agent_id}", response_model=AIAgentDefinition)
def get_agent(
    agent_id: str,
    locale: str = Query(default="en", pattern=r"^(en|th)$"),
) -> AIAgentDefinition:
    return build_ai_agent_definition(agent_id, locale)


@router.post("/{agent_id}/sessions", response_model=AISessionItem)
def start_agent_session(
    agent_id: str,
    payload: AISessionCreateRequest,
    db: Session = Depends(get_db),
) -> AISessionItem:
    return create_ai_session(agent_id, payload, db=db)


@router.post("/{agent_id}/chat", response_model=AIChatResponse)
def chat_with_agent(
    agent_id: str,
    payload: AIChatRequest,
    db: Session = Depends(get_db),
) -> AIChatResponse:
    return build_ai_chat_response(agent_id, payload, db=db)


@router.post("/{agent_id}/handoff-preview", response_model=AIHandoffPreview)
def preview_agent_handoff(
    agent_id: str,
    payload: AISessionCreateRequest,
) -> AIHandoffPreview:
    return build_ai_handoff_preview(
        agent_id,
        payload.locale,
        payload.page_context,
        payload.lead_profile,
    )


@router.get("/{agent_id}/optimization-summary", response_model=AIOptimizationSummary)
def get_agent_optimization_summary(
    agent_id: str,
    lookback_days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
) -> AIOptimizationSummary:
    _ = (
        AI_SALES_AGENT_ID
        if agent_id == AI_SALES_AGENT_ID
        else build_ai_agent_definition(agent_id, "en")
    )
    return build_ai_optimization_summary(db, lookback_days=lookback_days)


__all__ = ["router", "AI_SALES_AGENT_ID"]
