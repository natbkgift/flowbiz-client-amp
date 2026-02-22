/**
 * Sitemap helpers — Blueprint doc 04 — XML SITEMAP STRATEGY.
 *
 * Shared data functions and XML builders consumed by the named sitemap
 * Route Handlers (app/sitemap-*.xml/route.ts) and the sitemap index
 * route (app/sitemap.xml/route.ts).
 */
import { fetchProjects, fetchProperties } from './public-api-server';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com').replace(
  /\/+$/,
  '',
);

export const LOCALES = ['en', 'th'] as const;

type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface UrlEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFreq;
  priority: number;
}

/* ------------------------------------------------------------------ */
/*  Entry builder                                                      */
/* ------------------------------------------------------------------ */

function entry(
  path: string,
  changeFrequency: ChangeFreq,
  priority: number,
  lastModified?: Date | string,
): UrlEntry[] {
  const mod = lastModified ? new Date(lastModified) : new Date();
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: mod,
    changeFrequency,
    priority,
  }));
}

/* ------------------------------------------------------------------ */
/*  sitemap-pages.xml — static / semi-static pages                    */
/* ------------------------------------------------------------------ */

export function staticPages(): UrlEntry[] {
  const now = new Date();
  type PageEntry = { path: string; freq: ChangeFreq; pri: number };

  const pages: PageEntry[] = [
    // Homepage
    { path: '', freq: 'daily', pri: 1.0 },

    // Intent landings
    { path: '/buy', freq: 'weekly', pri: 0.9 },
    { path: '/rent', freq: 'weekly', pri: 0.9 },
    { path: '/sell', freq: 'weekly', pri: 0.9 },
    { path: '/invest', freq: 'weekly', pri: 0.9 },

    // Buy type landings
    { path: '/buy/condo-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/villa-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/house-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/land-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/hotel-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/shop-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/buy/office-pattaya', freq: 'weekly', pri: 0.8 },

    // Rent type landings
    { path: '/rent/condo-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/villa-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/house-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/hotel-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/shop-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/office-pattaya', freq: 'weekly', pri: 0.8 },
    { path: '/rent/land-pattaya', freq: 'weekly', pri: 0.8 },

    // Sell sub-pages
    { path: '/sell/valuation', freq: 'monthly', pri: 0.7 },
    { path: '/sell/list-property', freq: 'monthly', pri: 0.7 },

    // Invest sub-pages
    { path: '/invest/calculator', freq: 'monthly', pri: 0.7 },
    { path: '/invest/guides', freq: 'monthly', pri: 0.7 },
    { path: '/investment', freq: 'weekly', pri: 0.7 },

    // Hub pages (hubs only — detail pages go in their own sitemaps)
    { path: '/projects', freq: 'daily', pri: 0.9 },
    { path: '/developers', freq: 'weekly', pri: 0.7 },
    { path: '/area-guide', freq: 'weekly', pri: 0.8 },
    { path: '/guides', freq: 'weekly', pri: 0.7 },
    { path: '/blog', freq: 'weekly', pri: 0.6 },

    // Segment landing pages
    { path: '/european', freq: 'weekly', pri: 0.7 },
    { path: '/investor', freq: 'weekly', pri: 0.7 },
    { path: '/luxury', freq: 'weekly', pri: 0.7 },
    { path: '/holiday-home', freq: 'weekly', pri: 0.7 },
    { path: '/general', freq: 'weekly', pri: 0.7 },

    // Tools
    { path: '/smart-finder', freq: 'monthly', pri: 0.8 },
    { path: '/compare', freq: 'monthly', pri: 0.6 },
    { path: '/marketplace', freq: 'weekly', pri: 0.7 },

    // Support pages
    { path: '/about', freq: 'monthly', pri: 0.5 },
    { path: '/contact', freq: 'monthly', pri: 0.5 },
    { path: '/co-agent', freq: 'monthly', pri: 0.5 },
    { path: '/privacy', freq: 'yearly', pri: 0.5 },
    { path: '/terms', freq: 'yearly', pri: 0.5 },
  ];

  return pages.flatMap(({ path, freq, pri }) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: freq,
      priority: pri,
    })),
  );
}

/* ------------------------------------------------------------------ */
/*  sitemap-projects.xml — dynamic from API                           */
/* ------------------------------------------------------------------ */

export async function projectsEntries(): Promise<UrlEntry[]> {
  try {
    const projects = await fetchProjects({ limit: 5000 });
    return projects.flatMap((p) =>
      entry(`/projects/${encodeURIComponent(p.slug)}`, 'weekly', 0.8, p.updated_at),
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  sitemap-properties.xml — dynamic from API                         */
/* ------------------------------------------------------------------ */

export async function propertiesEntries(): Promise<UrlEntry[]> {
  try {
    const res = await fetchProperties({ limit: 5000, sort: 'newest' });
    return (res.data ?? []).flatMap((p) => {
      if (!p.slug) return [];
      const updated = (p as Record<string, unknown>).updated_at as string | undefined;
      return entry(`/property/${encodeURIComponent(p.slug)}`, 'daily', 0.7, updated);
    });
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  sitemap-areas.xml — area-guide + area data pages                  */
/* ------------------------------------------------------------------ */

const AREA_SLUGS = ['jomtien', 'pratumnak', 'wongamat', 'central', 'na-jomtien', 'bang-saray'];

export function areasEntries(): UrlEntry[] {
  return AREA_SLUGS.flatMap((slug) => [
    ...entry(`/area-guide/${slug}`, 'monthly', 0.7),
    ...entry(`/areas/${slug}`, 'monthly', 0.6),
  ]);
}

/* ------------------------------------------------------------------ */
/*  sitemap-developers.xml — dynamic from API                         */
/* ------------------------------------------------------------------ */

export async function developersEntries(): Promise<UrlEntry[]> {
  try {
    const projects = await fetchProjects({ limit: 5000 });
    // Map developer_id → most recent project updated_at (used as developer lastmod proxy)
    const devMap = new Map<string, string | undefined>();
    for (const p of projects) {
      if (!p.developer_id) continue;
      const existing = devMap.get(p.developer_id);
      if (!existing || (p.updated_at && p.updated_at > existing)) {
        devMap.set(p.developer_id, p.updated_at);
      }
    }
    return [...devMap.entries()].flatMap(([id, latestUpdated]) =>
      entry(`/developers/${encodeURIComponent(id)}`, 'monthly', 0.6, latestUpdated),
    );
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  sitemap-guides.xml — content hub                                  */
/* ------------------------------------------------------------------ */

const GUIDE_SLUGS = [
  'best-condos-jomtien',
  'luxury-condos-pattaya',
  'foreign-condo-ownership-thailand',
  'roi-pattaya-condos',
  'pool-villa-pattaya',
  'cost-of-living-pattaya',
];

export function guidesEntries(): UrlEntry[] {
  return GUIDE_SLUGS.flatMap((slug) => entry(`/guides/${slug}`, 'monthly', 0.6));
}

/* ------------------------------------------------------------------ */
/*  sitemap-blog.xml — content hub                                    */
/* ------------------------------------------------------------------ */

const BLOG_SLUGS = [
  'pattaya-real-estate-investment-guide-2025',
  'buying-condo-thailand-foreigner-complete-guide',
  'top-areas-pattaya-investment-2025',
  'pattaya-rental-yield-analysis',
];

export function blogEntries(): UrlEntry[] {
  return BLOG_SLUGS.flatMap((slug) => entry(`/blog/${slug}`, 'monthly', 0.5));
}

/* ------------------------------------------------------------------ */
/*  XML builders                                                       */
/* ------------------------------------------------------------------ */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Build a `<urlset>` XML response from an array of URL entries. */
export function urlsetResponse(entries: UrlEntry[]): Response {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(e.url)}</loc>\n` +
        `    <lastmod>${e.lastModified.toISOString().split('T')[0]}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority.toFixed(1)}</priority>\n` +
        `  </url>`,
    )
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls +
    `\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

/** Build a `<sitemapindex>` XML response referencing named child sitemaps. */
export function sitemapIndexResponse(sitemapUrls: string[]): Response {
  const now = new Date().toISOString().split('T')[0];
  const items = sitemapUrls
    .map(
      (url) =>
        `  <sitemap>\n` +
        `    <loc>${escapeXml(url)}</loc>\n` +
        `    <lastmod>${now}</lastmod>\n` +
        `  </sitemap>`,
    )
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    items +
    `\n</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
