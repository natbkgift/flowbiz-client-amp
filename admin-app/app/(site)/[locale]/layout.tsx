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
import {
  organizationSchema,
  webSiteSchema,
  localBusinessSchema,
} from '@/app/_lib/schema-markup';

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
  const locale = normalizeLocale((params as unknown as { locale: string }).locale);
  const dict = getDictionary(locale);

  // Blueprint doc 10 — Schema Markup Plan:
  // Every page gets Organization + WebSite + LocalBusiness (RealEstateAgent).
  const jsonLd = JSON.stringify(
    [
      organizationSchema(),
      webSiteSchema(),
      localBusinessSchema(),
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
