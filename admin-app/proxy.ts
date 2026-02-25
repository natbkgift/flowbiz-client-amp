import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

const LOCALES = ['en', 'th'] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

const PUBLIC_FILE = /\.[^/]+$/;

/**
 * Blueprint doc 02 — URL STRUCTURE: deleted pages return 410 Gone.
 * Add locale-stripped paths here when a page is permanently removed
 * (e.g. '/old-page' matches both /en/old-page/ and /th/old-page/).
 */
const GONE_PATHS = new Set<string>([
  // Example: '/projects/discontinued-project'
]);

/**
 * Next.js Edge Proxy — locale detection, redirect, and security headers.
 *
 * Responsibilities:
 * 1. Skip static assets, API routes, and admin pages.
 * 2. Return 410 Gone for permanently deleted pages.
 * 3. Enforce lowercase URLs (301 redirect).
 * 4. Redirect non-prefixed public paths to `/en` by default.
 * 5. Attach security headers (CSP, HSTS, X-Frame-Options, etc.) to localized responses.
 */
export function proxy(req: NextRequest) {
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

  // Rate-limit form submission endpoints before general API skip.
  if (pathname === '/api/v1/inquiries' && req.method === 'POST') {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    const { allowed, remaining, retryAfterMs } = checkRateLimit(
      `inquiries:${clientIp}`,
      5,       // max 5 submissions
      60_000,  // per 60-second window
    );
    if (!allowed) {
      return NextResponse.json(
        { detail: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
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

  // Blueprint doc 02 — URL STRUCTURE: enforce lowercase URLs (301).
  // Locale prefixes and path segments must always be lowercase.
  const lowered = pathname.toLowerCase();
  if (pathname !== lowered) {
    const url = req.nextUrl.clone();
    url.pathname = lowered;
    return NextResponse.redirect(url, 301);
  }

  // Already localized.
  if (isLocale(first)) {
    // Blueprint doc 02 — 410 Gone for permanently deleted pages.
    const pathWithoutLocale = '/' + segments.slice(1).join('/');
    const normalised = pathWithoutLocale.replace(/\/+$/, '') || '/';
    if (GONE_PATHS.has(normalised)) {
      return new NextResponse('Gone', { status: 410 });
    }

    const response = NextResponse.next();
    response.headers.set('x-next-pathname', pathname);
    setSecurityHeaders(response);
    setCacheHeaders(response);
    return response;
  }

  // Phase A: remove external redirect for the root path.
  // Serve the default locale content (/en/) at / via internal rewrite so
  // Lighthouse does not pay a redirect-chain penalty.
  if (pathname === '/' || pathname === '') {
    const url = req.nextUrl.clone();
    url.pathname = '/en/';
    url.search = search;

    const response = NextResponse.rewrite(url);
    response.headers.set('x-next-pathname', '/en/');
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

/** Attach all security response headers (incl. CSP + cross-origin isolation). */
function setSecurityHeaders(res: NextResponse) {
  const scriptSrc =
    process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  // Cross-origin isolation headers
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  // Rate-limit hint for upstream proxy (nginx/CDN enforces actual limits)
  res.headers.set('X-RateLimit-Policy', '60;w=60;comment="form submissions"');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "worker-src 'self'",
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
