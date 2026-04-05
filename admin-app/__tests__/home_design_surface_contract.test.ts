import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home design surface contract', () => {
  it('keeps a premium home funnel with hero, route clarity, trust, projects, and a final conversion gate', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('PublicSectionHeader');
    expect(page).toContain('PublicSurfaceCard');
    expect(page).toContain('PublicChip');
    expect(page).toContain('home-section-kicker');
    expect(page).toContain('home-pathways-grid');
    expect(page).toContain('home-pathway-card');
    expect(page).toContain('home-trust-snapshot-grid');
    expect(page).toContain('Find the right Pattaya property faster');
    expect(page).toContain('Get My Shortlist');
    expect(page).toContain('Browse Verified Projects');
    expect(page).toContain('home_paths_sell');
    expect(page).toContain('Start with the goal that fits you');
    expect(page).toContain('Better decisions start with better framing');
    expect(page).toContain('Sell or rent out with clearer positioning');
    expect(page).toContain('Tell us what you are looking for');
    expect(page).toContain('Request My Shortlist');
    expect(page).not.toContain('One brief is enough.');
    expect(page).toContain('home-trust-snapshot__item');
    expect(page).not.toContain('home-pathways-highlight-row');
    expect(page).not.toContain('home-curated-shell__signal-row');
    expect(page).not.toContain('home-confidence-row');
    expect(page).not.toContain('home-pathways-support__link');
    expect(page).not.toContain('Choose the next route by buyer intent');
    expect(page).not.toContain('home-intent-card reveal');
    expect(page).toContain('home-segmentation-note');
    expect(page).toContain('home-segmentation-note public-surface-card public-surface-card--deep');
    expect(page).toContain('home-unit-group public-surface-card public-surface-card--warm');
    expect(page).toContain('premium-investment-card__footer');
  });

  it('keeps home hero and bottom cta class hooks for mobile ergonomics and visual hierarchy', () => {
    const hero = read('components/home/HomeHero.tsx');
    const bottomCta = read('components/home/HomeBottomCta.tsx');
    const homePage = read('app/(site)/[locale]/page.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');

    expect(hero).toContain('PublicSurfaceCard');
    expect(hero).toContain('PublicActionRow');
    expect(hero).toContain('hero-cta hero-cta--primary');
    expect(hero).toContain('hero-cta hero-cta--secondary');
    expect(hero).toContain('hero-whatsapp-link');
    expect(hero).toContain('home-hero-slider__trust-list');
    expect(hero).toContain('home-hero-slider__meta-bar');
    expect(hero).toContain('home-hero-slider__controls');
    expect(hero).toContain('AUTOPLAY_MS = 7000');
    expect(hero).toContain('SWIPE_THRESHOLD = 42');

    expect(bottomCta).toContain('PublicSurfaceCard');
    expect(bottomCta).toContain('PublicActionRow');
    expect(bottomCta).toContain('PublicChip');
    expect(bottomCta).toContain('home-bottom-cta__grid');
    expect(bottomCta).toContain('home-bottom-cta__actions');
    expect(bottomCta).toContain('home-bottom-cta__panel');
    expect(bottomCta).toContain('home-bottom-cta__benefits');
    expect(bottomCta).toContain('primaryEventPayload');
    expect(bottomCta).toContain('secondaryEventPayload');

    expect(homePage).not.toContain("priority={group.key === 'sale' && index === 0}");
    expect(homePage).not.toContain("fetchPriority={group.key === 'sale' && index === 0 ? 'high'");
    expect(featuredProjects).not.toContain('priority={index === 0}');
    expect(featuredProjects).not.toContain("fetchPriority={index === 0 ? 'high'");
  });

  it('keeps the public design layer imports, tokens, and primitive selectors that drive mobile polish and motion', () => {
    const rootStyles = read('app/root-styles.ts');
    const publicTokens = read('styles/public-tokens.css');
    const publicPrimitives = read('styles/public-primitives.css');

    expect(rootStyles).toContain("../styles/public-tokens.css");
    expect(rootStyles).toContain("../styles/public-primitives.css");

    expect(publicTokens).toContain('--public-space-1: 8px;');
    expect(publicTokens).toContain('--public-space-9: 96px;');
    expect(publicTokens).toContain('--public-motion-fast: 180ms;');
    expect(publicTokens).toContain('--public-motion-base: 220ms;');
    expect(publicTokens).toContain('--public-font-weight-regular: 400;');
    expect(publicTokens).toContain('--public-font-weight-semibold: 600;');
    expect(publicTokens).toContain('--public-font-weight-bold: 700;');

    expect(publicPrimitives).toContain('.public-section-header');
    expect(publicPrimitives).toContain('.public-surface-card');
    expect(publicPrimitives).toContain('.public-chip');
    expect(publicPrimitives).toContain('.public-action-row');
    expect(publicPrimitives).toContain('.site-header.header');
    expect(publicPrimitives).toContain('.site-footer.footer');
    expect(publicPrimitives).toContain('.home-trust-snapshot');
    expect(publicPrimitives).toContain('.home-pathway-card');
    expect(publicPrimitives).toContain('.home-market-proof');
    expect(publicPrimitives).toContain('.home-bottom-cta__benefits');
    expect(publicPrimitives).toContain('.home-hero-slider__panel');
    expect(publicPrimitives).toContain('.home-hero-slider__meta-bar');
    expect(publicPrimitives).toContain('.home-bottom-cta__panel');
    expect(publicPrimitives).toContain('.decision-page--confidence .public-hero__actions .public-hero__action');
  });
});
