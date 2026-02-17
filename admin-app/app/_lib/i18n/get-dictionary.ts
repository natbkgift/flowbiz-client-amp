import type { Dictionary, Locale } from './types';
import { en } from './en';
import { th } from './th';

export function normalizeLocale(input: string | undefined): Locale {
  return input === 'th' ? 'th' : 'en';
}

export function getDictionary(locale: string | undefined): Dictionary {
  return normalizeLocale(locale) === 'th' ? th : en;
}
