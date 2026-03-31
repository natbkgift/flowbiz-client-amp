'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { trackEvent } from '../../lib/analytics';
import { captureAttributionFromUrl } from '../../lib/attribution';
import { recordVisit, getFunnelStage, type VisitorProfile } from '../../lib/personalization';
import { initErrorReporting } from '../../lib/error-reporting';

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Invisible client component that fires analytics events on every navigation.
 *
 * Responsibilities:
 * - Capture UTM attribution from the URL on first render.
 * - Record the visit in the personalization layer (localStorage).
 * - Send a `page_view` event enriched with visitor segment, intent,
 *   return-visitor flag, and funnel stage.
 * - Initialise global error reporting listeners (once per session).
 *
 * Renders `null` — purely a side-effect component.
 */
export function SiteAnalytics() {
  const pathname = usePathname() ?? '/';
  const search = useSearchParams();
  const sessionStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const win = window as IdleCapableWindow;

    const run = () => {
      if (cancelled) return;
      try {
        const url = new URL(win.location.href);
        if (search) {
          url.search = search.toString();
        }
        captureAttributionFromUrl(url);

        const isNewSession = !sessionStarted.current;
        sessionStarted.current = true;
        const visitor: VisitorProfile = recordVisit(pathname, isNewSession);
        const funnelStage = getFunnelStage();

        if (isNewSession) initErrorReporting();

        trackEvent('page_view', pathname, {
          search: url.search || null,
          visitor_segment: visitor.segment,
          visitor_intent: visitor.intent,
          is_return_visitor: visitor.sessionCount > 1,
          funnel_stage: funnelStage,
        });
      } catch {
        // ignore
      }
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(run, { timeout: 900 });
      return () => {
        cancelled = true;
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = win.setTimeout(run, 250);
    return () => {
      cancelled = true;
      win.clearTimeout(timeoutId);
    };
  }, [pathname, search]);

  return null;
}
