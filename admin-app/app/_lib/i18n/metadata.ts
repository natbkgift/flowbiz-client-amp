import type { Metadata } from 'next';
import type { Locale } from './types';
import { ogLocale } from './routing';

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
  const canonical = slug ? `/${locale}/${slug}` : `/${locale}`;
  const fullTitle = `${title} | ${brandName}`;
  const enAlt = slug ? `/en/${slug}` : '/en';
  const thAlt = slug ? `/th/${slug}` : '/th';
  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
      languages: { en: enAlt, th: thAlt },
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
