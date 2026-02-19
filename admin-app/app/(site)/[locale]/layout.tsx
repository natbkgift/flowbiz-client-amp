import type { ReactNode } from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { LinkClickTracker } from '@/components/analytics/LinkClickTracker';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { SUPPORTED_LOCALES } from '@/app/_lib/i18n/routing';

/** Pre-render both locale segments at build time. */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const FloatingWhatsAppCTA = dynamic(
  () => import('@/components/ux/FloatingWhatsAppCTA').then((m) => m.FloatingWhatsAppCTA),
  { ssr: false },
);
const StickyMobileCTA = dynamic(
  () => import('@/components/ux/StickyMobileCTA').then((m) => m.StickyMobileCTA),
  { ssr: false },
);
const ScrollReveal = dynamic(
  () => import('@/components/ux/ScrollReveal').then((m) => m.ScrollReveal),
  { ssr: false },
);

export default function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const locale = normalizeLocale(params.locale);
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
      <ScrollReveal />
      {children}
      <Footer locale={locale} dict={dict} />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
    </>
  );
}
