import type { Locale } from './types';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'th'] as const;

/** Extract the locale segment from a Next.js pathname (defaults to `'en'`). */
export function localeFromPathname(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg === 'th' ? 'th' : 'en';
}

/** Prefix an internal `href` with the locale segment. */
export function withLocale(locale: Locale, href: string): string {
  if (!href.startsWith('/')) return href;
  const normalized = href === '/' ? '' : href;
  return `/${locale}${normalized}`;
}

/** Replace the locale segment in an existing pathname. */
export function switchLocaleInPathname(pathname: string, next: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${next}`;

  if (parts[0] === 'en' || parts[0] === 'th') {
    parts[0] = next;
    return `/${parts.join('/')}`;
  }
  return `/${next}/${parts.join('/')}`;
}

/** Map Locale to OpenGraph locale code. */
export function ogLocale(locale: Locale): string {
  return locale === 'th' ? 'th_TH' : 'en_US';
}
