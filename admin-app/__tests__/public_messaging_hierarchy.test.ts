import { describe, expect, it } from 'vitest';

import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import {
  getPublicAdvisoryTone,
  getPublicInvestmentLanguage,
  getPublicMessagingCtas,
  getPublicMessagingHierarchy,
  getPublicTrustLanguage,
} from '@/app/_lib/public-messaging';

describe('public messaging hierarchy', () => {
  it('promotes the accepted EN home and advisory baseline into one shared hierarchy', () => {
    const messaging = getPublicMessagingHierarchy('en');

    expect(messaging.valueProposition.heroEyebrow).toBe(en.advisory.heroEyebrow);
    expect(messaging.valueProposition.homeHeroTitle).toBe(en.home.heroTitle);
    expect(messaging.valueProposition.homeHeroSubtitle).toBe(en.home.heroSubtitle);
    expect(messaging.ctaLanguage.startShortlist).toBe(en.home.heroPrimaryCta);
    expect(messaging.ctaLanguage.reviewProjects).toBe(en.home.heroSecondaryCta);
    expect(messaging.ctaLanguage.sendBrief).toBe(en.home.premiumCtaPrimary);
    expect(messaging.ctaLanguage.getInvestmentPlan).toBe(en.cta.getInvestmentPlan);
    expect(messaging.trustLanguage.proofs).toEqual(en.advisory.trustBar);
    expect(messaging.advisoryTone.teamCtaBody).toBe(en.advisory.teamCtaBody);
    expect(messaging.investmentLanguage.subtitle).toBe(en.invest.subtitle);
  });

  it('keeps Thai hierarchy aligned and localized without English advisory drift', () => {
    const messaging = getPublicMessagingHierarchy('th');

    expect(messaging.valueProposition.homeHeroTitle).toBe(th.home.heroTitle);
    expect(messaging.ctaLanguage.startShortlist).toBe(th.home.heroPrimaryCta);
    expect(messaging.ctaLanguage.useSmartFinder).toBe(th.advisory.useSmartFinder);
    expect(messaging.ctaLanguage.talkToAdvisoryTeam).toBe(th.advisory.teamCtaPrimary);
    expect(messaging.trustLanguage.proofs).toEqual(th.advisory.trustBar);
    expect(messaging.trustLanguage.summary).not.toContain('Curated');
    expect(messaging.advisoryTone.principles.every((line) => !line.includes('next step'))).toBe(true);
    expect(messaging.investmentLanguage.subtitle).toBe(th.invest.subtitle);
    expect(messaging.investmentLanguage.ownershipFraming).not.toContain('Ownership route');
  });

  it('exposes stable helper accessors for CTA, trust, advisory, and investment bundles', () => {
    expect(getPublicMessagingCtas(en).talkToAdvisoryTeam).toBe(en.advisory.teamCtaPrimary);
    expect(getPublicTrustLanguage(en).proofs).toEqual(en.advisory.trustBar);
    expect(getPublicAdvisoryTone(en).teamCtaTrustNote).toBe(en.advisory.teamCtaTrustNote);
    expect(getPublicInvestmentLanguage(en).riskFraming).toBe(en.invest.riskSubtitle);
  });
});