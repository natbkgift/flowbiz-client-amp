from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.core.database import get_db
from packages.core.models import Lead
from packages.core.phase1.classification import (
    ClassificationResult,
    ClassificationTarget,
    classify_offscript_text,
)
from packages.core.phase1.schemas import ChatProgress, Phase1LeadPayload, Phase1ScoreResult
from packages.core.phase1.scoring import calculate_lead_score
from packages.core.phase1.state_machine import next_chat_state

router = APIRouter(prefix="/v1/phase1", tags=["phase1"])


@router.post("/score", response_model=Phase1ScoreResult)
def score_phase1_lead(
    payload: Phase1LeadPayload,
    db: Session = Depends(get_db),
) -> Phase1ScoreResult:
    score_result = calculate_lead_score(payload)

    contact_value = payload.contact_value.strip()
    email = contact_value if "@" in contact_value else None
    phone = contact_value if "@" not in contact_value else None

    dedupe_cutoff = datetime.now(UTC) - timedelta(minutes=10)
    existing = None
    if email:
        existing = db.scalar(
            select(Lead)
            .where(
                Lead.email == email,
                Lead.purpose == payload.purpose.value,
                Lead.source_page == payload.source_page,
                Lead.created_at >= dedupe_cutoff,
            )
            .order_by(Lead.created_at.desc())
        )
    elif phone:
        existing = db.scalar(
            select(Lead)
            .where(
                Lead.phone == phone,
                Lead.purpose == payload.purpose.value,
                Lead.source_page == payload.source_page,
                Lead.created_at >= dedupe_cutoff,
            )
            .order_by(Lead.created_at.desc())
        )

    lead = existing or Lead(
        name=payload.first_name,
        email=email,
        phone=phone,
        score=score_result.lead_score,
        source_page=payload.source_page,
        purpose=payload.purpose.value,
        follow_up_due_at=datetime.now(UTC) + timedelta(hours=24),
    )
    if existing is not None:
        lead.score = score_result.lead_score
        lead.source_page = payload.source_page
        lead.purpose = payload.purpose.value

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return score_result.model_copy(update={"lead_id": str(lead.id)})


@router.post("/chat/next-state")
async def get_next_chat_state(progress: ChatProgress) -> dict[str, str]:
    return {"next_state": next_chat_state(progress).value}


@router.post("/chat/classify", response_model=ClassificationResult)
async def classify_chat_input(payload: dict[str, str]) -> ClassificationResult:
    text = payload.get("text", "")
    target = ClassificationTarget(payload.get("target", "purpose"))
    return classify_offscript_text(text=text, target=target)
