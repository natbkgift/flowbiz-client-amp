import type { Dictionary, Locale } from './types';
import { en } from './en';
import { th } from './th';

/** Coerce an arbitrary string to a supported Locale (defaults to `'en'`). */
export function normalizeLocale(input: string | undefined): Locale {
  return input === 'th' ? 'th' : 'en';
}

/** Return the full typed Dictionary for the given locale. */
export function getDictionary(locale: string | undefined): Dictionary {
  return normalizeLocale(locale) === 'th' ? th : en;
}
