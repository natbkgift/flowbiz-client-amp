import type { Dictionary, Locale } from '@/app/_lib/i18n/types';
import { withLocale } from '@/app/_lib/i18n/routing';
import { buildWhatsAppUrl } from '@/app/_lib/public-cta';

export type InvestorToolContext = {
  purchasePrice?: number | null;
  monthlyRent?: number | null;
  occupancyRate?: number | null;
  annualCosts?: number | null;
  grossYield?: number | null;
  netYield?: number | null;
  paybackYears?: number | null;
  ids?: string[];
  intent?: string | null;
  source?: string | null;
};

export type BuyingCostAdvisorContext = {
  intent?: string | null;
  source?: string | null;
  tool?: string | null;
  propertyPrice?: number | null;
  purchaseContext?: string | null;
  ownershipType?: string | null;
  transferSplit?: string | null;
  financingMode?: string | null;
  assumptionSetId?: string | null;
  assumptionVersion?: string | null;
  governmentFees?: number | null;
  closingCost?: number | null;
  totalCashNeeded?: number | null;
  agentFee?: number | null;
  lawyerFee?: number | null;
  bankTransferCost?: number | null;
  fxEstimate?: number | null;
  unresolvedItems?: string[];
  disclaimerKey?: string | null;
};

export type NormalizedLeadIntent =
  | 'project_consultation'
  | 'project_shortlist'
  | 'project_compare'
  | 'general_inquiry';

export type LeadCaptureContext = {
  intent: NormalizedLeadIntent;
  source?: string | null;
  sourceRoute?: string | null;
  ctaType?: string | null;
  ctaLabel?: string | null;
  project?: string | null;
  projects?: string[];
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  userIntent?: string | null;
  budgetRange?: string | null;
  bedroom?: string | null;
  location?: string | null;
  buyerFit?: string | null;
  signalLevel?: string | null;
  compareIds?: string[];
  area?: string | null;
  message?: string | null;
};

function pickQueryValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function parseFiniteNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIds(value: string | null): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function parseDelimitedValues(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function serializeDelimitedValues(values: Array<string | null | undefined> | undefined): string | null {
  if (!values?.length) return null;
  const seen = new Set<string>();
  const normalized = values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);

  return normalized.length ? normalized.join(',') : null;
}

function serializeMetric(value: number | null | undefined, decimals = 2): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function normalizeLeadIntent(
  value: string | null | undefined,
  fallback: NormalizedLeadIntent = 'general_inquiry',
): NormalizedLeadIntent {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'project_consultation' || normalized === 'project_availability_check' || normalized === 'project_investment_check') {
    return 'project_consultation';
  }
  if (normalized === 'project_shortlist') {
    return 'project_shortlist';
  }
  if (normalized === 'project_compare' || normalized === 'shortlist_review') {
    return 'project_compare';
  }
  if (normalized === 'general_inquiry' || normalized === 'general') {
    return 'general_inquiry';
  }

  return fallback;
}

export function parseLeadCaptureContext(
  searchParams?: Record<string, string | string[] | undefined>,
  fallbackIntent: NormalizedLeadIntent = 'general_inquiry',
): LeadCaptureContext {
  const project = pickQueryValue(searchParams?.project);
  const projects = parseDelimitedValues(pickQueryValue(searchParams?.projects));
  const context: LeadCaptureContext = {
    intent: normalizeLeadIntent(pickQueryValue(searchParams?.intent), fallbackIntent),
  };
  const source = pickQueryValue(searchParams?.source);
  const sourceRoute = pickQueryValue(searchParams?.source_route);
  const ctaType = pickQueryValue(searchParams?.cta_type);
  const ctaLabel = pickQueryValue(searchParams?.cta_label);
  const entityType = pickQueryValue(searchParams?.entity_type);
  const entityId = pickQueryValue(searchParams?.entity_id);
  const entityName = pickQueryValue(searchParams?.entity_name);
  const userIntent = pickQueryValue(searchParams?.user_intent);
  const budgetRange = pickQueryValue(searchParams?.budget_range);
  const bedroom = pickQueryValue(searchParams?.bedroom);
  const location = pickQueryValue(searchParams?.location);
  const buyerFit = pickQueryValue(searchParams?.buyer_fit);
  const signalLevel = pickQueryValue(searchParams?.signal_level);
  const compareIds = parseDelimitedValues(pickQueryValue(searchParams?.compare_ids));
  const area = pickQueryValue(searchParams?.area);
  const message = pickQueryValue(searchParams?.msg);

  if (source) context.source = source;
  if (sourceRoute) context.sourceRoute = sourceRoute;
  if (ctaType) context.ctaType = ctaType;
  if (ctaLabel) context.ctaLabel = ctaLabel;
  if (project) context.project = project;
  if (projects.length || project) context.projects = project && !projects.length ? [project] : projects;
  if (entityType) context.entityType = entityType;
  if (entityId) context.entityId = entityId;
  if (entityName) context.entityName = entityName;
  if (userIntent) context.userIntent = userIntent;
  if (budgetRange) context.budgetRange = budgetRange;
  if (bedroom) context.bedroom = bedroom;
  if (location) context.location = location;
  if (buyerFit) context.buyerFit = buyerFit;
  if (signalLevel) context.signalLevel = signalLevel;
  if (compareIds.length) context.compareIds = compareIds;
  if (area) context.area = area;
  if (message) context.message = message;

  return context;
}

export function buildLeadCaptureQuery(context: LeadCaptureContext): Record<string, string> {
  const query: Record<string, string> = {
    intent: normalizeLeadIntent(context.intent),
  };
  const projects = serializeDelimitedValues(context.projects);
  const compareIds = serializeDelimitedValues(context.compareIds);

  if (context.source) query.source = context.source;
  if (context.sourceRoute) query.source_route = context.sourceRoute;
  if (context.ctaType) query.cta_type = context.ctaType;
  if (context.ctaLabel) query.cta_label = context.ctaLabel;
  if (context.project) query.project = context.project;
  if (projects) query.projects = projects;
  if (context.entityType) query.entity_type = context.entityType;
  if (context.entityId) query.entity_id = context.entityId;
  if (context.entityName) query.entity_name = context.entityName;
  if (context.userIntent) query.user_intent = context.userIntent;
  if (context.budgetRange) query.budget_range = context.budgetRange;
  if (context.bedroom) query.bedroom = context.bedroom;
  if (context.location) query.location = context.location;
  if (context.buyerFit) query.buyer_fit = context.buyerFit;
  if (context.signalLevel) query.signal_level = context.signalLevel;
  if (compareIds) query.compare_ids = compareIds;
  if (context.area) query.area = context.area;
  if (context.message) query.msg = context.message;

  return query;
}

export function parseInvestorToolContext(
  searchParams?: Record<string, string | string[] | undefined>,
): InvestorToolContext {
  return {
    purchasePrice: parseFiniteNumber(pickQueryValue(searchParams?.purchasePrice)),
    monthlyRent: parseFiniteNumber(pickQueryValue(searchParams?.monthlyRent)),
    occupancyRate: parseFiniteNumber(pickQueryValue(searchParams?.occupancyRate)),
    annualCosts: parseFiniteNumber(pickQueryValue(searchParams?.annualCosts)),
    grossYield: parseFiniteNumber(pickQueryValue(searchParams?.grossYield)),
    netYield: parseFiniteNumber(pickQueryValue(searchParams?.netYield)),
    paybackYears: parseFiniteNumber(pickQueryValue(searchParams?.paybackYears)),
    ids: parseIds(pickQueryValue(searchParams?.ids)),
    intent: pickQueryValue(searchParams?.intent),
    source: pickQueryValue(searchParams?.source),
  };
}

export function buildInvestorToolQuery(context: InvestorToolContext): Record<string, string> {
  const query: Record<string, string> = {};
  const purchasePrice = serializeMetric(context.purchasePrice, 0);
  const monthlyRent = serializeMetric(context.monthlyRent, 0);
  const occupancyRate = serializeMetric(context.occupancyRate, 0);
  const annualCosts = serializeMetric(context.annualCosts, 0);
  const grossYield = serializeMetric(context.grossYield);
  const netYield = serializeMetric(context.netYield);
  const paybackYears = serializeMetric(context.paybackYears, 1);

  if (purchasePrice) query.purchasePrice = purchasePrice;
  if (monthlyRent) query.monthlyRent = monthlyRent;
  if (occupancyRate) query.occupancyRate = occupancyRate;
  if (annualCosts) query.annualCosts = annualCosts;
  if (grossYield) query.grossYield = grossYield;
  if (netYield) query.netYield = netYield;
  if (paybackYears) query.paybackYears = paybackYears;
  if (context.ids?.length) query.ids = context.ids.join(',');
  if (context.intent) query.intent = context.intent;
  if (context.source) query.source = context.source;

  return query;
}

export function parseBuyingCostAdvisorContext(
  searchParams?: Record<string, string | string[] | undefined>,
): BuyingCostAdvisorContext {
  return {
    intent: pickQueryValue(searchParams?.intent),
    source: pickQueryValue(searchParams?.source),
    tool: pickQueryValue(searchParams?.tool),
    propertyPrice: parseFiniteNumber(pickQueryValue(searchParams?.bc_price)),
    purchaseContext: pickQueryValue(searchParams?.bc_purchase_context),
    ownershipType: pickQueryValue(searchParams?.bc_ownership_type),
    transferSplit: pickQueryValue(searchParams?.bc_transfer_split),
    financingMode: pickQueryValue(searchParams?.bc_financing_mode),
    assumptionSetId: pickQueryValue(searchParams?.bc_assumption_set),
    assumptionVersion: pickQueryValue(searchParams?.bc_assumption_version),
    governmentFees: parseFiniteNumber(pickQueryValue(searchParams?.bc_government_fees)),
    closingCost: parseFiniteNumber(pickQueryValue(searchParams?.bc_closing_cost)),
    totalCashNeeded: parseFiniteNumber(pickQueryValue(searchParams?.bc_total_cash_needed)),
    agentFee: parseFiniteNumber(pickQueryValue(searchParams?.bc_agent_fee)),
    lawyerFee: parseFiniteNumber(pickQueryValue(searchParams?.bc_lawyer_fee)),
    bankTransferCost: parseFiniteNumber(pickQueryValue(searchParams?.bc_bank_transfer_cost)),
    fxEstimate: parseFiniteNumber(pickQueryValue(searchParams?.bc_fx_estimate)),
    unresolvedItems: parseDelimitedValues(pickQueryValue(searchParams?.bc_unresolved_items)),
    disclaimerKey: pickQueryValue(searchParams?.bc_disclaimer_key),
  };
}

export function buildBuyingCostAdvisorQuery(context: BuyingCostAdvisorContext): Record<string, string> {
  const query: Record<string, string> = {};
  const price = serializeMetric(context.propertyPrice, 0);
  const governmentFees = serializeMetric(context.governmentFees, 0);
  const closingCost = serializeMetric(context.closingCost, 0);
  const totalCashNeeded = serializeMetric(context.totalCashNeeded, 0);
  const agentFee = serializeMetric(context.agentFee, 0);
  const lawyerFee = serializeMetric(context.lawyerFee, 0);
  const bankTransferCost = serializeMetric(context.bankTransferCost, 0);
  const fxEstimate = serializeMetric(context.fxEstimate, 0);

  if (context.intent) query.intent = context.intent;
  if (context.source) query.source = context.source;
  if (context.tool) query.tool = context.tool;
  if (price) query.bc_price = price;
  if (context.purchaseContext) query.bc_purchase_context = context.purchaseContext;
  if (context.ownershipType) query.bc_ownership_type = context.ownershipType;
  if (context.transferSplit) query.bc_transfer_split = context.transferSplit;
  if (context.financingMode) query.bc_financing_mode = context.financingMode;
  if (context.assumptionSetId) query.bc_assumption_set = context.assumptionSetId;
  if (context.assumptionVersion) query.bc_assumption_version = context.assumptionVersion;
  if (governmentFees) query.bc_government_fees = governmentFees;
  if (closingCost) query.bc_closing_cost = closingCost;
  if (totalCashNeeded) query.bc_total_cash_needed = totalCashNeeded;
  if (agentFee) query.bc_agent_fee = agentFee;
  if (lawyerFee) query.bc_lawyer_fee = lawyerFee;
  if (bankTransferCost) query.bc_bank_transfer_cost = bankTransferCost;
  if (fxEstimate) query.bc_fx_estimate = fxEstimate;
  if (context.unresolvedItems?.length) query.bc_unresolved_items = context.unresolvedItems.join(',');
  if (context.disclaimerKey) query.bc_disclaimer_key = context.disclaimerKey;

  return query;
}

export function getAdvisoryProofs(dict: Dictionary, count = 4): string[] {
  return dict.advisory.trustBar.slice(0, count);
}

export function getAdvisoryLabels(input: Locale | Dictionary): {
  proofsLabel: string;
  guidanceLabel: string;
} {
  if (typeof input !== 'string') {
    return input.advisory.accessibility;
  }

  if (input === 'th') {
    return {
      proofsLabel: 'แถบความน่าเชื่อถือ',
      guidanceLabel: 'คำแนะนำของหน้านี้',
    };
  }

  return {
    proofsLabel: 'Trust bar',
    guidanceLabel: 'Page guidance',
  };
}

export function buildAdvisorWhatsApp(locale: Locale, dict: Dictionary, message?: string): string {
  const fallback = dict.home.whatsAppFallback || (locale === 'th'
    ? 'สวัสดี AMP Pattaya ฉันต้องการคำแนะนำเพื่อคัดอสังหาริมทรัพย์ในพัทยา'
    : 'Hi AMP Pattaya, I need help curating the right Pattaya property.');
  return buildWhatsAppUrl(message ?? fallback);
}

export function withLocaleQuery(
  locale: Locale,
  pathname: string,
  query?: Record<string, string | number | null | undefined>,
): string {
  const url = new URL(pathname, 'https://amp.local');
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value == null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return withLocale(locale, `${url.pathname}${url.search}`);
}
