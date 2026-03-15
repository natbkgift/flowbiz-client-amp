from __future__ import annotations


def test_a12_foreign_buyer_hub_routes_render_conservative_guidance(client) -> None:
    en_response = client.get("/en/foreign-buyer-hub")
    assert en_response.status_code == 200, en_response.text
    en_html = en_response.text

    assert "Foreign Buyer Hub" in en_html
    assert "Ownership and eligibility basics" in en_html
    assert "Buying process module" in en_html
    assert "Discovery and shortlist review" in en_html
    assert "Reservation and due diligence stage" in en_html
    assert "Transfer preparation" in en_html
    assert "Post-transfer support expectations" in en_html
    assert "Document guidance module" in en_html
    assert "Common preparation categories" in en_html
    assert "Identity and passport baseline" in en_html
    assert "Funds-transfer evidence guidance" in en_html
    assert "These document categories are preparation guidance only" in en_html
    assert "FAQ / clarification module" in en_html
    assert "How long does a foreign-buyer purchase usually take?" in en_html
    assert "Which costs should be clarified early?" in en_html
    assert "This FAQ is for early clarification only" in en_html
    assert "It is not a legal, tax, or eligibility guarantee" in en_html
    assert "It is not a complete legal checklist" in en_html
    assert 'href="/en/contact?intent=consultation&amp;source=foreign_buyer_hub"' in en_html
    assert 'href="/en/projects?source=foreign_buyer_hub"' in en_html
    assert "Some condo inventory may fit foreign-quota ownership" in en_html
    assert "When legal review is required" in en_html
    assert "<form" not in en_html

    th_response = client.get("/th/foreign-buyer-hub")
    assert th_response.status_code == 200, th_response.text
    th_html = th_response.text

    assert "Foreign Buyer Hub" in th_html
    assert "ศูนย์ข้อมูลนี้เป็น guidance เชิงภาพรวมสำหรับผู้ซื้อต่างชาติในพัทยาเท่านั้น" in th_html
    assert "Ownership and eligibility basics" in th_html
    assert "Buying process module" in th_html
    assert "ลำดับด้านล่างเป็น roadmap เชิงอธิบายสำหรับผู้ซื้อต่างชาติ" in th_html
    assert "1. Discovery and shortlist review" in th_html
    assert "Document guidance module" in th_html
    assert "หมวดเอกสารด้านบนเป็น guidance เพื่อการเตรียมตัว" in th_html
    assert "identity/passport baseline" in th_html
    assert "FAQ / clarification module" in th_html
    assert "การซื้อของผู้ซื้อต่างชาติมักใช้เวลานานแค่ไหน?" in th_html
    assert "FAQ นี้ออกแบบมาเพื่อ clarification ระดับต้น" in th_html
    assert "workflow นี้เป็นคำอธิบายเชิงโครงสร้าง" in th_html
    assert 'href="/th/contact?intent=consultation&amp;source=foreign_buyer_hub"' in th_html
    assert "เมื่อใดที่ต้องขอ legal review" in th_html
