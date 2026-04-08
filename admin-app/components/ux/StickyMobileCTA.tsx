'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { shouldRenderStickyMobileCta } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';

export function StickyMobileCTA() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;
  const shouldRender = shouldRenderStickyMobileCta(pathname);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className="mobile-cta mobile-cta--visible pattern-mobile-bar"
      role="region"
      aria-label={dict.common.ctaRegion}
    >
      <div className="mobile-cta__primary pattern-mobile-bar__actions">
        <Link
          className="btn btn-cta mobile-cta__btn mobile-cta__btn--primary pattern-mobile-bar__btn"
          href={withLocale(locale, '/contact?topic=private_tour')}
        >
          {dict.cta.bookPrivateTour}
        </Link>
      </div>
      <div className="mobile-cta__secondary pattern-mobile-bar__actions">
        <Link
          className="btn btn-secondary mobile-cta__btn pattern-mobile-bar__btn"
          href={withLocale(locale, '/contact?topic=investment_plan')}
        >
          {dict.cta.getInvestmentPlan}
        </Link>
      </div>
    </div>
  );
}
