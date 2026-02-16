import type { PropertyListItem } from '../public/_shared/types';

export function resolveImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;

  // Strict: public site must only render local images served via /images/.
  // Anything else is treated as non-renderable to avoid hotlinking.
  if (image.startsWith('/images/')) return image;
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

export function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '-';
  return `${Math.round(price).toLocaleString()} THB`;
}

export function toPropertyHref(p: PropertyListItem): string {
  // Prefer slug-based pretty URL; fallback to legacy id route.
  if (p.slug) return `/property/${encodeURIComponent(p.slug)}`;
  return `/public/properties/${encodeURIComponent(p.id)}`;
}
