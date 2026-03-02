'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { en } from '../../_lib/i18n/en';
import { th } from '../../_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../_lib/i18n/routing';

export default function NotFound() {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  return (
    <main
      id="main-content"
      className="section min-h-[60vh] flex flex-col items-center justify-center text-center"
    >
      <h2 className="text-2xl font-semibold text-[var(--color-text)]">
        {dict.errors.pageNotFound}
      </h2>
      <p className="mt-3 max-w-md text-[var(--color-text-secondary)]">
        {dict.errors.pageNotFoundDescription}
      </p>
      <Link
        href={withLocale(locale, '/')}
        className="btn btn-cta mt-6"
      >
        {dict.errors.goToHomepage}
      </Link>
    </main>
  );
}
