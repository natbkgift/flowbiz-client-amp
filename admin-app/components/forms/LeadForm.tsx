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
import dynamic from 'next/dynamic';

const LeadFormCore = dynamic(
  () => import('./LeadFormCore').then((m) => ({ default: m.LeadForm })),
  { ssr: false }
);

export type LeadFormProps = {
  heading?: string;
  propertyId?: string | null;
  defaultMessage?: string;
};

export function LeadForm(props: LeadFormProps) {
  return <LeadFormCore {...props} />;
}
