import 'server-only';

import type { PropertyDetail, PropertyListResponse } from '../public/_shared/types';
import { PAGE_REVALIDATE_SECONDS } from './constants';

/** Maximum retries for transient server / network errors. */
const MAX_RETRIES = 2;
/** Base delay (ms) between retries — doubled on each attempt. */
const RETRY_BASE_MS = 500;
/** Per-request timeout (ms) to prevent SSR hangs. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * fetch() wrapper with exponential back-off for transient failures.
 * Retries on 5xx status codes and network errors only.
 * 4xx responses are returned immediately (caller decides).
 * Each attempt is guarded by a 10 s timeout via AbortSignal.
 */
async function fetchWithRetry(
  input: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      // Only retry on server errors (5xx). Client errors (4xx) are intentional.
      if (res.status >= 500 && attempt < MAX_RETRIES) {
        await delay(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_BASE_MS * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

const DEFAULT_SITE_ORIGIN = 'https://amppattaya.com';

function getOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith('http')) return env;
  return DEFAULT_SITE_ORIGIN;
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
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/properties`, origin);
  url.searchParams.set('page', String(params.page ?? 1));
  url.searchParams.set('limit', String(params.limit ?? 60));

  if (params.type) url.searchParams.set('type', params.type);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sort) url.searchParams.set('sort', params.sort);

  const res = await fetchWithRetry(url.toString(), {
    // Public pages: allow caching but keep it reasonably fresh.
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch properties (${res.status})`);
  }

  return (await res.json()) as PropertyListResponse;
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/properties/slug/${encodeURIComponent(slug)}`, origin);

  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch property (${res.status})`);

  return (await res.json()) as PropertyDetail;
}

export async function fetchProjects(params?: { limit?: number }): Promise<ProjectItem[]> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects`, origin);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
  return (await res.json()) as ProjectItem[];
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectItem | null> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects/slug/${encodeURIComponent(slug)}`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
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
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/marketplace/categories`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch marketplace categories (${res.status})`);
  return (await res.json()) as MarketplaceCategoryItem[];
}

export async function fetchMarketplaceItems(params?: { category?: string }): Promise<MarketplaceItemItem[]> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/marketplace/items`, origin);
  if (params?.category) url.searchParams.set('category', params.category);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch marketplace items (${res.status})`);
  return (await res.json()) as MarketplaceItemItem[];
}

export type SmartFinderPurpose = 'live' | 'invest' | 'flip';
export type SmartFinderBudget = '<3m' | '3-5m' | '5-8m' | '8m+' | 'not_sure';
export type SmartFinderTimeline = '0-3m' | '3-6m' | '6-12m' | '12m+' | 'flexible';
export type SmartFinderRiskTolerance = 'low' | 'medium' | 'high';
export type SmartFinderForeignQuota = 'required' | 'not_required' | 'unsure';

export type SmartFinderRequest = {
  session_id?: string | null;
  purpose: SmartFinderPurpose;
  budget: SmartFinderBudget;
  timeline: SmartFinderTimeline;
  risk_tolerance: SmartFinderRiskTolerance;
  foreign_quota: SmartFinderForeignQuota;
};

export type SmartFinderProjectRecommendation = {
  project_id: string;
  slug: string;
  name: string;
  score: number;
  reasons: string[];
};

export type SmartFinderResponse = {
  ranking_version: string;
  query_hash: string;
  items: SmartFinderProjectRecommendation[];
};

export async function fetchSmartFinder(payload: SmartFinderRequest): Promise<SmartFinderResponse> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/smart-finder`, origin);
  const res = await fetchWithRetry(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch smart-finder recommendations (${res.status})`);
  }

  return (await res.json()) as SmartFinderResponse;
}

export type TrustBadge = { key: string; label: string };

export type AreaStatisticsSnapshot = {
  area_id: string;
  avg_price: string | null;
  avg_rent: string | null;
  roi_percent: string | null;
  as_of: string;
};

export type ProjectEvaluationResponse = {
  evaluation_version: string;
  project: ProjectItem;
  area_statistics: AreaStatisticsSnapshot | null;
  badges: TrustBadge[];
};

export async function fetchProjectEvaluation(projectId: string): Promise<ProjectEvaluationResponse | null> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects/${encodeURIComponent(projectId)}/evaluation`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project evaluation (${res.status})`);
  return (await res.json()) as ProjectEvaluationResponse;
}

export type AreaItem = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  created_at: string;
};

export type AreaStatisticsResponse = {
  area: AreaItem;
  statistics: AreaStatisticsSnapshot | null;
};

export async function fetchAreaStatisticsBySlug(slug: string): Promise<AreaStatisticsResponse | null> {
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/areas/${encodeURIComponent(slug)}/statistics`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch area statistics (${res.status})`);
  return (await res.json()) as AreaStatisticsResponse;
}
