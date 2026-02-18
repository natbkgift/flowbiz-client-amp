from __future__ import annotations

from packages.core.crm_tagging import enrich_inquiry


def test_enrich_inquiry_guided_investment_plan_tags_and_fields() -> None:
    enrichment = enrich_inquiry(
        message="Hi AMP Pattaya — Goal: invest | Budget: 8m+ | Timeline: 0-3m",
        source_page="https://amppattaya.com/en/contact?topic=investment_plan",
        persona=None,
        budget_band=None,
        timeline=None,
    )

    assert enrichment.persona == "investor"
    assert enrichment.budget_band == "5m_10m"
    assert enrichment.timeline == "1_3mo"
    assert enrichment.tags == ("high_budget", "investor", "urgent")


def test_enrich_inquiry_private_tour_owner_stay_tag() -> None:
    enrichment = enrich_inquiry(
        message="Hello | Goal: buy | Budget: 3-5m | Timeline: 6-12m",
        source_page="https://amppattaya.com/th/contact?topic=private_tour",
        persona=None,
        budget_band=None,
        timeline=None,
    )

    assert enrichment.persona is None
    assert enrichment.budget_band == "2m_5m"
    assert enrichment.timeline == "6_12mo"
    assert enrichment.tags == ("own_stay",)


def test_enrich_inquiry_does_not_override_structured_fields() -> None:
    enrichment = enrich_inquiry(
        message="Goal: buy | Budget: <3m | Timeline: 12m+",
        source_page="https://amppattaya.com/en/contact?topic=private_tour",
        persona="investor",
        budget_band="gt_20m",
        timeline="gt_12mo",
    )

    assert enrichment.persona == "investor"
    assert enrichment.budget_band == "gt_20m"
    assert enrichment.timeline == "gt_12mo"
    # Investor + high budget; not urgent because timeline is > 12mo.
    # Note: topic=private_tour also tags own-stay intent.
    assert enrichment.tags == ("high_budget", "investor", "own_stay")


def test_enrich_inquiry_is_deterministic() -> None:
    message = "Hi — Goal: rent | Budget: 5-8m | Timeline: 3-6m"
    source_page = "https://amppattaya.com/en/contact?topic=private_tour"

    a = enrich_inquiry(
        message=message,
        source_page=source_page,
        persona=None,
        budget_band=None,
        timeline=None,
    )
    b = enrich_inquiry(
        message=message,
        source_page=source_page,
        persona=None,
        budget_band=None,
        timeline=None,
    )

    assert a == b
