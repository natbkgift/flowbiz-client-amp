/**
 * Sitemap index — Blueprint doc 04 — XML SITEMAP STRATEGY.
 *
 * Serves /sitemap.xml as a sitemap index referencing all 7 named child sitemaps.
 * Route Handlers are exempt from `trailingSlash: true` in next.config.js and
 * are treated as API-like routes, so /sitemap.xml is served without a trailing slash.
 */
import { SITE_URL, sitemapIndexResponse } from '@/app/_lib/sitemap-xml';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour

const NAMED_SITEMAPS = [
  `${SITE_URL}/sitemap-pages.xml`,
  `${SITE_URL}/sitemap-projects.xml`,
  `${SITE_URL}/sitemap-properties.xml`,
  `${SITE_URL}/sitemap-areas.xml`,
  `${SITE_URL}/sitemap-developers.xml`,
  `${SITE_URL}/sitemap-guides.xml`,
  `${SITE_URL}/sitemap-blog.xml`,
];

export function GET(): Response {
  return sitemapIndexResponse(NAMED_SITEMAPS);
}
