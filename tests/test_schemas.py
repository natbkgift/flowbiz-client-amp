"""
Tests for core schemas and enums.
"""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from packages.core.campaign_config import get_campaign_config, get_hashtags
from packages.core.schemas.enums import (
    LeadPriority,
    LeadSource,
    LeadStatus,
    PropertyIntent,
    PropertyType,
)
from packages.core.schemas.leads import (
    LeadContact,
    LeadCreate,
    LeadWebhookPayload,
)
from packages.core.schemas.properties import (
    PropertyCreate,
    PropertyLocation,
    PropertyPricing,
    PropertySpecs,
)


class TestEnums:
    """Test enum values."""

    def test_property_intent_values(self):
        assert PropertyIntent.SALE_NEW.value == "sale_new"
        assert PropertyIntent.SALE_RESALE.value == "sale_resale"
        assert PropertyIntent.RENT_LONG.value == "rent_long"
        assert PropertyIntent.RENT_SHORT.value == "rent_short"

    def test_lead_priority_values(self):
        assert LeadPriority.HOT.value == "hot"
        assert LeadPriority.WARM.value == "warm"
        assert LeadPriority.COLD.value == "cold"
        assert LeadPriority.DEAD.value == "dead"


class TestPropertySchemas:
    """Test property schemas."""

    def test_property_create_valid(self):
        property_data = PropertyCreate(
            property_id="PROP-2026-001",
            intent=PropertyIntent.SALE_NEW,
            type=PropertyType.CONDO,
            location=PropertyLocation(area="Jomtien"),
            specs=PropertySpecs(bedrooms=2, bathrooms=2),
            pricing=PropertyPricing(price_sale=Decimal("5000000")),
        )
        assert property_data.property_id == "PROP-2026-001"
        assert property_data.intent == PropertyIntent.SALE_NEW

    def test_property_id_pattern_invalid(self):
        with pytest.raises(ValidationError):
            PropertyCreate(
                property_id="INVALID-ID",
                intent=PropertyIntent.SALE_NEW,
                type=PropertyType.CONDO,
                location=PropertyLocation(area="Jomtien"),
                specs=PropertySpecs(),
                pricing=PropertyPricing(),
            )


class TestLeadSchemas:
    """Test lead schemas."""

    def test_lead_create_valid(self):
        lead = LeadCreate(
            source=LeadSource.FB_LEAD_FORM,
            contact=LeadContact(
                first_name="John",
                phone="+66891234567",
            ),
        )
        assert lead.source == LeadSource.FB_LEAD_FORM
        assert lead.contact.first_name == "John"
        assert lead.status == LeadStatus.NEW
        assert lead.priority == LeadPriority.WARM

    def test_lead_webhook_payload(self):
        payload = LeadWebhookPayload(
            source="fb_lead_form",
            first_name="Jane",
            phone="+66891234567",
            budget="3to5",
        )
        assert payload.source == "fb_lead_form"
        assert payload.budget == "3to5"


class TestCampaignConfig:
    """Test campaign configuration."""

    def test_get_campaign_config_new_project(self):
        config = get_campaign_config("sale_new")
        assert config["name"] == "New Project Campaign"
        assert config["target_cpl_thb"] == 500

    def test_get_campaign_config_fallback(self):
        config = get_campaign_config("unknown_type")
        assert config["name"] == "Resale Property Campaign"

    def test_get_hashtags(self):
        hashtags = get_hashtags("sale_new", include_secondary=True)
        assert "#PattayaProperty" in hashtags
        assert len(hashtags) > 5

    def test_get_hashtags_primary_only(self):
        hashtags = get_hashtags("rent_long", include_secondary=False)
        assert "#PattayaRental" in hashtags
        assert "#JomtienRental" not in hashtags
