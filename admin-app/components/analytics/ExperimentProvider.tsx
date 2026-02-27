'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import {
  getActiveExperiments,
  getOrAssignVariant,
} from '@/lib/experiments';
import { getOrCreateSessionId, trackEvent } from '@/lib/analytics';

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
    const sessionId = getOrCreateSessionId();
    const experiments = getActiveExperiments();

    for (const experiment of experiments) {
      // Check if this page is targeted by the experiment
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

      // Track exposure once per experiment per component lifecycle
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
  }, [pathname]);

  return null;
}
