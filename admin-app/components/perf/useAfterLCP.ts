'use client';

import { useEffect, useState } from 'react';

type UseAfterLCPOptions = {
  /** Hard fallback in case LCP cannot be observed (older browsers / blocked APIs). */
  fallbackMs?: number;
};

/**
 * Returns true only after LCP has been observed.
 *
 * Purpose: move non-critical client work (analytics, observers, CTAs) out of the
 * LCP window so it cannot block the LCP paint under Lighthouse CPU throttling.
 */
export function useAfterLCP({ fallbackMs = 4500 }: UseAfterLCPOptions = {}) {
  const [afterLcp, setAfterLcp] = useState(false);

  useEffect(() => {
    let done = false;
    const mark = () => {
      if (done) return;
      done = true;
      setAfterLcp(true);
    };

    const fallbackTimer = setTimeout(mark, fallbackMs);

    // Prefer observing LCP directly.
    try {
      if ('PerformanceObserver' in window) {
        const po = new PerformanceObserver((list) => {
          // Any LCP entry means the metric was recorded.
          const entries = list.getEntries();
          if (entries.length > 0) {
            // Ensure we run after the entry is processed.
            setTimeout(mark, 0);
            po.disconnect();
          }
        });

        // `buffered: true` catches early entries.
        // Some browsers throw if the type isn't supported.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        po.observe({ type: 'largest-contentful-paint', buffered: true } as any);

        return () => {
          clearTimeout(fallbackTimer);
          po.disconnect();
        };
      }
    } catch {
      // Ignore and rely on fallback.
    }

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [fallbackMs]);

  return afterLcp;
}
