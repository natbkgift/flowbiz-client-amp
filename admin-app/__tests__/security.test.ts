import { describe, it, expect, beforeAll } from 'vitest';
import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';
import { ADMIN_LABELS } from '@/app/_lib/admin-labels';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import manifest from '@/app/manifest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Verify that the next.config.js has the expected security and performance settings.
 * These tests validate config shape without requiring a Next.js build.
 */
// Dynamic path avoids eslint @typescript-eslint/no-var-requires lint rule
const CONFIG_PATH = '../next.config.js';

describe('next.config.js security & performance settings', () => {
  let config: Record<string, unknown>;

  beforeAll(async () => {
    const mod = (await import(CONFIG_PATH)) as { default?: Record<string, unknown> } & Record<string, unknown>;
    config = (mod.default ?? mod) as Record<string, unknown>;
  });

  it('disables X-Powered-By header', () => {
    expect(config.poweredByHeader).toBe(false);
  });

  it('enables compression', () => {
    expect(config.compress).toBe(true);
  });

  it('uses standalone output mode', () => {
    expect(config.output).toBe('standalone');
  });

  it('supports AVIF and WebP image formats', () => {
    const c = config as any;
    expect(c.images?.formats).toContain('image/avif');
    expect(c.images?.formats).toContain('image/webp');
  });

  it('has optimizePackageImports configured', () => {
    const c = config as any;
    expect(c.experimental?.optimizePackageImports).toEqual(
      expect.arrayContaining(['@heroicons/react']),
    );
  });
});

describe('PAGE_REVALIDATE_SECONDS', () => {
  it('defaults to 300', () => {
    expect(PAGE_REVALIDATE_SECONDS).toBe(300);
  });

  it('is a positive number', () => {
    expect(PAGE_REVALIDATE_SECONDS).toBeGreaterThan(0);
  });
});

describe('security-relevant i18n keys', () => {
  it('skip link text is a non-empty string in both locales', () => {
    expect(en.common.skipLink).toBeTruthy();
    expect(th.common.skipLink).toBeTruthy();
  });

  it('error messages exist in both locales', () => {
    expect(en.errors.requestFailed).toBeTruthy();
    expect(th.errors.requestFailed).toBeTruthy();
    expect(en.errors.failedToSubmit).toBeTruthy();
    expect(th.errors.failedToSubmit).toBeTruthy();
  });

  it('CTA region aria label exists in both locales', () => {
    expect(en.common.ctaRegion).toBeTruthy();
    expect(th.common.ctaRegion).toBeTruthy();
  });
});

describe('robots.ts', () => {
  const result = robots();

  it('allows crawling of root', () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rule.allow).toContain('/');
  });

  it('disallows admin/api paths', () => {
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallowed = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    expect(disallowed).toContain('/api/');
    expect(disallowed).toContain('/login');
    expect(disallowed).toContain('/analytics');
  });

  it('includes sitemap URL', () => {
    expect(result.sitemap).toMatch(/sitemap\.xml$/);
  });
});

describe('sitemap.ts', () => {
  const entries = sitemap();

  it('generates entries for both locales', () => {
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/en'))).toBe(true);
    expect(urls.some((u) => u.includes('/th'))).toBe(true);
  });

  it('includes required pages', () => {
    const urls = entries.map((e) => e.url);
    const requiredPaths = ['/invest', '/buy', '/rent', '/projects', '/smart-finder', '/compare', '/sell', '/about', '/areas/jomtien', '/areas/pratumnak', '/area-guide/central'];
    for (const p of requiredPaths) {
      expect(urls.some((u) => u.includes(p))).toBe(true);
    }
  });

  it('sets lastModified on every entry', () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it('has priority between 0 and 1 for all entries', () => {
    for (const entry of entries) {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it('home page has highest priority', () => {
    const homeEntries = entries.filter((e) => e.url.endsWith('/en') || e.url.endsWith('/th'));
    for (const entry of homeEntries) {
      expect(entry.priority).toBe(1.0);
    }
  });
});

describe('middleware security headers', () => {
  const src = readFileSync(resolve(__dirname, '..', 'middleware.ts'), 'utf-8');

  it('keeps backend v1 routes outside locale redirect', () => {
    expect(src).toContain("'\/v1'");
  });

  it('sets Content-Security-Policy header', () => {
    expect(src).toContain('Content-Security-Policy');
  });

  it('CSP includes frame-ancestors none', () => {
    expect(src).toContain("frame-ancestors 'none'");
  });

  it('CSP restricts default-src to self', () => {
    expect(src).toContain("default-src 'self'");
  });

  it('CSP restricts base-uri', () => {
    expect(src).toContain("base-uri 'self'");
  });

  it('CSP restricts form-action', () => {
    expect(src).toContain("form-action 'self'");
  });

  it('CSP does NOT use unsafe-eval', () => {
    expect(src).not.toContain('unsafe-eval');
  });

  it('CSP includes upgrade-insecure-requests', () => {
    expect(src).toContain('upgrade-insecure-requests');
  });

  it('sets HSTS header with preload', () => {
    expect(src).toContain('Strict-Transport-Security');
    expect(src).toContain('preload');
  });

  it('sets all 8 security headers', () => {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'X-DNS-Prefetch-Control',
      'Permissions-Policy',
      'Strict-Transport-Security',
      'X-XSS-Protection',
      'Content-Security-Policy',
    ];
    for (const h of requiredHeaders) {
      expect(src).toContain(h);
    }
  });

  it('sets cross-origin isolation headers', () => {
    expect(src).toContain('Cross-Origin-Opener-Policy');
    expect(src).toContain('Cross-Origin-Resource-Policy');
  });

  it('CSP blocks plugin-based content', () => {
    expect(src).toContain("object-src 'none'");
  });

  it('CSP restricts workers to same origin', () => {
    expect(src).toContain("worker-src 'self'");
  });

  it('sets cache headers with stale-while-revalidate', () => {
    expect(src).toContain('Cache-Control');
    expect(src).toContain('stale-while-revalidate');
    expect(src).toContain('s-maxage');
  });
});

describe('fetchWithRetry resilience', () => {
  const apiSrc = readFileSync(resolve(__dirname, '..', 'app', '_lib', 'public-api-server.ts'), 'utf-8');

  it('uses AbortController for request timeout', () => {
    expect(apiSrc).toContain('AbortController');
    expect(apiSrc).toContain('REQUEST_TIMEOUT_MS');
  });

  it('implements exponential back-off', () => {
    expect(apiSrc).toContain('RETRY_BASE_MS');
    expect(apiSrc).toContain('2 ** attempt');
  });
});

describe('manifest.ts', () => {
  const m = manifest();

  it('has a name and short_name', () => {
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
  });

  it('display is standalone', () => {
    expect(m.display).toBe('standalone');
  });

  it('has theme_color and background_color', () => {
    expect(m.theme_color).toBeTruthy();
    expect(m.background_color).toBeTruthy();
  });
});

describe('global-error.tsx exists', () => {
  it('has global error boundary file', () => {
    const exists = existsSync(
      resolve(__dirname, '..', 'app', 'global-error.tsx'),
    );
    expect(exists).toBe(true);
  });

  it('includes bilingual text (EN + TH)', () => {
    const src = readFileSync(resolve(__dirname, '..', 'app', 'global-error.tsx'), 'utf-8');
    expect(src).toContain('เกิดข้อผิดพลาด');
    expect(src).toContain('ลองอีกครั้ง');
  });

  it('logs error for observability', () => {
    const src = readFileSync(resolve(__dirname, '..', 'app', 'global-error.tsx'), 'utf-8');
    expect(src).toContain('console.error');
  });
});

describe('next.config.js reactStrictMode', () => {
  let config: Record<string, unknown>;

  beforeAll(async () => {
    const mod = (await import(CONFIG_PATH)) as { default?: Record<string, unknown> } & Record<string, unknown>;
    config = (mod.default ?? mod) as Record<string, unknown>;
  });

  it('has reactStrictMode enabled', () => {
    expect(config.reactStrictMode).toBe(true);
  });
});

describe('route loading skeletons', () => {
  const routes = ['buy', 'rent', 'projects', 'invest', 'marketplace', 'contact', 'smart-finder'];

  for (const route of routes) {
    it(`${route}/ has loading.tsx`, () => {
      const exists = existsSync(
        resolve(__dirname, '..', 'app', '(site)', '[locale]', route, 'loading.tsx'),
      );
      expect(exists).toBe(true);
    });
  }

  it('property/[slug]/ has loading.tsx', () => {
    const exists = existsSync(
      resolve(__dirname, '..', 'app', '(site)', '[locale]', 'property', '[slug]', 'loading.tsx'),
    );
    expect(exists).toBe(true);
  });
});

describe('ADMIN_LABELS', () => {
  it('has brand name', () => {
    expect(ADMIN_LABELS.brand).toBeTruthy();
  });

  it('has all nav labels', () => {
    expect(ADMIN_LABELS.nav.analytics).toBeTruthy();
    expect(ADMIN_LABELS.nav.inquiries).toBeTruthy();
    expect(ADMIN_LABELS.nav.leads).toBeTruthy();
  });

  it('has logout labels', () => {
    expect(ADMIN_LABELS.logout).toBeTruthy();
    expect(ADMIN_LABELS.logoutAria).toBeTruthy();
  });
});

describe('layout.tsx source', () => {
  const layoutSrc = readFileSync(resolve(__dirname, '..', 'app', 'layout.tsx'), 'utf-8');

  it('sets dir="ltr" on <html>', () => {
    expect(layoutSrc).toContain('dir="ltr"');
  });

  it('sets theme-color meta', () => {
    expect(layoutSrc).toContain('theme-color');
  });

  it('does not preconnect to external font CDNs (fonts are self-hosted)', () => {
    expect(layoutSrc).not.toContain('fonts.googleapis.com');
  });
});
