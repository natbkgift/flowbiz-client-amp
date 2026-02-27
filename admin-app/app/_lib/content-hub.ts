import 'server-only';

import {
  fetchBlogPostBySlug,
  fetchBlogPosts,
  fetchGuideBySlug,
  fetchGuides,
  type BlogPostDetailApi,
  type ContentLocalizedText,
  type ContentSummaryApiItem,
  type GuideDetailApi,
} from './public-api-server';

export type LocalizedText = {
  en: string;
  th: string;
};

export type ContentLink = {
  label: LocalizedText;
  href: string;
};

export type BlogPostEntity = {
  slug: string;
  title: LocalizedText;
  excerpt?: LocalizedText;
  category?: LocalizedText;
  readTime?: LocalizedText;
  publishedAt: string;
  updatedAt?: string;
  heroImageUrl?: string | null;
  body?: {
    en: string[];
    th: string[];
  };
  relatedGuides?: string[];
  links?: ContentLink[];
};

export type GuideEntity = {
  slug: string;
  title: LocalizedText;
  summary?: LocalizedText;
  publishedAt: string;
  updatedAt?: string;
  heroImageUrl?: string | null;
  checklist?: {
    en: string[];
    th: string[];
  };
  relatedBlogPosts?: string[];
  links?: ContentLink[];
};

function mapLocalized(input: ContentLocalizedText | null | undefined): LocalizedText | undefined {
  if (!input) return undefined;
  return {
    en: String(input.en ?? '').trim(),
    th: String(input.th ?? '').trim(),
  };
}

function toPublishedDate(value: string | null | undefined): string {
  return value ?? '';
}

function mapSummaryToBlog(input: ContentSummaryApiItem): BlogPostEntity {
  return {
    slug: input.slug,
    title: mapLocalized(input.title) ?? { en: input.slug, th: input.slug },
    excerpt: mapLocalized(input.excerpt),
    category: mapLocalized(input.category),
    readTime: mapLocalized(input.read_time),
    publishedAt: toPublishedDate(input.published_at),
    updatedAt: input.updated_at,
    heroImageUrl: input.hero_image_url ?? null,
  };
}

function mapSummaryToGuide(input: ContentSummaryApiItem): GuideEntity {
  return {
    slug: input.slug,
    title: mapLocalized(input.title) ?? { en: input.slug, th: input.slug },
    summary: mapLocalized(input.excerpt),
    publishedAt: toPublishedDate(input.published_at),
    updatedAt: input.updated_at,
    heroImageUrl: input.hero_image_url ?? null,
  };
}

function mapBlogDetail(input: BlogPostDetailApi): BlogPostEntity {
  const base = mapSummaryToBlog(input);
  return {
    ...base,
    body: input.body,
    relatedGuides: input.related_guides ?? [],
    links: input.links ?? [],
  };
}

function mapGuideDetail(input: GuideDetailApi): GuideEntity {
  const base = mapSummaryToGuide(input);
  return {
    ...base,
    summary: mapLocalized(input.summary) ?? base.summary,
    checklist: input.checklist,
    relatedBlogPosts: input.related_blog_posts ?? [],
    links: input.links ?? [],
  };
}

export async function getBlogPosts(): Promise<BlogPostEntity[]> {
  try {
    const rows = await fetchBlogPosts();
    return rows.map(mapSummaryToBlog);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostEntity | null> {
  try {
    const row = await fetchBlogPostBySlug(slug);
    return row ? mapBlogDetail(row) : null;
  } catch {
    return null;
  }
}

export async function getGuideArticles(): Promise<GuideEntity[]> {
  try {
    const rows = await fetchGuides();
    return rows.map(mapSummaryToGuide);
  } catch {
    return [];
  }
}

export async function getGuideArticleBySlug(slug: string): Promise<GuideEntity | null> {
  try {
    const row = await fetchGuideBySlug(slug);
    return row ? mapGuideDetail(row) : null;
  } catch {
    return null;
  }
}

export async function getBlogSlugs(): Promise<string[]> {
  try {
    const rows = await fetchBlogPosts();
    return rows.map((row) => row.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getGuideSlugs(): Promise<string[]> {
  try {
    const rows = await fetchGuides();
    return rows.map((row) => row.slug).filter(Boolean);
  } catch {
    return [];
  }
}
