function normalizeAbsoluteUrl(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function resolveApiUpstreamBase(): string | null {
  return (
    normalizeAbsoluteUrl(process.env.LOCAL_API_ORIGIN)
    || normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_API_BASE)
  );
}

export function buildApiUpstreamUrl(path: string[], search = ''): URL | null {
  const upstreamBase = resolveApiUpstreamBase();
  if (!upstreamBase) {
    return null;
  }

  const upstreamUrl = new URL(`${upstreamBase}/${path.map(encodeURIComponent).join('/')}`);
  upstreamUrl.search = search;
  return upstreamUrl;
}