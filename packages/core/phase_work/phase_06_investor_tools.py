from __future__ import annotations

from dataclasses import asdict
from decimal import Decimal

from packages.core.investment import calc_mortgage_amortization, calc_roi


def run() -> None:
    """Phase 6: investor tools.

    Ensures ROI + mortgage calculators execute deterministically.
    This is a pure compute phase (no DB writes).
    """

    roi = calc_roi(
        purchase_price=Decimal("4200000"),
        monthly_rent=Decimal("35000"),
        annual_expenses=Decimal("60000"),
    )
    if roi.gross_yield_percent <= 0:
        raise SystemExit("ROI gross_yield_percent must be > 0")
    if roi.net_yield_percent <= 0:
        raise SystemExit("ROI net_yield_percent must be > 0")

    mort = calc_mortgage_amortization(
        principal=Decimal("3000000"),
        annual_rate_percent=Decimal("6.5"),
        years=20,
        payments_per_year=12,
    )
    if mort.periods != 240:
        raise SystemExit(f"Unexpected mortgage periods: {mort.periods}")
    if mort.payment_per_period <= 0:
        raise SystemExit("Mortgage payment_per_period must be > 0")

    # Emit a stable JSON-ish line for logs.
    print("phase_06_ok", {"roi": asdict(roi), "mortgage": asdict(mort)})


if __name__ == "__main__":
    run()
