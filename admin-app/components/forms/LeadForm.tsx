'use client';

/**
 * LeadForm — deferred wrapper.
 *
 * The real implementation (LeadFormCore) is code-split via ssr:false so
 * its JS (311 lines + zod/analytics deps) is not included in the initial
 * hydration bundle. All pages import { LeadForm } from './LeadForm' and
 * get this thin wrapper — zero import changes needed across 35+ pages.
 *
 * LeadForm is always below the fold, so:
 * - Server renders null (no form HTML in initial SSR payload)
 * - After hydration the chunk is fetched and the form renders
 * - No CLS risk (form container has fixed min-height in its parent)
 */
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const LeadFormCore = dynamic(
  () => import('./LeadFormCore').then((m) => ({ default: m.LeadForm })),
  { ssr: false }
);

export type LeadFormProps = {
  heading?: string;
  propertyId?: string | null;
  defaultMessage?: string;
  variant?: 'default' | 'home';
};

export function LeadForm(props: LeadFormProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;
    const el = hostRef.current;
    if (!el) return;

    // If IntersectionObserver isn't available, fall back to eager load.
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      // Start loading a bit before the form scrolls into view.
      { rootMargin: '300px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad]);

  return (
    <>
      {/*
        IntersectionObserver requires a real layout box.
        `display: contents` elements don't create a box and can cause
        non-deterministic intersection behavior (early loads offscreen).
      */}
      <div ref={hostRef} style={{ height: 1 }} />
      {shouldLoad ? <LeadFormCore {...props} /> : null}
    </>
  );
}
