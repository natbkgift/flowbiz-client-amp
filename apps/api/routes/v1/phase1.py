from fastapi import APIRouter

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
async def score_phase1_lead(payload: Phase1LeadPayload) -> Phase1ScoreResult:
    return calculate_lead_score(payload)


@router.post("/chat/next-state")
async def get_next_chat_state(progress: ChatProgress) -> dict[str, str]:
    return {"next_state": next_chat_state(progress).value}


@router.post("/chat/classify", response_model=ClassificationResult)
async def classify_chat_input(payload: dict[str, str]) -> ClassificationResult:
    text = payload.get("text", "")
    target = ClassificationTarget(payload.get("target", "purpose"))
    return classify_offscript_text(text=text, target=target)
