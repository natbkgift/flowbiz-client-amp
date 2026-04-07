import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public design system contract', () => {
  it('registers the public token and primitive layers at the root', () => {
    const rootStyles = read('app/root-styles.ts');
    const tokens = read('styles/public-tokens.css');
    const primitives = read('styles/public-primitives.css');
    const tailwindConfig = read('tailwind.config.ts');
    const globals = read('app/globals.css');

    expect(rootStyles).toContain("../styles/public-tokens.css");
    expect(rootStyles).toContain("../styles/public-primitives.css");

    expect(tokens).toContain('--public-breakpoint-tablet: 768px;');
    expect(tokens).toContain('--public-breakpoint-laptop: 1024px;');
    expect(tokens).toContain('--public-breakpoint-desktop: 1280px;');
    expect(tokens).toContain('--public-container-default: 1440px;');
    expect(tokens).toContain('--public-container-wide: 1680px;');
    expect(tokens).toContain('--public-container-readable: 840px;');
    expect(tokens).toContain('--public-container-gutter-mobile: 24px;');
    expect(tokens).toContain('--public-container-gutter-cinema: 112px;');
    expect(tokens).toContain('--public-grid-columns: 12;');
    expect(tokens).toContain('--public-section-space-desktop: 96px;');
    expect(tokens).toContain('--public-space-1: 8px;');
    expect(tokens).toContain('--public-space-4: 24px;');
    expect(tokens).toContain('--public-space-9: 96px;');
    expect(tokens).toContain('--public-motion-fast: 180ms;');
    expect(tokens).toContain('--public-motion-base: 220ms;');
    expect(tokens).toContain('--public-font-weight-regular: 400;');
    expect(tokens).toContain('--public-font-weight-semibold: 600;');
    expect(tokens).toContain('--public-font-weight-bold: 700;');

    expect(tailwindConfig).toContain("tablet: '768px'");
    expect(tailwindConfig).toContain("laptop: '1024px'");
    expect(tailwindConfig).toContain("desktop: '1280px'");
    expect(tailwindConfig).toContain("'public-content': 'var(--public-container-default)'");
    expect(tailwindConfig).toContain("'public-wide': 'var(--public-container-wide)'");
    expect(tailwindConfig).toContain("'public-readable': 'var(--public-container-readable)'");

    expect(globals).toContain('--maxw: var(--public-container-default);');
    expect(globals).toContain('--maxw-wide: var(--public-container-wide);');
    expect(globals).toContain('--maxw-readable: var(--public-container-readable);');
    expect(globals).toContain('.container--readable');
    expect(globals).toContain('padding: var(--public-section-space-desktop) 0;');

    expect(primitives).toContain('.public-section-header');
    expect(primitives).toContain('.public-surface-card');
    expect(primitives).toContain('.public-chip');
    expect(primitives).toContain('.public-action-row');
    expect(primitives).toContain('.site-header.header');
    expect(primitives).toContain('.site-footer.footer');
    expect(primitives).toContain('.authority-card');
    expect(primitives).toContain('.decision-page--confidence .public-hero__actions .public-hero__action');
  });

  it('uses shared public primitives on the home shell, advisory hero, and reusable cards', () => {
    const homePage = read('app/(site)/[locale]/page.tsx');
    const advisoryHero = read('components/public/PublicAdvisoryHero.tsx');
    const homeHero = read('components/home/HomeHero.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');
    const propertyCard = read('components/cards/PropertyCard.tsx');

    expect(homePage).toContain('PublicSectionHeader');
    expect(homePage).toContain('PublicSurfaceCard');
    expect(homePage).toContain('PublicChip');
    expect(homePage).toContain('public-surface-card--interactive');
    expect(homePage).toContain('home-segmentation-note public-surface-card public-surface-card--deep');
    expect(homePage).toContain('home-unit-group public-surface-card public-surface-card--warm');

    expect(advisoryHero).toContain('PublicSurfaceCard');
    expect(advisoryHero).toContain('PublicActionRow');
    expect(advisoryHero).toContain('PublicChip');
    expect(advisoryHero).toContain('btn btn-primary');
    expect(advisoryHero).toContain('btn btn-secondary');
    expect(advisoryHero).toContain('btn btn-tertiary');

    expect(homeHero).toContain('PublicSurfaceCard');
    expect(homeHero).toContain('PublicActionRow');
    expect(homeHero).toContain('hero-cta-row');
    expect(homeHero).toContain('home-hero-slider__panel');
    expect(homeHero).toContain('home-hero-slider__meta-bar');

    expect(featuredProjects).toContain('PublicSectionHeader');
    expect(featuredProjects).toContain('PublicChip');
    expect(featuredProjects).toContain('public-surface-card--interactive');
    expect(featuredProjects).toContain('premium-project-card__footer');

    expect(propertyCard).toContain('PublicSurfaceCard');
    expect(propertyCard).toContain('PublicActionRow');
    expect(propertyCard).toContain('PublicChip');
    expect(propertyCard).toContain('btn btn-primary');
  });

  it('keeps decision detail routes on the shared public hero system', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const propertyDetail = read('app/(site)/[locale]/property/[slug]/page.tsx');

    expect(projectDetail).toContain('PublicAdvisoryHero');
    expect(projectDetail).toContain('decision-page--project');
    expect(projectDetail).toContain('decision-page--confidence');

    expect(propertyDetail).toContain('PublicAdvisoryHero');
    expect(propertyDetail).toContain('decision-page--property');
  });
});
