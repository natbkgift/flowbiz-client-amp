'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import {
  getActiveExperiments,
  getOrAssignVariant,
} from '@/lib/experiments';
import { getOrCreateSessionId, trackEvent } from '@/lib/analytics';

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * ExperimentProvider — headless client component.
 *
 * On mount (and on pathname change) it:
 * 1. Resolves all active experiments targeting the current page.
 * 2. Deterministically assigns a variant per experiment (via session ID).
 * 3. Fires an `experiment_exposure` event once per experiment per session.
 *
 * Renders nothing — side-effects only.
 */
export function ExperimentProvider() {
  const pathname = usePathname() ?? '/';
  const tracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const win = window as IdleCapableWindow;
    const run = () => {
      if (cancelled) return;
      const sessionId = getOrCreateSessionId();
      const experiments = getActiveExperiments();

      for (const experiment of experiments) {
        const isTargeted = experiment.targetPages.some((pattern) => {
          if (pattern.includes('*')) {
            const regex = new RegExp(
              '^' + pattern.replace(/\*/g, '.*') + '$',
            );
            return regex.test(pathname);
          }
          return pathname === pattern || pathname.startsWith(pattern);
        });

        if (!isTargeted) continue;

        const assignment = getOrAssignVariant(experiment.id, sessionId);
        if (!assignment) continue;

        const key = `${experiment.id}:${assignment.variantId}`;
        if (!tracked.current.has(key)) {
          tracked.current.add(key);
          trackEvent('experiment_exposure', pathname, {
            experiment_id: experiment.id,
            variant_id: assignment.variantId,
            experiment_name: experiment.name,
          });
        }
      }
    };

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(run, { timeout: 1200 });
      return () => {
        cancelled = true;
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = win.setTimeout(run, 300);
    return () => {
      cancelled = true;
      win.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
