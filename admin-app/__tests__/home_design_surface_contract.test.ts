import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home design surface contract', () => {
  it('keeps the hard-reset four-section funnel and removes the old route selector', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('home-section-kicker');
    expect(page).toContain('home-trust-snapshot-grid');
    expect(page).toContain('Luxury condos in Pattaya from 4M');
    expect(page).toContain('Sea View • High ROI • Foreign Buyer Friendly');
    expect(page).toContain('Availability changes quickly. Start with verified projects, not guesswork.');
    expect(page).toContain('Verified stock, local guidance, and clear next steps from the start.');
    expect(page).toContain('Get current pricing and the shortlist worth seeing now');
    expect(page).toContain('Get Pricing & Shortlist');
    expect(page).toContain('home-trust-snapshot__item');
    expect(page).not.toContain('Choose the next route by buyer intent');
    expect(page).not.toContain('home-intent-card reveal');
    expect(page).not.toContain('home-segmentation-note');
  });

  it('keeps home hero and bottom cta class hooks for mobile ergonomics and visual hierarchy', () => {
    const hero = read('components/home/HomeHero.tsx');
    const bottomCta = read('components/home/HomeBottomCta.tsx');

    expect(hero).toContain('hero-cta hero-cta--primary');
    expect(hero).toContain('hero-cta hero-cta--secondary');
    expect(hero).toContain('hero-whatsapp-link');
    expect(hero).toContain('showGuidedTrigger');

    expect(bottomCta).toContain('home-bottom-cta__grid');
    expect(bottomCta).toContain('home-bottom-cta__actions');
    expect(bottomCta).toContain('home-bottom-cta__panel');
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
    expect(css).toContain('@keyframes home-hero-panel-in');
    expect(css).toContain('@keyframes home-band-in');
    expect(css).toContain('.home-page .home-bottom-cta__actions > a');
    expect(css).toContain('.hero-cta--primary');
  });
});
