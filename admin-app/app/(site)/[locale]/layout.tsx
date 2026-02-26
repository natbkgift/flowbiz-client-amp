import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DeferredProviders } from '@/components/layout/DeferredProviders';
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
      <DeferredProviders />
      <div className="layout-shell">{children}</div>
      <Footer locale={locale} dict={dict} />
      <div aria-live="polite" aria-atomic="true" id="amp-live-region" className="sr-only" />
    </>
  );
}
