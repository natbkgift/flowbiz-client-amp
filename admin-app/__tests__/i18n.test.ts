import { describe, it, expect } from 'vitest';
import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import type { Dictionary } from '@/app/_lib/i18n/types';

/**
 * Verify that EN and TH dictionaries have the exact same shape.
 * This prevents partial translations from being shipped.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe('i18n dictionaries', () => {
  it('EN and TH have the same top-level keys', () => {
    const enKeys = Object.keys(en).sort();
    const thKeys = Object.keys(th).sort();
    expect(enKeys).toEqual(thKeys);
  });

  it('EN and TH have the same nested scalar keys', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);
    const thKeys = collectKeys(th as unknown as Record<string, unknown>);
    expect(enKeys).toEqual(thKeys);
  });

  it('brand.name is a non-empty string in both locales', () => {
    expect(en.brand.name).toBeTruthy();
    expect(th.brand.name).toBeTruthy();
  });

  it('about section has 3 mission cards in both locales', () => {
    expect(en.about.missionCards).toHaveLength(3);
    expect(th.about.missionCards).toHaveLength(3);
  });

  it('about section has 4 why-bullets in both locales', () => {
    expect(en.about.whyBullets).toHaveLength(4);
    expect(th.about.whyBullets).toHaveLength(4);
  });

  it('about section has 3 who-paragraphs in both locales', () => {
    expect(en.about.whoParagraphs).toHaveLength(3);
    expect(th.about.whoParagraphs).toHaveLength(3);
  });

  it('nav has all required keys', () => {
    const requiredNav: (keyof Dictionary['nav'])[] = [
      'home', 'invest', 'buy', 'live', 'projects', 'areaGuide', 'contact',
    ];
    for (const key of requiredNav) {
      expect(en.nav[key]).toBeTruthy();
      expect(th.nav[key]).toBeTruthy();
    }
  });

  it('common.leadForm has all required keys', () => {
    const requiredKeys: (keyof Dictionary['common']['leadForm'])[] = [
      'headingDefault', 'description', 'namePlaceholder', 'emailPlaceholder',
      'phonePlaceholder', 'messagePlaceholder', 'submit', 'submitting',
      'success', 'errorPrefix',
    ];
    for (const key of requiredKeys) {
      expect(en.common.leadForm[key]).toBeTruthy();
      expect(th.common.leadForm[key]).toBeTruthy();
    }
  });

  it('smartFinder has all required keys', () => {
    const requiredKeys: (keyof Dictionary['smartFinder'])[] = [
      'title', 'subtitle', 'steps', 'live', 'flip', 'startOver',
      'riskLabel', 'riskLow', 'riskMedium', 'riskHigh',
      'quotaLabel', 'quotaRequired', 'quotaUnsure', 'quotaNotRequired',
      'resultsTitle', 'viewProject', 'compare', 'noProjects', 'goToProjects',
      'notesTitle', 'notesDescription',
    ];
    for (const key of requiredKeys) {
      expect(en.smartFinder[key]).toBeTruthy();
      expect(th.smartFinder[key]).toBeTruthy();
    }
  });

  it('compare has all required keys', () => {
    const requiredKeys: (keyof Dictionary['compare'])[] = [
      'title', 'getStarted', 'comparisonTable', 'field',
      'priceRange', 'strength', 'weakness', 'riskLevel',
      'backToSmartFinder', 'getInvestmentPlan',
    ];
    for (const key of requiredKeys) {
      expect(en.compare[key]).toBeTruthy();
      expect(th.compare[key]).toBeTruthy();
    }
  });

  it('property has all required keys', () => {
    const requiredKeys: (keyof Dictionary['property'])[] = [
      'nextSteps', 'exploreRelated', 'breadcrumbHome',
      'bedrooms', 'bathrooms', 'sqm', 'exploreMore', 'navigateToKeyPages',
      'highlightsTitle', 'highlightsSubtitle', 'localContextTitle', 'localContextSubtitle', 'shortlistFitTitle', 'shortlistFitSubtitle',
    ];
    for (const key of requiredKeys) {
      expect(en.property[key]).toBeTruthy();
      expect(th.property[key]).toBeTruthy();
    }
  });

  it('area has all required keys', () => {
    const requiredKeys: (keyof Dictionary['area'])[] = [
      'notFound', 'invalidLink', 'backToAreaGuide', 'confidenceTitle', 'confidenceSubtitle', 'processTitle', 'processSubtitle', 'priceTrend',
      'rentalDemand', 'suitableBuyer', 'nextStep',
      'goToSmartFinder', 'browseProjects',
      'fallbackTitle', 'metaDescription', 'avgPrice', 'asOf', 'avgRent', 'roiPercent',
    ];
    for (const key of requiredKeys) {
      expect(en.area[key]).toBeTruthy();
      expect(th.area[key]).toBeTruthy();
    }
  });

  it('listing has all required keys', () => {
    const requiredKeys: (keyof Dictionary['listing'])[] = [
      'filtersAndSort', 'results', 'sort', 'newest',
      'priceLowToHigh', 'priceHighToLow', 'noProperties',
      'view', 'contact', 'listings', 'viewDetails',
      'projectsSubtitle', 'publishedProjects', 'exploreProjectsDesc',
    ];
    for (const key of requiredKeys) {
      expect(en.listing[key]).toBeTruthy();
      expect(th.listing[key]).toBeTruthy();
    }
  });

  it('filters has all required keys', () => {
    const requiredKeys: (keyof Dictionary['filters'])[] = [
      'heading', 'priceRange', 'min', 'max',
      'bedrooms', 'studio', 'area', 'clear', 'close',
    ];
    for (const key of requiredKeys) {
      expect(en.filters[key]).toBeTruthy();
      expect(th.filters[key]).toBeTruthy();
    }
  });

  it('errors has all required keys', () => {
    const requiredKeys: (keyof Dictionary['errors'])[] = [
      'somethingWentWrong', 'unexpectedError', 'tryAgain',
      'pageNotFound', 'pageNotFoundDescription', 'goToHomepage',
      'requestFailed', 'failedToSubmit',
    ];
    for (const key of requiredKeys) {
      expect(en.errors[key]).toBeTruthy();
      expect(th.errors[key]).toBeTruthy();
    }
  });

  it('deepReview has snapshot label keys', () => {
    const requiredKeys: (keyof Dictionary['deepReview'])[] = [
      'avgPriceSnapshot', 'avgRentSnapshot', 'roiPercentSnapshot', 'asOfLabel',
    ];
    for (const key of requiredKeys) {
      expect(en.deepReview[key]).toBeTruthy();
      expect(th.deepReview[key]).toBeTruthy();
    }
  });

  it('areaGuide has area-specific content keys', () => {
    const requiredKeys: (keyof Dictionary['areaGuide'])[] = [
      'confidenceTitle', 'confidenceSubtitle', 'processTitle', 'processSubtitle',
      'centralTitle', 'centralLifestyle', 'centralInvestment',
      'jomtienTitle', 'jomtienLifestyle', 'jomtienInvestment',
      'pratumnakTitle', 'pratumnakLifestyle', 'pratumnakInvestment',
    ];
    for (const key of requiredKeys) {
      expect(en.areaGuide[key]).toBeTruthy();
      expect(th.areaGuide[key]).toBeTruthy();
    }
  });

  it('contact has trust and response copy keys', () => {
    const requiredKeys: (keyof Dictionary['contact'])[] = [
      'title', 'subtitle', 'advisoryTitle', 'advisoryBody', 'formTitle', 'trustTitle', 'responseTitle', 'channelsTitle',
    ];
    for (const key of requiredKeys) {
      expect(en.contact[key]).toBeTruthy();
      expect(th.contact[key]).toBeTruthy();
    }
  });

  it('contact handoff labels stay available in both locales', () => {
    const requiredKeys: (keyof Dictionary['contact']['handoffLabels'])[] = [
      'compare_hero', 'compare_review', 'compare_recovery',
      'shortlist_compare', 'shortlist_contact', 'shortlist_shared',
      'project_detail', 'project_investment_check', 'project_availability_check', 'project_timeout',
      'high', 'medium', 'low',
      'investor_compare', 'shortlist_narrowing', 'project_first_buyer',
    ];
    for (const key of requiredKeys) {
      expect(en.contact.handoffLabels[key]).toBeTruthy();
      expect(th.contact.handoffLabels[key]).toBeTruthy();
    }
  });

  it('shortlist has fallback and recovery copy keys', () => {
    const requiredKeys: (keyof Dictionary['shortlist'])[] = [
      'loadError', 'removeError', 'shareError', 'locationPending', 'sharedUnavailableTitle', 'sharedUnavailableBody',
    ];
    for (const key of requiredKeys) {
      expect(en.shortlist[key]).toBeTruthy();
      expect(th.shortlist[key]).toBeTruthy();
    }
  });

  it('home has featured area and WhatsApp keys', () => {
    const requiredKeys: (keyof Dictionary['home'])[] = [
      'featuredCentralTitle', 'featuredCentralSubtitle',
      'featuredJomtienTitle', 'featuredJomtienSubtitle',
      'featuredPratumnakTitle', 'featuredPratumnakSubtitle',
      'whatsAppGreeting', 'whatsAppFallback',
    ];
    for (const key of requiredKeys) {
      expect(en.home[key]).toBeTruthy();
      expect(th.home[key]).toBeTruthy();
    }
  });

  it('messaging hierarchy has all required global copy groups', () => {
    const valuePropKeys: (keyof Dictionary['messaging']['valueProposition'])[] = [
      'heroEyebrow', 'heroSupportingLine', 'homeHeroTitle', 'homeHeroSubtitle', 'shortlistPromise', 'curatedSetPromise',
    ];
    const ctaKeys: (keyof Dictionary['messaging']['ctaLanguage'])[] = [
      'startShortlist', 'reviewProjects', 'sendBrief', 'speakToAdvisor', 'talkToAdvisoryTeam', 'seeHowAmpWorks', 'useSmartFinder', 'compareOpportunities', 'getInvestmentPlan',
    ];
    const trustKeys: (keyof Dictionary['messaging']['trustLanguage'])[] = ['title', 'proofs', 'summary'];
    const advisoryToneKeys: (keyof Dictionary['messaging']['advisoryTone'])[] = ['teamCtaTitle', 'teamCtaBody', 'teamCtaTrustNote', 'principles'];
    const investmentKeys: (keyof Dictionary['messaging']['investmentLanguage'])[] = ['subtitle', 'yieldFraming', 'riskFraming', 'ownershipFraming', 'timingFraming'];

    for (const key of valuePropKeys) {
      expect(en.messaging.valueProposition[key]).toBeTruthy();
      expect(th.messaging.valueProposition[key]).toBeTruthy();
    }
    for (const key of ctaKeys) {
      expect(en.messaging.ctaLanguage[key]).toBeTruthy();
      expect(th.messaging.ctaLanguage[key]).toBeTruthy();
    }
    for (const key of trustKeys) {
      expect(en.messaging.trustLanguage[key]).toBeTruthy();
      expect(th.messaging.trustLanguage[key]).toBeTruthy();
    }
    for (const key of advisoryToneKeys) {
      expect(en.messaging.advisoryTone[key]).toBeTruthy();
      expect(th.messaging.advisoryTone[key]).toBeTruthy();
    }
    for (const key of investmentKeys) {
      expect(en.messaging.investmentLanguage[key]).toBeTruthy();
      expect(th.messaging.investmentLanguage[key]).toBeTruthy();
    }
  });

  it('common.testimonials has consistent length in both locales', () => {
    expect(en.common.testimonials.length).toBeGreaterThan(0);
    expect(en.common.testimonials.length).toBe(th.common.testimonials.length);
  });

  it('smartFinder has new breadcrumb and score keys', () => {
    expect(en.smartFinder.stepBreadcrumb).toBeTruthy();
    expect(en.smartFinder.scorePrefix).toBeTruthy();
    expect(th.smartFinder.stepBreadcrumb).toBeTruthy();
    expect(th.smartFinder.scorePrefix).toBeTruthy();
  });

  it('area.areas has all 4 area slugs with title and buyerTypes', () => {
    const slugs = ['jomtien', 'pratumnak', 'wongamat', 'central'] as const;
    for (const slug of slugs) {
      expect(en.area.areas[slug].title).toBeTruthy();
      expect(th.area.areas[slug].title).toBeTruthy();
      expect(en.area.areas[slug].buyerTypes.length).toBeGreaterThan(0);
      expect(th.area.areas[slug].buyerTypes.length).toBe(en.area.areas[slug].buyerTypes.length);
    }
  });

  it('brand.shortName exists in both locales', () => {
    expect(en.brand.shortName).toBeTruthy();
    expect(th.brand.shortName).toBeTruthy();
  });

  it('property.galleryPhoto exists in both locales', () => {
    expect(en.property.galleryPhoto).toBeTruthy();
    expect(th.property.galleryPhoto).toBeTruthy();
  });
});
