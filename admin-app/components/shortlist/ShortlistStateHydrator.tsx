'use client';

import { useEffect } from 'react';

import { fetchCurrentShortlist, publishShortlist } from '@/lib/shortlist';

export function ShortlistStateHydrator({ locale }: { locale: 'en' | 'th' }) {
  useEffect(() => {
    let isActive = true;

    fetchCurrentShortlist(locale, { publish: false })
      .then((response) => {
        if (!isActive) {
          return;
        }

        publishShortlist(response.shortlist ?? null, 'fetch');
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [locale]);

  return null;
}