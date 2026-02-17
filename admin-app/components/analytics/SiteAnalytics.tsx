'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { trackEvent } from '../../lib/analytics';
import { captureAttributionFromUrl } from '../../lib/attribution';

export function SiteAnalytics() {
  const pathname = usePathname() ?? '/';
  const search = useSearchParams();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      // Ensure we capture current search params from Next as well.
      if (search) {
        url.search = search.toString();
      }
      captureAttributionFromUrl(url);

      trackEvent('page_view', pathname, {
        search: url.search || null,
      });
    } catch {
      // ignore
    }
  }, [pathname, search]);

  return null;
}
