/**
 * Next.js Edge Middleware — Security Headers
 *
 * Sets security response headers on every response route.
 * These are additive to the static headers in next.config.js (Blueprint doc 16).
 * WARNING: Do NOT add any permissive eval/inline flags to the CSP directives.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Content-Security-Policy — no permissive eval or hash flags
  response.headers.set('Content-Security-Policy', CSP);

  // Click-jacking protection
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Legacy XSS filter (belt-and-suspenders)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS pre-fetch opt-out
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Feature / Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)',
  );

  // HSTS — 2 years, subdomains, preload
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );

  // Cross-origin isolation
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Dynamic routes use CDN caching with stale-while-revalidate
  const url = request.nextUrl.pathname;
  const isStaticAsset = url.startsWith('/_next/static/') || url.startsWith('/_next/image');
  if (!isStaticAsset) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    );
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
