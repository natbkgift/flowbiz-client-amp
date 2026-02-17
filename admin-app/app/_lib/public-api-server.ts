import 'server-only';

import { headers } from 'next/headers';
import type { PropertyDetail, PropertyListResponse } from '../public/_shared/types';

export type ProjectItem = {
  id: string;
  slug: string;
  name: string;
  developer_id?: string | null;
  area_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function getOriginFromHeaders(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  if (!host) return 'https://www.amppattaya.com';
  return `${proto}://${host}`;
}

function apiBase(): string {
  // Use same-origin /api when behind nginx; allow override for local dev.
  return process.env.NEXT_PUBLIC_API_BASE || '/api';
}

export async function fetchProperties(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}): Promise<PropertyListResponse> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/properties`, origin);
  url.searchParams.set('page', String(params.page ?? 1));
  url.searchParams.set('limit', String(params.limit ?? 60));

  if (params.type) url.searchParams.set('type', params.type);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sort) url.searchParams.set('sort', params.sort);

  const res = await fetch(url.toString(), {
    // Public pages: allow caching but keep it reasonably fresh.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch properties (${res.status})`);
  }

  return (await res.json()) as PropertyListResponse;
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/properties/slug/${encodeURIComponent(slug)}`, origin);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch property (${res.status})`);

  return (await res.json()) as PropertyDetail;
}

export async function fetchProjects(params?: { limit?: number }): Promise<ProjectItem[]> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects`, origin);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
  return (await res.json()) as ProjectItem[];
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectItem | null> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects/slug/${encodeURIComponent(slug)}`, origin);
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);
  return (await res.json()) as ProjectItem;
}

export type MarketplaceCategoryItem = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
};

export type MarketplaceItemItem = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  summary?: string | null;
  image_url?: string | null;
  vetting_notes?: string | null;
  sponsor_tier?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function fetchMarketplaceCategories(): Promise<MarketplaceCategoryItem[]> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/marketplace/categories`, origin);
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch marketplace categories (${res.status})`);
  return (await res.json()) as MarketplaceCategoryItem[];
}

export async function fetchMarketplaceItems(params?: { category?: string }): Promise<MarketplaceItemItem[]> {
  const origin = getOriginFromHeaders();
  const base = apiBase();

  const url = new URL(`${base}/v1/marketplace/items`, origin);
  if (params?.category) url.searchParams.set('category', params.category);
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Failed to fetch marketplace items (${res.status})`);
  return (await res.json()) as MarketplaceItemItem[];
}
