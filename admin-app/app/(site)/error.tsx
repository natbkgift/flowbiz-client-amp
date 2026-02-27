'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { en } from '../_lib/i18n/en';
import { th } from '../_lib/i18n/th';
import { localeFromPathname } from '../_lib/i18n/routing';
import { reportComponentError } from '@/lib/error-reporting';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  // Report the error to the analytics/error tracking endpoint
  useEffect(() => {
    reportComponentError(error, error.digest);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center"
      role="alert"
    >
      <h2 className="text-2xl font-semibold text-red-600">{dict.errors.somethingWentWrong}</h2>
      <p className="mt-3 max-w-md text-slate-600">
        {error.message || dict.errors.unexpectedError}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
      >
        {dict.errors.tryAgain}
      </button>
    </main>
  );
}
