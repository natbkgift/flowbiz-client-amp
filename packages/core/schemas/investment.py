from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class RoiRequest(BaseModel):
    purchase_price: Decimal = Field(gt=0)
    monthly_rent: Decimal = Field(ge=0)
    annual_expenses: Decimal = Field(ge=0, default=0)


class RoiResponse(BaseModel):
    gross_yield_percent: Decimal
    net_yield_percent: Decimal
    net_annual_income: Decimal


class MortgageRequest(BaseModel):
    principal: Decimal = Field(gt=0)
    annual_rate_percent: Decimal = Field(ge=0)
    years: int = Field(gt=0)
    payments_per_year: int = Field(gt=0, default=12)


class MortgageResponse(BaseModel):
    payment_per_period: Decimal
    periods: int
    total_paid: Decimal
    total_interest: Decimal
