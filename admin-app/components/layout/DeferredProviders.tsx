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
import { useEffect, useState } from 'react';
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
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setEnabled(true);
    };

    // Move non-critical work out of the LCP window:
    // - Prefer requestIdleCallback so execution happens when the main thread is idle
    // - Use a timeout so it still runs on long-scroll sessions
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(enable, { timeout: 3000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }

    const t = setTimeout(enable, 2500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!enabled) return null;

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
