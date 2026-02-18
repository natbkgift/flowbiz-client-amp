from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SmartFinderPurpose = Literal["live", "invest", "flip"]
SmartFinderBudget = Literal["<3m", "3-5m", "5-8m", "8m+", "not_sure"]
SmartFinderTimeline = Literal["0-3m", "3-6m", "6-12m", "12m+", "flexible"]
SmartFinderRiskTolerance = Literal["low", "medium", "high"]
SmartFinderForeignQuota = Literal["required", "not_required", "unsure"]


class SmartFinderRequest(BaseModel):
    """Structured, deterministic Smart Finder input (Hybrid Execution v1 - Phase 2).

    Notes:
    - No randomness.
    - Same input should produce same output, given same dataset.
    """

    session_id: str | None = Field(default=None, max_length=64)

    purpose: SmartFinderPurpose
    budget: SmartFinderBudget
    timeline: SmartFinderTimeline
    risk_tolerance: SmartFinderRiskTolerance
    foreign_quota: SmartFinderForeignQuota


class SmartFinderProjectRecommendation(BaseModel):
    project_id: str
    slug: str
    name: str
    score: int
    reasons: list[str]


class SmartFinderResponse(BaseModel):
    ranking_version: str = "v1"
    query_hash: str
    items: list[SmartFinderProjectRecommendation]
