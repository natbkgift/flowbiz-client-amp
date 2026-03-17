// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = 3101;
const BASE = `http://${HOST}:${PORT}`;

let server: ChildProcess | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`${BASE}/healthz`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(200);
  }
  throw new Error('A2 harness server did not become healthy in time');
}

async function getHtml(pathname: string): Promise<string> {
  const res = await fetch(`${BASE}${pathname}`);
  expect(res.ok).toBe(true);
  return await res.text();
}

function getTagCount(html: string, tagName: string) {
  const regex = new RegExp(`<${tagName}\\b`, 'gi');
  return (html.match(regex) || []).length;
}

function extractAttrValues(html: string, attrName: string): string[] {
  const regex = new RegExp(`${attrName}="([^"]+)"`, 'gi');
  const out: string[] = [];
  let match = regex.exec(html);
  while (match) {
    out.push(match[1]);
    match = regex.exec(html);
  }
  return out;
}

function cssRuleValue(html: string, selector: string, prop: string): number {
  const block = new RegExp(`\\${selector}\\{([^}]+)\\}`, 'i').exec(html)?.[1] || '';
  const value = new RegExp(`${prop}:([\\d.]+)(?:px|rem)`, 'i').exec(block)?.[1] || '0';
  return Number(value);
}

function isAllowedMediaUrl(raw: string): boolean {
  const value = String(raw || '').trim();
  if (!value) return true;
  if (value.startsWith('data:')) return true;
  if (value.startsWith('/')) return !value.startsWith('//');

  try {
    const parsed = new URL(value, BASE);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return new Set([HOST, 'localhost', '127.0.0.1', 'flowbiz.com', 'www.flowbiz.com']).has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

beforeAll(async () => {
  server = spawn(process.execPath, ['scripts/a1-public-server.mjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, A1_HOST: HOST, A1_PORT: String(PORT) },
  });
  await waitForHealth();
});

afterAll(async () => {
  if (server) {
    server.kill('SIGTERM');
    await sleep(300);
    if (!server.killed) server.kill('SIGKILL');
  }
});

describe('A2 home runtime spec locks', () => {
  it('renders one H1, exact EN hero CTA labels, and all required section anchors', async () => {
    const html = await getHtml('/en');

    expect(getTagCount(html, 'h1')).toBe(1);
    expect(html).toContain('Verified Pattaya properties for Europeans — buy, invest, rent, sell with confidence.');

    const heroPrimary = /data-cta-id="hero_primary"[^>]*>([^<]+)<\/a>/i.exec(html)?.[1]?.trim();
    const heroSecondary = /data-cta-id="hero_secondary"[^>]*>([^<]+)<\/a>/i.exec(html)?.[1]?.trim();
    expect(heroPrimary).toBe('Request Consultation');
    expect(heroSecondary).toBe('Browse Curated Projects');

    const heroActions = /<div class="hero-ctas"[\s\S]*?<\/div>/i.exec(html)?.[0] || '';
    expect((heroActions.match(/<a\b/gi) || []).length).toBe(2);

    expect(html).toContain('id="intent-title"');
    expect(html).toContain('id="featured-title"');
    expect(html).toContain('id="investment-title"');
    expect(html).toContain('id="why-pattaya-title"');
    expect(html).toContain('id="trust-title"');
    expect(html).toContain('id="insights-title"');
    expect(html).toContain('id="reviews-title"');
    expect(html).toContain('id="video-title"');
    expect(html).toContain('id="consult-title"');
  });

  it('includes four intent cards with fit/outcome/start and clickable paths', async () => {
    const html = await getHtml('/en');

    const intentCards = html.match(/class="intent-card"/gi) || [];
    expect(intentCards.length).toBe(4);
    expect((html.match(/<strong>Fit:<\/strong>/gi) || []).length).toBe(4);
    expect((html.match(/<strong>Outcome:<\/strong>/gi) || []).length).toBe(4);
    expect((html.match(/>Start<\/span>/gi) || []).length).toBe(4);

    expect(html).toContain('data-intent="invest"');
    expect(html).toContain('data-intent="buy"');
    expect(html).toContain('data-intent="rent"');
    expect(html).toContain('data-intent="sell"');

    const hrefs = Array.from(html.matchAll(/class="intent-card"[^>]*href="([^"]+)"/gi)).map((m) => m[1]);
    expect(hrefs.length).toBe(4);
    expect(hrefs.every((href) => href.startsWith('/en/'))).toBe(true);
  });

  it('ensures every major section has a forward path and includes required methodology/team/work links', async () => {
    const html = await getHtml('/en');

    const sectionIds = [
      'intent-title',
      'featured-title',
      'investment-title',
      'why-pattaya-title',
      'trust-title',
      'insights-title',
      'reviews-title',
      'video-title',
      'consult-title',
    ];

    for (const sectionId of sectionIds) {
      const sectionMatch = new RegExp(`<section[^>]*[\\s\\S]*?aria-labelledby="${sectionId}"[\\s\\S]*?<\\/section>`, 'i').exec(html)?.[0] || '';
      expect(sectionMatch.length).toBeGreaterThan(0);
      expect((sectionMatch.match(/<a\b/gi) || []).length).toBeGreaterThanOrEqual(1);
    }

    expect(html).toContain('>See methodology<');
    expect(html).toContain('>Meet the team<');
    expect(html).toContain('>How we work<');
  });

  it('enforces media safety by hostname allowlist across runtime media attributes', async () => {
    const html = await getHtml('/en');
    const src = extractAttrValues(html, 'src');
    const srcset = extractAttrValues(html, 'srcset');
    const poster = extractAttrValues(html, 'poster');
    const allMedia = [...src, ...srcset, ...poster];

    const disallowed = allMedia.filter((url) => {
      const candidates = url
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0])
        .filter(Boolean);
      return candidates.some((candidate) => !isAllowedMediaUrl(candidate));
    });

    expect(disallowed).toEqual([]);
  });

  it('wires fixed tracking endpoint and required event names', async () => {
    const html = await getHtml('/en');

    expect(html).toContain("const endpoint = '/telemetry';");
    expect(html).not.toContain('/telemetry/');

    expect(html).toContain('home_hero_primary_click');
    expect(html).toContain('home_hero_secondary_click');
    expect(html).toContain('home_whatsapp_click');
    expect(html).toContain('home_browse_projects_click');
    expect(html).toContain('home_investment_pick_click');
    expect(html).toContain('home_form_submit');
    expect(html).toContain('home_scroll_depth');
  });

  it('keeps consultation form visible and submit-capable with required fields', async () => {
    const html = await getHtml('/en');

    expect(html).not.toContain('home-consultation-section');
    expect(html).toContain('id="consultation-form"');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="contact"');
    expect(html).toContain('name="budget"');
    expect(html).toContain('name="purpose"');
    expect(html).toContain('name="timeline"');
    expect(html).toContain('id="consult-submit"');
    expect(html).toContain('No spam • Reply within 1 business day');
    expect(html).toContain('id="form-loading"');
    expect(html).toContain('id="form-error"');
    expect(html).toContain('class="state-loading"');
    expect(html).toContain('class="state-error"');
  });

  it('includes deterministic responsive and accessibility CSS gates', async () => {
    const html = await getHtml('/en');

    expect(html).toContain(':focus-visible');
    expect(html).toContain('@media (min-width:1024px){.project-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.investment-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}');
    expect(html).toContain('@media (min-width:2560px){.investment-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}');
  });

  it('passes primary CTA visual prominence gate deterministically', async () => {
    const html = await getHtml('/en');

    const pHeight = cssRuleValue(html, '.btn-primary-hero', 'min-height');
    const pWidth = cssRuleValue(html, '.btn-primary-hero', 'min-width');
    const pFont = cssRuleValue(html, '.btn-primary-hero', 'font-size');
    const pWeight = cssRuleValue(html, '.btn-primary-hero', 'font-weight');

    const sHeight = cssRuleValue(html, '.btn-secondary-hero', 'min-height');
    const sWidth = cssRuleValue(html, '.btn-secondary-hero', 'min-width');
    const sFont = cssRuleValue(html, '.btn-secondary-hero', 'font-size');
    const sWeight = cssRuleValue(html, '.btn-secondary-hero', 'font-weight');

    const pArea = pHeight * pWidth;
    const sArea = sHeight * sWidth;
    expect(pArea).toBeGreaterThanOrEqual(sArea * 1.2);
    expect(pFont).toBeGreaterThan(sFont);
    expect(pWeight).toBeGreaterThanOrEqual(sWeight);

    const pIndex = html.indexOf('data-cta-id="hero_primary"');
    const sIndex = html.indexOf('data-cta-id="hero_secondary"');
    expect(pIndex).toBeGreaterThan(-1);
    expect(sIndex).toBeGreaterThan(-1);
    expect(pIndex).toBeLessThan(sIndex);

    expect((html.match(/btn-primary-hero/gi) || []).length).toBe(2);
  });

  it('serves semantic TH fallback copy while preserving CTA hierarchy', async () => {
    const html = await getHtml('/th');

    const heroPrimary = /data-cta-id="hero_primary"[^>]*>([^<]+)<\/a>/i.exec(html)?.[1]?.trim();
    const heroSecondary = /data-cta-id="hero_secondary"[^>]*>([^<]+)<\/a>/i.exec(html)?.[1]?.trim();

    expect(heroPrimary).toBe('ขอคำปรึกษา');
    expect(heroSecondary).toBe('ดูโครงการคัดสรร');
    expect(html).toContain('lang="th"');
  });
});
