from enum import Enum

from pydantic import BaseModel, Field


class ClassificationTarget(str, Enum):
    PURPOSE = "purpose"
    BUDGET_RANGE = "budget_range"
    AREA_PREFERENCE = "area_preference"


class ClassificationResult(BaseModel):
    target: ClassificationTarget
    value: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)


def classify_offscript_text(
    text: str,
    target: ClassificationTarget,
) -> ClassificationResult:
    normalized = text.lower().strip()

    if target == ClassificationTarget.PURPOSE:
        if any(k in normalized for k in ["rent", "rental", "lease"]):
            return ClassificationResult(target=target, value="rent", confidence=0.8)
        if any(k in normalized for k in ["invest", "yield", "roi"]):
            return ClassificationResult(target=target, value="buy_invest", confidence=0.8)
        if any(k in normalized for k in ["live", "stay", "home"]):
            return ClassificationResult(target=target, value="buy_live", confidence=0.7)
        return ClassificationResult(target=target, value="exploring", confidence=0.5)

    if target == ClassificationTarget.BUDGET_RANGE:
        if "10" in normalized and "m" in normalized:
            return ClassificationResult(target=target, value="10m_plus", confidence=0.7)
        if any(k in normalized for k in ["5m", "6m", "7m", "8m", "9m"]):
            return ClassificationResult(target=target, value="5m_10m", confidence=0.7)
        if any(k in normalized for k in ["2m", "3m", "4m"]):
            return ClassificationResult(target=target, value="2m_5m", confidence=0.7)
        if any(k in normalized for k in ["15k", "25k", "45k"]):
            if "45" in normalized:
                return ClassificationResult(target=target, value="45k_plus", confidence=0.7)
            if "25" in normalized:
                return ClassificationResult(target=target, value="25k_45k", confidence=0.7)
            return ClassificationResult(target=target, value="15k_25k", confidence=0.7)
        return ClassificationResult(target=target, value="under_2m", confidence=0.4)

    area_map = {
        "jomtien": "jomtien",
        "pratumnak": "pratumnak",
        "central": "central",
        "wongamat": "wongamat",
        "na jomtien": "na_jomtien",
    }
    for key, value in area_map.items():
        if key in normalized:
            return ClassificationResult(target=target, value=value, confidence=0.8)

    return ClassificationResult(target=target, value="not_sure", confidence=0.4)
