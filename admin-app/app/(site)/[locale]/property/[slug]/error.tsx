'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { en } from '@/app/_lib/i18n/en';
import { th } from '@/app/_lib/i18n/th';
import { localeFromPathname } from '@/app/_lib/i18n/routing';
import { reportComponentError } from '@/lib/error-reporting';

export default function PropertyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  useEffect(() => {
    reportComponentError(error, error.digest);
  }, [error]);

  return (
    <main id="main-content" className="section" role="alert">
      <div className="container max-w-3xl">
        <div className="card reveal text-center">
          <h1 className="section-title">{dict.errors.somethingWentWrong}</h1>
          <p className="section-subtitle">{error.message || dict.errors.unexpectedError}</p>
          <div className="card-actions justify-center">
            <button type="button" className="btn btn-secondary" onClick={reset}>
              {dict.errors.tryAgain}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
