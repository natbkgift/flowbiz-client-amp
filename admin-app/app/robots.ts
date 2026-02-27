/**
 * robots.txt — Blueprint doc 11 — CRAWL OPTIMIZATION PLAN.
 *
 * Blocks admin/API paths, filter parameters, and duplicate-generating
 * query strings from crawlers while keeping all public pages accessible.
 */
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin & API
          '/api/',
          '/login',
          '/leads',
          '/inquiries',
          '/analytics',

          // Internal Next.js
          '/_next/',
          '/public',

          // Error pages
          '/404',
          '/500',

          // Draft & preview
          '/preview/',
          '/draft/',

          // Filter parameters (prevent duplicate content)
          '/*?bedrooms=',
          '/*?bathrooms=',
          '/*?price_min=',
          '/*?price_max=',
          '/*?sort=',
          '/*?page=',
          '/*?area=',
          '/*?type=',
          '/*?furnishing=',
          '/*?size_min=',
          '/*?size_max=',

          // Guided modal parameters
          '/*?guided=',
          '/*?step=',
          '/*?goal=',
          '/*?budget=',

          // Comparison tool with IDs
          '/*?ids=',

          // UTM parameters
          '/*?utm_source=',
          '/*?utm_medium=',
          '/*?utm_campaign=',
        ],
      },
    ],
    sitemap: `${SITE_URL.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
