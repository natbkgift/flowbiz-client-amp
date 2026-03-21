import type { PropertyListItem } from '../public/_shared/types';
import { isKnownStalePublicMediaPath } from './local-media';

const LOCAL_MEDIA_PREFIXES = ['/media/', '/uploads/', '/assets/', '/_next/'];

export function resolveImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;

  const raw = String(image).trim();
  if (!raw) return null;
  if (raw.includes('://') || raw.startsWith('//')) return null;

  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  if (LOCAL_MEDIA_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    if (isKnownStalePublicMediaPath(normalized)) return null;
    return normalized;
  }
  return null;
}

export function pickCoverImage(p: {
  cover_image?: string | null;
  local_images?: string[] | null;
  images?: string[] | null;
}): string | null {
  return (
    resolveImageUrl(p.cover_image) ??
    resolveImageUrl(p.local_images?.[0]) ??
    resolveImageUrl(p.images?.[0]) ??
    null
  );
}

export function normalizeNoWatermark(url: string): string {
  // Fallback safety: strip wm_ prefix from basename when present.
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash < 0) return url;
  const base = url.slice(lastSlash + 1);
  if (!base.toLowerCase().startsWith('wm_')) return url;
  return url.slice(0, lastSlash + 1) + base.slice(3);
}

export function formatPriceTHB(price: number, locale: 'en' | 'th' = 'en'): string {
  if (!Number.isFinite(price)) return '-';
  const rounded = Math.round(price).toLocaleString();
  return locale === 'th' ? `฿${rounded}` : `THB ${rounded}`;
}

export function toPropertyHref(p: PropertyListItem): string {
  // Prefer slug-based pretty URL; fallback to legacy id route.
  if (p.slug) return `/property/${encodeURIComponent(p.slug)}`;
  return `/public/properties/${encodeURIComponent(p.id)}`;
}
