import { getDictionary } from '@/app/_lib/i18n/get-dictionary';
import type { Dictionary, Locale } from '@/app/_lib/i18n/types';

function resolveDictionary(input: Locale | Dictionary): Dictionary {
  return typeof input === 'string' ? getDictionary(input) : input;
}

export function getPublicMessagingHierarchy(input: Locale | Dictionary): Dictionary['messaging'] {
  return resolveDictionary(input).messaging;
}

export function getPublicMessagingCtas(input: Locale | Dictionary): Dictionary['messaging']['ctaLanguage'] {
  return getPublicMessagingHierarchy(input).ctaLanguage;
}

export function getPublicTrustLanguage(input: Locale | Dictionary): Dictionary['messaging']['trustLanguage'] {
  return getPublicMessagingHierarchy(input).trustLanguage;
}

export function getPublicAdvisoryTone(input: Locale | Dictionary): Dictionary['messaging']['advisoryTone'] {
  return getPublicMessagingHierarchy(input).advisoryTone;
}

export function getPublicInvestmentLanguage(input: Locale | Dictionary): Dictionary['messaging']['investmentLanguage'] {
  return getPublicMessagingHierarchy(input).investmentLanguage;
}