import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

function joinUrl(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'th'] as const;
  const paths = ['', '/invest', '/buy', '/rent', '/area-guide', '/contact', '/projects'];

  const urls = locales.flatMap((locale) =>
    paths.map((p) => ({
      url: joinUrl(SITE_URL, `/${locale}${p}`),
    }))
  );

  return urls;
}
