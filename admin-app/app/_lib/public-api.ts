import type { PropertyDetail, PropertyListItem, PropertyListResponse } from '../public/_shared/types';
import { headers } from 'next/headers';

function getOriginFromHeaders(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchProperties(params: {
  type?: 'rent' | 'resale' | 'new';
  limit?: number;
  page?: number;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}): Promise<PropertyListResponse> {
  const origin = getOriginFromHeaders();
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('limit', String(params.limit ?? 60));
  qs.set('sort', params.sort ?? 'newest');
  if (params.type) qs.set('type', params.type);

  return fetchJson<PropertyListResponse>(`${origin}/api/v1/properties?${qs.toString()}`);
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const origin = getOriginFromHeaders();
  const safe = encodeURIComponent(slug);
  const res = await fetch(`${origin}/api/v1/properties/slug/${safe}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as PropertyDetail;
}

export function pickCoverImage(p: {
  cover_image?: string | null;
  local_images?: string[] | null;
  images?: string[] | null;
}): string | null {
  return p.cover_image ?? p.local_images?.[0] ?? p.images?.[0] ?? null;
}

export function normalizeNoWatermark(url: string): string {
  // Fallback safety: strip wm_ prefix from basename when present.
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash < 0) return url;
  const base = url.slice(lastSlash + 1);
  if (!base.toLowerCase().startsWith('wm_')) return url;
  return url.slice(0, lastSlash + 1) + base.slice(3);
}

export function toPropertyHref(p: PropertyListItem): string {
  // Prefer slug-based pretty URL; fallback to legacy id route.
  if (p.slug) return `/property/${encodeURIComponent(p.slug)}`;
  return `/public/properties/${encodeURIComponent(p.id)}`;
}
