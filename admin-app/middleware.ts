import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'th'] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

const PUBLIC_FILE = /\.[^/]+$/;

/**
 * Next.js Edge Middleware — locale detection, redirect, and security headers.
 *
 * Responsibilities:
 * 1. Skip static assets, API routes, and admin pages.
 * 2. Redirect non-prefixed public paths to `/en` by default.
 * 3. Attach 8 security headers (CSP, HSTS, X-Frame-Options, etc.) to localized responses.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Ignore next internals & static assets.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Ignore API routes served by backend via nginx (/api/*).
  if (pathname.startsWith('/api/')) return NextResponse.next();

  // Ignore admin routes (keep existing URLs stable).
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/inquiries') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Already localized.
  if (isLocale(first)) {
    const response = NextResponse.next();
    response.headers.set('x-next-pathname', pathname);
    setSecurityHeaders(response);
    setCacheHeaders(response);
    return response;
  }

  // Default locale: English.
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

/** Attach all security response headers (8 total, incl. CSP). */
function setSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  );
}

/** Set browser + CDN cache headers for public pages. */
function setCacheHeaders(res: NextResponse) {
  // Let CDNs cache for 5 min, serve stale for up to 1 hour while revalidating.
  res.headers.set(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=3600',
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
