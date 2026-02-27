'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics';

type Props = {
  addedIds: string[];
  removedIds: string[];
};

export function CompareEventTracker({ addedIds, removedIds }: Props) {
  useEffect(() => {
    const page = window.location.pathname || '/';

    for (const projectId of addedIds) {
      void trackEvent('compare_item_added', page, { project_id: projectId });
    }

    for (const projectId of removedIds) {
      void trackEvent('compare_item_removed', page, { project_id: projectId });
    }
  }, [addedIds, removedIds]);

  return null;
}
