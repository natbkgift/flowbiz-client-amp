import type { PropertyListItem } from '../public/_shared/types';

export function resolveImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;

  const raw = String(image).trim();
  if (!raw) return null;

  // Same-origin paths are always allowed (not hotlinking).
  if (raw.startsWith('/')) return raw;

  // Common backend payloads omit the leading slash (e.g. "uploads/...").
  if (
    raw.startsWith('images/') ||
    raw.startsWith('uploads/') ||
    raw.startsWith('media/')
  ) {
    return `/${raw}`;
  }

  // Protocol-relative → assume https.
  if (raw.startsWith('//')) return `https:${raw}`;

  const defaultAllowed = ['amppattaya.com', 'www.amppattaya.com'];
  const envAllowed = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  const allowed = new Set([...defaultAllowed, ...envAllowed]);

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    allowed.add('localhost');
    allowed.add('127.0.0.1');
  }

  function hostAllowed(hostname: string): boolean {
    const h = hostname.toLowerCase();
    for (const a of allowed) {
      const aa = a.toLowerCase();
      if (h === aa) return true;
      if (h.endsWith(`.${aa}`)) return true;
    }
    return false;
  }

  try {
    const url = new URL(raw);
    const protocol = url.protocol.toLowerCase();
    const hostname = url.hostname;

    if (!hostAllowed(hostname)) return null;

    // Upgrade known domains to https to satisfy next/image remotePatterns and avoid mixed content.
    if (protocol === 'http:' && (hostname === 'amppattaya.com' || hostname === 'www.amppattaya.com')) {
      url.protocol = 'https:';
      return url.toString();
    }

    // Only allow http in local development.
    if (protocol === 'http:' && !isDev) return null;
    if (protocol !== 'http:' && protocol !== 'https:') return null;

    return url.toString();
  } catch {
    // Not a valid URL and not a same-origin path.
    return null;
  }
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
