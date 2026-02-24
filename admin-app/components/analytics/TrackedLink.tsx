/**
 * TrackedLink — server component wrapper around Next.js <Link>.
 *
 * Tracking is handled by the global LinkClickTracker component (registered in
 * the site layout), which listens for clicks on any `a[data-amp-event-type]`
 * element and calls trackEvent() with window.location.pathname.  This means:
 *   - No 'use client' needed → no JS hydration cost for every CTA button
 *   - No usePathname() subscription → smaller page bundle
 *   - Same event data is recorded as before
 *
 * PHASE 1 PERF LOCK — DO NOT restore 'use client' / usePathname() here.
 * If you need click-side effects beyond event tracking, add them to
 * LinkClickTracker (one global listener) instead of per-link hydration.
 */
import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

import type { EventType } from '../../lib/analytics';

export function TrackedLink({
  eventType,
  eventPayload,
  children,
  ...props
}: LinkProps & {
  eventType: EventType;
  eventPayload?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link prefetch={false}
      {...props}
      data-amp-event-type={eventType}
      data-amp-event-payload={
        eventPayload ? JSON.stringify(eventPayload) : undefined
      }
    >
      {children}
    </Link>
  );
}
