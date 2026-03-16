'use client';

const SHORTLIST_OWNER_KEY = 'amp_shortlist_owner_v1';

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

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
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

  return (await response.json()) as ShortlistResponse;
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

  return (await response.json()) as ShortlistMutationResponse;
}