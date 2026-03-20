'use client';

import { useEffect } from 'react';

import { trackEvent, type EventType } from '@/lib/analytics';
import type { ConversionPayload } from '@/lib/conversion';

function safeParseJson(value: string | null): ConversionPayload | Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return undefined;
  } catch {
    return undefined;
  }
}

export function LinkClickTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.('a[data-amp-event-type]') as HTMLAnchorElement | null;
      if (!a) return;

      const eventType = (a.dataset.ampEventType as EventType | undefined) ?? undefined;
      if (!eventType) return;

      const payload = safeParseJson(a.dataset.ampEventPayload ?? null);
      const page = window.location.pathname || '/';
      const href = a.getAttribute('href') ?? null;

      void trackEvent(eventType, page, {
        ...(payload ?? {}),
        href,
      });
    };

    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, []);

  return null;
}
