import { headers } from 'next/headers';

/**
 * Head tags for public locale pages.
 *
 * Hero LCP fix pack: explicitly preload the homepage hero image, but only on
 * the locale root path (/en/ or /th/) to avoid wasting bandwidth on inner pages.
 */
export default async function Head() {
  const h = await headers();
  const pathname = h.get('x-next-pathname') ?? '';
  const isLocaleRoot = pathname === '/en/' || pathname === '/th/' || pathname === '/en' || pathname === '/th';

  if (!isLocaleRoot) return null;

  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/hero-banner.webp"
        type="image/webp"
        fetchPriority="high"
      />
    </>
  );
}
