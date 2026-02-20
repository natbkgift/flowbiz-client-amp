/**
 * Shared ISR revalidation interval (in seconds).
 *
 * NOTE: In Next.js 16, segment config exports (like `export const revalidate = ...`)
 * must be statically analyzable. Avoid env-based computation here.
 */
export const PAGE_REVALIDATE_SECONDS = 300;
