from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


def _d(value: Decimal | int | float | str) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _q2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class RoiResult:
    gross_yield_percent: Decimal
    net_yield_percent: Decimal
    net_annual_income: Decimal


def calc_roi(
    *,
    purchase_price: Decimal,
    monthly_rent: Decimal,
    annual_expenses: Decimal,
) -> RoiResult:
    purchase_price = _d(purchase_price)
    monthly_rent = _d(monthly_rent)
    annual_expenses = _d(annual_expenses)

    if purchase_price <= 0:
        raise ValueError("purchase_price must be > 0")
    if monthly_rent < 0:
        raise ValueError("monthly_rent must be >= 0")
    if annual_expenses < 0:
        raise ValueError("annual_expenses must be >= 0")

    gross_annual = monthly_rent * Decimal(12)
    net_annual = gross_annual - annual_expenses

    gross_yield = (gross_annual / purchase_price) * Decimal(100)
    net_yield = (net_annual / purchase_price) * Decimal(100)

    return RoiResult(
        gross_yield_percent=_q2(gross_yield),
        net_yield_percent=_q2(net_yield),
        net_annual_income=_q2(net_annual),
    )


@dataclass(frozen=True)
class MortgageResult:
    payment_per_period: Decimal
    periods: int
    total_paid: Decimal
    total_interest: Decimal


def calc_mortgage_amortization(
    *,
    principal: Decimal,
    annual_rate_percent: Decimal,
    years: int,
    payments_per_year: int = 12,
) -> MortgageResult:
    principal = _d(principal)
    annual_rate_percent = _d(annual_rate_percent)

    if principal <= 0:
        raise ValueError("principal must be > 0")
    if annual_rate_percent < 0:
        raise ValueError("annual_rate_percent must be >= 0")
    if years <= 0:
        raise ValueError("years must be > 0")
    if payments_per_year <= 0:
        raise ValueError("payments_per_year must be > 0")

    periods = int(years) * int(payments_per_year)
    r = (annual_rate_percent / Decimal(100)) / Decimal(payments_per_year)

    if r == 0:
        payment = principal / Decimal(periods)
    else:
        one_plus_r_n = (Decimal(1) + r) ** periods
        payment = principal * (r * one_plus_r_n) / (one_plus_r_n - Decimal(1))

    payment = _q2(payment)
    total_paid = _q2(payment * Decimal(periods))
    total_interest = _q2(total_paid - principal)

    return MortgageResult(
        payment_per_period=payment,
        periods=periods,
        total_paid=total_paid,
        total_interest=total_interest,
    )
