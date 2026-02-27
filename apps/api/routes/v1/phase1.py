from fastapi import APIRouter, Depends
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

    lead = Lead(
        name=payload.first_name,
        email=email,
        phone=phone,
        score=score_result.lead_score,
    )
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
