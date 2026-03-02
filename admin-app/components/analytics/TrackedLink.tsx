'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { trackEvent, type EventType } from '../../lib/analytics';

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
  const pathname = usePathname() ?? '/';

  return (
    <Link
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        trackEvent(eventType, pathname, eventPayload);
      }}
    >
      {children}
    </Link>
  );
}
