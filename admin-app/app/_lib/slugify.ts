/**
 * Slug generation — Blueprint doc 02 — URL STRUCTURE GUIDELINE.
 *
 * Shared utility for generating URL-safe slugs following the project's
 * conventions: lowercase, hyphen-separated, no special characters.
 */

const LEGAL_SUFFIXES = /\b(co\.?,?\s*ltd\.?|corp\.?|inc\.?|plc\.?|llc\.?|gmbh)\b/gi;

const MAX_SLUG_LENGTH = 80;

/**
 * Generate a URL-safe slug from a display name.
 *
 * Rules (per Blueprint doc 02):
 *  1. Convert to lowercase
 *  2. Replace spaces with hyphens
 *  3. Remove special characters except hyphens
 *  4. Collapse multiple hyphens to single
 *  5. Trim leading/trailing hyphens
 *  6. Max length: 80 characters
 */
export function buildSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
}

/**
 * Generate a slug for a developer name.
 *
 * Same as `buildSlug` but strips legal suffixes first
 * (Co., Ltd., Corp., Inc., PLC, LLC, GmbH).
 */
export function buildDeveloperSlug(companyName: string): string {
  return buildSlug(companyName.replace(LEGAL_SUFFIXES, ''));
}
