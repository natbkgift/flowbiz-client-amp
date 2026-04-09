'use client';

import { useEffect, useRef } from 'react';

import { trackEvent, type EventType } from '@/lib/analytics';
import type { ConversionEntityType } from '@/lib/conversion';

type EntityViewTrackerProps = {
  eventType: Extract<EventType, 'view_project' | 'view_property'>;
  pathname: string;
  sourceRoute: 'project' | 'property';
  entityType: Extract<ConversionEntityType, 'project' | 'property'>;
  entityId: string;
  entityName: string;
};

export function EntityViewTracker({
  eventType,
  pathname,
  sourceRoute,
  entityType,
  entityId,
  entityName,
}: EntityViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    void trackEvent(eventType, pathname, {
      source_route: sourceRoute,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
    });
  }, [entityId, entityName, entityType, eventType, pathname, sourceRoute]);

  return null;
}