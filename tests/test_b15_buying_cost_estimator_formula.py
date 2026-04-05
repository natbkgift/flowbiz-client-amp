from __future__ import annotations

from decimal import Decimal

from packages.core.buying_cost_estimator import calculate_buying_cost_estimate
from packages.core.schemas.buying_cost_estimator import BuyingCostEstimatorRequest


def test_calculate_buying_cost_estimate_for_thai_local_context() -> None:
    result = calculate_buying_cost_estimate(
        BuyingCostEstimatorRequest(
            purchase_context="thai_local",
            property_price=Decimal("6000000"),
            ownership_type="freehold",
            transfer_split="split_equally",
            financing_mode="cash",
            assumption_set_id="amp_v2_buying_cost_baseline",
            assumption_set_version="2026-03-15",
            agent_fee=Decimal("25000"),
        )
    )

    assert result.government_fees == Decimal("75000.00")
    assert result.closing_cost == Decimal("100000.00")
    assert result.total_cash_needed == Decimal("6100000.00")
    assert [item.key for item in result.line_items] == ["transfer_fee", "stamp_duty", "agent_fee"]
    assert result.unresolved_items == ["withholding_tax_review"]


def test_buying_cost_api_returns_foreign_context_shape(client) -> None:
    response = client.post(
        "/tools/buying-cost",
        json={
            "purchase_context": "foreign",
            "property_price": "7250000",
            "ownership_type": "freehold",
            "transfer_split": "buyer_pays",
            "financing_mode": "financing",
            "assumption_set_id": "amp_v2_buying_cost_baseline",
            "assumption_set_version": "2026-03-15",
            "lawyer_fee": "20000",
            "bank_transfer_cost": "15000",
            "fx_estimate": "25000",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["assumption_set_id"] == "amp_v2_buying_cost_baseline"
    assert payload["purchase_context"] == "foreign"
    assert payload["government_fees"] == "145000.00"
    assert payload["closing_cost"] == "205000.00"
    assert payload["total_cash_needed"] == "7455000.00"
    assert payload["unresolved_items"] == ["withholding_tax_review", "mortgage_registration_review"]
    assert payload["disclaimer_key"] == "buying_cost_estimator.assumption_led_v1"
