from __future__ import annotations

from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PurchaseContext(str, Enum):
    THAI_LOCAL = "thai_local"
    FOREIGN = "foreign"


class OwnershipType(str, Enum):
    FREEHOLD = "freehold"
    LEASEHOLD = "leasehold"
    COMPANY_HOLD = "company_hold"


class TransferSplit(str, Enum):
    BUYER_PAYS = "buyer_pays"
    SPLIT_EQUALLY = "split_equally"
    SELLER_PAYS = "seller_pays"


class FinancingMode(str, Enum):
    CASH = "cash"
    FINANCING = "financing"


class BuyingCostEstimatorRequest(BaseModel):
    purchase_context: PurchaseContext
    property_price: Decimal = Field(gt=0)
    ownership_type: OwnershipType
    transfer_split: TransferSplit
    financing_mode: FinancingMode
    assumption_set_id: str = Field(min_length=1)
    assumption_set_version: str = Field(min_length=1)
    agent_fee: Decimal | None = Field(default=None, ge=0)
    lawyer_fee: Decimal | None = Field(default=None, ge=0)
    bank_transfer_cost: Decimal | None = Field(default=None, ge=0)
    fx_estimate: Decimal | None = Field(default=None, ge=0)

    model_config = ConfigDict(extra="ignore")


class BuyingCostLineItem(BaseModel):
    key: str
    label_key: str
    amount: Decimal
    source_type: str
    included_in_total: bool = True


class BuyingCostEstimatorResponse(BaseModel):
    assumption_set_id: str
    assumption_set_version: str
    purchase_context: PurchaseContext
    line_items: list[BuyingCostLineItem]
    government_fees: Decimal
    closing_cost: Decimal
    total_cash_needed: Decimal
    unresolved_items: list[str]
    disclaimer_key: str