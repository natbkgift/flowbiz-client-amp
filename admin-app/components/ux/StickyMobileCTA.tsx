'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';

export function StickyMobileCTA() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  return (
    <div className="mobile-cta" role="region" aria-label="CTA">
      <Link className="btn btn-cta mobile-cta__btn" href={withLocale(locale, '/invest')}>
        {dict.cta.exploreInvestment}
      </Link>
      <Link className="btn btn-secondary mobile-cta__btn" href={withLocale(locale, '/contact')}>
        {dict.cta.speakToAdvisor}
      </Link>
    </div>
  );
}
