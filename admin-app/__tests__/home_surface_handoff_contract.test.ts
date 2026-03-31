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

    expect(page).toContain('NEXT_PUBLIC_HOME_METRICS_DEBUG');
    expect(perfProbe).toContain("entity_name: 'home_perf_probe'");
    expect(perfProbe).toContain("trackEvent('web_vitals_probe'");
    expect(page).toContain('home_hero_primary');
    expect(page).toContain('home_hero_secondary');
    expect(page).toContain('home_bottom_secondary');
    expect(page).toContain('home-trust-snapshot-grid');
    expect(page).not.toContain('home_featured_projects_advisor');
    expect(perfProbe).toContain('amp_home_perf_probe_latest_v1');
    expect(perfProbe).toContain('follow_up_target');
  });

  it('keeps the trust snapshot and final cta framed as decision cues instead of a route selector', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('Verified listings only');
    expect(page).toContain('No fake or outdated stock');
    expect(page).toContain('Send your brief');
    expect(page).toContain('Browse live opportunities');
    expect(page).not.toContain('home-pathways-highlight-row');
    expect(page).not.toContain('home-curated-shell__signal-row');
    expect(page).not.toContain('home-confidence-row');
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

    expect(hero).not.toContain('fetchPriority="high"');
    expect(hero).toContain('quality={76}');
    expect(hero).toContain('data-home-perf="hero-media"');
    expect(hero).toContain('prefetch');
    expect(featuredProjects).toContain('unoptimized={false}');
    expect(featuredProjects).toContain('premium-project-card__cta');
    expect(featuredProjects).not.toContain('premium-project-card__fact-label" aria-hidden="true">+</span>');
    expect(localMedia).toContain('fetchPriority');
    expect(safeCoverImage).toContain('unoptimized = true');
    expect(personalization).toContain("intent === 'sell'");
    expect(page).toContain('data-home-perf="trust-layer"');
    expect(page).toContain('data-home-perf="trust-strip"');
    expect(page).not.toContain('fetchBlogPosts');
    expect(page).not.toContain('fetchPublishedTestimonials');
    expect(page).not.toContain("dynamic = 'force-dynamic'");
    expect(page).not.toContain('noStore()');
  });
});
