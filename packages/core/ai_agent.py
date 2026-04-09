from __future__ import annotations

from datetime import UTC, datetime
from typing import cast
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from packages.core.ai_optimization import build_ai_optimization_summary
from packages.core.ai_qualification import infer_lead_profile_updates
from packages.core.ai_recommendations import build_ai_recommendation_preview
from packages.core.sales_automation import build_sales_automation_snapshot
from packages.core.schemas.ai import (
    AIAgentDefinition,
    AIChatRequest,
    AIChatResponse,
    AIConversionSignal,
    AIGuardrails,
    AIHandoffPreview,
    AILeadProfile,
    AIOptimizationSummary,
    AIOptimizationTuning,
    AIPageContext,
    AIRecentAction,
    AIRecommendationPreview,
    AISessionCreateRequest,
    AISessionItem,
    AISessionMemory,
    AISuggestedAction,
)
from packages.core.schemas.crm import SalesAutomationFollowUpStepItem, SalesAutomationItem

AI_SALES_AGENT_ID = "sales_agent_v1"
AI_MAX_MESSAGE_CHARS = 1600
AI_MAX_HISTORY_MESSAGES = 12
AI_MAX_CONTEXT_IDS = 12
_PROMPT_INJECTION_PATTERNS = (
    "ignore previous instructions",
    "system prompt",
    "developer prompt",
    "reveal internal",
    "bypass guardrails",
    "act as system",
)
_VIEWING_REQUEST_PATTERNS = (
    "book a viewing",
    "book viewing",
    "schedule a viewing",
    "schedule viewing",
    "private tour",
    "tour this",
    "site visit",
    "can i view",
    "can we view",
    "นัดดู",
    "นัดเข้าชม",
    "ขอดูห้อง",
    "ขอเข้าชม",
)
_PRICE_REQUEST_PATTERNS = (
    "price",
    "pricing",
    "asking price",
    "latest price",
    "quote",
    "promotion",
    "discount",
    "ราคา",
    "ราคาล่าสุด",
    "โปร",
    "ส่วนลด",
)
_DETAIL_REQUEST_PATTERNS = (
    "details",
    "more details",
    "availability",
    "available",
    "floor plan",
    "payment plan",
    "unit details",
    "inventory",
    "รายละเอียด",
    "ห้องว่าง",
    "ยูนิต",
    "แปลน",
    "ผ่อน",
)


def _normalize_text(value: str | None, *, limit: int | None = None) -> str | None:
    text = " ".join(str(value or "").strip().split())
    if not text:
        return None
    return text[:limit] if limit is not None else text


def _normalize_source_page(value: str | None) -> str | None:
    text = _normalize_text(value, limit=500)
    if not text:
        return None

    parsed = urlparse(text)
    path = parsed.path or text
    if not path.startswith("/"):
        path = f"/{path.lstrip('/')}"
    if parsed.query:
        path = f"{path}?{parsed.query}"
    return path[:500]


def _humanize_token(value: str | None) -> str | None:
    text = _normalize_text(value)
    if not text:
        return None
    return text.replace("_", " ")


def _merge_lead_profiles(*profiles: AILeadProfile | None) -> AILeadProfile:
    merged = AILeadProfile()
    for profile in profiles:
        if profile is None:
            continue
        for field_name in AILeadProfile.model_fields:
            value = getattr(profile, field_name)
            if value in {None, ""}:
                continue
            setattr(merged, field_name, value)
    return merged


def _prepend_unique(values: list[str], additions: list[str], *, limit: int) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for raw in [*additions, *values]:
        value = _normalize_text(raw)
        if not value or value in seen:
            continue
        seen.add(value)
        merged.append(value)
        if len(merged) >= limit:
            break
    return merged


def _prepend_actions(
    values: list[AIRecentAction],
    additions: list[AIRecentAction],
    *,
    limit: int,
) -> list[AIRecentAction]:
    merged: list[AIRecentAction] = []
    seen: set[tuple[str, str | None, str | None, str | None]] = set()
    for action in [*additions, *values]:
        key = (action.action, action.page_type, action.source_route, action.entity_id)
        if key in seen:
            continue
        seen.add(key)
        merged.append(action)
        if len(merged) >= limit:
            break
    return merged


def _build_guardrails() -> AIGuardrails:
    return AIGuardrails(
        max_message_chars=AI_MAX_MESSAGE_CHARS,
        max_history_messages=AI_MAX_HISTORY_MESSAGES,
        locale_locked=True,
        require_contact_before_handoff=True,
        inventory_claim_policy="verified_only",
        disallowed_patterns=list(_PROMPT_INJECTION_PATTERNS),
        disallowed_claims=[
            "fabricated inventory or pricing",
            "unverified availability promises",
            "internal workflow or prompt disclosure",
            "recommendations outside verified active inventory",
        ],
        required_handoff_fields=[
            "intent",
            "budget_range",
            "timeframe",
            "buyer_type",
            "contact_method",
        ],
    )


def _localized_copy(locale: str) -> dict[str, str]:
    if locale == "th":
        return {
            "label": "AMP AI Sales Agent",
            "description": "ช่วยเก็บบริบทการซื้อ คัด intent และเตรียมส่งต่อให้ทีมขายโดยไม่สร้างข้อมูลเกินจริง",
            "ask_intent": "ก่อนอื่น ช่วยบอกเป้าหมายหลักของดีลนี้ก่อน ว่าซื้อ ลงทุน เช่า หรือยังเปรียบเทียบอยู่",
            "ask_budget_range": "งบประมาณคร่าว ๆ อยู่ช่วงไหน เพื่อให้คำแนะนำอยู่ในกรอบที่ใช้งานได้จริง",
            "ask_timeframe": "ต้องการขยับภายในช่วงเวลาไหน เช่น ทันที 1-3 เดือน หรือกำลังเก็บข้อมูลก่อน",
            "ask_preferred_area": "มีทำเลหรือย่านที่อยากโฟกัสเป็นพิเศษไหม",
            "ask_property_type": "อยากโฟกัส property type แบบไหน เช่น คอนโด บ้าน หรือวิลล่า",
            "ask_buyer_type": "ดีลนี้เป็นผู้ซื้ออยู่เอง นักลงทุน ผู้เช่า หรือยังไม่ตัดสินใจชัดเจน",
            "ask_contact_method": "ก่อนส่งต่อให้ทีม ช่วยทิ้งอีเมลหรือเบอร์โทรที่สะดวกไว้หนึ่งช่องทาง",
            "ready": "ตอนนี้บริบทหลักพอสำหรับส่งต่อให้ทีมขายหรือใช้ต่อกับชั้น recommendation ในสไลซ์ถัดไปแล้ว",
            "blocked": (
                "คำขอนี้แตะรูปแบบที่ระบบ guardrail จะไม่ประมวลผล"
                " กรุณาถามใหม่โดยยึดกับข้อมูลโครงการ ทำเล งบ หรือแผนการซื้อจริง"
            ),
            "compare_action": "เปิดหน้าเปรียบเทียบ",
            "shortlist_action": "เปิด shortlist",
            "contact_action": "ไปหน้าส่งต่อถึงที่ปรึกษา",
        }

    return {
        "label": "AMP AI Sales Agent",
        "description": (
            "Capture buying context, qualify intent, and prepare structured"
            " advisor handoff without fabricating inventory or pricing."
        ),
        "ask_intent": (
            "First, what is the main goal for this session: buy, invest, rent,"
            " or compare options?"
        ),
        "ask_budget_range": (
            "What budget range should this stay inside so the next step remains"
            " realistic?"
        ),
        "ask_timeframe": (
            "What timeline are you working against: now, 1-3 months, or still"
            " researching?"
        ),
        "ask_preferred_area": (
            "Is there a preferred area or district I should keep this anchored to?"
        ),
        "ask_property_type": (
            "What property type should I keep this inside: condo, house, or villa?"
        ),
        "ask_buyer_type": (
            "Is this for an owner-occupier, investor, renter, or are you still"
            " undecided?"
        ),
        "ask_contact_method": (
            "Before handoff, please leave one contact route: email or phone."
        ),
        "ready": (
            "The core context is now strong enough for advisor handoff or for the"
            " recommendation layer in the next slice."
        ),
        "blocked": (
            "This request matches a blocked prompt pattern. Rephrase around"
            " real project, area, budget, or timeline questions instead."
        ),
        "compare_action": "Open compare",
        "shortlist_action": "Open shortlist",
        "contact_action": "Open advisor handoff",
    }


def _ensure_agent_id(agent_id: str) -> str:
    if agent_id != AI_SALES_AGENT_ID:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI agent not found")
    return agent_id


def build_ai_agent_definition(agent_id: str, locale: str) -> AIAgentDefinition:
    _ensure_agent_id(agent_id)
    copy = _localized_copy(locale)
    return AIAgentDefinition(
        id=agent_id,
        locale=cast("str", locale),
        label=copy["label"],
        description=copy["description"],
        supported_page_types=[
            "home",
            "listing",
            "project",
            "property",
            "shortlist",
            "compare",
            "smart_finder",
            "contact",
            "shared",
        ],
        capabilities=[
            "intent_capture",
            "budget_qualification",
            "timeline_qualification",
            "area_context_capture",
            "live_inventory_recommendations",
            "advisor_handoff_preview",
            "session_memory",
            "conversion_optimization_loop",
        ],
        handoff_destination="/api/v1/inquiries",
        guardrails=_build_guardrails(),
    )


def list_ai_agents(locale: str) -> list[AIAgentDefinition]:
    return [build_ai_agent_definition(AI_SALES_AGENT_ID, locale)]


def _derive_missing_fields(page_context: AIPageContext, lead_profile: AILeadProfile) -> list[str]:
    missing: list[str] = []
    if not lead_profile.intent:
        missing.append("intent")
    if not lead_profile.budget_range:
        missing.append("budget_range")
    if not lead_profile.timeframe:
        missing.append("timeframe")
    if not lead_profile.buyer_type:
        missing.append("buyer_type")
    if page_context.page_type not in {"project", "property"} and not lead_profile.preferred_area:
        missing.append("preferred_area")
    if not (lead_profile.email or lead_profile.phone or lead_profile.contact_preference):
        missing.append("contact_method")
    return missing


def _next_question_key(
    missing_fields: list[str], asked_question_keys: list[str] | None = None
) -> str | None:
    asked = set(asked_question_keys or [])
    for field_name in missing_fields:
        if field_name not in asked:
            return field_name
    return None


def _build_tags(
    agent_id: str,
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
) -> list[str]:
    tags: list[str] = [f"agent_id:{agent_id}", f"page_type:{page_context.page_type}"]

    if page_context.source_route:
        tags.append(f"source_route:{page_context.source_route}")
    if lead_profile.intent:
        tags.append(f"intent:{lead_profile.intent}")
    if lead_profile.buyer_type:
        tags.append(f"buyer_fit:{lead_profile.buyer_type}")
    if lead_profile.property_type:
        tags.append(f"property_type:{lead_profile.property_type}")
    if page_context.entity_type:
        tags.append(f"entity_type:{page_context.entity_type}")
    if page_context.entity_id:
        tags.append(f"entity_id:{page_context.entity_id}")
    if page_context.entity_slug:
        tags.append(f"entity_slug:{page_context.entity_slug}")
    if page_context.project_id:
        tags.append(f"project_id:{page_context.project_id}")
    if page_context.area_id:
        tags.append(f"area_id:{page_context.area_id}")
    for property_id in page_context.compare_property_ids:
        tags.append(f"property_scope:{property_id}")
    for project_id in page_context.compare_project_ids:
        tags.append(f"project_scope:{project_id}")
    for property_id in page_context.shortlist_property_ids:
        tags.append(f"property_scope:{property_id}")
    for project_id in page_context.shortlist_project_ids:
        tags.append(f"project_scope:{project_id}")

    return list(dict.fromkeys(tags))


def _serialize_sales_automation(snapshot) -> SalesAutomationItem:
    return SalesAutomationItem(
        locale=snapshot.locale,
        intent=snapshot.intent,
        source=snapshot.source,
        buyer_fit=snapshot.buyer_fit,
        signal_level=snapshot.signal_level,
        projects=list(snapshot.projects),
        primary_project=snapshot.primary_project,
        response_channel=snapshot.response_channel,
        response_sla_seconds=snapshot.response_sla_seconds,
        auto_response_message=snapshot.auto_response_message,
        confirmation_title=snapshot.confirmation_title,
        confirmation_body=snapshot.confirmation_body,
        recommended_approach=snapshot.recommended_approach,
        suggested_first_reply=snapshot.suggested_first_reply,
        priority_label=snapshot.priority_label,
        priority_score=snapshot.priority_score,
        route_hint=snapshot.route_hint,
        next_follow_up_at=snapshot.next_follow_up_at,
        follow_up_status=snapshot.follow_up_status,
        follow_up_stage=snapshot.follow_up_stage,
        follow_up_plan=[
            SalesAutomationFollowUpStepItem(
                stage=step.stage,
                label=step.label,
                message=step.message,
                due_at=step.due_at,
            )
            for step in snapshot.follow_up_plan
        ],
        stop_conditions=list(snapshot.stop_conditions),
    )


def build_ai_handoff_preview(
    agent_id: str,
    locale: str,
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
) -> AIHandoffPreview:
    _ensure_agent_id(agent_id)
    normalized_source_page = _normalize_source_page(page_context.source_page)
    inferred_intent = lead_profile.intent or (
        "project_compare"
        if (
            page_context.page_type == "compare"
            or len(page_context.compare_project_ids) >= 2
            or len(page_context.compare_property_ids) >= 2
        )
        else "project_consultation"
        if page_context.page_type in {"project", "property"}
        else "general"
    )
    missing_fields = _derive_missing_fields(page_context, lead_profile)
    tags = _build_tags(agent_id, page_context, lead_profile)
    contact_bonus = 15 if (lead_profile.email or lead_profile.phone) else 0
    lead_score = max(25, 80 - (len(missing_fields) * 10) + contact_bonus)
    snapshot = build_sales_automation_snapshot(
        intent=inferred_intent,
        source_page=normalized_source_page,
        email=lead_profile.email,
        phone=lead_profile.phone,
        tags=tags,
        lead_score=lead_score,
    )

    summary_lines = [
        line
        for line in [
            f"page_type: {page_context.page_type}",
            f"source_page: {normalized_source_page}" if normalized_source_page else None,
            (
                f"entity: {page_context.entity_name or page_context.entity_id}"
                if (page_context.entity_name or page_context.entity_id)
                else None
            ),
            f"entity_slug: {page_context.entity_slug}" if page_context.entity_slug else None,
            f"intent: {inferred_intent}",
            f"buyer_type: {lead_profile.buyer_type}" if lead_profile.buyer_type else None,
            f"budget_range: {lead_profile.budget_range}" if lead_profile.budget_range else None,
            f"timeframe: {lead_profile.timeframe}" if lead_profile.timeframe else None,
            f"preferred_area: {lead_profile.preferred_area}"
            if lead_profile.preferred_area
            else None,
            f"property_type: {lead_profile.property_type}" if lead_profile.property_type else None,
            f"project_id: {page_context.project_id}" if page_context.project_id else None,
            f"area_id: {page_context.area_id}" if page_context.area_id else None,
            (
                f"compare_scope: {len(page_context.compare_project_ids)} project(s)"
                if page_context.compare_project_ids
                else None
            ),
            (
                f"compare_units: {len(page_context.compare_property_ids)} property item(s)"
                if page_context.compare_property_ids
                else None
            ),
            (
                f"shortlist_scope: {len(page_context.shortlist_property_ids)} property item(s)"
                if page_context.shortlist_property_ids
                else None
            ),
            (
                f"shortlist_projects: {len(page_context.shortlist_project_ids)} project(s)"
                if page_context.shortlist_project_ids
                else None
            ),
        ]
        if line
    ]

    return AIHandoffPreview(
        recommended_intent=inferred_intent,
        missing_fields=missing_fields,
        recommended_contact_fields=["email_or_phone"] if "contact_method" in missing_fields else [],
        summary_lines=summary_lines,
        tags=tags,
        sales_automation=_serialize_sales_automation(snapshot),
    )


def _build_session_memory(
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
    session_memory: AISessionMemory | None,
    *,
    action_name: str,
    last_recommendation_slugs: list[str] | None = None,
    next_question_key: str | None = None,
) -> AISessionMemory:
    now = datetime.now(UTC)
    base = session_memory or AISessionMemory()
    property_ids = [
        value
        for value in [
            page_context.property_id,
            page_context.entity_id if page_context.entity_type == "property" else None,
            *page_context.compare_property_ids,
            *page_context.shortlist_property_ids,
        ]
        if value
    ]
    project_ids = [
        value
        for value in [
            page_context.project_id,
            page_context.entity_id if page_context.entity_type == "project" else None,
            *page_context.compare_project_ids,
            *page_context.shortlist_project_ids,
        ]
        if value
    ]
    area_ids = [value for value in [page_context.area_id] if value]
    asked_question_keys = list(base.asked_question_keys)
    if next_question_key and next_question_key not in asked_question_keys:
        asked_question_keys = _prepend_unique(asked_question_keys, [next_question_key], limit=12)

    return AISessionMemory(
        lead_profile=_merge_lead_profiles(base.lead_profile, lead_profile),
        viewed_property_ids=_prepend_unique(base.viewed_property_ids, property_ids, limit=12),
        viewed_project_ids=_prepend_unique(base.viewed_project_ids, project_ids, limit=12),
        viewed_area_ids=_prepend_unique(base.viewed_area_ids, area_ids, limit=12),
        recent_paths=_prepend_unique(
            base.recent_paths,
            [page_context.source_page] if page_context.source_page else [],
            limit=8,
        ),
        recent_actions=_prepend_actions(
            base.recent_actions,
            [
                AIRecentAction(
                    action=action_name,
                    page_type=page_context.page_type,
                    source_route=page_context.source_route,
                    entity_type=page_context.entity_type,
                    entity_id=page_context.entity_id,
                    created_at=now,
                )
            ],
            limit=12,
        ),
        asked_question_keys=asked_question_keys,
        last_recommendation_slugs=_prepend_unique(
            base.last_recommendation_slugs,
            last_recommendation_slugs or [],
            limit=6,
        ),
        conversation_outcome=base.conversation_outcome,
        message_count=min(base.message_count + 1, 100),
        last_updated_at=now,
    )


def create_ai_session(
    agent_id: str,
    request: AISessionCreateRequest,
    db: Session | None = None,
) -> AISessionItem:
    _ensure_agent_id(agent_id)
    validate_ai_payload(request.locale, request.page_context, request.initial_message, [])
    lead_profile = _merge_lead_profiles(
        request.session_memory.lead_profile if request.session_memory else None,
        request.lead_profile,
    )
    if request.initial_message:
        lead_profile, _ = infer_lead_profile_updates(request.initial_message, lead_profile)
    missing_fields = _derive_missing_fields(request.page_context, lead_profile)
    next_question_key = _next_question_key(
        missing_fields,
        request.session_memory.asked_question_keys if request.session_memory else None,
    )
    session_id = f"ai-{uuid4()}"
    recommendation_preview = build_ai_recommendation_preview(
        db,
        request.locale,
        request.page_context,
        lead_profile,
    )
    session_memory = _build_session_memory(
        request.page_context,
        lead_profile,
        request.session_memory,
        action_name="ai_session_start",
        last_recommendation_slugs=[item.slug for item in recommendation_preview.items]
        if recommendation_preview
        else [],
        next_question_key=next_question_key,
    )
    return AISessionItem(
        session_id=session_id,
        agent_id=agent_id,
        locale=request.locale,
        page_context=request.page_context,
        lead_profile=lead_profile,
        session_memory=session_memory,
        recommendation_preview=recommendation_preview,
        missing_fields=missing_fields,
        next_question_key=next_question_key,
        guardrails=_build_guardrails(),
    )


def validate_ai_payload(
    locale: str,
    page_context: AIPageContext,
    message: str | None,
    history: list,
) -> None:
    if page_context.locale != locale:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI locale must stay locked across the session context",
        )
    if len(history) > AI_MAX_HISTORY_MESSAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI history exceeds the allowed contract length",
        )
    if len(page_context.shortlist_property_ids) > AI_MAX_CONTEXT_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI context exceeds the allowed shortlist/compare contract size",
        )
    if len(page_context.shortlist_project_ids) > AI_MAX_CONTEXT_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI context exceeds the allowed shortlist/compare contract size",
        )
    if len(page_context.compare_property_ids) > AI_MAX_CONTEXT_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI context exceeds the allowed shortlist/compare contract size",
        )
    if len(page_context.compare_project_ids) > AI_MAX_CONTEXT_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI context exceeds the allowed shortlist/compare contract size",
        )
    normalized_message = _normalize_text(message, limit=AI_MAX_MESSAGE_CHARS)
    if message is not None and not normalized_message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="AI message must not be blank",
        )


def _is_guardrail_blocked(message: str) -> bool:
    lowered = message.lower()
    return any(pattern in lowered for pattern in _PROMPT_INJECTION_PATTERNS)


def _message_requests_any(message: str, patterns: tuple[str, ...]) -> bool:
    lowered = message.lower()
    return any(pattern in lowered for pattern in patterns)


def _build_conversion_signal(
    locale: str,
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
    message: str,
    *,
    ready_for_handoff: bool,
    recommendation_preview: AIRecommendationPreview | None,
) -> AIConversionSignal:
    signals: list[str] = []
    budget_defined = bool(lead_profile.budget_range and lead_profile.budget_range != "not_sure")
    viewing_requested = _message_requests_any(message, _VIEWING_REQUEST_PATTERNS)
    price_requested = _message_requests_any(message, _PRICE_REQUEST_PATTERNS)
    details_requested = _message_requests_any(message, _DETAIL_REQUEST_PATTERNS)
    contact_ready = bool(lead_profile.email or lead_profile.phone)
    entity_context = page_context.page_type in {"project", "property"}

    if budget_defined:
        signals.append("budget_defined")
    if viewing_requested:
        signals.append("viewing_requested")
    if price_requested:
        signals.append("price_requested")
    if details_requested:
        signals.append("details_requested")
    if contact_ready:
        signals.append("contact_ready")
    if entity_context and recommendation_preview and recommendation_preview.items:
        signals.append("entity_context")

    is_high_intent = budget_defined and (viewing_requested or price_requested or details_requested)
    should_prompt_contact_capture = bool(
        is_high_intent or ready_for_handoff or viewing_requested or price_requested
    )

    recommended_ctas: list[str] = []
    if is_high_intent:
        recommended_ctas.extend(["book_viewing", "open_whatsapp"])
    elif should_prompt_contact_capture:
        recommended_ctas.append("contact_advisor")
    if recommendation_preview and len(recommendation_preview.items) >= 2:
        recommended_ctas.append("open_compare")

    if is_high_intent:
        summary = (
            "เจอสัญญาณ HOT: มีงบและกำลังถามเรื่องนัดดูหรือราคาจริง ควรดันไปสู่การจองดูห้องหรือคุยต่อทาง WhatsApp"
            if locale == "th"
            else (
                "HOT intent detected: budget is defined and the buyer is asking for"
                " live pricing, details, or a viewing. Push toward viewing or WhatsApp."
            )
        )
        tier = "hot"
    elif should_prompt_contact_capture:
        summary = (
            "บริบทเริ่มพร้อมส่งต่อแล้ว ควรเก็บชื่อและช่องทางติดต่อเพื่อให้ทีมขายรับช่วงต่อ"
            if locale == "th"
            else (
                "This conversation is close to handoff-ready. Capture name plus one"
                " contact route so sales can take over cleanly."
            )
        )
        tier = "warm"
    else:
        summary = (
            "ยังอยู่ในโหมดคัดกรองข้อมูลเบื้องต้น ควรเก็บ intent งบ และกรอบเวลาต่ออีกเล็กน้อย"
            if locale == "th"
            else (
                "This is still an early qualification chat. Keep the exchange short and"
                " tighten intent, budget, and timing first."
            )
        )
        tier = "cool"

    return AIConversionSignal(
        tier=cast("str", tier),
        is_high_intent=is_high_intent,
        should_prompt_contact_capture=should_prompt_contact_capture,
        signals=cast("list[str]", list(dict.fromkeys(signals))),
        recommended_ctas=list(dict.fromkeys(recommended_ctas)),
        summary=summary,
    )


def _context_anchor(
    locale: str, page_context: AIPageContext, session_memory: AISessionMemory
) -> str | None:
    entity_label = page_context.entity_name or page_context.entity_slug or page_context.entity_id
    viewed_properties = len(session_memory.viewed_property_ids)
    viewed_projects = len(session_memory.viewed_project_ids)
    recent_action = (
        session_memory.recent_actions[0].action if session_memory.recent_actions else None
    )

    if page_context.page_type == "property" and entity_label:
        if locale == "th":
            return (
                f"ตอนนี้คุณอยู่บน {entity_label} และผมจะยึดคำตอบกับ property ที่ดูไว้ "
                f"{max(viewed_properties, 1)} รายการใน session นี้"
            )
        return (
            f"You're on {entity_label}, and I'm anchoring this to "
            f"{max(viewed_properties, 1)} viewed property option(s) in this session"
        )
    if page_context.page_type == "project" and entity_label:
        if locale == "th":
            return (
                f"ตอนนี้คุณกำลังดู {entity_label} และผมจะอิงกับ project context ที่เปิดไว้ "
                f"{max(viewed_projects, 1)} รายการ"
            )
        return (
            f"You're reviewing {entity_label}, and I'm keeping this anchored to "
            f"{max(viewed_projects, 1)} live project context(s)"
        )
    if page_context.page_type == "compare":
        compare_count = max(
            len(page_context.compare_project_ids), len(page_context.compare_property_ids)
        )
        if locale == "th":
            return f"ตอนนี้คุณอยู่บนหน้า compare ที่มี {compare_count or 2} ตัวเลือกให้ตัดสินใจต่อ"
        return f"You're on a compare surface with {compare_count or 2} options already in play"
    if page_context.page_type == "shortlist":
        shortlist_count = max(
            len(page_context.shortlist_property_ids), len(page_context.shortlist_project_ids)
        )
        if locale == "th":
            return f"shortlist ตอนนี้มี {shortlist_count or viewed_properties or 1} ตัวเลือกที่พร้อมคัดต่อ"
        return (
            "Your shortlist already holds "
            f"{shortlist_count or viewed_properties or 1} option(s) worth narrowing"
        )
    if recent_action == "compare_add":
        return (
            "ผมจะเน้น trade-off และ next step จากสิ่งที่เพิ่งถูกเพิ่มเข้า compare"
            if locale == "th"
            else (
                "I'll stay focused on trade-offs and next steps from what was just"
                " added to compare"
            )
        )
    if recent_action == "shortlist_add":
        return (
            "ผมจะยึดกับ shortlist intent ที่เพิ่งเกิดขึ้นเพื่อไม่วนกลับไปถามกว้างเกินไป"
            if locale == "th"
            else (
                "I'll stay anchored to the shortlist intent so we do not drift back"
                " into broad questions"
            )
        )
    return None


def _personalization_anchor(locale: str, lead_profile: AILeadProfile) -> str | None:
    parts: list[str] = []
    if lead_profile.budget_range:
        parts.append(lead_profile.budget_range)
    if lead_profile.preferred_area:
        parts.append(lead_profile.preferred_area)
    if lead_profile.property_type:
        parts.append(_humanize_token(lead_profile.property_type) or lead_profile.property_type)
    if lead_profile.buyer_type:
        parts.append(_humanize_token(lead_profile.buyer_type) or lead_profile.buyer_type)
    if not parts:
        return None
    if locale == "th":
        return f"ผมจะยึดคำแนะนำนี้กับบริบท {', '.join(parts)}"
    return f"I'm keeping this brief anchored to {', '.join(parts)}"


def _recommendation_clause(
    locale: str,
    recommendation_preview: AIRecommendationPreview | None,
    *,
    recommendation_limit: int,
) -> str | None:
    if not recommendation_preview or not recommendation_preview.items:
        return None
    titles = [
        item.title for item in recommendation_preview.items[:recommendation_limit] if item.title
    ]
    if not titles:
        return None
    if locale == "th":
        if len(titles) == 1:
            return f"ตัวเลือก verified ที่ใกล้ที่สุดตอนนี้คือ {titles[0]}"
        return f"ตัวเลือก verified ที่น่าไปต่อที่สุดตอนนี้คือ {', '.join(titles[:-1])} และ {titles[-1]}"
    if len(titles) == 1:
        return f"The strongest verified fit right now is {titles[0]}"
    return f"The strongest verified fits right now are {', '.join(titles[:-1])} and {titles[-1]}"


def _fallback_clause(locale: str, tuning: AIOptimizationTuning) -> str:
    if locale == "th":
        if tuning.fallback_mode == "advisor_handoff":
            return "ตอนนี้ยังไม่มี live match ที่แคบกว่าบริบทนี้อย่างมั่นใจ ดังนั้นทางที่คมที่สุดคือส่งต่อให้ advisor"
        return "ตอนนี้ยังไม่มี verified live match ที่แคบพอจาก inventory ปัจจุบัน"
    if tuning.fallback_mode == "advisor_handoff":
        return (
            "I do not have a tighter verified live match than the current brief, so"
            " the cleanest move is advisor handoff"
        )
    return "I do not have a tighter verified live match from the current inventory yet"


def _cta_clause(
    locale: str,
    conversion_signal: AIConversionSignal,
    tuning: AIOptimizationTuning,
) -> str:
    if locale == "th":
        if conversion_signal.is_high_intent or tuning.cta_mode == "viewing_first":
            return "ทางถัดไปที่ควรทำตอนนี้คือกดนัดดูหรือคุยต่อทาง WhatsApp"
        if tuning.cta_mode == "assertive":
            return "ถ้าบริบทนี้ใช่ ให้ส่งต่อถึง advisor ตอนนี้เพื่อไม่เสียโมเมนตัม"
        return "next step ที่สะอาดที่สุดคือเปิด compare ต่อหรือส่งต่อให้ advisor"
    if conversion_signal.is_high_intent or tuning.cta_mode == "viewing_first":
        return "Best next move: book the viewing or continue on WhatsApp"
    if tuning.cta_mode == "assertive":
        return "If this brief is close, send it to an advisor now so the momentum does not drop"
    return "Cleanest next step: open compare or send this to an advisor"


def _field_prompt(locale: str, field_key: str | None) -> str | None:
    if not field_key:
        return None
    copy = _localized_copy(locale)
    return copy.get(f"ask_{field_key}", copy["ask_intent"])


def _join_reply_parts(parts: list[str]) -> str:
    reply = ". ".join(part.rstrip(". ") for part in parts if part).strip()
    if reply and not reply.endswith("."):
        reply = f"{reply}."
    return reply[:480]


def _build_reply(
    locale: str,
    page_context: AIPageContext,
    lead_profile: AILeadProfile,
    session_memory: AISessionMemory,
    conversion_signal: AIConversionSignal,
    recommendation_preview: AIRecommendationPreview | None,
    tuning: AIOptimizationTuning,
    *,
    blocked: bool,
    next_question_key: str | None,
) -> str:
    copy = _localized_copy(locale)
    if blocked:
        return copy["blocked"]

    parts: list[str] = []
    context_anchor = _context_anchor(locale, page_context, session_memory)
    personalization_anchor = _personalization_anchor(locale, lead_profile)
    recommendation_clause = _recommendation_clause(
        locale,
        recommendation_preview,
        recommendation_limit=tuning.recommendation_limit,
    )
    field_prompt = _field_prompt(locale, next_question_key)

    if context_anchor:
        parts.append(context_anchor)
    elif personalization_anchor:
        parts.append(personalization_anchor)

    if personalization_anchor and personalization_anchor not in parts:
        parts.append(personalization_anchor)

    if recommendation_clause:
        parts.append(recommendation_clause)
        if tuning.force_cta_after_recommendation:
            parts.append(_cta_clause(locale, conversion_signal, tuning))
    elif field_prompt:
        parts.append(field_prompt)
    else:
        parts.append(_fallback_clause(locale, tuning))
        parts.append(_cta_clause(locale, conversion_signal, tuning))

    if not parts:
        parts.append(copy["ready"])

    return _join_reply_parts(parts[:3])


def _build_suggested_actions(
    locale: str,
    page_context: AIPageContext,
    *,
    ready_for_handoff: bool,
    conversion_signal: AIConversionSignal,
    recommendation_preview: AIRecommendationPreview | None,
    tuning: AIOptimizationTuning,
) -> list[AISuggestedAction]:
    copy = _localized_copy(locale)
    actions: list[AISuggestedAction] = []
    compare_href = f"/{locale}/compare"
    if recommendation_preview and len(recommendation_preview.items) >= 2:
        compare_ids = ",".join(item.slug for item in recommendation_preview.items[:4] if item.slug)
        if compare_ids:
            compare_href = f"/{locale}/compare?ids={compare_ids}"

    compare_action = None
    if (
        page_context.compare_project_ids
        or page_context.compare_property_ids
        or (recommendation_preview is not None and len(recommendation_preview.items) >= 2)
    ):
        compare_action = AISuggestedAction(
            type="open_compare",
            label=copy["compare_action"],
            href=compare_href,
        )

    shortlist_action = None
    if page_context.shortlist_property_ids:
        shortlist_action = AISuggestedAction(
            type="open_shortlist",
            label=copy["shortlist_action"],
            href=f"/{locale}/shortlist",
        )

    handoff_action = AISuggestedAction(
        type="handoff",
        label=copy["contact_action"],
        href=f"/{locale}/contact",
    )

    if ready_for_handoff or conversion_signal.should_prompt_contact_capture:
        actions.append(handoff_action)
        if compare_action is not None:
            actions.append(compare_action)
        if shortlist_action is not None:
            actions.append(shortlist_action)
    else:
        if tuning.cta_mode == "assertive" and compare_action is not None:
            actions.append(compare_action)
        if shortlist_action is not None:
            actions.append(shortlist_action)
        actions.append(
            AISuggestedAction(
                type="continue_chat",
                label="Continue chat" if locale == "en" else "คุยต่อ",
            )
        )
        if compare_action is not None and compare_action not in actions:
            actions.append(compare_action)
    return actions


def build_ai_chat_response(
    agent_id: str,
    request: AIChatRequest,
    db: Session | None = None,
) -> AIChatResponse:
    _ensure_agent_id(agent_id)
    validate_ai_payload(request.locale, request.page_context, request.message, request.history)

    blocked = _is_guardrail_blocked(request.message)
    base_lead_profile = _merge_lead_profiles(
        request.session_memory.lead_profile if request.session_memory else None,
        request.lead_profile,
    )
    lead_profile, captured_fields = infer_lead_profile_updates(
        request.message,
        base_lead_profile,
    )
    optimization_summary: AIOptimizationSummary | None = build_ai_optimization_summary(db)
    tuning = (
        optimization_summary.tuning if optimization_summary is not None else AIOptimizationTuning()
    )
    recommendation_preview = build_ai_recommendation_preview(
        db,
        request.locale,
        request.page_context,
        lead_profile,
    )
    if recommendation_preview is not None:
        recommendation_preview = recommendation_preview.model_copy(
            update={"items": recommendation_preview.items[: tuning.recommendation_limit]}
        )
    handoff_preview = build_ai_handoff_preview(
        agent_id,
        request.locale,
        request.page_context,
        lead_profile,
    )
    missing_fields = handoff_preview.missing_fields
    next_question_key = _next_question_key(
        missing_fields,
        request.session_memory.asked_question_keys if request.session_memory else None,
    )
    if blocked:
        status_value = "guardrail_blocked"
    elif missing_fields:
        status_value = "needs_input"
    else:
        status_value = "ready_for_handoff"
    conversion_signal = _build_conversion_signal(
        request.locale,
        request.page_context,
        lead_profile,
        request.message,
        ready_for_handoff=status_value == "ready_for_handoff",
        recommendation_preview=recommendation_preview,
    )
    session_memory = _build_session_memory(
        request.page_context,
        lead_profile,
        request.session_memory,
        action_name="ai_chat_message",
        last_recommendation_slugs=[item.slug for item in recommendation_preview.items]
        if recommendation_preview
        else [],
        next_question_key=next_question_key,
    )

    session_id = request.session_id or f"ai-{uuid4()}"
    return AIChatResponse(
        session_id=session_id,
        agent_id=agent_id,
        locale=cast("str", request.locale),
        status=cast("str", status_value),
        reply=_build_reply(
            request.locale,
            request.page_context,
            lead_profile,
            session_memory,
            conversion_signal,
            recommendation_preview,
            tuning,
            blocked=blocked,
            next_question_key=next_question_key,
        ),
        lead_profile=lead_profile,
        session_memory=session_memory,
        captured_fields=captured_fields,
        conversion_signal=conversion_signal,
        recommendation_preview=recommendation_preview,
        missing_fields=missing_fields,
        next_question_key=next_question_key,
        guardrails=_build_guardrails(),
        handoff_preview=handoff_preview,
        optimization_summary=optimization_summary,
        suggested_actions=_build_suggested_actions(
            request.locale,
            request.page_context,
            ready_for_handoff=status_value == "ready_for_handoff",
            conversion_signal=conversion_signal,
            recommendation_preview=recommendation_preview,
            tuning=tuning,
        ),
    )
