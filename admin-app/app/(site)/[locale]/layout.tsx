import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { headers } from 'next/headers';

import { SiteFooter } from '@/components/layout/Footer';
import { SiteHeader } from '@/components/layout/Header';
import { PublicClientEnhancements } from '@/components/layout/PublicClientEnhancements';
import { resolveLayoutCms, SITE_LAYOUT_CMS_SLUG } from '@/app/_lib/layout-cms';
import { fetchCompanyInfoBySlug } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { SUPPORTED_LOCALES } from '@/app/_lib/i18n/routing';

/** Pre-render both locale segments at build time. */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const useMinimalSiteLocaleLayout = process.env.NEXT_LOCAL_SITE_LAYOUT_MINIMAL === '1';

async function detectCurrentPathWithoutLocale(locale: 'en' | 'th'): Promise<string> {
  try {
    const headerList = await headers();
    const pathname = headerList.get('x-next-pathname') ?? headerList.get('x-invoke-path') ?? '';
    const localizedPrefix = new RegExp(`^/${locale}(?=/|$)`);
    const stripped = pathname.replace(localizedPrefix, '') || '/';
    return stripped.startsWith('/') ? stripped : '/';
  } catch {
    return '/';
  }
}

export default async function SiteLayout(
  props: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  if (useMinimalSiteLocaleLayout) {
    return <>{children}</>;
  }
  const currentPath = await detectCurrentPathWithoutLocale(locale);
  const isV3PreviewLayout = currentPath === '/v3-preview' || currentPath.startsWith('/v3-preview/');
  const useFallbackLayoutCms = currentPath === '/' || currentPath === '/projects';
  const layoutCmsRow = useFallbackLayoutCms
    ? null
    : await fetchCompanyInfoBySlug(SITE_LAYOUT_CMS_SLUG).catch(() => null);
  const layoutCms = resolveLayoutCms(locale, dict, layoutCmsRow?.content);

  const siteUrl = 'https://amppattaya.com';
  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: dict.brand.name,
        url: siteUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: dict.brand.name,
        url: siteUrl,
        inLanguage: locale,
        publisher: {
          '@type': 'Organization',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
    ],
    null,
    0
  );
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="public-site-shell" data-locale={locale}>
        {isV3PreviewLayout ? null : <SiteHeader locale={locale} cms={layoutCms.header} />}
        {children}
        {isV3PreviewLayout ? null : <SiteFooter locale={locale} cms={layoutCms.footer} />}
        <div aria-live="polite" aria-atomic="true" id="amp-live-region" className="sr-only" />
        <Suspense fallback={null}>
          <PublicClientEnhancements />
        </Suspense>
      </div>
    </>
  );
}
