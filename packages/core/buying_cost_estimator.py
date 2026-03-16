from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from packages.core.schemas.buying_cost_estimator import (
    BuyingCostEstimatorRequest,
    BuyingCostEstimatorResponse,
    BuyingCostLineItem,
    FinancingMode,
    PurchaseContext,
    TransferSplit,
)


DEFAULT_ASSUMPTION_SET_ID = "amp_v2_buying_cost_baseline"
DEFAULT_ASSUMPTION_SET_VERSION = "2026-03-15"
DISCLAIMER_KEY = "buying_cost_estimator.assumption_led_v1"

TRANSFER_FEE_RATE = Decimal("0.02")
STAMP_DUTY_RATE = Decimal("0.005")


def _round_currency(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _split_multiplier(transfer_split: TransferSplit) -> Decimal:
    if transfer_split == TransferSplit.BUYER_PAYS:
        return Decimal("1")
    if transfer_split == TransferSplit.SPLIT_EQUALLY:
        return Decimal("0.5")
    return Decimal("0")


def calculate_buying_cost_estimate(
    payload: BuyingCostEstimatorRequest,
) -> BuyingCostEstimatorResponse:
    split_multiplier = _split_multiplier(payload.transfer_split)
    property_price = Decimal(payload.property_price)

    line_items: list[BuyingCostLineItem] = []

    transfer_fee_amount = _round_currency(property_price * TRANSFER_FEE_RATE * split_multiplier)
    line_items.append(
        BuyingCostLineItem(
            key="transfer_fee",
            label_key="buying_cost.transfer_fee",
            amount=transfer_fee_amount,
            source_type="fixed",
        )
    )

    government_fees = transfer_fee_amount

    if payload.purchase_context == PurchaseContext.THAI_LOCAL:
        stamp_duty_amount = _round_currency(property_price * STAMP_DUTY_RATE * split_multiplier)
        line_items.append(
            BuyingCostLineItem(
                key="stamp_duty",
                label_key="buying_cost.stamp_duty",
                amount=stamp_duty_amount,
                source_type="fixed",
            )
        )
        government_fees = _round_currency(government_fees + stamp_duty_amount)

    editable_inputs = [
        ("agent_fee", "buying_cost.agent_fee", payload.agent_fee),
        ("lawyer_fee", "buying_cost.lawyer_fee", payload.lawyer_fee if payload.purchase_context == PurchaseContext.FOREIGN else None),
        (
            "bank_transfer_cost",
            "buying_cost.bank_transfer_cost",
            payload.bank_transfer_cost if payload.purchase_context == PurchaseContext.FOREIGN else None,
        ),
        (
            "fx_estimate",
            "buying_cost.fx_estimate",
            payload.fx_estimate if payload.purchase_context == PurchaseContext.FOREIGN else None,
        ),
    ]

    for key, label_key, raw_value in editable_inputs:
        if raw_value is None:
            continue
        amount = _round_currency(Decimal(raw_value))
        if amount <= 0:
            continue
        line_items.append(
            BuyingCostLineItem(
                key=key,
                label_key=label_key,
                amount=amount,
                source_type="editable",
            )
        )

    closing_cost = _round_currency(sum((item.amount for item in line_items), Decimal("0")))
    total_cash_needed = _round_currency(property_price + closing_cost)

    unresolved_items = ["withholding_tax_review"]
    if payload.financing_mode == FinancingMode.FINANCING:
        unresolved_items.append("mortgage_registration_review")

    return BuyingCostEstimatorResponse(
        assumption_set_id=payload.assumption_set_id or DEFAULT_ASSUMPTION_SET_ID,
        assumption_set_version=payload.assumption_set_version or DEFAULT_ASSUMPTION_SET_VERSION,
        purchase_context=payload.purchase_context,
        line_items=line_items,
        government_fees=government_fees,
        closing_cost=closing_cost,
        total_cash_needed=total_cash_needed,
        unresolved_items=unresolved_items,
        disclaimer_key=DISCLAIMER_KEY,
    )