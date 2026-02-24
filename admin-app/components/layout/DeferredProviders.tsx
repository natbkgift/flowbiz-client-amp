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
import { useEffect, useState } from 'react';

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
  // Stage 1: deterministic gate after LCP settles.
  const afterLcp = useAfterLCP({ postLcpDelayMs: 300 });
  // Stage 2: additional delay gate to move non-critical providers to idle/interaction.
  const [ready, setReady] = useState(false);
  // Stage 3: heavy modules gate (source path for long tasks / bootup / unused-js hot spots).
  const [heavyReady, setHeavyReady] = useState(false);

  useEffect(() => {
    if (!afterLcp) {
      setReady(false);
      return;
    }

    let done = false;
    let minDelayPassed = false;
    let idleReached = false;
    let interacted = false;

    let minDelayTimer: ReturnType<typeof setTimeout> | null = null;
    let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const markReady = () => {
      if (done) return;
      done = true;
      setReady(true);
    };

    const tryReady = () => {
      if (done) return;
      if (minDelayPassed && (idleReached || interacted)) {
        markReady();
      }
    };

    const onInteraction = () => {
      interacted = true;
      tryReady();
    };

    minDelayTimer = setTimeout(() => {
      minDelayPassed = true;
      tryReady();
    }, 900);

    hardTimeoutTimer = setTimeout(markReady, 4000);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(
        () => {
          idleReached = true;
          tryReady();
        },
        { timeout: 2500 }
      );
    } else {
      setTimeout(() => {
        idleReached = true;
        tryReady();
      }, 1200);
    }

    window.addEventListener('pointerdown', onInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', onInteraction, { once: true, passive: true });
    window.addEventListener('scroll', onInteraction, { once: true, passive: true });

    return () => {
      done = true;
      if (minDelayTimer) clearTimeout(minDelayTimer);
      if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('scroll', onInteraction);
    };
  }, [afterLcp]);

  useEffect(() => {
    if (!ready) {
      setHeavyReady(false);
      return;
    }

    let done = false;
    let interacted = false;
    let idleReached = false;

    let engageTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const markHeavyReady = () => {
      if (done) return;
      done = true;
      setHeavyReady(true);
    };

    const tryHeavyReady = () => {
      if (done) return;
      if (interacted && idleReached) {
        markHeavyReady();
      }
    };

    const onInteraction = () => {
      interacted = true;
      tryHeavyReady();
    };

    engageTimeout = setTimeout(() => {
      interacted = true;
      tryHeavyReady();
    }, 6000);

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(
        () => {
          idleReached = true;
          tryHeavyReady();
        },
        { timeout: 3500 }
      );
    } else {
      idleTimeout = setTimeout(() => {
        idleReached = true;
        tryHeavyReady();
      }, 1800);
    }

    window.addEventListener('pointerdown', onInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', onInteraction, { once: true, passive: true });
    window.addEventListener('scroll', onInteraction, { once: true, passive: true });

    return () => {
      done = true;
      if (engageTimeout) clearTimeout(engageTimeout);
      if (idleTimeout) clearTimeout(idleTimeout);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('scroll', onInteraction);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <FloatingWhatsAppCTA />
      <StickyMobileCTA />
      <CookieConsent />
      {heavyReady ? (
        <>
          <PostLCPAnalytics />
          <ExperimentProvider />
          <ScrollReveal />
        </>
      ) : null}
    </>
  );
}
