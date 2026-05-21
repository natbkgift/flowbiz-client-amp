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
    const siteLocaleLayout = read('app/(site)/[locale]/layout.tsx');
    const sharedTokens = read('components/public-system/tokens/publicUiTokens.ts');
    const sectionPrimitive = read('components/public-system/primitives/Section.tsx');
    const cardBasePrimitive = read('components/public-system/primitives/CardBase.tsx');
    const buttonComponent = read('components/public-system/components/Button.tsx');
    const sectionHeaderComponent = read('components/public-system/components/SectionHeader.tsx');

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
    expect(tokens).toContain('--public-panel-padding-fluid: clamp(20px, 3vw, 36px);');
    expect(tokens).toContain('--public-radius-panel: 22px;');
    expect(tokens).toContain('--public-surface-panel-showcase:');
    expect(tokens).toContain('--public-shadow-showcase: 0 42px 94px rgba(3, 8, 18, 0.34);');
    expect(tokens).toContain('--public-control-height: 44px;');
    expect(tokens).toContain('--public-field-border-focus: rgba(10, 77, 140, 0.28);');
    expect(tokens).toContain('--public-cta-row-gap: var(--public-space-3);');
    expect(tokens).toContain('--public-pattern-split-gap: clamp(40px, 5vw, 64px);');
    expect(tokens).toContain("html[lang='th'] {");
    expect(tokens).toContain('--public-space-1: 8px;');
    expect(tokens).toContain('--public-space-4: 24px;');
    expect(tokens).toContain('--public-space-9: 96px;');
    expect(tokens).toContain('--public-color-bone: #f8f4ea;');
    expect(tokens).toContain('--public-color-ink: #14201f;');
    expect(tokens).toContain('--public-color-teal: #0e3a3a;');
    expect(tokens).toContain('--public-color-coral: #d96a4e;');
    expect(tokens).toContain('--public-color-champagne: #c9a677;');
    expect(tokens).toContain('--public-radius-lg: 16px;');
    expect(tokens).toContain('--public-shadow-claude-card:');
    expect(tokens).toContain('--public-type-display-family: var(--font-serif)');
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
    expect(globals).toContain('.detail-stack--readable');
    expect(globals).toContain('padding: var(--public-panel-padding-fluid);');
    expect(globals).toContain('border-radius: var(--public-radius-showcase);');
    expect(globals).toContain('box-shadow: var(--public-shadow-showcase);');
    expect(globals).toContain('outline: var(--public-control-focus-outline);');
    expect(globals).toContain('gap: var(--public-cta-row-gap);');
    expect(globals).toContain('min-height: var(--public-field-min-height);');
    expect(globals).toContain('box-shadow: var(--public-field-shadow-focus);');
    expect(globals).toContain('.pattern-split-grid');
    expect(globals).toContain('.pattern-inline-controls');
    expect(globals).toContain('.pattern-mobile-bar');
    expect(globals).toContain('padding: var(--public-section-space-desktop) 0;');

    expect(primitives).toContain('.type-h1');
    expect(primitives).toContain('.type-caption');
    expect(primitives).toContain('.content-flow > * + *');
    expect(primitives).toContain('.form-helper--muted');
    expect(primitives).toContain('gap: var(--public-stack-gap-compact);');
    expect(primitives).toContain('padding: var(--public-hero-content-padding);');
    expect(primitives).toContain('background: var(--public-surface-signal);');
    expect(primitives).toContain('.btn-cta');
    expect(primitives).toContain('.public-section-header');
    expect(primitives).toContain('.public-site-shell');
    expect(primitives).toContain('.public-site-shell .btn-cta');
    expect(primitives).toContain('.public-site-shell .mobile-cta');
    expect(primitives).toContain('.public-surface-card');
    expect(primitives).toContain('.public-chip');
    expect(primitives).toContain('.public-action-row');
    expect(primitives).toContain('.site-header.header');
    expect(primitives).toContain('.site-footer.footer');
    expect(primitives).toContain('.authority-card');
    expect(primitives).toContain('.decision-page--confidence .public-hero__actions .public-hero__action');

    expect(sharedTokens).toContain('publicSectionToneClassNames');
    expect(sharedTokens).toContain('publicGridColumnClassNames');
    expect(sharedTokens).toContain('publicButtonVariantClassNames');
    expect(sharedTokens).toContain('getPublicButtonClassName');
    expect(sectionPrimitive).toContain("container = 'default'");
    expect(sectionPrimitive).toContain('publicSectionToneClassNames[tone]');
    expect(cardBasePrimitive).toContain("'public-surface-card'");
    expect(cardBasePrimitive).toContain('publicCardPaddingClassNames[padding]');
    expect(buttonComponent).toContain('getPublicButtonClassName');
    expect(buttonComponent).toContain("<Link className={resolvedClassName}");
    expect(sectionHeaderComponent).toContain("'public-section-header'");
    expect(sectionHeaderComponent).toContain('section-title');
    expect(sectionHeaderComponent).toContain('section-subtitle');
    expect(siteLocaleLayout).toContain('className="public-site-shell"');

    expect(foundationSpec).toContain('## Typography');
    expect(foundationSpec).toContain('## Content Rhythm');
    expect(foundationSpec).toContain('## Surface And Elevation');
    expect(foundationSpec).toContain('## Controls And CTA Hierarchy');
    expect(foundationSpec).toContain('## Responsive Component Patterns');
    expect(foundationSpec).toContain('## Page Templates And Implementation Rules');
    expect(foundationSpec).toContain('Home final CTA may use an `h2` element with the `type-h1` class');
    expect(foundationSpec).toContain('Long-form routes that keep a supporting rail may keep the outer section shell at `default`, but the narrative column itself should still respect the readable measure.');
  });

  it('uses shared public primitives on the home shell, advisory hero, and reusable cards', () => {
    const homePage = read('app/(site)/[locale]/page.tsx');
    const advisoryHero = read('components/public/PublicAdvisoryHero.tsx');
    const homeHero = read('components/home/HomeHero.tsx');
    const homeBottomCta = read('components/home/HomeBottomCta.tsx');
    const homeVideoCard = read('components/home/HomeVideoEmbedCard.tsx');
    const featuredProjects = read('components/home/FeaturedProjects.tsx');
    const projectCard = read('components/project/ProjectCard.tsx');
    const propertyCard = read('components/cards/PropertyCard.tsx');
    const publicSectionHeader = read('components/public/PublicSectionHeader.tsx');
    const publicActionRow = read('components/public/PublicActionRow.tsx');
    const publicSurfaceCard = read('components/public/PublicSurfaceCard.tsx');
    const canonicalSectionHeader = read('components/public-system/components/SectionHeader.tsx');
    const leadForm = read('components/forms/LeadForm.tsx');
    const sellerForm = read('components/forms/SellerForm.tsx');
    const sidebarFilter = read('components/listing/SidebarFilter.tsx');
    const listingGrid = read('components/listing/ListingGrid.tsx');
    const stickyMobileCta = read('components/ux/StickyMobileCTA.tsx');
    const pageOwnedMobileCta = read('components/ux/PageOwnedMobileCTA.tsx');

    expect(homePage).toContain('PublicSectionHeader');
    expect(homePage).toContain('PublicSurfaceCard');
    expect(homePage).toContain('PublicChip');
    expect(homePage).toContain('public-surface-card--interactive');
    expect(homePage).toContain('function HomeTrustStripSection()');
    expect(homePage).toContain('home-pathways-support__link');
    expect(homePage).toContain('showTrustStripSection');
    expect(homePage).not.toContain('home-market-shell__signal-row');
    expect(homePage).not.toContain('home-market-proof__footer');
    expect(homePage).not.toContain('home-trust-module__signal-row');

    expect(advisoryHero).toContain('PublicSurfaceCard');
    expect(advisoryHero).toContain('PublicActionRow');
    expect(advisoryHero).toContain('PublicChip');
    expect(advisoryHero).toContain('type-h1');
    expect(advisoryHero).toContain('type-h4');
    expect(advisoryHero).toContain('getPublicButtonClassName');
    expect(advisoryHero).toContain("variant: 'primary'");
    expect(advisoryHero).toContain("variant: 'secondary'");
    expect(advisoryHero).toContain("variant: 'tertiary'");

    expect(homeHero).toContain('PublicSurfaceCard');
    expect(homeHero).toContain('PublicActionRow');
    expect(homeHero).toContain('hero-cta-row');
    expect(homeHero).toContain('home-hero-slider__panel');
    expect(homeHero).toContain('home-hero-slider__meta-bar');
    expect(homeHero).toContain('getPublicButtonClassName');

    expect(homeBottomCta).toContain('type-h1');
    expect(homeBottomCta).toContain('type-body');
    expect(homeBottomCta).toContain('type-caption');
    expect(homeBottomCta).toContain('className="home-bottom-cta__panel"');
    expect(homeBottomCta).toContain('pattern-split-grid');
    expect(homeBottomCta).toContain('getPublicButtonClassName');
    expect(homeBottomCta).not.toContain('rounded-2xl');
    expect(homeBottomCta).not.toContain('shadow-2xl');
    expect(homeBottomCta).not.toContain('p-5 md:p-8');

    expect(homeVideoCard).toContain('type-h3');
    expect(homeVideoCard).toContain('type-small');

    expect(featuredProjects).toContain('PublicSectionHeader');
    expect(featuredProjects).toContain('ProjectCard');
    expect(projectCard).toContain('PublicChip');
    expect(projectCard).toContain('LocalMediaImage');
    expect(projectCard).toContain('public-surface-card--interactive');
    expect(projectCard).toContain('premium-project-card__footer');

    expect(propertyCard).toContain('PublicSurfaceCard');
    expect(propertyCard).toContain('PublicActionRow');
    expect(propertyCard).toContain('PublicChip');
    expect(propertyCard).toContain('SafeCoverImage');
    expect(propertyCard).toContain('<Button');
    expect(propertyCard).toContain('variant="primary"');
    expect(propertyCard).toContain('property-card__signals');
    expect(propertyCard).toContain('property-card__media-chip--signal');

    expect(publicSectionHeader).toContain('SectionHeader as PublicSectionHeader');
    expect(publicActionRow).toContain('CTAGroup as PublicActionRow');
    expect(publicSurfaceCard).toContain('CardBase as PublicSurfaceCard');
    expect(canonicalSectionHeader).toContain('variant="label"');
    expect(canonicalSectionHeader).toContain('variant="body"');

    expect(leadForm).toContain('form-helper form-helper--muted');
    expect(sellerForm).toContain('form-note-box');
    expect(sidebarFilter).toContain('form-label form-label--compact');
    expect(listingGrid).toContain('form-label form-label--compact');
    expect(listingGrid).toContain('pattern-inline-controls');
    expect(listingGrid).toContain('PublicChip');
    expect(listingGrid).toContain('results-header__summary-chips');
    expect(listingGrid).toContain('PublicSurfaceCard');
    expect(listingGrid).toContain('PublicActionRow');
    expect(listingGrid).toContain('listing-guidance-card');
    expect(sidebarFilter).toContain('filter-sidebar__summary');
    expect(sidebarFilter).toContain('listing-filter-backdrop');
    expect(stickyMobileCta).toContain('pattern-mobile-bar');
    expect(pageOwnedMobileCta).toContain('pattern-mobile-bar');
  });

  it('aligns buy, projects, and contact routes to the shared public system', () => {
    const buyPage = read('app/(site)/[locale]/buy/page.tsx');
    const projectsPage = read('app/(site)/[locale]/projects/page.tsx');
    const contactPage = read('app/(site)/[locale]/contact/page.tsx');

    expect(buyPage).toContain("from '@/components/public-system/components/Button'");
    expect(buyPage).toContain("from '@/components/public-system/components/Card'");
    expect(buyPage).toContain("from '@/components/public-system/components/SectionHeader'");
    expect(buyPage).toContain("from '@/components/public-system/primitives/Section'");
    expect(buyPage).toContain("from '@/components/public-system/primitives/Grid'");
    expect(buyPage).toContain("from '@/components/public-system/primitives/CardBase'");

    expect(projectsPage).toContain("from '@/app/_lib/local-media'");
    expect(projectsPage).toContain("from '@/components/project/ProjectCard'");
    expect(projectsPage).toContain("from '@/components/public-system/components/Button'");
    expect(projectsPage).toContain("from '@/components/public-system/components/CTAGroup'");
    expect(projectsPage).toContain("from '@/components/public-system/primitives/Section'");
    expect(projectsPage).toContain("from '@/components/public-system/patterns/SectionIntroBlock'");
    expect(projectsPage).toContain('project-catalogue-toolbar');
    expect(projectsPage).toContain('ProjectCard');
    expect(projectsPage).toContain('pickRenderableLocalMedia');

    expect(contactPage).toContain("from '@/components/public-system/components/Button'");
    expect(contactPage).toContain("from '@/components/public-system/components/CTAGroup'");
    expect(contactPage).toContain("from '@/components/public-system/primitives/CardBase'");
    expect(contactPage).toContain("from '@/components/public-system/primitives/Section'");
    expect(contactPage).toContain("from '@/components/public-system/patterns/SectionIntroBlock'");
    expect(contactPage).toContain('className="contact-page decision-page--confidence"');
  });

  it('extends the Phase 2 public shell across conversion routes without leaving the public scope', () => {
    const primitives = read('styles/public-primitives.css');
    const projectsPage = read('app/(site)/[locale]/projects/page.tsx');
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const listingGrid = read('components/listing/ListingGrid.tsx');
    const contactPage = read('app/(site)/[locale]/contact/page.tsx');
    const buyPage = read('app/(site)/[locale]/buy/page.tsx');

    expect(primitives).toContain('Claude public shell phase 2');
    expect(primitives).toContain('.public-site-shell .project-catalogue-toolbar');
    expect(primitives).toContain('.public-site-shell .projects-page .premium-project-card');
    expect(primitives).toContain('.public-site-shell .buy-page .property-card');
    expect(primitives).toContain('.public-site-shell .contact-page .contact-form-shell .inquiry-form');
    expect(primitives).toContain('.public-site-shell .decision-page--project .project-gallery');
    expect(primitives).toContain('.public-site-shell .decision-page--confidence .public-hero__action--primary');

    expect(projectsPage).toContain('ProjectCard');
    expect(projectsPage).toContain('buildProjectMedia');
    expect(projectsPage).not.toContain('project-catalogue-card__visual');
    expect(projectDetail).toContain('project-gallery__status');
    expect(listingGrid).toContain('PropertyCard');
    expect(contactPage).toContain('contact-form-shell');
    expect(buyPage).toContain('buy-closing-cta-panel');
  });

  it('extends the Phase 3B shell to property, rent, sell, shortlist, compare, and homepage cleanup surfaces', () => {
    const primitives = read('styles/public-primitives.css');
    const homePage = read('app/(site)/[locale]/page.tsx');
    const propertyDetail = read('app/(site)/[locale]/property/[slug]/page.tsx');
    const rentPage = read('app/(site)/[locale]/rent/page.tsx');
    const sellPage = read('app/(site)/[locale]/sell/page.tsx');

    expect(primitives).toContain('Claude public shell phase 3B');
    expect(primitives).toContain('.public-site-shell .rent-page .property-card');
    expect(primitives).toContain('.public-site-shell .decision-page--property .property-gallery');
    expect(primitives).toContain('.public-site-shell .decision-page--shortlist .shortlist-item-card');
    expect(primitives).toContain('.public-site-shell .decision-page--compare .compare-table-card');
    expect(primitives).toContain('.public-site-shell .sell-page .inquiry-form');
    expect(primitives).toContain('.public-site-shell .home-page .home-owner-card');

    expect(homePage).toContain('HomeOwnerBridgeSection');
    expect(homePage).toContain('home-trust-strip-section home-trust-layer-section');
    expect(homePage).toContain('secondaryLabel={bottomCtaSecondaryLabel}');
    expect(homePage).toContain("['owner_bridge', 6]");

    expect(propertyDetail).toContain('PageOwnedMobileCTA');
    expect(propertyDetail).toContain('property-gallery__status');
    expect(rentPage).toContain('ListingGrid');
    expect(sellPage).toContain('SellerForm');
  });

  it('keeps undecided listing prompts on shared surface and action primitives with Smart Finder handoff', () => {
    const listingGrid = read('components/listing/ListingGrid.tsx');
    const globals = read('app/globals.css');

    expect(listingGrid).toContain('withLocaleQuery(locale, \'/smart-finder\'');
    expect(listingGrid).toContain('listing_broad_results');
    expect(listingGrid).toContain('listing_no_results');
    expect(listingGrid).toContain('PublicSurfaceCard');
    expect(listingGrid).toContain('PublicActionRow');

    expect(globals).toContain('.listing-guidance-card');
    expect(globals).toContain('.listing-guidance-card__actions');
    expect(globals).toContain('.listing-guidance-card--empty .listing-guidance-card__list .insight-list__item');
  });

  it('keeps shortlist conversion guidance on shared surface, action, chip, and section primitives', () => {
    const shortlistListSurface = read('components/shortlist/ShortlistListSurface.tsx');
    const globals = read('app/globals.css');

    expect(shortlistListSurface).toContain('PublicSurfaceCard');
    expect(shortlistListSurface).toContain('PublicActionRow');
    expect(shortlistListSurface).toContain('PublicSectionHeader');
    expect(shortlistListSurface).toContain('PublicChip');
    expect(shortlistListSurface).toContain('SafeCoverImage');
    expect(shortlistListSurface).toContain('shortlist-conversion-pack');
    expect(shortlistListSurface).toContain('compareIds: compareReady ? compareProjectIds : undefined');

    expect(globals).toContain('.shortlist-surface__summary-signals');
    expect(globals).toContain('.shortlist-conversion-pack');
    expect(globals).toContain('.shortlist-conversion-card');
    expect(globals).toContain('.shortlist-conversion-card--handoff .insight-list__item');
  });

  it('keeps decision detail routes on the shared public hero system', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const propertyDetail = read('app/(site)/[locale]/property/[slug]/page.tsx');

    expect(projectDetail).toContain('PublicAdvisoryHero');
    expect(projectDetail).toContain('decision-page--project');
    expect(projectDetail).toContain('decision-page--confidence');

    expect(propertyDetail).toContain('PublicAdvisoryHero');
    expect(propertyDetail).toContain('SafeCoverImage');
    expect(propertyDetail).toContain('decision-page--property');
  });

  it('keeps the project hero anchored on a decision-led summary above the gallery', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(projectDetail).toContain('subtitle={projectHeroSubtitle}');
    expect(projectDetail).toContain('signals={projectHeroSignals}');
    expect(projectDetail).toContain('project-confidence-pack--topline');
    expect(projectDetail).toContain('className="insight-list project-confidence-facts mt-3"');
    expect(projectDetail.indexOf('project-confidence-pack--topline')).toBeLessThan(projectDetail.indexOf('project-gallery mt-6 reveal'));

    expect(primitives).toContain('.decision-page--project .project-confidence-pack--topline');
    expect(primitives).toContain('.decision-page--project .project-confidence-fact');
    expect(primitives).toContain('.decision-page--project .public-hero__subtitle');
  });

  it('keeps the project page why-this-project layer on shared section and card primitives', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(projectDetail).toContain('PublicSectionHeader');
    expect(projectDetail).toContain('id="project-why-framework"');
    expect(projectDetail).toContain('className="signal-grid signal-grid--three-up project-why-grid"');
    expect(projectDetail).toContain('className="project-use-case-list mt-3"');
    expect(projectDetail).toContain('className="insight-list mt-3 project-investment-framing-list"');

    expect(primitives).toContain('.decision-page--project .project-why-framework');
    expect(primitives).toContain('.decision-page--project .project-why-card');
    expect(primitives).toContain('.decision-page--project .project-use-case-item');
  });

  it('keeps the project page unit inventory layer on the existing property-card and shared section primitives', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(projectDetail).toContain('fetchProperties({ limit: 6, sort: \'newest\', project_id: project.id })');
    expect(projectDetail).toContain('PropertyCard');
    expect(projectDetail).toContain('id="project-unit-inventory"');
    expect(projectDetail).toContain('className="signal-grid signal-grid--three-up project-unit-inventory-grid"');
    expect(projectDetail).toContain('className="cta-strip project-unit-inventory-empty"');

    expect(primitives).toContain('.decision-page--project .project-unit-inventory');
    expect(primitives).toContain('.decision-page--project .project-unit-summary-card');
    expect(primitives).toContain('.decision-page--project .project-unit-inventory-grid .property-card');
  });

  it('keeps the project CTA hierarchy on owned handoff and the page-owned mobile bar', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(projectDetail).toContain('PageOwnedMobileCTA');
    expect(projectDetail).toContain('title={projectDecisionCta.title}');
    expect(projectDetail).toContain('description={projectMobileDescription}');
    expect(projectDetail).toContain('project_self_serve_secondary');
    expect(projectDetail).toContain('className="card-actions project-cta-row project-unit-summary-actions mt-3"');
    expect(projectDetail).toContain('className="card-actions project-cta-row project-decision-lens-actions mt-3"');
    expect(projectDetail).toContain('className="card-actions project-cta-row project-next-steps-actions mt-3"');

    expect(primitives).toContain('.decision-page--project .project-cta-row');
    expect(primitives).toContain('.decision-page--project .project-cta-row > .btn-tertiary');
  });

  it('keeps the project gallery on renderable local media plus an explicit fallback status layer', () => {
    const projectDetail = read('app/(site)/[locale]/projects/[slug]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(projectDetail).toContain('resolveRenderableLocalMediaPath');
    expect(projectDetail).toContain('buildRenderableProjectMedia(project)');
    expect(projectDetail).toContain('id="project-gallery-section"');
    expect(projectDetail).toContain('id="project-gallery-status"');
    expect(projectDetail).toContain('fallbackSrc="/images/project-overview.png"');

    expect(primitives).toContain('.decision-page--project .project-gallery__lead-meta');
    expect(primitives).toContain('.decision-page--project .project-gallery__status');
    expect(primitives).toContain('.decision-page--project .project-gallery__status-list .insight-list__item');
  });

  it('locks audited route container intent for narrative and inventory shells', () => {
    const blogArticle = read('app/(site)/[locale]/blog/[slug]/page.tsx');
    const aboutPage = read('app/(site)/[locale]/about/page.tsx');
    const howWeWorkPage = read('app/(site)/[locale]/how-we-work/page.tsx');
    const termsPage = read('app/(site)/[locale]/terms/page.tsx');
    const privacyPage = read('app/(site)/[locale]/privacy/page.tsx');
    const buyPage = read('app/(site)/[locale]/buy/page.tsx');
    const rentPage = read('app/(site)/[locale]/rent/page.tsx');
    const sellPage = read('app/(site)/[locale]/sell/page.tsx');
    const projectsPage = read('app/(site)/[locale]/projects/page.tsx');

    expect(blogArticle).toContain('detail-stack detail-stack--readable');
    expect(blogArticle.match(/variant="readable"/g)?.length).toBe(1);
    expect(blogArticle).toContain('page-template--narrative');

    expect(aboutPage.match(/variant="readable"/g)?.length).toBe(2);
    expect(aboutPage).toContain('page-template--narrative');
    expect(howWeWorkPage.match(/variant="readable"/g)?.length).toBe(2);
    expect(howWeWorkPage).toContain('page-template--narrative');
    expect(termsPage.match(/variant="readable"/g)?.length).toBe(2);
    expect(termsPage).toContain('page-template--narrative');
    expect(privacyPage.match(/variant="readable"/g)?.length).toBe(2);
    expect(privacyPage).toContain('page-template--narrative');

    expect((buyPage.match(/(container|variant)="wide"/g) ?? []).length).toBe(6);
    expect(buyPage).toContain('page-template--catalogue');
    expect(rentPage.match(/variant="wide"/g)?.length).toBe(6);
    expect(rentPage).toContain('page-template--catalogue');
    expect(rentPage).toContain('PublicAdvisoryHero');
    expect(rentPage).toContain('decision-page--confidence');
    expect(sellPage).toContain('page-template--narrative');
    expect(sellPage).toContain('PublicAdvisoryHero');
    expect(sellPage).toContain('decision-page--confidence');
    expect((projectsPage.match(/(container|variant)="wide"/g) ?? []).length).toBe(2);
    expect(projectsPage).toContain('page-template--catalogue');
  });


  it('keeps the home funnel sequenced around paths, curated stock, trust, and conversion', () => {
    const homePage = read('app/(site)/[locale]/page.tsx');
    const renderStart = homePage.indexOf('return (\n    <main');
    const renderBody = renderStart >= 0 ? homePage.slice(renderStart) : homePage;

    expect(homePage).toMatch(/const defaultSectionOrder = \[\s*'hero',\s*'pathways',\s*'trust_micro_strip',\s*'featured_projects',\s*'why_pattaya',\s*'owner_bridge',\s*'bottom_cta',\s*\]/);
    expect(homePage).toContain("['trust_micro_strip', 3]");
    expect(homePage).toContain("['featured_projects', 4]");
    expect(homePage).toContain("['why_pattaya', 5]");
    expect(homePage).toContain("['owner_bridge', 6]");
    expect(homePage).toContain("['pathways', 2]");
    expect(homePage).not.toContain('function HomeOwnerAdvisorySection()');
    expect(homePage).not.toContain('function HomeTeamCtaSection()');

    expect(renderBody.indexOf('HomePathwaysSection')).toBeLessThan(renderBody.indexOf('HomeCuratedOpportunitiesSection'));
    expect(renderBody.indexOf('HomeTrustStripSection')).toBeLessThan(renderBody.indexOf('HomeCuratedOpportunitiesSection'));
    expect(renderBody.indexOf('HomeCuratedOpportunitiesSection')).toBeLessThan(renderBody.indexOf('HomeMarketClaritySection'));
    expect(renderBody.indexOf('HomeMarketClaritySection')).toBeLessThan(renderBody.indexOf('HomeOwnerBridgeSection'));
    expect(renderBody.indexOf('HomeOwnerBridgeSection')).toBeLessThan(renderBody.indexOf('HomeBottomCta'));
    expect(homePage).toContain('homeUnitGroups');
    expect(homePage).toContain('home-segmentation-note');
    expect(homePage).toContain('home-unit-group');
    expect(homePage).toContain('home_curated_unit_group');
    expect(homePage).toContain('<PropertyCard key={property.id} item={property} dict={dict} locale={locale} />');
    expect(renderBody).not.toContain('id="home-proof-process"');
  });

  it('keeps Phase 3C homepage IA fixes scoped to the public shell', () => {
    const primitives = read('styles/public-primitives.css');

    expect(primitives).toContain('Phase 3C: homepage IA stabilization');
    expect(primitives).toContain('.public-site-shell .home-page .home-unit-group__grid');
    expect(primitives).toContain('.public-site-shell .home-page .home-owner-section');
    expect(primitives).toContain('.public-site-shell .home-page .home-bottom-cta');
    expect(primitives).toContain('padding-bottom: clamp(12px, 2vw, 20px);');
    expect(primitives).toContain('padding-top: clamp(32px, 4vw, 48px);');
  });

  it('keeps the home trust layer anchored on the lighter trust strip instead of proof/process blocks', () => {
    const homePage = read('app/(site)/[locale]/page.tsx');
    const primitives = read('styles/public-primitives.css');

    expect(homePage).toContain('title={dict.home.trustTitle}');
    expect(homePage).toContain('subtitle={dict.home.trustSubtitle}');
    expect(homePage).toContain('className="home-trust-snapshot-grid mt-8"');
    expect(homePage).not.toContain('className="home-trust-proof-list"');
    expect(homePage).not.toContain('className="home-trust-process-list"');
    expect(homePage).not.toContain('className="home-trust-review-stack"');
    expect(homePage).not.toContain("cta: 'home_trust_secondary'");
    expect(homePage).not.toContain("cta: 'home_market_primary'");
    expect(homePage).not.toContain("cta: 'home_market_secondary'");

    expect(primitives).toContain('.home-trust-snapshot');
    expect(primitives).toContain('.home-trust-snapshot-grid');
  });
});
