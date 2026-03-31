import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home design surface contract', () => {
  it('keeps a premium home funnel with hero, route clarity, trust, projects, and a final conversion gate', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('home-section-kicker');
    expect(page).toContain('home-pathways-grid');
    expect(page).toContain('home-pathway-card');
    expect(page).toContain('home-trust-snapshot-grid');
    expect(page).toContain('Pattaya property advice, curated before you browse.');
    expect(page).toContain('Speak to a Pattaya advisor');
    expect(page).toContain('View curated units');
    expect(page).toContain('home_paths_sell');
    expect(page).toContain('Choose your route.');
    expect(page).toContain('Share your brief');
    expect(page).toContain('View all projects');
    expect(page).not.toContain('One brief is enough.');
    expect(page).toContain('home-trust-snapshot__item');
    expect(page).not.toContain('home-pathways-highlight-row');
    expect(page).not.toContain('home-curated-shell__signal-row');
    expect(page).not.toContain('home-confidence-row');
    expect(page).not.toContain('home-pathways-support__link');
    expect(page).not.toContain('Choose the next route by buyer intent');
    expect(page).not.toContain('home-intent-card reveal');
    expect(page).toContain('home-segmentation-note');
  });

  it('keeps home hero and bottom cta class hooks for mobile ergonomics and visual hierarchy', () => {
    const hero = read('components/home/HomeHero.tsx');
    const bottomCta = read('components/home/HomeBottomCta.tsx');

    expect(hero).toContain('hero-cta hero-cta--primary');
    expect(hero).toContain('hero-cta hero-cta--secondary');
    expect(hero).toContain('hero-whatsapp-link');
    expect(hero).toContain('home-hero-slider__controls');
    expect(hero).toContain('AUTOPLAY_MS = 7000');
    expect(hero).toContain('SWIPE_THRESHOLD = 42');

    expect(bottomCta).toContain('home-bottom-cta__grid');
    expect(bottomCta).toContain('home-bottom-cta__actions');
    expect(bottomCta).toContain('home-bottom-cta__panel');
    expect(bottomCta).toContain('home-bottom-cta__benefits');
    expect(bottomCta).toContain('primaryEventPayload');
    expect(bottomCta).toContain('secondaryEventPayload');
  });

  it('keeps the home globals css selectors that drive mobile polish and motion', () => {
    const css = read('app/globals.css');

    expect(css).toContain('.home-section-kicker');
    expect(css).toContain('.home-trust-snapshot-grid');
    expect(css).toContain('.home-trust-snapshot__item');
    expect(css).toContain('.home-section-utility');
    expect(css).toContain('.home-section-utility__link');
    expect(css).toContain('.premium-project-card__signals');
    expect(css).toContain('.premium-project-card__cta');
    expect(css).toContain('.home-bottom-cta__benefits');
    expect(css).toContain('.home-hero-slider__panel');
    expect(css).toContain('.home-hero-slider__controls');
    expect(css).toContain('.home-page .home-bottom-cta__actions > a');
    expect(css).toContain('.hero-cta--primary');
  });
});
