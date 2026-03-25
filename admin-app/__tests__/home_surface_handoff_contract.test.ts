import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home surface handoff contract', () => {
  it('keeps structured home handoff routes wired across hero, trust, projects, and the final conversion gate', () => {
    const page = read('app/(site)/[locale]/page.tsx');
    const perfProbe = read('components/home/HomePerfProbe.tsx');

    expect(page).toContain('HomePerfProbe');
    expect(perfProbe).toContain("entity_name: 'home_perf_probe'");
    expect(perfProbe).toContain("trackEvent('web_vitals_probe'");
    expect(page).toContain('home_featured_projects_advisor');
    expect(page).toContain('home_hero_primary');
    expect(page).toContain('home_hero_secondary');
    expect(page).toContain('home_bottom_secondary');
    expect(page).toContain('home-trust-snapshot-grid');
    expect(perfProbe).toContain('amp_home_perf_probe_latest_v1');
    expect(perfProbe).toContain('follow_up_target');
  });

  it('keeps the trust snapshot and final cta framed as decision cues instead of a route selector', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('Verified listings only');
    expect(page).toContain('Price & floor plans ready');
    expect(page).toContain('Ready to find your property?');
    expect(page).toContain('Talk to an Advisor Now');
    expect(page).not.toContain('home-intent-card__eyebrow');
    expect(page).not.toContain('home-intent-card__start');
  });

  it('keeps guided overlay contact handoff mapped through structured lead capture query building', () => {
    const overlay = read('app/(site)/[locale]/_components/GuidedOverlay.tsx');

    expect(overlay).toContain('home_guided_contact');
    expect(overlay).toContain('buildLeadCaptureQuery');
    expect(overlay).toContain('normalizeGuidedIntent');
  });

  it('keeps the home performance hooks for optimized hero and card media', () => {
    const hero = read('components/home/HomeHero.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');
    const localMedia = read('components/media/LocalMediaImage.tsx');
    const safeCoverImage = read('components/media/SafeCoverImage.tsx');
    const personalization = read('lib/personalization.ts');
    const page = read('app/(site)/[locale]/page.tsx');

    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('quality={82}');
    expect(hero).toContain('data-home-perf="hero-media"');
    expect(featuredProjects).toContain('unoptimized={false}');
    expect(featuredProjects).toContain('premium-project-card__cta');
    expect(localMedia).toContain('fetchPriority');
    expect(safeCoverImage).toContain('unoptimized = true');
    expect(personalization).toContain("intent === 'sell'");
    expect(page).toContain('data-home-perf="trust-layer"');
    expect(page).toContain('data-home-perf="trust-strip"');
  });
});
