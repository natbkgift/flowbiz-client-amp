from __future__ import annotations

from dataclasses import asdict

from packages.core.investment import calc_mortgage_amortization, calc_roi


def run() -> None:
    """Phase 6: investor tools.

    Ensures ROI + mortgage calculators execute deterministically.
    This is a pure compute phase (no DB writes).
    """

    roi = calc_roi(purchase_price=4_200_000, monthly_rent=35_000, annual_expenses=60_000)
    if roi.gross_yield_percent <= 0:
        raise SystemExit("ROI gross_yield_percent must be > 0")
    if roi.net_yield_percent <= 0:
        raise SystemExit("ROI net_yield_percent must be > 0")

    mort = calc_mortgage_amortization(
        principal=3_000_000,
        annual_rate_percent=6.5,
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
