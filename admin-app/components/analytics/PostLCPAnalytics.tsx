'use client';

import { SiteAnalytics } from '@/components/analytics/SiteAnalytics';
import { LinkClickTracker } from '@/components/analytics/LinkClickTracker';
import { useAfterLCP } from '@/components/perf/useAfterLCP';

/**
 * Mount analytics only after LCP.
 *
 * Why: Lighthouse CPU throttling amplifies any main-thread work that overlaps
 * the LCP window. Analytics is not required for above-the-fold usability.
 */
export function PostLCPAnalytics() {
  const afterLcp = useAfterLCP({ fallbackMs: 4500 });
  if (!afterLcp) return null;

  return (
    <>
      <SiteAnalytics />
      <LinkClickTracker />
    </>
  );
}
