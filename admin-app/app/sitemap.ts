import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

function joinUrl(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

type PageEntry = {
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

const pages: PageEntry[] = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/invest', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/buy', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/rent', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/sell', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/area-guide', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/area-guide/jomtien', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/area-guide/pratumnak', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/area-guide/wongamat', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/projects', changeFrequency: 'daily', priority: 0.9 },
  { path: '/smart-finder', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/compare', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/marketplace', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/area-guide/central', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/areas/jomtien', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/areas/pratumnak', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/areas/wongamat', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/areas/central', changeFrequency: 'weekly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'th'] as const;
  const now = new Date();

  return locales.flatMap((locale) =>
    pages.map(({ path, changeFrequency, priority }) => ({
      url: joinUrl(SITE_URL, `/${locale}${path}`),
      lastModified: now,
      changeFrequency,
      priority,
    }))
  );
}
