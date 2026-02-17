import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'th'] as const;
type Locale = (typeof LOCALES)[number];

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '');
}

const PUBLIC_FILE = /\.[^/]+$/;

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
  if (pathname.startsWith('/login') || pathname.startsWith('/leads') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // Already localized.
  if (isLocale(first)) return NextResponse.next();

  // Default locale: English.
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
