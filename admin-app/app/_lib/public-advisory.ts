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

function serializeMetric(value: number | null | undefined, decimals = 2): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value.toFixed(decimals).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
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
