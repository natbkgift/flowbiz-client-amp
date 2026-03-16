from __future__ import annotations

from fastapi import APIRouter

from packages.core.buying_cost_estimator import calculate_buying_cost_estimate
from packages.core.schemas.buying_cost_estimator import (
    BuyingCostEstimatorRequest,
    BuyingCostEstimatorResponse,
)


router = APIRouter(prefix="/tools", tags=["tools"])


@router.post("/buying-cost", response_model=BuyingCostEstimatorResponse)
def calculate_buying_cost(payload: BuyingCostEstimatorRequest) -> BuyingCostEstimatorResponse:
    return calculate_buying_cost_estimate(payload)