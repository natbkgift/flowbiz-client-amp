from __future__ import annotations


def test_a13_market_intelligence_route_owner_renders_public_safe_shell(client) -> None:
    en_response = client.get("/en/market-intelligence")
    assert en_response.status_code == 200, en_response.text
    en_html = en_response.text

    assert "Market Intelligence" in en_html
    assert "What this slice activates" in en_html
    assert "Public-safe boundary" in en_html
    assert "Source classification layer" in en_html
    assert "Report region contract" in en_html
    assert "Basic market overview charts" in en_html
    assert "Advisory interpretation blocks" in en_html
    assert "Freshness and methodology framing" in en_html
    assert "What later slices add" in en_html
    assert "This page shell is not a full market report yet" in en_html
    assert "Published inventory coverage" in en_html
    assert "Governed signal readiness" in en_html
    assert "How much published inventory does the current public runtime cover?" in en_html
    assert "How much public-safe signal coverage is ready to support later reports?" in en_html
    assert "Published areas" in en_html
    assert "Projects with investment snapshot" in en_html
    assert "Freshness tier: fast" in en_html
    assert "Freshness tier: governed" in en_html
    assert "This chart summarizes records currently published in the runtime." in en_html
    assert "Coverage reading" in en_html
    assert "Readiness reading" in en_html
    assert "Nuance and escalation" in en_html
    assert "Source class: curated" in en_html
    assert "The current public runtime reflects published inventory across" in en_html
    assert "the next step should be the existing advisor path" in en_html
    assert "They are not investment recommendations" in en_html
    assert "Approved public inventory counts" in en_html
    assert "Editorial market commentary" in en_html
    assert "Advisor-only" in en_html
    assert (
        "This is a boundary class that defines what stays excluded from public market claims."
        in en_html
    )
    assert "Allowed classes" in en_html
    assert "Methodology / disclaimer region" in en_html
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
    assert "Source classification layer" in th_html
    assert "Report region contract" in th_html
    assert "Basic market overview charts" in th_html
    assert "Advisory interpretation blocks" in th_html
    assert "Freshness and methodology framing" in th_html
    assert "สิ่งที่จะตามมาใน slice ถัดไป" in th_html
    assert "page shell นี้ยังไม่ใช่รายงานตลาดฉบับสมบูรณ์" in th_html
    assert "Published inventory coverage" in th_html
    assert "Governed signal readiness" in th_html
    assert "ตอนนี้ public runtime ครอบคลุม inventory ที่เผยแพร่มากน้อยเพียงใด?" in th_html
    assert "มี public-safe market signals ที่พร้อมใช้เป็นฐานของ reports ถัดไปอยู่เท่าใด?" in th_html
    assert "Areas with verified metrics" in th_html
    assert "Projects with investment snapshot" in th_html
    assert "chart นี้สรุปจำนวน records ที่เผยแพร่ใน runtime ปัจจุบัน" in th_html
    assert "Coverage reading" in th_html
    assert "Readiness reading" in th_html
    assert "Nuance and escalation" in th_html
    assert "Source class: curated" in th_html
    assert "public runtime ตอนนี้สะท้อน inventory ที่เผยแพร่แล้ว" in th_html
    assert "ควรยกระดับไปยัง advisor path เดิม" in th_html
    assert "ไม่ใช่คำแนะนำลงทุน" in th_html
    assert "approved public inventory counts" in th_html
    assert "editorial market commentary" in th_html
    assert "จัดเป็น boundary class เพื่อบอกสิ่งที่ห้ามเผยแพร่" in th_html
    assert "Methodology / disclaimer region" in th_html
    assert 'href="/th/contact?intent=consultation&amp;source=market_intelligence"' in th_html
    assert 'href="/th/investment/methodology?source=market_intelligence"' in th_html
    assert "ข้อมูล advisor-only, negotiation notes" in th_html
    assert "data source classification layer" in th_html
    assert "<form" not in th_html
