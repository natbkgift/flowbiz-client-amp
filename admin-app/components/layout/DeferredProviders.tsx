'use client';

/**
 * DeferredProviders — client-only bundle boundary.
 *
 * next/dynamic with ssr:false is only valid inside Client Components.
 * Mounting is gated behind a requestAnimationFrame + setTimeout(0) so
 * the components only activate AFTER the browser has had at least one
 * paint opportunity, ensuring LCP is not blocked by their execution.
 *
 * Pattern: rAF fires once the next frame is available (post-render),
 * then setTimeout(0) yields to any queued tasks before mounting.
 * This typically fires 8-16 ms after initial hydration — well after
 * the LCP image paints but fast enough for non-critical interactivity.
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

export function DeferredProviders() {
  const [afterPaint, setAfterPaint] = useState(false);

  useEffect(() => {
    // Wait for the browser to have at least one frame to paint (post-LCP).
    // rAF fires when the browser is ready to paint; the inner setTimeout
    // yields the microtask/task queues before we trigger dynamic imports.
    let timerId: ReturnType<typeof setTimeout>;
    const rafId = requestAnimationFrame(() => {
      timerId = setTimeout(() => setAfterPaint(true), 0);
    });
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, []);

  if (!afterPaint) return null;

  return (
    <>
      <ExperimentProvider />
      <ScrollReveal />
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
      <CookieConsent />
    </>
  );
}
