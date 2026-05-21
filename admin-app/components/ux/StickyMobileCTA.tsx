'use client';

import { usePathname } from 'next/navigation';

import { TrackedLink } from '@/components/analytics/TrackedLink';

import { getPublicCtaSurface, shouldRenderStickyMobileCta } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';

export function StickyMobileCTA() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;
  const shouldRender = shouldRenderStickyMobileCta(pathname);
  const isHomeSurface = getPublicCtaSurface(pathname) === 'home';

  if (!shouldRender) {
    return null;
  }

  const primaryHref = isHomeSurface
    ? withLocale(locale, '/contact?topic=consultation&source=home_mobile_sticky_primary')
    : withLocale(locale, '/contact?topic=private_tour');
  const secondaryHref = isHomeSurface
    ? withLocale(locale, '/projects?source=home_mobile_sticky_secondary')
    : withLocale(locale, '/contact?topic=investment_plan');
  const primaryLabel = isHomeSurface ? dict.home.heroPrimaryCta : dict.cta.bookPrivateTour;
  const secondaryLabel = isHomeSurface ? dict.home.heroSecondaryCta : dict.cta.getInvestmentPlan;
  const source = isHomeSurface ? 'home_mobile_sticky' : 'mobile_sticky';

  return (
    <div
      className="mobile-cta mobile-cta--visible pattern-mobile-bar"
      role="region"
      aria-label={dict.common.ctaRegion}
    >
      <div className="mobile-cta__meta">
        <p className="mobile-cta__title">{dict.common.ctaRegion}</p>
      </div>
      <div className="mobile-cta__actions pattern-mobile-bar__actions">
        <div className="mobile-cta__primary">
          <TrackedLink
            className="btn btn-cta mobile-cta__btn mobile-cta__btn--primary pattern-mobile-bar__btn"
            href={primaryHref}
            prefetch={false}
            eventType="cta_click"
            eventPayload={{ cta: isHomeSurface ? 'request_shortlist' : 'book_private_tour', from: source }}
          >
            {primaryLabel}
          </TrackedLink>
        </div>
        <div className="mobile-cta__secondary">
          <TrackedLink
            className="btn btn-secondary mobile-cta__btn pattern-mobile-bar__btn"
            href={secondaryHref}
            prefetch={false}
            eventType="cta_click"
            eventPayload={{ cta: isHomeSurface ? 'browse_verified_projects' : 'get_investment_plan', from: source }}
          >
            {secondaryLabel}
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}
