import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

const LOCALES = ['en', 'th'] as const;
type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE_NAME = 'amp_locale';
const LOCALE_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 365;
const NON_LOCALIZED_ROUTE_PREFIXES = [
  '/v1',
  '/login',
  '/leads',
  '/inquiries',
  '/analytics',
  '/media',
  '/public',
  '/admin',
  '/layout-cms',
  '/home-composer',
  '/telemetry',
] as const;
const ENGLISH_ONLY_PREVIEW_BLOCKED_PATHS = new Set(['/th/v2-preview', '/th/v2-preview/']);

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

function hasRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const PUBLIC_FILE = /\.[^/]+$/;

function appendVary(existing: string | null, values: string[]): string {
  const normalized = new Set(
    String(existing ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  for (const value of values) normalized.add(value);
  return [...normalized].join(', ');
}

export function resolveLocaleFromAcceptLanguage(value: string | null | undefined): Locale | null {
  if (!value) return null;

  const preferences = value
    .split(',')
    .map((segment) => {
      const [rawLang, ...params] = segment.trim().split(';');
      const base = rawLang.toLowerCase().split('-')[0];
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qParam ? Number.parseFloat(qParam.split('=')[1] ?? '1') : 1;
      return { lang: base, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .sort((left, right) => right.quality - left.quality);

  for (const preference of preferences) {
    if (isLocale(preference.lang)) {
      return preference.lang;
    }
  }
  return null;
}

export function resolvePreferredLocale(req: Pick<NextRequest, 'headers' | 'cookies'>): Locale {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }
  return resolveLocaleFromAcceptLanguage(req.headers.get('accept-language')) ?? 'en';
}

function isSecureRequest(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.toLowerCase() === 'https';
  }
  return req.nextUrl.protocol === 'https:';
}

function persistLocaleCookie(res: NextResponse, req: NextRequest, locale: Locale) {
  res.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    path: '/',
    maxAge: LOCALE_COOKIE_TTL_SECONDS,
    sameSite: 'lax',
    secure: isSecureRequest(req),
  });
}

/**
 * Next.js Edge Middleware — locale detection, redirect, and security headers.
 *
 * Responsibilities:
 * 1. Skip static assets, API routes, and admin pages.
 * 2. Redirect non-prefixed public paths to `/en` by default.
 * 3. Attach 8 security headers (CSP, HSTS, X-Frame-Options, etc.) to localized responses.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_LOCAL_RUNTIME_MINIMAL === '1') {
    return NextResponse.next();
  }

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

  // AMP Public v2 Phase 1 is English-only. Force a real HTTP 404 for the Thai preview path.
  if (ENGLISH_ONLY_PREVIEW_BLOCKED_PATHS.has(pathname)) {
    const response = new NextResponse(null, { status: 404 });
    response.headers.set('x-next-pathname', pathname);
    response.headers.set('Cache-Control', 'no-store');
    setSecurityHeaders(response);
    persistLocaleCookie(response, req, 'th');
    return response;
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Already localized.
  if (isLocale(first)) {
    const response = NextResponse.next();
    response.headers.set('x-next-pathname', pathname);
    setSecurityHeaders(response);
    setCacheHeaders(response);
    persistLocaleCookie(response, req, first);
    return response;
  }

  const preferredLocale = resolvePreferredLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  const response = NextResponse.redirect(url);
  response.headers.set('Vary', appendVary(response.headers.get('Vary'), ['Accept-Language', 'Cookie']));
  persistLocaleCookie(response, req, preferredLocale);
  return response;
}

/** Attach all security response headers (incl. CSP + cross-origin isolation). */
function setSecurityHeaders(res: NextResponse) {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = "script-src 'self' 'unsafe-inline'";
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
