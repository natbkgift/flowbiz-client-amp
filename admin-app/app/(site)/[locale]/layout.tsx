import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
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
  return (
    <>
      <Header locale={locale} dict={dict} />
      <SiteAnalytics />
      <ScrollReveal />
      {children}
      <Footer locale={locale} dict={dict} />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
    </>
  );
}
