'use client';

import { useEffect } from 'react';

import { fetchCurrentShortlist } from '@/lib/shortlist';

export function ShortlistStateHydrator({ locale }: { locale: 'en' | 'th' }) {
  useEffect(() => {
    fetchCurrentShortlist(locale).catch(() => undefined);
  }, [locale]);

  return null;
}