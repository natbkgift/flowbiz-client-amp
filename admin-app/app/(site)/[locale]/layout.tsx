import type { ReactNode } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { LinkClickTracker } from '@/components/analytics/LinkClickTracker';

// Defer non-critical client components — reduces main-thread work blocking LCP paint
const ExperimentProvider = dynamic(
  () => import('@/components/analytics/ExperimentProvider').then((m) => ({ default: m.ExperimentProvider })),
  { ssr: false }
);
const FloatingWhatsAppCTA = dynamic(
  () => import('@/components/ux/FloatingWhatsAppCTA').then((m) => ({ default: m.FloatingWhatsAppCTA })),
  { ssr: false }
);
const StickyMobileCTA = dynamic(
  () => import('@/components/ux/StickyMobileCTA').then((m) => ({ default: m.StickyMobileCTA })),
  { ssr: false }
);
const ScrollReveal = dynamic(
  () => import('@/components/ux/ScrollReveal').then((m) => ({ default: m.ScrollReveal })),
  { ssr: false }
);
const CookieConsent = dynamic(
  () => import('@/components/ux/CookieConsent').then((m) => ({ default: m.CookieConsent })),
  { ssr: false }
);
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

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.locale);
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
