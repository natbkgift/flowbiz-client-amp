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

/**
 * Listing pages that accept filter query params (bedrooms, price_max, area,
 * etc.) must NOT be indexed when filters are active. The canonical always
 * points to the clean parent URL without query params.
 *
 * Blueprint doc 01 — MASTER SITEMAP, §Filtered Views:
 *   "These dynamic filter URLs are NOT indexed. They canonical back to
 *    their parent landing page."
 */
const FILTER_PARAMS = new Set([
  'bedrooms', 'bathrooms', 'price_min', 'price_max',
  'sort', 'page', 'area', 'type', 'furnishing', 'size_min', 'size_max',
]);

export function makeListingPageMetadata(
  locale: Locale,
  slug: string,
  title: string,
  description: string,
  brandName: string,
  searchParams?: Record<string, string | string[] | undefined>,
): Metadata {
  const base = makePageMetadata(locale, slug, title, description, brandName);

  const hasFilterParam = searchParams
    ? Object.keys(searchParams).some((key) => FILTER_PARAMS.has(key))
    : false;

  if (hasFilterParam) {
    return {
      ...base,
      robots: { index: false, follow: true },
    };
  }

  return base;
}
