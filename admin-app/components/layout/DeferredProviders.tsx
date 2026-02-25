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

import { useAfterLCP } from '@/components/perf/useAfterLCP';

const PostLCPAnalytics = dynamic(
  () =>
    import('@/components/analytics/PostLCPAnalytics').then((m) => ({
      default: m.PostLCPAnalytics,
    })),
  { ssr: false }
);

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

export function DeferredProviders() {
  // Deterministic gate after LCP settles.
  const afterLcp = useAfterLCP({ postLcpDelayMs: 300 });
  if (!afterLcp) return null;

  return (
    <>
      <PostLCPAnalytics />
      <ExperimentProvider />
      <ScrollReveal />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
      <CookieConsent />
    </>
  );
}
