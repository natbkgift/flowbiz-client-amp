import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { LinkClickTracker } from '@/components/analytics/LinkClickTracker';
import { ExperimentProvider } from '@/components/analytics/ExperimentProvider';
import { FloatingWhatsAppCTA } from '@/components/ux/FloatingWhatsAppCTA';
import { StickyMobileCTA } from '@/components/ux/StickyMobileCTA';
import { ScrollReveal } from '@/components/ux/ScrollReveal';
import { CookieConsent } from '@/components/ux/CookieConsent';
import { resolveLayoutCms, SITE_LAYOUT_CMS_SLUG } from '@/app/_lib/layout-cms';
import { fetchCompanyInfoBySlug } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { SUPPORTED_LOCALES } from '@/app/_lib/i18n/routing';

/** Pre-render both locale segments at build time. */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const useMinimalSiteLocaleLayout = process.env.NEXT_LOCAL_SITE_LAYOUT_MINIMAL === '1';

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
  const layoutCmsRow = await fetchCompanyInfoBySlug(SITE_LAYOUT_CMS_SLUG).catch(() => null);
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
      <Header locale={locale} dict={dict} cms={layoutCms.header} />
      <Suspense fallback={null}>
        <SiteAnalytics />
      </Suspense>
      <LinkClickTracker />
      <ExperimentProvider />
      <ScrollReveal />
      {children}
      <Footer locale={locale} dict={dict} cms={layoutCms.footer} />
      <div aria-live="polite" aria-atomic="true" id="amp-live-region" className="sr-only" />
      <FloatingWhatsAppCTA />
      <Suspense fallback={null}>
        <StickyMobileCTA />
      </Suspense>
      <CookieConsent />
    </>
  );
}

