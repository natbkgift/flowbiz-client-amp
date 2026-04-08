export type ConversionSourceRoute =
  | 'property'
  | 'project'
  | 'compare'
  | 'shortlist'
  | 'smart-finder'
  | 'area-guide'
  | 'estimator'
  | 'contact'
  | 'buy'
  | 'rent'
  | 'sell'
  | 'home'
  | 'shared';

export type ConversionCtaType = 'primary' | 'secondary' | 'tertiary';
export type ConversionEntityType =
  | 'property'
  | 'project'
  | 'area'
  | 'recommendation'
  | 'shortlist'
  | 'estimate'
  | 'contact'
  | 'route';
export type ConversionIntent = 'buy' | 'invest' | 'compare' | 'research';
export type ConversionDevice = 'mobile' | 'desktop';

export type ConversionContext = {
  from_shortlist?: boolean;
  compare_ids?: string[];
  smart_finder_answers?: Record<string, string>;
  estimator_result?: Record<string, string | number>;
  area?: string;
  [key: string]: unknown;
};

export type ConversionContact = {
  name?: string;
  phone?: string;
  email?: string;
  line?: string;
};

export type ConversionPayload = {
  source_route: ConversionSourceRoute;
  cta_type?: ConversionCtaType;
  cta_label?: string;
  entity_type?: ConversionEntityType;
  entity_id?: string;
  entity_name?: string;
  user_intent?: ConversionIntent;
  budget_range?: string;
  bedroom?: string;
  location?: string;
  locale?: 'en' | 'th';
  device?: ConversionDevice;
  timestamp?: string;
  context?: ConversionContext;
  contact?: ConversionContact;
  [key: string]: unknown;
};

export type LeadHandoff = {
  sourceRoute: ConversionSourceRoute;
  ctaType?: ConversionCtaType;
  ctaLabel?: string;
  entityType?: ConversionEntityType;
  entityId?: string | null;
  entityName?: string | null;
  userIntent?: ConversionIntent;
  budgetRange?: string | null;
  bedroom?: string | null;
  location?: string | null;
  context?: ConversionContext;
};

export type LeadAnalyticsOptions = {
  sourceRoute?: ConversionSourceRoute;
  propertyId?: string | null;
  leadSource?: string | null;
  leadTier?: string | null;
  leadScore?: number | null;
  budgetRange?: string | null;
  purpose?: string | null;
  timeframe?: string | null;
  preferredArea?: string | null;
  inquiryIntent?: string | null;
  responseChannel?: string | null;
  responseSlaSeconds?: number | null;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLine?: boolean;
  formType?: string | null;
  errorMessage?: string | null;
};

function cleanValue(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => cleanValue(item))
      .filter((item) => item !== undefined);
    return cleaned.length ? cleaned : undefined;
  }
  if (typeof value === 'object') {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, cleanValue(item)] as const)
      .filter((entry): entry is readonly [string, unknown] => entry[1] !== undefined);
    return cleanedEntries.length ? Object.fromEntries(cleanedEntries) : undefined;
  }
  return value;
}

export function sanitizeConversionPayload<T extends Record<string, unknown>>(payload: T): T {
  return (cleanValue(payload) ?? {}) as T;
}

export function inferLocaleFromPath(pathname: string): 'en' | 'th' {
  return pathname.startsWith('/th') ? 'th' : 'en';
}

export function inferSourceRouteFromPath(pathname: string): ConversionSourceRoute {
  const normalized = pathname.trim().toLowerCase();

  if (!normalized || normalized === '/' || normalized === '/en' || normalized === '/th') {
    return 'home';
  }
  if (/(^|\/)buy(\/|$)/.test(normalized)) return 'buy';
  if (/(^|\/)rent(\/|$)/.test(normalized)) return 'rent';
  if (/(^|\/)sell(\/|$)/.test(normalized)) return 'sell';
  if (/(^|\/)contact(\/|$)/.test(normalized)) return 'contact';
  if (/(^|\/)compare(\/|$)/.test(normalized)) return 'compare';
  if (/(^|\/)shortlist(\/|$)/.test(normalized)) return 'shortlist';
  if (/(^|\/)smart-finder(\/|$)/.test(normalized)) return 'smart-finder';
  if (/(^|\/)area-guide(\/|$)/.test(normalized)) return 'area-guide';
  if (/(^|\/)(buying-cost-estimator|calculator)(\/|$)/.test(normalized)) return 'estimator';
  if (/(^|\/)property(\/|$)/.test(normalized)) return 'property';
  if (/(^|\/)projects?(\/|$)/.test(normalized)) return 'project';
  return 'shared';
}

export function inferDeviceType(width: number | null | undefined): ConversionDevice {
  return typeof width === 'number' && width < 768 ? 'mobile' : 'desktop';
}

function normalizeTagToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function buildLeadHandoffTags(handoff: LeadHandoff | undefined): string[] {
  if (!handoff) return [];

  const tags = [
    `source_route:${normalizeTagToken(handoff.sourceRoute)}`,
    handoff.ctaType ? `cta_type:${normalizeTagToken(handoff.ctaType)}` : null,
    handoff.entityType ? `entity_type:${normalizeTagToken(handoff.entityType)}` : null,
    handoff.entityId ? `entity_id:${normalizeTagToken(handoff.entityId)}` : null,
    handoff.entityName ? `entity_name:${normalizeTagToken(handoff.entityName)}` : null,
    handoff.userIntent ? `user_intent:${normalizeTagToken(handoff.userIntent)}` : null,
    handoff.location ? `location:${normalizeTagToken(handoff.location)}` : null,
    handoff.bedroom ? `bedroom:${normalizeTagToken(handoff.bedroom)}` : null,
    handoff.budgetRange ? `budget_range:${normalizeTagToken(handoff.budgetRange)}` : null,
    handoff.context?.from_shortlist ? 'from_shortlist:yes' : null,
    handoff.context?.area ? `area:${normalizeTagToken(String(handoff.context.area))}` : null,
  ].filter((item): item is string => Boolean(item));

  const compareIds = Array.isArray(handoff.context?.compare_ids) ? handoff.context?.compare_ids : [];
  if (compareIds.length) {
    tags.push(`compare_count:${compareIds.length}`);
  }

  return Array.from(new Set(tags));
}

export function buildLeadHandoffSummary(
  locale: 'en' | 'th',
  handoff: LeadHandoff | undefined,
): string[] {
  if (!handoff) return [];

  const lines = [
    locale === 'th'
      ? `เส้นทางต้นทาง: ${handoff.sourceRoute}`
      : `Source route: ${handoff.sourceRoute}`,
    handoff.ctaLabel
      ? (locale === 'th' ? `CTA ที่กด: ${handoff.ctaLabel}` : `CTA used: ${handoff.ctaLabel}`)
      : null,
    handoff.entityName
      ? (locale === 'th' ? `รายการหลัก: ${handoff.entityName}` : `Primary entity: ${handoff.entityName}`)
      : null,
    handoff.userIntent
      ? (locale === 'th' ? `เจตนา: ${handoff.userIntent}` : `Intent: ${handoff.userIntent}`)
      : null,
    handoff.budgetRange
      ? (locale === 'th' ? `ช่วงงบ: ${handoff.budgetRange}` : `Budget range: ${handoff.budgetRange}`)
      : null,
    handoff.location
      ? (locale === 'th' ? `ทำเล: ${handoff.location}` : `Location: ${handoff.location}`)
      : null,
    handoff.bedroom
      ? (locale === 'th' ? `ห้องนอน: ${handoff.bedroom}` : `Bedroom: ${handoff.bedroom}`)
      : null,
    handoff.context?.from_shortlist
      ? (locale === 'th' ? 'มาจาก shortlist เดิม' : 'Carried from the shortlist')
      : null,
    Array.isArray(handoff.context?.compare_ids) && handoff.context.compare_ids.length
      ? (locale === 'th'
          ? `รายการที่ใช้เทียบ: ${handoff.context.compare_ids.join(', ')}`
          : `Comparison scope: ${handoff.context.compare_ids.join(', ')}`)
      : null,
    handoff.context?.area
      ? (locale === 'th' ? `บริบททำเล: ${handoff.context.area}` : `Area context: ${handoff.context.area}`)
      : null,
  ].filter((item): item is string => Boolean(item));

  if (handoff.context?.smart_finder_answers) {
    const answerSummary = Object.entries(handoff.context.smart_finder_answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    if (answerSummary) {
      lines.push(
        locale === 'th'
          ? `คำตอบจาก Smart Finder: ${answerSummary}`
          : `Smart Finder answers: ${answerSummary}`,
      );
    }
  }

  if (handoff.context?.estimator_result) {
    const resultSummary = Object.entries(handoff.context.estimator_result)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');
    if (resultSummary) {
      lines.push(
        locale === 'th'
          ? `ผลจาก estimator: ${resultSummary}`
          : `Estimator result: ${resultSummary}`,
      );
    }
  }

  return lines;
}

export function buildLeadTrackingPayload(
  locale: 'en' | 'th',
  handoff: LeadHandoff | undefined,
  contact?: ConversionContact,
): ConversionPayload | undefined {
  if (!handoff) return undefined;

  return sanitizeConversionPayload({
    source_route: handoff.sourceRoute,
    cta_type: handoff.ctaType,
    cta_label: handoff.ctaLabel,
    entity_type: handoff.entityType,
    entity_id: handoff.entityId ?? undefined,
    entity_name: handoff.entityName ?? undefined,
    user_intent: handoff.userIntent,
    budget_range: handoff.budgetRange ?? undefined,
    bedroom: handoff.bedroom ?? undefined,
    location: handoff.location ?? undefined,
    locale,
    context: handoff.context,
    contact,
  });
}

function inferContactChannel(options: LeadAnalyticsOptions): string | undefined {
  const channels = [
    options.hasEmail ? 'email' : null,
    options.hasPhone ? 'phone' : null,
    options.hasLine ? 'line' : null,
  ].filter((item): item is string => Boolean(item));

  return channels.length ? channels.join('_and_') : undefined;
}

export function buildLeadAnalyticsPayload(
  locale: 'en' | 'th',
  handoff: LeadHandoff | undefined,
  options: LeadAnalyticsOptions = {},
): ConversionPayload {
  const qualificationFields = [
    options.budgetRange ?? handoff?.budgetRange ? 'budget_range' : null,
    options.purpose ? 'purpose' : null,
    options.timeframe ? 'timeframe' : null,
    options.preferredArea ? 'preferred_area' : null,
  ].filter((item): item is string => Boolean(item));

  return sanitizeConversionPayload({
    source_route: options.sourceRoute ?? handoff?.sourceRoute ?? 'shared',
    cta_type: handoff?.ctaType,
    cta_label: handoff?.ctaLabel,
    entity_type: handoff?.entityType,
    entity_id: handoff?.entityId ?? undefined,
    entity_name: handoff?.entityName ?? undefined,
    user_intent: handoff?.userIntent,
    budget_range: options.budgetRange ?? handoff?.budgetRange ?? undefined,
    bedroom: handoff?.bedroom ?? undefined,
    location: handoff?.location ?? options.preferredArea ?? undefined,
    locale,
    context: handoff?.context,
    property_id: options.propertyId ?? undefined,
    lead_source: options.leadSource ?? undefined,
    lead_tier: options.leadTier ?? undefined,
    lead_score: options.leadScore ?? undefined,
    purpose: options.purpose ?? undefined,
    timeline: options.timeframe ?? undefined,
    preferred_area: options.preferredArea ?? undefined,
    intent: options.inquiryIntent ?? undefined,
    has_email: options.hasEmail ? true : undefined,
    has_phone: options.hasPhone ? true : undefined,
    has_line: options.hasLine ? true : undefined,
    contact_channel: inferContactChannel(options),
    response_channel: options.responseChannel ?? undefined,
    response_sla_seconds: options.responseSlaSeconds ?? undefined,
    form_type: options.formType ?? undefined,
    error_message: options.errorMessage ?? undefined,
    qualification_fields: qualificationFields.length ? qualificationFields : undefined,
  });
}
