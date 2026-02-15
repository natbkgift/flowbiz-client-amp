from packages.core.phase1.schemas import ContactChannel, Phase1LeadPayload, Purpose
from packages.core.phase1.scoring import calculate_lead_score


def test_score_threshold_cold():
    payload = Phase1LeadPayload(
        source_page="/rent-condo-pattaya",
        purpose=Purpose.EXPLORING,
        budget_range="under_15k",
        timeline="researching",
        first_name="Alex",
        preferred_channel=ContactChannel.EMAIL,
        contact_value="alex@example.com",
        country="UK",
    )
    result = calculate_lead_score(payload)
    assert result.lead_score <= 20
    assert result.lead_temp.value == "cold"


def test_score_threshold_fire():
    payload = Phase1LeadPayload(
        source_page="/pattaya-condo-investment",
        purpose=Purpose.BUY_INVEST,
        budget_range="10m_plus",
        timeline="within_1mo",
        in_thailand="yes_pattaya",
        first_name="Sam",
        preferred_channel=ContactChannel.WHATSAPP,
        contact_value="+66810000000",
        country="US",
        requested_viewing=True,
        referred_by_client=True,
    )
    result = calculate_lead_score(payload)
    assert result.lead_score >= 71
    assert result.lead_temp.value == "fire"
    assert result.line_notification_mode == "urgent"
