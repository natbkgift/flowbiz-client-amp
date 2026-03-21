import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('home design surface contract', () => {
  it('keeps section kicker hierarchy and reveal hooks on the home page', () => {
    const page = read('app/(site)/[locale]/page.tsx');

    expect(page).toContain('home-section-kicker');
    expect(page).toContain('home-confidence-row');
    expect(page).toContain('home-intent-card reveal');
    expect(page).toContain('Choose the right path before opening the full inventory');
    expect(page).toContain('Read Pattaya through a market lens built for decisions');
    expect(page).toContain('Editorial signals that reduce guesswork');
  });

  it('keeps home hero and bottom cta class hooks for mobile ergonomics and visual hierarchy', () => {
    const hero = read('components/home/HomeHero.tsx');
    const bottomCta = read('components/home/HomeBottomCta.tsx');

    expect(hero).toContain('hero-cta hero-cta--primary');
    expect(hero).toContain('hero-cta hero-cta--secondary');
    expect(hero).toContain('hero-support-link--pill');

    expect(bottomCta).toContain('home-bottom-cta__grid');
    expect(bottomCta).toContain('home-bottom-cta__actions');
    expect(bottomCta).toContain('home-bottom-cta__panel');
  });

  it('keeps the home globals css selectors that drive mobile polish and motion', () => {
    const css = read('app/globals.css');

    expect(css).toContain('.home-section-kicker');
    expect(css).toContain('.home-confidence-row');
    expect(css).toContain('.home-mobile-intent-rail');
    expect(css).toContain('@keyframes home-hero-panel-in');
    expect(css).toContain('@keyframes home-band-in');
    expect(css).toContain('.home-page .home-bottom-cta__actions > a');
    expect(css).toContain('.hero-guided-trigger,');
  });
});