const DEFAULT_MEDIA_ORIGIN = 'https://amppattaya.com';

function normalizeAbsoluteUrl(value: string | undefined | null): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function resolveMediaUpstreamBase(): string {
  const explicitMediaOrigin = normalizeAbsoluteUrl(process.env.LOCAL_MEDIA_ORIGIN);
  if (explicitMediaOrigin) return explicitMediaOrigin;

  const siteOrigin = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteOrigin) return siteOrigin;

  const apiBase =
    normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_API_BASE) ||
    normalizeAbsoluteUrl(process.env.LOCAL_API_ORIGIN);
  if (apiBase) {
    return new URL(apiBase).origin;
  }

  return DEFAULT_MEDIA_ORIGIN;
}

export function buildMediaUpstreamUrl(path: string[], search: string): string {
  const upstreamBase = resolveMediaUpstreamBase();
  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const upstreamUrl = new URL(upstreamBase);
  const basePath = upstreamUrl.pathname.replace(/\/+$/, '');
  upstreamUrl.pathname = `${basePath}/media/${encodedPath}`.replace(/\/{2,}/g, '/');
  upstreamUrl.search = search;
  return upstreamUrl.toString();
}
