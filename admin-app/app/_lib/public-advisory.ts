import type { Dictionary, Locale } from '@/app/_lib/i18n/types';
import { withLocale } from '@/app/_lib/i18n/routing';
import { buildWhatsAppUrl } from '@/app/_lib/public-cta';

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
