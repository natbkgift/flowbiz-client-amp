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

export type BuyingCostShareState = BuyingCostEstimateRequest & {
  disclaimer_key?: string;
  unresolved_items?: string[];
};

type QueryValueSource = URLSearchParams | { get(name: string): string | null } | Record<string, string | string[] | undefined>;

const SHARE_QUERY_KEYS = {
  property_price: 'bc_price',
  purchase_context: 'bc_purchase_context',
  ownership_type: 'bc_ownership_type',
  transfer_split: 'bc_transfer_split',
  financing_mode: 'bc_financing_mode',
  agent_fee: 'bc_agent_fee',
  lawyer_fee: 'bc_lawyer_fee',
  bank_transfer_cost: 'bc_bank_transfer_cost',
  fx_estimate: 'bc_fx_estimate',
  assumption_set_id: 'bc_assumption_set',
  assumption_set_version: 'bc_assumption_version',
  disclaimer_key: 'bc_disclaimer_key',
  unresolved_items: 'bc_unresolved_items',
} as const;

function pickQueryValue(source: QueryValueSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }

  const maybeGet = (source as { get?: (name: string) => string | null }).get;
  if (typeof maybeGet === 'function') {
    return maybeGet.call(source, key);
  }

  const rawValue = (source as Record<string, string | string[] | undefined>)[key];
  return typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue[0] ?? null : null;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function serializeNumber(value: number | undefined): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return String(value);
}

export function hasBuyingCostShareState(source: QueryValueSource): boolean {
  return Object.values(SHARE_QUERY_KEYS).some((key) => Boolean(pickQueryValue(source, key)));
}

export function parseBuyingCostShareQuery(source: QueryValueSource): Partial<BuyingCostShareState> & { has_share_state: boolean } {
  const propertyPrice = parsePositiveNumber(pickQueryValue(source, SHARE_QUERY_KEYS.property_price));
  const purchaseContext = normalizeEnum(pickQueryValue(source, SHARE_QUERY_KEYS.purchase_context), ['thai_local', 'foreign'] as const);
  const ownershipType = normalizeEnum(pickQueryValue(source, SHARE_QUERY_KEYS.ownership_type), ['freehold', 'leasehold', 'company_hold'] as const);
  const transferSplit = normalizeEnum(pickQueryValue(source, SHARE_QUERY_KEYS.transfer_split), ['buyer_pays', 'split_equally', 'seller_pays'] as const);
  const financingMode = normalizeEnum(pickQueryValue(source, SHARE_QUERY_KEYS.financing_mode), ['cash', 'financing'] as const);
  const unresolvedItemsValue = pickQueryValue(source, SHARE_QUERY_KEYS.unresolved_items);

  return {
    has_share_state: hasBuyingCostShareState(source),
    property_price: propertyPrice,
    purchase_context: purchaseContext,
    ownership_type: ownershipType,
    transfer_split: transferSplit,
    financing_mode: financingMode,
    agent_fee: parsePositiveNumber(pickQueryValue(source, SHARE_QUERY_KEYS.agent_fee)),
    lawyer_fee: parsePositiveNumber(pickQueryValue(source, SHARE_QUERY_KEYS.lawyer_fee)),
    bank_transfer_cost: parsePositiveNumber(pickQueryValue(source, SHARE_QUERY_KEYS.bank_transfer_cost)),
    fx_estimate: parsePositiveNumber(pickQueryValue(source, SHARE_QUERY_KEYS.fx_estimate)),
    assumption_set_id: pickQueryValue(source, SHARE_QUERY_KEYS.assumption_set_id) ?? undefined,
    assumption_set_version: pickQueryValue(source, SHARE_QUERY_KEYS.assumption_set_version) ?? undefined,
    disclaimer_key: pickQueryValue(source, SHARE_QUERY_KEYS.disclaimer_key) ?? undefined,
    unresolved_items: unresolvedItemsValue
      ? unresolvedItemsValue.split(',').map((item) => item.trim()).filter(Boolean)
      : undefined,
  };
}

export function buildBuyingCostShareQuery(state: BuyingCostShareState): Record<string, string> {
  const query: Record<string, string> = {
    [SHARE_QUERY_KEYS.property_price]: String(state.property_price),
    [SHARE_QUERY_KEYS.purchase_context]: state.purchase_context,
    [SHARE_QUERY_KEYS.ownership_type]: state.ownership_type,
    [SHARE_QUERY_KEYS.transfer_split]: state.transfer_split,
    [SHARE_QUERY_KEYS.financing_mode]: state.financing_mode,
    [SHARE_QUERY_KEYS.assumption_set_id]: state.assumption_set_id,
    [SHARE_QUERY_KEYS.assumption_set_version]: state.assumption_set_version,
  };

  const agentFee = serializeNumber(state.agent_fee);
  const lawyerFee = serializeNumber(state.lawyer_fee);
  const bankTransferCost = serializeNumber(state.bank_transfer_cost);
  const fxEstimate = serializeNumber(state.fx_estimate);

  if (agentFee) query[SHARE_QUERY_KEYS.agent_fee] = agentFee;
  if (lawyerFee) query[SHARE_QUERY_KEYS.lawyer_fee] = lawyerFee;
  if (bankTransferCost) query[SHARE_QUERY_KEYS.bank_transfer_cost] = bankTransferCost;
  if (fxEstimate) query[SHARE_QUERY_KEYS.fx_estimate] = fxEstimate;
  if (state.disclaimer_key) query[SHARE_QUERY_KEYS.disclaimer_key] = state.disclaimer_key;
  if (state.unresolved_items?.length) query[SHARE_QUERY_KEYS.unresolved_items] = state.unresolved_items.join(',');

  return query;
}

export function stripBuyingCostShareQuery(params: URLSearchParams): URLSearchParams {
  const nextParams = new URLSearchParams(params.toString());
  Object.values(SHARE_QUERY_KEYS).forEach((key) => nextParams.delete(key));
  return nextParams;
}

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