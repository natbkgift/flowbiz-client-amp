import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home surface handoff contract', () => {
  it('keeps structured home handoff routes wired across hero, featured sections, reviews, and videos', () => {
    const page = read('app/(site)/[locale]/page.tsx');
    const mobileRail = read('components/home/HomeMobileIntentRail.tsx');
    const perfProbe = read('components/home/HomePerfProbe.tsx');
    const homeVideoCard = read('components/home/HomeVideoEmbedCard.tsx');

    expect(page).toContain('HomeMobileIntentRail');
    expect(page).toContain('HomePerfProbe');
    expect(mobileRail).toContain('home_mobile_buyer');
    expect(mobileRail).toContain('home_mobile_investor');
    expect(mobileRail).toContain('home_mobile_luxury');
    expect(mobileRail).toContain('home_mobile_intent_order_v2');
    expect(mobileRail).toContain('matchMedia');
    expect(perfProbe).toContain("entity_name: 'home_perf_probe'");
    expect(perfProbe).toContain("trackEvent('web_vitals_probe'");
    expect(homeVideoCard).not.toContain('srcDoc');
    expect(page).toContain('home_featured_projects_compare');
    expect(page).toContain('home_featured_projects_advisor');
    expect(page).toContain('home_featured_properties_advisor');
    expect(page).toContain('home_hero_primary');
    expect(page).toContain('home_hero_support');
    expect(page).toContain('home_insights_browse_all');
    expect(page).toContain('home_proof_trust_contact');
    expect(page).toContain('home_proof_trust_smart_finder');
    expect(page).toContain('home_reviews_contact');
    expect(page).toContain('home_reviews_smart_finder');
    expect(page).toContain('home_videos_handoff_smart_finder');
    expect(page).toContain('home_videos_contact');
    expect(page).toContain('home_insights_contact');
    expect(page).toContain('home_insights_smart_finder');
    expect(page).toContain('home_proof_trust_valuation');
    expect(page).toContain('home_insights_valuation');
    expect(page).toContain('home_reviews_valuation');
    expect(page).toContain('home_videos_valuation');
    expect(page).toContain('renderProofHandoffBand');
    expect(perfProbe).toContain('amp_home_perf_probe_latest_v1');
    expect(perfProbe).toContain('follow_up_target');
  });

  it('keeps the path selector framed with best-for, outcome, and start cues', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain("Best for");
    expect(page).toContain("Outcome");
    expect(page).toContain("Start:");
    expect(page).toContain('home-intent-card__eyebrow');
    expect(page).toContain('home-intent-card__start');
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
    expect(localMedia).toContain('fetchPriority');
    expect(safeCoverImage).toContain('unoptimized = true');
    expect(personalization).toContain("intent === 'sell'");
    expect(page).toContain('proofSequenceLabels');
    expect(page).toContain('data-home-perf="reviews"');
    expect(page).toContain('Step 1 of 4');
  });
});
