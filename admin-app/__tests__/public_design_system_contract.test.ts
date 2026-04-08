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
    const foundationSpec = read('../docs/contracts/AMP_UI_FOUNDATION_SPEC_2026-04-08.md');

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
    expect(tokens).toContain('--public-type-h1-size: clamp(2.05rem, 3.2vw, 3.3rem);');
    expect(tokens).toContain('--public-type-h4-size: clamp(1.02rem, 1.18vw, 1.16rem);');
    expect(tokens).toContain('--public-type-body-line: 1.76;');
    expect(tokens).toContain('--public-type-label-track: 0.14em;');
    expect(tokens).toContain('--public-type-flow-paragraph-gap: 16px;');
    expect(tokens).toContain("html[lang='th'] {");
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
    expect(globals).toContain('--type-h4: var(--public-type-h4-size);');
    expect(globals).toContain('font-size: var(--public-type-h1-size);');
    expect(globals).toContain('.container--readable');
    expect(globals).toContain('padding: var(--public-section-space-desktop) 0;');

    expect(primitives).toContain('.type-h1');
    expect(primitives).toContain('.type-caption');
    expect(primitives).toContain('.content-flow > * + *');
    expect(primitives).toContain('.form-helper--muted');
    expect(primitives).toContain('.public-section-header');
    expect(primitives).toContain('.public-surface-card');
    expect(primitives).toContain('.public-chip');
    expect(primitives).toContain('.public-action-row');
    expect(primitives).toContain('.site-header.header');
    expect(primitives).toContain('.site-footer.footer');
    expect(primitives).toContain('.authority-card');
    expect(primitives).toContain('.decision-page--confidence .public-hero__actions .public-hero__action');

    expect(foundationSpec).toContain('## Typography');
    expect(foundationSpec).toContain('## Content Rhythm');
    expect(foundationSpec).toContain('Home final CTA may use an `h2` element with the `type-h1` class');
  });

  it('uses shared public primitives on the home shell, advisory hero, and reusable cards', () => {
    const homePage = read('app/(site)/[locale]/page.tsx');
    const advisoryHero = read('components/public/PublicAdvisoryHero.tsx');
    const homeHero = read('components/home/HomeHero.tsx');
    const homeBottomCta = read('components/home/HomeBottomCta.tsx');
    const homeVideoCard = read('components/home/HomeVideoEmbedCard.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');
    const propertyCard = read('components/cards/PropertyCard.tsx');
    const publicSectionHeader = read('components/public/PublicSectionHeader.tsx');
    const leadForm = read('components/forms/LeadForm.tsx');
    const sellerForm = read('components/forms/SellerForm.tsx');
    const sidebarFilter = read('components/listing/SidebarFilter.tsx');
    const listingGrid = read('components/listing/ListingGrid.tsx');

    expect(homePage).toContain('PublicSectionHeader');
    expect(homePage).toContain('PublicSurfaceCard');
    expect(homePage).toContain('PublicChip');
    expect(homePage).toContain('public-surface-card--interactive');
    expect(homePage).toContain('home-segmentation-note public-surface-card public-surface-card--deep');
    expect(homePage).toContain('home-unit-group public-surface-card public-surface-card--warm');

    expect(advisoryHero).toContain('PublicSurfaceCard');
    expect(advisoryHero).toContain('PublicActionRow');
    expect(advisoryHero).toContain('PublicChip');
    expect(advisoryHero).toContain('type-h1');
    expect(advisoryHero).toContain('type-h4');
    expect(advisoryHero).toContain('btn btn-primary');
    expect(advisoryHero).toContain('btn btn-secondary');
    expect(advisoryHero).toContain('btn btn-tertiary');

    expect(homeHero).toContain('PublicSurfaceCard');
    expect(homeHero).toContain('PublicActionRow');
    expect(homeHero).toContain('hero-cta-row');
    expect(homeHero).toContain('home-hero-slider__panel');
    expect(homeHero).toContain('home-hero-slider__meta-bar');

    expect(homeBottomCta).toContain('type-h1');
    expect(homeBottomCta).toContain('type-body');
    expect(homeBottomCta).toContain('type-caption');

    expect(homeVideoCard).toContain('type-h3');
    expect(homeVideoCard).toContain('type-small');

    expect(featuredProjects).toContain('PublicSectionHeader');
    expect(featuredProjects).toContain('PublicChip');
    expect(featuredProjects).toContain('public-surface-card--interactive');
    expect(featuredProjects).toContain('premium-project-card__footer');

    expect(propertyCard).toContain('PublicSurfaceCard');
    expect(propertyCard).toContain('PublicActionRow');
    expect(propertyCard).toContain('PublicChip');
    expect(propertyCard).toContain('btn btn-primary');

    expect(publicSectionHeader).toContain('typeClassesByHeading');
    expect(publicSectionHeader).toContain('type-label');
    expect(publicSectionHeader).toContain('type-body');

    expect(leadForm).toContain('form-helper form-helper--muted');
    expect(sellerForm).toContain('form-note-box');
    expect(sidebarFilter).toContain('form-label form-label--compact');
    expect(listingGrid).toContain('form-label form-label--compact');
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
