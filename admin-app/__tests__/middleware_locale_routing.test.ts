import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import {
  LOCALE_COOKIE_NAME,
  middleware,
  resolveLocaleFromAcceptLanguage,
} from '@/middleware';

describe('middleware locale routing', () => {
  it('prefers the locale cookie when redirecting a non-localized route', () => {
    const request = new NextRequest('https://amppattaya.com/projects?source=direct', {
      headers: {
        cookie: `${LOCALE_COOKIE_NAME}=th`,
        'accept-language': 'en-US,en;q=0.9',
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://amppattaya.com/th/projects?source=direct');
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe('th');
    expect(response.headers.get('vary')).toContain('Accept-Language');
    expect(response.headers.get('vary')).toContain('Cookie');
  });

  it('falls back to Accept-Language when no cookie is present', () => {
    const request = new NextRequest('https://amppattaya.com/', {
      headers: {
        'accept-language': 'th-TH,th;q=0.9,en;q=0.7',
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://amppattaya.com/th');
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe('th');
  });

  it('falls back to English when no supported locale is present', () => {
    const request = new NextRequest('https://amppattaya.com/about', {
      headers: {
        'accept-language': 'fr-FR,fr;q=0.9',
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://amppattaya.com/en/about');
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe('en');
  });

  it('persists the active locale on localized responses', () => {
    const request = new NextRequest('https://amppattaya.com/th/projects');

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe('th');
  });

  it('parses weighted Accept-Language headers safely', () => {
    expect(resolveLocaleFromAcceptLanguage('en-US;q=0.7,th-TH;q=0.9')).toBe('th');
    expect(resolveLocaleFromAcceptLanguage('de-DE,de;q=0.9')).toBeNull();
  });
});
