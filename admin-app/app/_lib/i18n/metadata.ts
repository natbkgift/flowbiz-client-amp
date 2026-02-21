import type { Metadata } from 'next';
import type { Locale } from './types';
import { ogLocale } from './routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function absoluteUrl(path: string): string {
  const base = stripTrailingSlashes(SITE_URL);
  return ensureTrailingSlash(`${base}${ensureLeadingSlash(path)}`);
}

/**
 * Build standard page metadata with OG tags and alternates.
 *
 * Every public site page follows the same shape — only the `slug`,
 * `title`, and `description` differ.
 */
export function makePageMetadata(
  locale: Locale,
  slug: string,
  title: string,
  description: string,
  brandName: string,
): Metadata {
  const canonicalPath = slug ? `/${locale}/${slug}` : `/${locale}`;
  const canonical = absoluteUrl(canonicalPath);
  const fullTitle = `${title} | ${brandName}`;
  const enAlt = absoluteUrl(slug ? `/en/${slug}` : '/en');
  const thAlt = absoluteUrl(slug ? `/th/${slug}` : '/th');
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
      languages: { en: enAlt, th: thAlt, 'x-default': enAlt },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: fullTitle,
      description,
      siteName: brandName,
      locale: ogLocale(locale),
    },
  };
}
