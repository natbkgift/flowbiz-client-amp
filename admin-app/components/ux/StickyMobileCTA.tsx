'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CTA } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';

export function StickyMobileCTA() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  return (
    <div className="mobile-cta" role="region" aria-label={dict.common.ctaRegion}>
      <Link
        className="btn btn-cta mobile-cta__btn"
        href={withLocale(locale, '/contact?topic=private_tour')}
      >
        {dict.cta.bookPrivateTour}
      </Link>
      <a
        className="btn btn-secondary mobile-cta__btn"
        href={CTA.whatsAppUrl}
        target="_blank"
        rel="noreferrer"
      >
        {dict.cta.whatsapp}
      </a>
      <Link
        className="btn btn-secondary mobile-cta__btn"
        href={withLocale(locale, '/contact?topic=investment_plan')}
      >
        {dict.cta.getInvestmentPlan}
      </Link>
    </div>
  );
}
