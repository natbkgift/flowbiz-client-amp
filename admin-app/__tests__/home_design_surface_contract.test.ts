import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home design surface contract', () => {
  it('keeps the compressed funnel surfaces and reveal hooks on the home page', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('home-section-kicker');
    expect(page).toContain('home-confidence-row');
    expect(page).toContain('home-trust-layer-grid');
    expect(page).toContain('home-intent-card reveal');
    expect(page).toContain('Luxury condos in Pattaya from 4M');
    expect(page).toContain('Choose the next route by buyer intent');
    expect(page).toContain('home-featured-route-note');
    expect(page).toContain('home-segmentation-note');
  });

  it('keeps home hero and bottom cta class hooks for mobile ergonomics and visual hierarchy', () => {
    const hero = read('components/home/HomeHero.tsx');
    const bottomCta = read('components/home/HomeBottomCta.tsx');

    expect(hero).toContain('hero-cta hero-cta--primary');
    expect(hero).toContain('hero-cta hero-cta--secondary');
    expect(hero).toContain('hero-home-guidance');
    expect(hero).toContain('hero-support-link--pill');

    expect(bottomCta).toContain('home-bottom-cta__grid');
    expect(bottomCta).toContain('home-bottom-cta__actions');
    expect(bottomCta).toContain('home-bottom-cta__panel');
  });

  it('keeps the home globals css selectors that drive mobile polish and motion', () => {
    const css = read('app/globals.css');

    expect(css).toContain('.home-section-kicker');
    expect(css).toContain('.home-confidence-row');
    expect(css).toContain('.home-trust-layer-grid');
    expect(css).toContain('.home-trust-proof-item');
    expect(css).toContain('.home-featured-route-note');
    expect(css).toContain('.home-segmentation-note');
    expect(css).toContain('.home-section-utility');
    expect(css).toContain('.home-section-utility__link');
    expect(css).toContain('.premium-project-card__footer');
    expect(css).toContain('@keyframes home-hero-panel-in');
    expect(css).toContain('@keyframes home-band-in');
    expect(css).toContain('.home-page .home-bottom-cta__actions > a');
    expect(css).toContain('.hero-guided-trigger,');
  });
});
