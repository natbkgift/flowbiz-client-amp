from __future__ import annotations


def test_a13_market_intelligence_route_owner_renders_public_safe_shell(client) -> None:
    en_response = client.get("/en/market-intelligence")
    assert en_response.status_code == 200, en_response.text
    en_html = en_response.text

    assert "Market Intelligence" in en_html
    assert "What this slice activates" in en_html
    assert "Public-safe boundary" in en_html
    assert "Freshness and methodology framing" in en_html
    assert "What later slices add" in en_html
    assert "This page shell is not a full market report yet" in en_html
    assert 'href="/en/contact?intent=consultation&amp;source=market_intelligence"' in en_html
    assert 'href="/en/investment/methodology?source=market_intelligence"' in en_html
    assert "Advisor-only signals, negotiation notes" in en_html
    assert "Data source classification layer" in en_html
    assert "Basic market overview charts" in en_html
    assert "Advisory interpretation blocks" in en_html
    assert "<form" not in en_html

    th_response = client.get("/th/market-intelligence")
    assert th_response.status_code == 200, th_response.text
    th_html = th_response.text

    assert "Market Intelligence" in th_html
    assert "หน้านี้เป็น route owner สำหรับ Market Intelligence module" in th_html
    assert "Public-safe boundary" in th_html
    assert "Freshness and methodology framing" in th_html
    assert "สิ่งที่จะตามมาใน slice ถัดไป" in th_html
    assert "page shell นี้ยังไม่ใช่รายงานตลาดฉบับสมบูรณ์" in th_html
    assert 'href="/th/contact?intent=consultation&amp;source=market_intelligence"' in th_html
    assert 'href="/th/investment/methodology?source=market_intelligence"' in th_html
    assert "ข้อมูล advisor-only, negotiation notes" in th_html
    assert "data source classification layer" in th_html
    assert "<form" not in th_html
