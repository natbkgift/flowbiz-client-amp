'use client';

import { usePathname } from 'next/navigation';

import { CTA, shouldRenderFloatingWhatsApp } from '../../app/_lib/public-cta';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';

export function FloatingWhatsAppCTA() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  if (!shouldRenderFloatingWhatsApp(pathname)) {
    return null;
  }

  return (
    <a
      className="floating-cta"
      href={CTA.whatsAppUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={dict.cta.whatsapp}
    >
      {dict.cta.whatsapp}
    </a>
  );
}
