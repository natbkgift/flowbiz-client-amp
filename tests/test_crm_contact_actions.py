from __future__ import annotations

from packages.core.crm_contact_actions import build_contact_action_urls


def test_whatsapp_url_uses_default_66_for_local_phone(monkeypatch):
    monkeypatch.delenv("CRM_WHATSAPP_DEFAULT_COUNTRY_CODE", raising=False)
    urls = build_contact_action_urls(email=None, phone="080 123 4567")
    assert urls["phone_url"] == "tel:0801234567"
    assert urls["whatsapp_url"] == "https://wa.me/66801234567"


def test_whatsapp_url_uses_env_country_code_for_local_phone(monkeypatch):
    monkeypatch.setenv("CRM_WHATSAPP_DEFAULT_COUNTRY_CODE", "+1")
    urls = build_contact_action_urls(email=None, phone="080 123 4567")
    assert urls["phone_url"] == "tel:0801234567"
    assert urls["whatsapp_url"] == "https://wa.me/1801234567"


def test_whatsapp_url_keeps_explicit_country_code(monkeypatch):
    monkeypatch.setenv("CRM_WHATSAPP_DEFAULT_COUNTRY_CODE", "+1")
    urls = build_contact_action_urls(email=None, phone="+66 80 123 4567")
    assert urls["phone_url"] == "tel:+66801234567"
    assert urls["whatsapp_url"] == "https://wa.me/66801234567"
