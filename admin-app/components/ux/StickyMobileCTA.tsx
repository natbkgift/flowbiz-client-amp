'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { CTA, shouldRenderStickyMobileCta } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';

const HOME_MOBILE_CTA_REVEAL_SCROLL = 320;

export function StickyMobileCTA() {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;
  const shouldRender = shouldRenderStickyMobileCta(pathname);
  const isLocaleHome = pathname === `/${locale}`;
  const isGuidedOverlayOpen = isLocaleHome && searchParams?.get('guided') === '1';
  const [isVisible, setIsVisible] = useState(() => !isLocaleHome);

  useEffect(() => {
    if (!shouldRender) {
      setIsVisible(false);
      return;
    }

    if (isGuidedOverlayOpen) {
      setIsVisible(false);
      return;
    }

    if (!isLocaleHome) {
      setIsVisible(true);
      return;
    }

    const updateVisibility = () => {
      setIsVisible(window.scrollY >= HOME_MOBILE_CTA_REVEAL_SCROLL);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, [isGuidedOverlayOpen, isLocaleHome, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`mobile-cta${isVisible ? ' mobile-cta--visible' : ''}`}
      role="region"
      aria-label={dict.common.ctaRegion}
    >
      <div className="mobile-cta__primary">
        <Link
          className="btn btn-cta mobile-cta__btn mobile-cta__btn--primary"
          href={withLocale(locale, '/contact?topic=private_tour')}
        >
          {dict.cta.bookPrivateTour}
        </Link>
      </div>
      <div className="mobile-cta__secondary">
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
    </div>
  );
}
