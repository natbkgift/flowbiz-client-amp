import type { Locale } from './types';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'th'] as const;

export function localeFromPathname(pathname: string): Locale {
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg === 'th' ? 'th' : 'en';
}

export function withLocale(locale: Locale, href: string): string {
  if (!href.startsWith('/')) return href;
  const normalized = href === '/' ? '' : href;
  return `/${locale}${normalized}`;
}

export function switchLocaleInPathname(pathname: string, next: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${next}`;

  if (parts[0] === 'en' || parts[0] === 'th') {
    parts[0] = next;
    return `/${parts.join('/')}`;
  }
  return `/${next}/${parts.join('/')}`;
}
