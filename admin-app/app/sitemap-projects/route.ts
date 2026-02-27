const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function absoluteUrl(path: string): string {
  const base = stripTrailingSlashes(SITE_URL);
  return ensureTrailingSlash(`${base}${ensureLeadingSlash(path)}`);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapDocument(urls: string[]): string {
  const items = urls
    .map((loc) => `<url><loc>${xmlEscape(loc)}</loc></url>`)
    .join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`
  );
}

export async function GET() {
  const locales = ['en', 'th'] as const;
  const paths = ['/projects'];
  const urls = locales.flatMap((locale) =>
    paths.map((path) => absoluteUrl(`/${locale}${path}`)),
  );

  const xml = buildSitemapDocument(urls);
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
