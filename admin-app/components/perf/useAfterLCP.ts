'use client';

import { useEffect, useState } from 'react';

type UseAfterLCPOptions = {
  /** Hard fallback in case LCP cannot be observed (older browsers / blocked APIs). */
  fallbackMs?: number;
  /** Debounce window: wait for LCP to stop updating before enabling deferred work. */
  quietWindowMs?: number;
  /** Optional minimum delay after LCP is finalized before enabling deferred work. */
  postLcpDelayMs?: number;
};

/**
 * Returns true only after LCP has been observed.
 *
 * Purpose: move non-critical client work (analytics, observers, CTAs) out of the
 * LCP window so it cannot block the LCP paint under Lighthouse CPU throttling.
 */
export function useAfterLCP(options: UseAfterLCPOptions = {}) {
  const fallbackMs = typeof options.fallbackMs === 'number' ? options.fallbackMs : 15000;
  const quietWindowMs =
    typeof options.quietWindowMs === 'number' ? options.quietWindowMs : 1200;
  const postLcpDelayMs =
    typeof options.postLcpDelayMs === 'number' ? options.postLcpDelayMs : 0;

  const [afterLcp, setAfterLcp] = useState(false);

  useEffect(() => {
    let done = false;
    const markNow = () => {
      if (done) return;
      done = true;
      setAfterLcp(true);
    };

    const mark = () => {
      if (done) return;
      if (postLcpDelayMs > 0) {
        setTimeout(markNow, postLcpDelayMs);
        return;
      }
      markNow();
    };

    const fallbackTimer = setTimeout(mark, fallbackMs);
    let quietTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleAfterQuietWindow = (quietWindowMs: number) => {
      if (done) return;
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(mark, quietWindowMs);
    };

    const onVisibilityChange = () => {
      // When the page is hidden, LCP is finalized — safe to enable deferred work.
      if (document.visibilityState === 'hidden') mark();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // Prefer observing LCP directly.
    try {
      if ('PerformanceObserver' in window) {
        const po = new PerformanceObserver((list) => {
          // Any LCP entry means the metric was recorded.
          const entries = list.getEntries();
          if (entries.length > 0) {
            // LCP can update multiple times; wait for a short quiet window so we
            // don't enable deferred work during the real (final) LCP window.
            scheduleAfterQuietWindow(quietWindowMs);
          }
        });

        // `buffered: true` catches early entries.
        // Some browsers throw if the type isn't supported.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        po.observe({ type: 'largest-contentful-paint', buffered: true } as any);

        return () => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          clearTimeout(fallbackTimer);
          if (quietTimer) clearTimeout(quietTimer);
          po.disconnect();
        };
      }
    } catch {
      // Ignore and rely on fallback.
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimeout(fallbackTimer);
      if (quietTimer) clearTimeout(quietTimer);
    };
  }, [fallbackMs, quietWindowMs, postLcpDelayMs]);

  return afterLcp;
}
