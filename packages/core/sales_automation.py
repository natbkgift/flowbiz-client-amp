from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

Locale = Literal["en", "th"]
PriorityLabel = Literal["high", "medium", "low"]
RouteHint = Literal["senior", "default"]
FollowUpStage = Literal["t5m", "t1h", "t24h", "done"]

FOLLOW_UP_STAGE_SEQUENCE: tuple[FollowUpStage, ...] = ("t5m", "t1h", "t24h", "done")
FOLLOW_UP_STAGE_DELAYS: dict[FollowUpStage, timedelta | None] = {
    "t5m": timedelta(minutes=5),
    "t1h": timedelta(hours=1),
    "t24h": timedelta(hours=24),
    "done": None,
}
FOLLOW_UP_SUPPRESSION_TAGS: frozenset[str] = frozenset(
    {
        "opt_out",
        "do_not_follow_up",
        "user_replied",
        "reply_received",
        "deal_active",
        "validation:test",
    }
)


@dataclass(frozen=True)
class SalesAutomationFollowUpStep:
    stage: FollowUpStage
    label: str
    message: str
    due_at: datetime | None


@dataclass(frozen=True)
class SalesAutomationSnapshot:
    locale: Locale
    intent: str
    source: str | None
    buyer_fit: str | None
    signal_level: str
    projects: tuple[str, ...]
    primary_project: str | None
    response_channel: str
    response_sla_seconds: int
    auto_response_message: str
    confirmation_title: str
    confirmation_body: str
    recommended_approach: str
    suggested_first_reply: str
    priority_label: PriorityLabel
    priority_score: int
    route_hint: RouteHint
    next_follow_up_at: datetime | None
    follow_up_status: str
    follow_up_stage: FollowUpStage
    follow_up_plan: tuple[SalesAutomationFollowUpStep, ...]
    stop_conditions: tuple[str, ...]

    def as_tags(self) -> list[str]:
        tags = [
            f"priority:{self.priority_label}",
            f"advisor_route:{self.route_hint}",
            f"follow_up_stage:{self.follow_up_stage}",
            "sales_automation:enabled",
        ]
        if self.next_follow_up_at is not None:
            tags.append("follow_up_sequence:active")
        return tags


def normalize_text(value: str | None) -> str | None:
    text = str(value or "").strip()
    return text or None


def normalize_token(value: str | None) -> str | None:
    text = str(value or "").strip().lower()
    if not text:
        return None
    return text.replace("-", "_").replace(" ", "_")


def humanize_token(value: str | None) -> str | None:
    token = normalize_text(value)
    if not token:
        return None
    return " ".join(part.capitalize() for part in token.replace("_", "-").split("-") if part)


def _decode_slug(value: str | None) -> str | None:
    token = normalize_text(value)
    if not token:
        return None
    pieces = token.replace("_", "-").split("-")
    return " ".join(part.capitalize() for part in pieces if part)


def _pick_tag_value(tags: list[str] | None, prefix: str) -> str | None:
    for raw in tags or []:
        text = normalize_text(raw)
        if not text:
            continue
        if text.startswith(prefix):
            return text.split(":", 1)[1].strip() or None
    return None


def _pick_tag_values(tags: list[str] | None, prefix: str) -> list[str]:
    values: list[str] = []
    seen: set[str] = set()
    for raw in tags or []:
        text = normalize_text(raw)
        if not text or not text.startswith(prefix):
            continue
        value = text.split(":", 1)[1].strip()
        if not value:
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        values.append(value)
    return values


def extract_sales_locale(tags: list[str] | None) -> Locale:
    locale = normalize_token(_pick_tag_value(tags, "locale:"))
    return "th" if locale == "th" else "en"


def _score_to_signal_level(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 45:
        return "medium"
    return "low"


def _signal_level_rank(signal_level: str | None) -> int:
    return {"low": 0, "medium": 1, "high": 2}.get(str(signal_level or ""), -1)


def _signal_level_from_lead_tier(lead_tier: str | None) -> str | None:
    if lead_tier == "hot":
        return "high"
    if lead_tier == "warm":
        return "medium"
    if lead_tier in {"cool", "cold"}:
        return "low"
    return None


def extract_sales_context(
    *,
    intent: str | None,
    source_page: str | None,
    tags: list[str] | None,
    score: int = 0,
) -> dict[str, object]:
    normalized_intent = normalize_token(intent) or "general_inquiry"
    source = normalize_text(_pick_tag_value(tags, "lead_source:")) or normalize_text(source_page)
    buyer_fit = normalize_text(_pick_tag_value(tags, "buyer_fit:"))
    signal_level = normalize_token(_pick_tag_value(tags, "signal_level:"))
    lead_tier = normalize_token(_pick_tag_value(tags, "lead_tier:"))
    project_values = _pick_tag_values(tags, "project_scope:")
    single_project = normalize_text(_pick_tag_value(tags, "project:"))
    if single_project and single_project.lower() not in {item.lower() for item in project_values}:
        project_values.insert(0, single_project)
    if signal_level not in {"high", "medium", "low"}:
        signal_level = _score_to_signal_level(score)
        tier_signal_level = _signal_level_from_lead_tier(lead_tier)
        if _signal_level_rank(tier_signal_level) > _signal_level_rank(signal_level):
            signal_level = str(tier_signal_level)
    return {
        "intent": normalized_intent,
        "source": source,
        "buyer_fit": buyer_fit,
        "signal_level": signal_level,
        "projects": tuple(project_values),
        "primary_project": single_project or (project_values[0] if project_values else None),
    }


def _auto_response_message(locale: Locale, intent: str, project_names: tuple[str, ...]) -> str:
    primary_project = project_names[0] if project_names else None
    primary_label = _decode_slug(primary_project)
    if intent == "project_consultation":
        if locale == "th":
            return (
                f"ขอบคุณที่สนใจ {primary_label}. ทีมจะทบทวนบริบทนี้และส่งตัวเลือกที่เกี่ยวข้องกลับให้เร็วที่สุด"
                if primary_label
                else "ขอบคุณสำหรับรายละเอียดที่ส่งมา ทีมจะทบทวนบริบทนี้และส่งคำแนะนำที่เกี่ยวข้องกลับให้เร็วที่สุด"
            )
        return (
            (
                f"Thanks for your interest in {primary_label}. "
                "I will review your request and share the most relevant options shortly."
            )
            if primary_label
            else (
                "Thanks for your request. "
                "I will review the context and share the most relevant options shortly."
            )
        )
    if intent == "project_shortlist":
        return (
            "ขอบคุณครับ เห็นแล้วว่าคุณกำลังคัด shortlist อยู่ ทีมจะส่ง availability และยูนิตที่ตรงโจทย์กลับให้"
            if locale == "th"
            else (
                "Thanks — I see you're exploring shortlisted options. "
                "I'll send you current availability and matching units."
            )
        )
    if intent == "project_compare":
        return (
            "รับทราบครับ คุณกำลังเปรียบเทียบหลายโครงการ ทีมจะเตรียมคำแนะนำแบบเทียบกันให้ชัดเจน"
            if locale == "th"
            else (
                "Got it — you're comparing multiple projects. "
                "I'll prepare a clear side-by-side recommendation for you."
            )
        )
    return (
        "รับคำขอแล้วครับ ทีมจะตรวจบริบทและติดต่อกลับพร้อมขั้นตอนถัดไปที่ชัดเจน"
        if locale == "th"
        else (
            "Thanks — we received your request and will follow up "
            "with the clearest next step shortly."
        )
    )


def _recommended_approach(locale: Locale, signal_level: str) -> str:
    if signal_level == "high":
        return (
            "ขับไปสู่ conversion: ยืนยัน availability, เงื่อนไข, และเสนอทางเลือกที่พร้อมคุยต่อทันที"
            if locale == "th"
            else (
                "Push toward conversion: confirm live availability, "
                "key terms, and the fastest next step."
            )
        )
    if signal_level == "medium":
        return (
            "บีบตัวเลือกให้แคบลง: ยืนยัน shortlist, ช่วงราคา, และตัวเปรียบเทียบที่ควรเก็บไว้"
            if locale == "th"
            else (
                "Narrow options: confirm the shortlist, price bands, "
                "and which alternatives still deserve attention."
            )
        )
    return (
        "สำรวจและคัดกรอง: ถามเพิ่มเรื่องเป้าหมาย การใช้งาน และบริบทการตัดสินใจก่อนส่งตัวเลือกชุดใหญ่"
        if locale == "th"
        else (
            "Explore and qualify: clarify goals, use case, "
            "and decision context before broad recommendations."
        )
    )


def _suggested_first_reply(
    locale: Locale,
    signal_level: str,
    intent: str,
    project_names: tuple[str, ...],
) -> str:
    if signal_level == "high":
        if project_names:
            names = ", ".join(_decode_slug(item) or item for item in project_names)
            return (
                f"ตอนนี้มีตัวเลือกที่ตรงกับ {names} อยู่พอสมควร ต้องการให้ส่งรายละเอียดให้ตอนนี้เลยไหมครับ"
                if locale == "th"
                else (
                    f"There are current options matching {names} right now. "
                    "Shall I send the details now?"
                )
            )
        return (
            "ตอนนี้มีตัวเลือกที่ตรงบริบทนี้อยู่พอสมควร ต้องการให้ส่งรายละเอียดให้ตอนนี้เลยไหมครับ"
            if locale == "th"
            else "There are currently options matching your criteria — shall I send details now?"
        )
    if signal_level == "medium":
        return (
            "ผมหายูนิตที่เข้า shortlist นี้ได้บางส่วนแล้ว ต้องการให้ส่งตัวเลือกที่ตรงที่สุดให้ดูเลยไหมครับ"
            if locale == "th"
            else "I've found a few units that match your shortlist. Want me to share them?"
        )
    if intent == "project_compare":
        return (
            "โจทย์หลักตอนนี้คือการลงทุนหรือการอยู่เองครับ จะได้เทียบโครงการให้ตรงขึ้น"
            if locale == "th"
            else (
                "Can I ask whether your main goal is investment or personal use "
                "so I can frame the comparison more clearly?"
            )
        )
    return (
        "ขอถามเพิ่มนิดหนึ่งครับว่าคุณมองเพื่อการลงทุนหรืออยู่อาศัยเองเป็นหลัก"
        if locale == "th"
        else "Can I ask what you're mainly looking for — investment or personal use?"
    )


def _follow_up_message(
    locale: Locale,
    intent: str,
    stage: FollowUpStage,
    project_names: tuple[str, ...],
) -> str:
    primary_names = ", ".join(_decode_slug(item) or item for item in project_names)
    if stage == "t5m":
        if intent == "project_compare":
            return (
                "ขอเช็กสั้น ๆ ครับ ถ้าต้องการ ผมช่วยสรุปความต่างสำคัญของโครงการที่คุณกำลังเทียบให้ได้ทันที"
                if locale == "th"
                else (
                    "Just checking in — I can break down the key differences "
                    "between these projects if helpful."
                )
            )
        if intent == "project_shortlist":
            return (
                "ขอเช็กสั้น ๆ ครับ ต้องการให้ผมช่วยบีบ shortlist นี้ให้เหลือยูนิตที่ควรดูจริงไหม"
                if locale == "th"
                else (
                    "Just checking — do you want me to narrow down the best units "
                    "from your shortlist?"
                )
            )
        return (
            (
                f"ผมช่วยไล่ตัวเลือกที่เกี่ยวกับ {primary_names} ต่อให้ได้ "
                "ถ้าต้องการให้เริ่มจาก availability หรือภาพรวมการตัดสินใจก็บอกได้ครับ"
            )
            if locale == "th" and primary_names
            else (
                f"I can continue with the next best options around {primary_names} if you'd like."
                if primary_names
                else "I can continue with the next best options around your request if helpful."
            )
        )
    if stage == "t1h":
        if intent == "project_compare":
            return (
                "หากยังอยู่ในโหมดเทียบ ผมช่วยสรุปจุดเด่น จุดเสี่ยง และโครงการที่ควรตัดออกให้ได้ครับ"
                if locale == "th"
                else (
                    "If you're still comparing, I can turn the trade-offs "
                    "into a simpler recommendation."
                )
            )
        if intent == "project_shortlist":
            return (
                "หากสะดวก ผมช่วยส่ง availability ล่าสุดและตัวเลือกสำรองในงบใกล้เคียงให้ต่อได้ครับ"
                if locale == "th"
                else (
                    "If helpful, I can send current availability plus a few backup options "
                    "in the same budget range."
                )
            )
        return (
            "ถ้ายังสนใจอยู่ ผมช่วยสรุปทางเลือกที่ควรไปต่อและคำถามที่ควรถามก่อนตัดสินใจให้ได้ครับ"
            if locale == "th"
            else (
                "If you're still reviewing, I can summarize the strongest next-step options "
                "and what to confirm next."
            )
        )
    if stage == "t24h":
        return (
            "เช็กครั้งสุดท้ายครับ ถ้ายังอยากให้ทีมช่วยต่อ สามารถตอบกลับได้เลย แล้วเราจะเดินต่อจากบริบทเดิมทันที"
            if locale == "th"
            else (
                "Final check-in — if you'd like to continue, reply and we'll pick up "
                "from the same context right away."
            )
        )
    return ""


def _priority_label(intent: str, signal_level: str, score_hint: int) -> PriorityLabel:
    if signal_level == "high" or score_hint >= 80:
        return "high"
    if intent == "project_shortlist" or signal_level == "medium" or score_hint >= 55:
        return "medium"
    return "low"


def _priority_score(intent: str, signal_level: str, lead_score: int) -> int:
    base = lead_score
    if signal_level == "high":
        base = max(base, 85)
    elif signal_level == "medium":
        base = max(base, 65)
    elif intent == "project_consultation":
        base = max(base, 55)
    elif intent == "general_inquiry":
        base = max(base, 30)
    else:
        base = max(base, 60)
    return max(0, min(int(base), 100))


def _call_requested(tags: list[str] | None) -> bool:
    return normalize_token(_pick_tag_value(tags, "call_requested:")) == "yes"


def _response_channel(email: str | None, phone: str | None, *, call_requested: bool) -> str:
    has_email = bool(normalize_text(email))
    has_phone = bool(normalize_text(phone))
    if call_requested and has_phone:
        return "phone_priority_if_connected"
    if has_email and has_phone:
        return "email_and_whatsapp_if_connected"
    if has_email:
        return "email_if_connected"
    if has_phone:
        return "whatsapp_or_line_if_connected"
    return "on_page_confirmation"


def _confirmation_body(
    locale: Locale,
    primary_label: str | None,
    response_channel: str,
) -> str:
    if locale == "th":
        if response_channel == "phone_priority_if_connected":
            return (
                f"ที่ปรึกษาจะโทรหรือทัก WhatsApp พร้อมบริบทของ {primary_label} ในไม่ช้า"
                if primary_label
                else "ที่ปรึกษาจะโทรหรือทัก WhatsApp พร้อมขั้นตอนถัดไปในไม่ช้า"
            )
        if response_channel == "email_and_whatsapp_if_connected":
            return (
                f"ที่ปรึกษาจะ follow up ทางอีเมลหรือ WhatsApp พร้อมบริบทของ {primary_label} ในไม่ช้า"
                if primary_label
                else "ที่ปรึกษาจะ follow up ทางอีเมลหรือ WhatsApp พร้อมขั้นตอนถัดไปในไม่ช้า"
            )
        return (
            f"ที่ปรึกษาจะติดต่อกลับพร้อมบริบทของ {primary_label} ในไม่ช้า"
            if primary_label
            else "ที่ปรึกษาจะติดต่อกลับพร้อมขั้นตอนถัดไปในไม่ช้า"
        )

    if response_channel == "phone_priority_if_connected":
        return (
            (
                "Our advisor will prioritize a phone or WhatsApp "
                f"follow-up shortly about {primary_label}."
            )
            if primary_label
            else "Our advisor will prioritize a phone or WhatsApp follow-up shortly."
        )
    if response_channel == "email_and_whatsapp_if_connected":
        return (
            f"Our advisor will follow up by email or WhatsApp shortly about {primary_label}."
            if primary_label
            else "Our advisor will follow up by email or WhatsApp shortly."
        )
    return (
        f"Our advisor will contact you shortly about {primary_label}."
        if primary_label
        else "Our advisor will contact you shortly."
    )


def build_sales_automation_snapshot(
    *,
    intent: str | None,
    source_page: str | None,
    email: str | None,
    phone: str | None,
    tags: list[str] | None,
    lead_score: int,
    now: datetime | None = None,
) -> SalesAutomationSnapshot:
    current_time = now or datetime.now(UTC)
    locale = extract_sales_locale(tags)
    context = extract_sales_context(
        intent=intent,
        source_page=source_page,
        tags=tags,
        score=lead_score,
    )
    normalized_intent = str(context["intent"])
    signal_level = str(context["signal_level"])
    project_names = tuple(str(item) for item in context["projects"])
    primary_project = (
        context["primary_project"] if isinstance(context["primary_project"], str) else None
    )
    buyer_fit = context["buyer_fit"] if isinstance(context["buyer_fit"], str) else None
    source = context["source"] if isinstance(context["source"], str) else None
    response_channel = _response_channel(
        email,
        phone,
        call_requested=_call_requested(tags),
    )
    priority_score = _priority_score(normalized_intent, signal_level, lead_score)
    priority_label = _priority_label(normalized_intent, signal_level, priority_score)
    route_hint: RouteHint = "senior" if priority_label == "high" else "default"
    next_follow_up_at = current_time + timedelta(minutes=5)
    follow_up_plan = tuple(
        SalesAutomationFollowUpStep(
            stage=stage,
            label=(
                "T+5 นาที"
                if stage == "t5m" and locale == "th"
                else "T+1 ชั่วโมง"
                if stage == "t1h" and locale == "th"
                else "T+24 ชั่วโมง"
                if stage == "t24h" and locale == "th"
                else "T+5 min"
                if stage == "t5m"
                else "T+1 hour"
                if stage == "t1h"
                else "T+24 hours"
            ),
            message=_follow_up_message(locale, normalized_intent, stage, project_names),
            due_at=(
                current_time + FOLLOW_UP_STAGE_DELAYS[stage]
                if FOLLOW_UP_STAGE_DELAYS[stage] is not None
                else None
            ),
        )
        for stage in ("t5m", "t1h", "t24h")
    )
    primary_label = _decode_slug(primary_project)
    confirmation_title = (
        f"รับคำขอเกี่ยวกับ {primary_label} แล้ว"
        if locale == "th" and primary_label
        else "รับคำขอเรียบร้อยแล้ว"
        if locale == "th"
        else f"We received your request about {primary_label}"
        if primary_label
        else "We received your request"
    )
    confirmation_body = (
        _confirmation_body(locale, primary_label, response_channel)
    )
    return SalesAutomationSnapshot(
        locale=locale,
        intent=normalized_intent,
        source=source,
        buyer_fit=buyer_fit,
        signal_level=signal_level,
        projects=project_names,
        primary_project=primary_project,
        response_channel=response_channel,
        response_sla_seconds=5,
        auto_response_message=_auto_response_message(locale, normalized_intent, project_names),
        confirmation_title=confirmation_title,
        confirmation_body=confirmation_body,
        recommended_approach=_recommended_approach(locale, signal_level),
        suggested_first_reply=_suggested_first_reply(
            locale,
            signal_level,
            normalized_intent,
            project_names,
        ),
        priority_label=priority_label,
        priority_score=priority_score,
        route_hint=route_hint,
        next_follow_up_at=next_follow_up_at,
        follow_up_status="pending",
        follow_up_stage="t5m",
        follow_up_plan=follow_up_plan,
        stop_conditions=(
            "user_replied",
            "deal_marked_active",
            "user_opted_out",
        ),
    )


def build_advisor_summary_note(snapshot: SalesAutomationSnapshot) -> str:
    project_line = ", ".join(_decode_slug(item) or item for item in snapshot.projects) or "-"
    next_follow_up = snapshot.next_follow_up_at.isoformat() if snapshot.next_follow_up_at else "-"
    if snapshot.locale == "th":
        return "\n".join(
            [
                "Advisor Summary:",
                f"- Project: {project_line}",
                f"- Intent: {snapshot.intent}",
                f"- Source: {snapshot.source or '-'}",
                f"- Buyer Fit: {snapshot.buyer_fit or '-'}",
                f"- Signal Level: {snapshot.signal_level}",
                f"- Response Channel: {snapshot.response_channel}",
                f"- Priority: {snapshot.priority_label} ({snapshot.priority_score})",
                f"- Next Follow-up: {next_follow_up}",
                "",
                "Recommended Approach:",
                f"- {snapshot.recommended_approach}",
                "",
                "Suggested First Reply:",
                f"- {snapshot.suggested_first_reply}",
                "",
                "Follow-up Plan:",
                *[f"- {step.label}: {step.message}" for step in snapshot.follow_up_plan],
            ]
        )
    return "\n".join(
        [
            "Lead Summary:",
            f"- Project: {project_line}",
            f"- Intent: {snapshot.intent}",
            f"- Source: {snapshot.source or '-'}",
            f"- Buyer Fit: {snapshot.buyer_fit or '-'}",
            f"- Signal Level: {snapshot.signal_level}",
            f"- Response Channel: {snapshot.response_channel}",
            f"- Priority: {snapshot.priority_label} ({snapshot.priority_score})",
            f"- Next Follow-up: {next_follow_up}",
            "",
            "Recommended Approach:",
            f"- {snapshot.recommended_approach}",
            "",
            "Suggested First Reply:",
            f"- {snapshot.suggested_first_reply}",
            "",
            "Follow-up Plan:",
            *[f"- {step.label}: {step.message}" for step in snapshot.follow_up_plan],
        ]
    )


def next_follow_up_stage(tags: list[str] | None) -> FollowUpStage:
    current = normalize_token(_pick_tag_value(tags, "follow_up_stage:")) or "t5m"
    if current == "t5m":
        return "t1h"
    if current == "t1h":
        return "t24h"
    if current == "t24h":
        return "done"
    return "done"


def current_follow_up_stage(tags: list[str] | None) -> FollowUpStage:
    current = normalize_token(_pick_tag_value(tags, "follow_up_stage:")) or "t5m"
    if current in {"t5m", "t1h", "t24h", "done"}:
        return current  # type: ignore[return-value]
    return "t5m"


def follow_up_due_for_stage(base_time: datetime, stage: FollowUpStage) -> datetime | None:
    delay = FOLLOW_UP_STAGE_DELAYS.get(stage)
    if delay is None:
        return None
    return base_time + delay


def should_stop_follow_up(
    *,
    status: str | None,
    follow_up_status: str | None = None,
    tags: list[str] | None,
) -> bool:
    normalized_status = normalize_token(status)
    normalized_follow_up_status = normalize_token(follow_up_status)
    lowered_tags = {str(tag).strip().lower() for tag in tags or [] if str(tag).strip()}
    if normalized_status in {"qualified", "closed", "lost"}:
        return True
    if normalized_follow_up_status in {"completed", "no_response"}:
        return True
    return any(tag in lowered_tags for tag in FOLLOW_UP_SUPPRESSION_TAGS)


def advance_follow_up_tags(tags: list[str] | None, next_stage: FollowUpStage) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for raw in tags or []:
        text = normalize_text(raw)
        if not text:
            continue
        if text.startswith("follow_up_stage:") or text == "follow_up_sequence:active":
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    out.append(f"follow_up_stage:{next_stage}")
    if next_stage != "done":
        out.append("follow_up_sequence:active")
    return out


def build_follow_up_execution_note(snapshot: SalesAutomationSnapshot, stage: FollowUpStage) -> str:
    step = next((item for item in snapshot.follow_up_plan if item.stage == stage), None)
    message = (
        step.message
        if step is not None
        else _follow_up_message(
            snapshot.locale,
            snapshot.intent,
            stage,
            snapshot.projects,
        )
    )
    if snapshot.locale == "th":
        return "\n".join(
            [
                "Follow-up Trigger:",
                f"- Stage: {stage}",
                f"- Message: {message}",
                f"- Response Channel: {snapshot.response_channel}",
                f"- Priority: {snapshot.priority_label} ({snapshot.priority_score})",
                f"- Stop if: {', '.join(snapshot.stop_conditions)}",
            ]
        )
    return "\n".join(
        [
            "Follow-up Trigger:",
            f"- Stage: {stage}",
            f"- Message: {message}",
            f"- Response Channel: {snapshot.response_channel}",
            f"- Priority: {snapshot.priority_label} ({snapshot.priority_score})",
            f"- Stop if: {', '.join(snapshot.stop_conditions)}",
        ]
    )
