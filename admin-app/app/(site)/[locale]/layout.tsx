import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { LinkClickTracker } from '@/components/analytics/LinkClickTracker';
import { FloatingWhatsAppCTA } from '@/components/ux/FloatingWhatsAppCTA';
import { StickyMobileCTA } from '@/components/ux/StickyMobileCTA';
import { ScrollReveal } from '@/components/ux/ScrollReveal';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';

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
      <SiteAnalytics />
      <LinkClickTracker />
      <ScrollReveal />
      {children}
      <Footer locale={locale} dict={dict} />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
    </>
  );
}
