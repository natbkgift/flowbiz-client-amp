'use client';

import type { PropertyDetail } from '@/app/public/_shared/types';

const SHORTLIST_OWNER_KEY = 'amp_shortlist_owner_v1';
const SHORTLIST_CACHE_KEY = 'amp_shortlist_cache_v1';

export const SHORTLIST_UPDATED_EVENT = 'amp:shortlist-updated';

export type ShortlistPropertyItem = {
  property_id: string;
  slug: string | null;
  title: string;
  project: string | null;
  location: string | null;
  price: number | string;
  size: number | string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  image: string | null;
  status: string;
  foreign_quota: boolean;
  position: number;
  added_at: string;
  source_surface: string | null;
};

export type ShortlistDetail = {
  id: string;
  owner_type: string;
  owner_key: string;
  status: string;
  title: string | null;
  intent: string | null;
  share_mode: string | null;
  source_context: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
  item_count: number;
  items: ShortlistPropertyItem[];
};

export type ShortlistResponse = {
  shortlist: ShortlistDetail | null;
};

export type ShortlistMutationResponse = {
  action: string;
  shortlist: ShortlistDetail | null;
};

export type SharedShortlistDetail = {
  id: string;
  title: string | null;
  intent: string | null;
  share_mode: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  items: ShortlistPropertyItem[];
};

export type ShortlistShareResponse = {
  action: string;
  share_token: string;
  share_mode: string;
  share_url: string;
  shortlist: SharedShortlistDetail;
};

export type SharedShortlistResponse = {
  shortlist: SharedShortlistDetail;
};

export type ShortlistCompareProject = {
  propertyId: string;
  projectId: string;
  projectName: string | null;
};

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

export function readCachedShortlist(): ShortlistDetail | null {
  const w = safeWindow();
  if (!w) return null;

  try {
    const raw = w.localStorage.getItem(SHORTLIST_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShortlistDetail;
  } catch {
    return null;
  }
}

export function publishShortlist(shortlist: ShortlistDetail | null): void {
  const w = safeWindow();
  if (!w) return;

  try {
    if (shortlist) {
      w.localStorage.setItem(SHORTLIST_CACHE_KEY, JSON.stringify(shortlist));
    } else {
      w.localStorage.removeItem(SHORTLIST_CACHE_KEY);
    }
  } catch {
    return;
  }

  w.dispatchEvent(new CustomEvent(SHORTLIST_UPDATED_EVENT, { detail: shortlist }));
}

export function getOrCreateShortlistOwnerKey(): string {
  const w = safeWindow();
  if (!w) return 'server';

  try {
    const existing = w.localStorage.getItem(SHORTLIST_OWNER_KEY);
    if (existing && existing.length >= 8) return existing;

    const next = w.crypto?.randomUUID?.() ?? `shortlist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    w.localStorage.setItem(SHORTLIST_OWNER_KEY, next);
    return next;
  } catch {
    return 'unknown';
  }
}

export async function fetchCurrentShortlist(locale: 'en' | 'th'): Promise<ShortlistResponse> {
  const ownerKey = getOrCreateShortlistOwnerKey();
  const params = new URLSearchParams({
    owner_type: 'session',
    owner_key: ownerKey,
    locale,
  });

  const response = await fetch(`/api/v1/shortlists/current?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load shortlist (${response.status})`);
  }

  const payload = (await response.json()) as ShortlistResponse;
  publishShortlist(payload.shortlist ?? null);
  return payload;
}

export async function savePropertyToShortlist(input: {
  locale: 'en' | 'th';
  propertyId: string;
  sourceSurface: string;
}): Promise<ShortlistMutationResponse> {
  const ownerKey = getOrCreateShortlistOwnerKey();
  const params = new URLSearchParams({ locale: input.locale });

  const response = await fetch(`/api/v1/shortlists/current/items?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_type: 'session',
      owner_key: ownerKey,
      property_id: input.propertyId,
      source_surface: input.sourceSurface,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save shortlist item (${response.status})`);
  }

  const payload = (await response.json()) as ShortlistMutationResponse;
  publishShortlist(payload.shortlist ?? null);
  return payload;
}

export async function removePropertyFromShortlist(input: {
  locale: 'en' | 'th';
  propertyId: string;
}): Promise<ShortlistMutationResponse> {
  const ownerKey = getOrCreateShortlistOwnerKey();
  const params = new URLSearchParams({
    owner_type: 'session',
    owner_key: ownerKey,
    locale: input.locale,
  });

  const response = await fetch(`/api/v1/shortlists/current/items/${encodeURIComponent(input.propertyId)}?${params.toString()}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove shortlist item (${response.status})`);
  }

  const payload = (await response.json()) as ShortlistMutationResponse;
  publishShortlist(payload.shortlist ?? null);
  return payload;
}

export async function shareCurrentShortlist(locale: 'en' | 'th'): Promise<ShortlistShareResponse> {
  const ownerKey = getOrCreateShortlistOwnerKey();
  const params = new URLSearchParams({ locale });

  const response = await fetch(`/api/v1/shortlists/current/share?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_type: 'session',
      owner_key: ownerKey,
      share_mode: 'public_read',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to share shortlist (${response.status})`);
  }

  return (await response.json()) as ShortlistShareResponse;
}

export async function fetchSharedShortlist(input: {
  locale: 'en' | 'th';
  shareToken: string;
}): Promise<SharedShortlistResponse> {
  const params = new URLSearchParams({ locale: input.locale });
  const response = await fetch(
    `/api/v1/shortlists/shared/${encodeURIComponent(input.shareToken)}?${params.toString()}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load shared shortlist (${response.status})`);
  }

  return (await response.json()) as SharedShortlistResponse;
}

export async function resolveShortlistCompareProjects(input: {
  locale: 'en' | 'th';
  items: ShortlistPropertyItem[];
}): Promise<ShortlistCompareProject[]> {
  const seenProjectIds = new Set<string>();
  const candidates: ShortlistCompareProject[] = [];

  for (const item of input.items) {
    if (!item.property_id || candidates.length >= 3) {
      continue;
    }

    try {
      const params = new URLSearchParams({ locale: input.locale });
      const response = await fetch(`/api/v1/properties/${encodeURIComponent(item.property_id)}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        continue;
      }

      const detail = (await response.json()) as PropertyDetail;
      const projectId = typeof detail.project_id === 'string' ? detail.project_id : null;
      if (!projectId || seenProjectIds.has(projectId)) {
        continue;
      }

      seenProjectIds.add(projectId);
      candidates.push({
        propertyId: item.property_id,
        projectId,
        projectName: item.project,
      });
    } catch {
      continue;
    }
  }

  return candidates;
}