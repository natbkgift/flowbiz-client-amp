export type BuyingCostPurchaseContext = 'thai_local' | 'foreign';
export type BuyingCostOwnershipType = 'freehold' | 'leasehold' | 'company_hold';
export type BuyingCostTransferSplit = 'buyer_pays' | 'split_equally' | 'seller_pays';
export type BuyingCostFinancingMode = 'cash' | 'financing';

export type BuyingCostEstimateRequest = {
  purchase_context: BuyingCostPurchaseContext;
  property_price: number;
  ownership_type: BuyingCostOwnershipType;
  transfer_split: BuyingCostTransferSplit;
  financing_mode: BuyingCostFinancingMode;
  assumption_set_id: string;
  assumption_set_version: string;
  agent_fee?: number;
  lawyer_fee?: number;
  bank_transfer_cost?: number;
  fx_estimate?: number;
};

export type BuyingCostEstimateLineItem = {
  key: string;
  label_key: string;
  amount: number;
  source_type: 'fixed' | 'editable';
  included_in_total: boolean;
};

export type BuyingCostEstimateResponse = {
  assumption_set_id: string;
  assumption_set_version: string;
  purchase_context: BuyingCostPurchaseContext;
  line_items: BuyingCostEstimateLineItem[];
  government_fees: number;
  closing_cost: number;
  total_cash_needed: number;
  unresolved_items: string[];
  disclaimer_key: string;
};

export const DEFAULT_BUYING_COST_ASSUMPTION_SET_ID = 'amp_v2_buying_cost_baseline';
export const DEFAULT_BUYING_COST_ASSUMPTION_SET_VERSION = '2026-03-15';

export async function requestBuyingCostEstimate(
  input: BuyingCostEstimateRequest,
): Promise<BuyingCostEstimateResponse> {
  const response = await fetch('/api/tools/buying-cost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }

  return (await response.json()) as BuyingCostEstimateResponse;
}