import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/leads',
          '/inquiries',
          '/analytics',
          '/public',
          '/_next/',
          '/404',
          '/500',
          '/preview/',
          '/draft/',
          '/*?bedrooms=',
          '/*?bathrooms=',
          '/*?price_min=',
          '/*?price_max=',
          '/*?sort=',
          '/*?page=',
        ],
      },
    ],
    sitemap: `${SITE_URL.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
