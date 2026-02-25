'use client';

import dynamic from 'next/dynamic';

import { useAfterLCP } from '@/components/perf/useAfterLCP';

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

const ScrollDepthTracker = dynamic(
  () =>
    import('@/components/analytics/ScrollDepthTracker').then((m) => ({
      default: m.ScrollDepthTracker,
    })),
  { ssr: false }
);

/**
 * Mount analytics only after LCP.
 *
 * Why: Lighthouse CPU throttling amplifies any main-thread work that overlaps
 * the LCP window. Analytics is not required for above-the-fold usability.
 */
export function PostLCPAnalytics() {
  const afterLcp = useAfterLCP();
  if (!afterLcp) return null;

  return (
    <>
      <SiteAnalytics />
      <LinkClickTracker />
      <ScrollDepthTracker />
    </>
  );
}
