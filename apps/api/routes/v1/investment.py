from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from packages.core.investment import calc_mortgage_amortization, calc_roi
from packages.core.schemas.investment import (
    MortgageRequest,
    MortgageResponse,
    RoiRequest,
    RoiResponse,
)

router = APIRouter(prefix="/v1/investment", tags=["investment"])


@router.post("/roi", response_model=RoiResponse)
async def roi(payload: RoiRequest) -> RoiResponse:
    try:
        r = calc_roi(
            purchase_price=payload.purchase_price,
            monthly_rent=payload.monthly_rent,
            annual_expenses=payload.annual_expenses,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    return RoiResponse(
        gross_yield_percent=r.gross_yield_percent,
        net_yield_percent=r.net_yield_percent,
        net_annual_income=r.net_annual_income,
    )


@router.post("/mortgage", response_model=MortgageResponse)
async def mortgage(payload: MortgageRequest) -> MortgageResponse:
    try:
        r = calc_mortgage_amortization(
            principal=payload.principal,
            annual_rate_percent=payload.annual_rate_percent,
            years=payload.years,
            payments_per_year=payload.payments_per_year,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    return MortgageResponse(
        payment_per_period=r.payment_per_period,
        periods=r.periods,
        total_paid=r.total_paid,
        total_interest=r.total_interest,
    )

