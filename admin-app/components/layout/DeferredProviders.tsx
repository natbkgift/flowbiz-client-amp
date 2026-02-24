'use client';

/**
 * DeferredProviders — client-only bundle boundary.
 *
 * next/dynamic with ssr:false is only valid inside Client Components.
 * This wrapper aggregates all non-critical client providers so their
 * JS modules are code-split into separate chunks and only downloaded
 * after the main bundle hydrates, reducing initial JS parse/exec work.
 *
 * Imported statically from the Server-Component layout; the five inner
 * modules are excluded from the initial SSR HTML and fetched lazily.
 */
import dynamic from 'next/dynamic';

const ExperimentProvider = dynamic(
  () =>
    import('@/components/analytics/ExperimentProvider').then((m) => ({
      default: m.ExperimentProvider,
    })),
  { ssr: false }
);

const ScrollReveal = dynamic(
  () =>
    import('@/components/ux/ScrollReveal').then((m) => ({
      default: m.ScrollReveal,
    })),
  { ssr: false }
);

const CookieConsent = dynamic(
  () =>
    import('@/components/ux/CookieConsent').then((m) => ({
      default: m.CookieConsent,
    })),
  { ssr: false }
);

const FloatingWhatsAppCTA = dynamic(
  () =>
    import('@/components/ux/FloatingWhatsAppCTA').then((m) => ({
      default: m.FloatingWhatsAppCTA,
    })),
  { ssr: false }
);

const StickyMobileCTA = dynamic(
  () =>
    import('@/components/ux/StickyMobileCTA').then((m) => ({
      default: m.StickyMobileCTA,
    })),
  { ssr: false }
);

const SiteAnalytics = dynamic(
  () =>
    import('@/components/analytics/SiteAnalytics').then((m) => ({
      default: m.SiteAnalytics,
    })),
  { ssr: false }
);

const LinkClickTracker = dynamic(
  () =>
    import('@/components/analytics/LinkClickTracker').then((m) => ({
      default: m.LinkClickTracker,
    })),
  { ssr: false }
);

export function DeferredProviders() {
  return (
    <>
      <SiteAnalytics />
      <LinkClickTracker />
      <ExperimentProvider />
      <ScrollReveal />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
      <CookieConsent />
    </>
  );
}
