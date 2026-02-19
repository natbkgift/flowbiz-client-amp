/**
 * Shared ISR revalidation interval (in seconds).
 *
 * All public pages import this constant so the value can be tuned in
 * one place.  Override at deploy time via `NEXT_PUBLIC_REVALIDATE_SECONDS`.
 *
 * Default: 300 seconds (5 minutes).
 */
export const PAGE_REVALIDATE_SECONDS: number = Number(
  process.env.NEXT_PUBLIC_REVALIDATE_SECONDS ?? 300,
);
