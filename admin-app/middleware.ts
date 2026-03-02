import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

const LOCALES = ['en', 'th'] as const;
type Locale = (typeof LOCALES)[number];
const NON_LOCALIZED_ROUTE_PREFIXES = [
  '/login',
  '/leads',
  '/inquiries',
  '/analytics',
  '/public',
  '/admin',
  '/home-composer',
] as const;

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

function hasRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
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
  if (NON_LOCALIZED_ROUTE_PREFIXES.some((prefix) => hasRoutePrefix(pathname, prefix))) {
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

/** Attach all security response headers (incl. CSP + cross-origin isolation). */
function setSecurityHeaders(res: NextResponse) {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const connectSrc = isDev
    ? "connect-src 'self' http: https: ws: wss:"
    : "connect-src 'self' https:";

  const cspParts = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https:",
    connectSrc,
    "object-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (!isDev) cspParts.push('upgrade-insecure-requests');

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
  res.headers.set('Content-Security-Policy', cspParts.join('; '));
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
