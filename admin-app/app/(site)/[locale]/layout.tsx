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
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { SUPPORTED_LOCALES } from '@/app/_lib/i18n/routing';

/** Pre-render both locale segments at build time. */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

 

export default function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Next 16 route params are typed as a Promise in generated route types.
  // Layouts can be async, so we await params for compatibility.
  const locale = normalizeLocale((params as unknown as { locale: string }).locale);
  const dict = getDictionary(locale);

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
      <Header locale={locale} dict={dict} />
      <Suspense fallback={null}>
        <SiteAnalytics />
      </Suspense>
      <LinkClickTracker />
      <ExperimentProvider />
      <ScrollReveal />
      {children}
      <Footer locale={locale} dict={dict} />
      <div aria-live="polite" aria-atomic="true" id="amp-live-region" className="sr-only" />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
      <CookieConsent />
    </>
  );
}
