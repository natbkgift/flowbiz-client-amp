from decimal import Decimal


def test_roi_deterministic_rounding(client):
    resp = client.post(
        "/v1/investment/roi",
        json={
            "purchase_price": "2000000",
            "monthly_rent": "15000",
            "annual_expenses": "12000",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["gross_yield_percent"] == "9.00"
    assert data["net_annual_income"] == "168000.00"


def test_mortgage_zero_interest(client):
    resp = client.post(
        "/v1/investment/mortgage",
        json={
            "principal": "1200000",
            "annual_rate_percent": "0",
            "years": 10,
            "payments_per_year": 12,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["periods"] == 120
    assert Decimal(data["total_interest"]) == Decimal("0.00")
