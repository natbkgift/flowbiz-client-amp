'use client';

import type { PropertyDetail } from '@/app/public/_shared/types';

const SHORTLIST_OWNER_KEY = 'amp_shortlist_owner_v1';
const SHORTLIST_CACHE_KEY = 'amp_shortlist_cache_v1';

export const SHORTLIST_UPDATED_EVENT = 'amp:shortlist-updated';

export type ShortlistOwnerType = 'session' | 'user';

export type ShortlistOwnerReference = {
  ownerType: ShortlistOwnerType;
  ownerKey: string;
};

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
  owner_type: ShortlistOwnerType;
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

export type ShortlistMetadataInput = {
  title?: string | null;
  intent?: string | null;
  sourceContext?: Record<string, unknown> | null;
};

function safeWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

function normalizeShortlistText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeShortlistSourceContext(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeShortlistDetail(value: unknown): ShortlistDetail | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<ShortlistDetail>;
  if (!candidate.id || typeof candidate.id !== 'string') {
    return null;
  }

  if (!isValidShortlistOwnerType(candidate.owner_type)) {
    return null;
  }

  if (typeof candidate.owner_key !== 'string' || typeof candidate.status !== 'string') {
    return null;
  }

  return {
    id: candidate.id,
    owner_type: candidate.owner_type,
    owner_key: candidate.owner_key,
    status: candidate.status,
    title: normalizeShortlistText(candidate.title),
    intent: normalizeShortlistText(candidate.intent),
    share_mode: normalizeShortlistText(candidate.share_mode),
    source_context: normalizeShortlistSourceContext(candidate.source_context),
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : '',
    updated_at: typeof candidate.updated_at === 'string' ? candidate.updated_at : '',
    last_viewed_at:
      typeof candidate.last_viewed_at === 'string' ? candidate.last_viewed_at : null,
    item_count: typeof candidate.item_count === 'number' ? candidate.item_count : 0,
    items: Array.isArray(candidate.items) ? candidate.items : [],
  };
}

function mergeShortlistMetadata(
  shortlist: ShortlistDetail,
  metadata: ShortlistMetadataInput,
): ShortlistDetail {
  return {
    ...shortlist,
    title:
      metadata.title === undefined
        ? shortlist.title
        : normalizeShortlistText(metadata.title),
    intent:
      metadata.intent === undefined
        ? shortlist.intent
        : normalizeShortlistText(metadata.intent),
    source_context:
      metadata.sourceContext === undefined
        ? shortlist.source_context
        : normalizeShortlistSourceContext(metadata.sourceContext),
  };
}

function isValidShortlistOwnerType(value: unknown): value is ShortlistOwnerType {
  return value === 'session' || value === 'user';
}

function normalizeShortlistOwnerReference(value: unknown): ShortlistOwnerReference | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as {
    ownerType?: unknown;
    ownerKey?: unknown;
    owner_type?: unknown;
    owner_key?: unknown;
  };

  const ownerType = candidate.ownerType ?? candidate.owner_type;
  const ownerKey = candidate.ownerKey ?? candidate.owner_key;

  if (!isValidShortlistOwnerType(ownerType)) {
    return null;
  }

  if (typeof ownerKey !== 'string' || ownerKey.trim().length < 8) {
    return null;
  }

  return {
    ownerType,
    ownerKey: ownerKey.trim(),
  };
}

function persistShortlistOwnerReference(reference: ShortlistOwnerReference): void {
  const w = safeWindow();
  if (!w) return;

  try {
    w.localStorage.setItem(
      SHORTLIST_OWNER_KEY,
      JSON.stringify({
        owner_type: reference.ownerType,
        owner_key: reference.ownerKey,
      }),
    );
  } catch {
    // Ignore storage failures and preserve current runtime behavior.
  }
}

export function readStoredShortlistOwnerReference(): ShortlistOwnerReference | null {
  const w = safeWindow();
  if (!w) return null;

  try {
    const raw = w.localStorage.getItem(SHORTLIST_OWNER_KEY);
    if (!raw) return null;

    const normalizedLegacy = raw.trim();
    if (normalizedLegacy && !normalizedLegacy.startsWith('{')) {
      return normalizedLegacy.length >= 8
        ? { ownerType: 'session', ownerKey: normalizedLegacy }
        : null;
    }

    return normalizeShortlistOwnerReference(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readCachedShortlist(): ShortlistDetail | null {
  const w = safeWindow();
  if (!w) return null;

  try {
    const raw = w.localStorage.getItem(SHORTLIST_CACHE_KEY);
    if (!raw) return null;
    return normalizeShortlistDetail(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function publishShortlist(shortlist: ShortlistDetail | null): void {
  const w = safeWindow();
  if (!w) return;

  try {
    if (shortlist) {
      const normalized = normalizeShortlistDetail(shortlist);
      if (!normalized) {
        w.localStorage.removeItem(SHORTLIST_CACHE_KEY);
        return;
      }

      w.localStorage.setItem(SHORTLIST_CACHE_KEY, JSON.stringify(normalized));
    } else {
      w.localStorage.removeItem(SHORTLIST_CACHE_KEY);
    }
  } catch {
    return;
  }

  w.dispatchEvent(new CustomEvent(SHORTLIST_UPDATED_EVENT, { detail: shortlist }));
}

export function updateCachedShortlistMetadata(
  metadata: ShortlistMetadataInput,
): ShortlistDetail | null {
  const current = readCachedShortlist();
  if (!current) return null;

  const next = mergeShortlistMetadata(current, metadata);
  publishShortlist(next);
  return next;
}

export function getOrCreateShortlistOwnerReference(): ShortlistOwnerReference {
  const w = safeWindow();
  if (!w) {
    return { ownerType: 'session', ownerKey: 'server' };
  }

  try {
    const existing = readStoredShortlistOwnerReference();
    if (existing) {
      persistShortlistOwnerReference(existing);
      return existing;
    }

    const next = w.crypto?.randomUUID?.() ?? `shortlist-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const reference = {
      ownerType: 'session' as const,
      ownerKey: next,
    };
    persistShortlistOwnerReference(reference);
    return reference;
  } catch {
    return { ownerType: 'session', ownerKey: 'unknown' };
  }
}

export async function fetchCurrentShortlist(locale: 'en' | 'th'): Promise<ShortlistResponse> {
  const ownerReference = getOrCreateShortlistOwnerReference();
  const params = new URLSearchParams({
    owner_type: ownerReference.ownerType,
    owner_key: ownerReference.ownerKey,
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
  title?: string | null;
  intent?: string | null;
  sourceContext?: Record<string, unknown> | null;
}): Promise<ShortlistMutationResponse> {
  const ownerReference = getOrCreateShortlistOwnerReference();
  const params = new URLSearchParams({ locale: input.locale });

  const response = await fetch(`/api/v1/shortlists/current/items?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_type: ownerReference.ownerType,
      owner_key: ownerReference.ownerKey,
      property_id: input.propertyId,
      source_surface: input.sourceSurface,
      title: input.title,
      intent: input.intent,
      source_context: input.sourceContext,
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
  const ownerReference = getOrCreateShortlistOwnerReference();
  const params = new URLSearchParams({
    owner_type: ownerReference.ownerType,
    owner_key: ownerReference.ownerKey,
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
  const ownerReference = getOrCreateShortlistOwnerReference();
  const params = new URLSearchParams({ locale });

  const response = await fetch(`/api/v1/shortlists/current/share?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_type: ownerReference.ownerType,
      owner_key: ownerReference.ownerKey,
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