import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf-8');
}

describe('about/company CMS contract', () => {
  it('wires the about page to company, process, team, and testimonial sources', () => {
    const page = read('app/(site)/[locale]/about/page.tsx');
    const api = read('app/_lib/public-api-server.ts');

    expect(page).toContain("fetchCompanyInfoBySlug('about')");
    expect(page).toContain("fetchCompanyInfoBySlug('how-we-work')");
    expect(page).toContain('fetchPublishedTeamMembers()');
    expect(page).toContain('fetchPublishedTestimonials({ limit: 6 })');
    expect(page).toContain("id=\"process-section\"");
    expect(page).toContain("id=\"team-section\"");
    expect(page).toContain("id=\"proof-assets\"");
    expect(page).toContain("id=\"client-reviews\"");
    expect(page).toContain('LocalMediaImage');
    expect(page).toContain('resolveCmsText');
    expect(page).toContain('resolveLocalizedText');
    expect(api).toContain('export async function fetchPublishedTeamMembers()');
    expect(api).toContain('export async function fetchPublishedTestimonials(');
    expect(api).toContain("const url = new URL(`${base}/v1/team-members`, origin);");
    expect(api).toContain("const url = new URL(`${base}/v1/testimonials`, origin);");
  });

  it('provides a dedicated how-we-work page backed by the company CMS slug', () => {
    const page = read('app/(site)/[locale]/how-we-work/page.tsx');

    expect(page).toContain("fetchCompanyInfoBySlug('how-we-work')");
    expect(page).toContain('fetchPublishedTeamMembers()');
    expect(page).toContain("withLocaleQuery(locale, '/contact', { intent: 'consultation', source: 'how_we_work' })");
    expect(page).toContain("withLocale(locale, '/contact')");
    expect(page).toContain("withLocale(locale, '/about#team-section')");
  });
});
