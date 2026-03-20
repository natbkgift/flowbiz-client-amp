'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';

import { trackEvent, type EventType } from '../../lib/analytics';
import type { ConversionPayload } from '../../lib/conversion';

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventType: EventType;
  eventPayload?: ConversionPayload | Record<string, unknown>;
  children: ReactNode;
};

export function TrackedLink({
  eventType,
  eventPayload,
  children,
  ...props
}: TrackedLinkProps) {
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
