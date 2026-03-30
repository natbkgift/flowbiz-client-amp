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
  init?: RequestInit & { next?: { revalidate?: number }; retryOn5xx?: boolean },
): Promise<Response> {
  const retryOn5xx = init?.retryOn5xx ?? true;
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeoutId);
      // Only retry on server errors (5xx). Client errors (4xx) are intentional.
      if (retryOn5xx && res.status >= 500 && attempt < MAX_RETRIES) {
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
  developer?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  area?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  status: string;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  images?: string[] | null;
  starting_price?: number | null;
  is_featured?: boolean;
  summary?: Record<string, unknown> | null;
  description?: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProjectDetail = {
  id: string;
  slug: string;
  name: string;
  status: string;
  property_type: string;
  delivery_date?: string | null;
  starting_price?: number | null;

  cover_image_url?: string | null;
  hero_image_url?: string | null;
  images?: string[] | null;

  summary: Record<string, unknown>;
  description?: Record<string, unknown> | null;

  amenities?: string[] | null;
  investment_snapshot?: Record<string, unknown> | null;
  location?: Record<string, unknown> | null;
  unit_count?: number | null;
  floors?: number | null;
  year_built?: number | null;
  is_featured?: boolean;

  developer_id?: string | null;
  area_id?: string | null;
  area?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  developer?: {
    id: string;
    slug: string;
    name: string;
  } | null;

  created_at: string | null;
  updated_at: string | null;
};

const DEFAULT_SITE_ORIGIN = 'https://amppattaya.com';
const useLocalBuildStaticSafe = process.env.NEXT_LOCAL_BUILD_STATIC_SAFE === '1';

const EMPTY_PROPERTY_LIST_RESPONSE: PropertyListResponse = {
  data: [],
  meta: { page: 1, limit: 0, total: 0 },
};

const EMPTY_SMART_FINDER_RESPONSE: SmartFinderResponse = {
  ranking_version: 'local-safe',
  query_hash: 'local-safe',
  items: [],
};

function getOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith('http')) return env;
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3000';
    return `http://127.0.0.1:${port}`;
  }
  return DEFAULT_SITE_ORIGIN;
}

function apiBase(): string {
  // This module is server-only, so prefer the direct internal API origin when
  // the runtime provides one (preview/prod containers expose the API as
  // http://api:8000). Falling back to same-origin /api keeps local dev and
  // browser-equivalent environments working without extra configuration.
  return process.env.LOCAL_API_ORIGIN || process.env.NEXT_PUBLIC_API_BASE || '/api';
}

export async function fetchProperties(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  project_id?: string;
}): Promise<PropertyListResponse> {
  if (useLocalBuildStaticSafe) {
    return EMPTY_PROPERTY_LIST_RESPONSE;
  }
  const origin = getOrigin();
  const base = apiBase();

  // Important: Next.js uses `trailingSlash: true` which can 308-redirect
  // `/api/v1/properties?...` → `/api/v1/properties/?...`.
  // Use the slash form to avoid redirect edge-cases during SSR.
  const url = new URL(`${base}/v1/properties/`, origin);
  url.searchParams.set('page', String(params.page ?? 1));
  // API contract: limit is capped at 100. Clamp defensively to avoid 422s from callers.
  const safeLimit = Math.max(1, Math.min(params.limit ?? 60, 100));
  url.searchParams.set('limit', String(safeLimit));

  if (params.type) url.searchParams.set('type', params.type);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.sort) url.searchParams.set('sort', params.sort);
  if (params.project_id) url.searchParams.set('project_id', params.project_id);

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
  if (useLocalBuildStaticSafe) {
    return null;
  }
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

export async function fetchProjects(params?: { limit?: number; page?: number; status_filter?: string }): Promise<ProjectItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects`, origin);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.page) url.searchParams.set('page', String(params.page));
  if (params?.status_filter) url.searchParams.set('status_filter', params.status_filter);

  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);

  // Some environments return a bare array, others return an envelope.
  // Normalize to a list so pages can render safely during static generation.
  const payload = (await res.json()) as unknown;
  if (Array.isArray(payload)) return payload as ProjectItem[];
  if (payload && typeof payload === 'object') {
    const maybe = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(maybe.data)) return maybe.data as ProjectItem[];
    if (Array.isArray(maybe.items)) return maybe.items as ProjectItem[];
  }

  return [];
}

export async function fetchProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects/slug/${encodeURIComponent(slug)}`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);
  const payload = (await res.json()) as unknown;
  if (payload && typeof payload === 'object' && 'project' in payload) {
    const maybe = payload as { project?: unknown };
    if (maybe.project && typeof maybe.project === 'object') {
      return maybe.project as ProjectDetail;
    }
  }
  return payload as ProjectDetail;
}

export type SeoResolvedOverride = {
  found: boolean;
  path: string;
  locale: string;
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  robots?: { index: boolean; follow: boolean };
  schema?: {
    organization_name?: string | null;
    local_business_name?: string | null;
    article_author?: string | null;
  };
};

export async function fetchSeoResolvedOverride(path: string, locale: string): Promise<SeoResolvedOverride | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/seo/resolve`, origin);
  url.searchParams.set('path', path);
  url.searchParams.set('locale', locale);

  try {
    const res = await fetchWithRetry(url.toString(), { next: { revalidate: 30 }, retryOn5xx: false });
    if (!res.ok) return null;
    return (await res.json()) as SeoResolvedOverride;
  } catch {
    return null;
  }
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
  if (useLocalBuildStaticSafe) {
    return EMPTY_SMART_FINDER_RESPONSE;
  }
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
  avg_price_sqm?: string | null;
  avg_rent_monthly?: string | null;
  avg_roi_percent?: string | null;
  total_projects?: number | null;
  total_units?: number | null;
  as_of_date?: string | null;
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
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/projects/${encodeURIComponent(projectId)}/evaluation`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project evaluation (${res.status})`);
  const payload = (await res.json()) as unknown;
  if (payload && typeof payload === 'object') {
    const maybe = payload as {
      evaluation?: Partial<ProjectEvaluationResponse> | null;
      project?: ProjectItem | null;
      project_id?: string | null;
    };
    if (maybe.evaluation) {
      return {
        evaluation_version: maybe.evaluation.evaluation_version ?? 'v1',
        project: maybe.evaluation.project ?? maybe.project ?? {
          id: maybe.project_id ?? projectId,
          slug: '',
          name: '',
          status: 'published',
          created_at: '',
          updated_at: '',
        },
        area_statistics: maybe.evaluation.area_statistics ?? null,
        badges: Array.isArray(maybe.evaluation.badges) ? maybe.evaluation.badges : [],
      };
    }
  }
  return payload as ProjectEvaluationResponse;
}

export type AreaItem = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  status?: string;
  hero_image_url?: string | null;
  created_at: string;
  updated_at?: string;
};

export type AreaStatisticsResponse = {
  area: AreaItem;
  statistics: AreaStatisticsSnapshot | null;
};

export type AreaDetailResponse = {
  area: AreaItem;
  statistics: AreaStatisticsSnapshot | null;
  content?: Record<string, unknown> | null;
  map_center?: Record<string, unknown> | null;
};

function normalizeAreaDetailResponse(payload: unknown): AreaDetailResponse | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('area' in payload) {
    const nested = payload as {
      area?: AreaItem;
      statistics?: AreaStatisticsSnapshot | null;
      content?: Record<string, unknown> | null;
      map_center?: Record<string, unknown> | null;
    };
    if (nested.area && typeof nested.area === 'object') {
      return {
        area: nested.area,
        statistics: nested.statistics ?? null,
        content: nested.content ?? null,
        map_center: nested.map_center ?? null,
      };
    }
  }

  const flat = payload as Partial<AreaItem> & {
    statistics?: AreaStatisticsSnapshot | null;
    content?: Record<string, unknown> | null;
    map_center?: Record<string, unknown> | null;
  };

  if (typeof flat.id !== 'string' || typeof flat.slug !== 'string' || typeof flat.name !== 'string') {
    return null;
  }

  return {
    area: {
      id: flat.id,
      slug: flat.slug,
      name: flat.name,
      city: typeof flat.city === 'string' ? flat.city : null,
      status: typeof flat.status === 'string' ? flat.status : undefined,
      hero_image_url: typeof flat.hero_image_url === 'string' ? flat.hero_image_url : null,
      created_at: typeof flat.created_at === 'string' ? flat.created_at : String(flat.updated_at ?? ''),
      updated_at: typeof flat.updated_at === 'string' ? flat.updated_at : undefined,
    },
    statistics: flat.statistics ?? null,
    content: flat.content ?? null,
    map_center: flat.map_center ?? null,
  };
}

export type DeveloperItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website: string | null;
  project_count?: number;
  primary_areas?: Array<{
    slug: string;
    name: string;
    project_count: number;
  }>;
  price_range?: {
    min: number;
    max: number;
    currency: string;
  } | null;
  has_active_projects?: boolean;
  last_updated?: string | null;
  tier?: string | null;
  logo_url?: string | null;
  status?: string;
  created_at: string;
  updated_at?: string;
};

export type DeveloperDetailResponse = {
  developer: DeveloperItem;
  summary?: Record<string, unknown> | null;
  media_warnings?: Array<{ level?: string; path?: string; detail?: string }>;
};

export async function fetchAreas(): Promise<AreaItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/areas`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch areas (${res.status})`);
  return (await res.json()) as AreaItem[];
}

export async function fetchAreaBySlug(slug: string): Promise<AreaDetailResponse | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/areas/${encodeURIComponent(slug)}`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch area detail (${res.status})`);
  return normalizeAreaDetailResponse(await res.json());
}

export async function fetchDevelopers(): Promise<DeveloperItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/developers`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch developers (${res.status})`);
  return (await res.json()) as DeveloperItem[];
}

export async function fetchDeveloperBySlug(slug: string): Promise<DeveloperDetailResponse | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/developers/${encodeURIComponent(slug)}`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch developer detail (${res.status})`);
  return (await res.json()) as DeveloperDetailResponse;
}

export async function fetchAreaStatisticsBySlug(slug: string): Promise<AreaStatisticsResponse | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/areas/${encodeURIComponent(slug)}/statistics`, origin);
  const res = await fetchWithRetry(url.toString(), { next: { revalidate: PAGE_REVALIDATE_SECONDS } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch area statistics (${res.status})`);
  return (await res.json()) as AreaStatisticsResponse;
}

export type HomeComposerPublishedResponse = {
  page_key: string;
  locale: 'en' | 'th';
  version: number;
  updated_at: string;
  config: Record<string, unknown>;
};

export async function fetchHomeComposerPublished(locale: 'en' | 'th'): Promise<HomeComposerPublishedResponse | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();

  const url = new URL(`${base}/v1/home-composer`, origin);
  url.searchParams.set('page_key', 'home');
  url.searchParams.set('locale', locale);

  const res = await fetchWithRetry(url.toString(), { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch home composer (${res.status})`);
  return (await res.json()) as HomeComposerPublishedResponse;
}

export type ContentLocalizedText = {
  en: string;
  th: string;
};

export type CompanyInfoItem = {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
};

export async function fetchCompanyInfoBySlug(slug: string): Promise<CompanyInfoItem | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/company/${encodeURIComponent(slug)}`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch company info (${res.status})`);
  return (await res.json()) as CompanyInfoItem;
}

export type TeamMemberItem = {
  id: string;
  name: string;
  role_title: string;
  bio?: Record<string, unknown> | null;
  photo_url?: string | null;
  languages?: string[] | null;
  specialties?: string[] | null;
  display_order: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TestimonialItem = {
  id: string;
  status: string;
  persona: string;
  intent: string;
  quote: string;
  attribution_name?: string | null;
  context?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function fetchPublishedTeamMembers(): Promise<TeamMemberItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/team-members`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (!res.ok) throw new Error(`Failed to fetch team members (${res.status})`);
  const payload = (await res.json()) as { data?: unknown } | unknown;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: TeamMemberItem[] }).data;
  }
  return [];
}

export async function fetchPublishedTestimonials(params?: { intent?: string; limit?: number }): Promise<TestimonialItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/testimonials`, origin);
  if (params?.intent) url.searchParams.set('intent', params.intent);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (!res.ok) throw new Error(`Failed to fetch testimonials (${res.status})`);
  const payload = (await res.json()) as { data?: unknown } | unknown;
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: TestimonialItem[] }).data;
  }
  return [];
}

export type ContentLink = {
  label: ContentLocalizedText;
  href: string;
};

export type ContentSummaryApiItem = {
  slug: string;
  title: ContentLocalizedText;
  excerpt?: ContentLocalizedText | null;
  category?: ContentLocalizedText | null;
  read_time?: ContentLocalizedText | null;
  published_at?: string | null;
  updated_at: string;
  hero_image_url?: string | null;
};

export type BlogPostDetailApi = ContentSummaryApiItem & {
  body: { en: string[]; th: string[] };
  related_guides?: string[];
  links?: ContentLink[];
};

export type GuideDetailApi = ContentSummaryApiItem & {
  summary?: ContentLocalizedText | null;
  checklist: { en: string[]; th: string[] };
  related_blog_posts?: string[];
  links?: ContentLink[];
};

export async function fetchBlogPosts(): Promise<ContentSummaryApiItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/content/blog-posts/`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (!res.ok) throw new Error(`Failed to fetch blog posts (${res.status})`);
  const payload = (await res.json()) as unknown;
  return Array.isArray(payload) ? (payload as ContentSummaryApiItem[]) : [];
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetailApi | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/content/blog-posts/${encodeURIComponent(slug)}/`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch blog detail (${res.status})`);
  return (await res.json()) as BlogPostDetailApi;
}

export async function fetchGuides(): Promise<ContentSummaryApiItem[]> {
  if (useLocalBuildStaticSafe) {
    return [];
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/content/guides/`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (!res.ok) throw new Error(`Failed to fetch guides (${res.status})`);
  const payload = (await res.json()) as unknown;
  return Array.isArray(payload) ? (payload as ContentSummaryApiItem[]) : [];
}

export async function fetchGuideBySlug(slug: string): Promise<GuideDetailApi | null> {
  if (useLocalBuildStaticSafe) {
    return null;
  }
  const origin = getOrigin();
  const base = apiBase();
  const url = new URL(`${base}/v1/content/guides/${encodeURIComponent(slug)}/`, origin);
  const res = await fetchWithRetry(url.toString(), {
    next: { revalidate: PAGE_REVALIDATE_SECONDS },
    retryOn5xx: false,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch guide detail (${res.status})`);
  return (await res.json()) as GuideDetailApi;
}
