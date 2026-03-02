export type LocalMediaInput = {
  cover_image?: string | null;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  image_url?: string | null;
  local_images?: Array<string | null | undefined> | null;
  images?: Array<string | null | undefined> | null;
};

const LOCAL_PREFIXES = ['/media/', '/uploads/', '/assets/'];

export function isLocalMediaPath(value: string | null | undefined): boolean {
  if (!value) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  if (raw.includes('://') || raw.startsWith('//')) return false;
  if (raw.startsWith('/_next/')) return true;
  return LOCAL_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

export function normalizeLocalMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (isLocalMediaPath(raw)) return raw;

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  if (isLocalMediaPath(withLeadingSlash)) return withLeadingSlash;

  return null;
}

export function pickPrimaryLocalMedia(input: LocalMediaInput): string | null {
  const candidates: Array<string | null | undefined> = [
    input.cover_image,
    input.cover_image_url,
    input.hero_image_url,
    input.image_url,
    ...(input.local_images ?? []),
    ...(input.images ?? []),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeLocalMediaPath(candidate);
    if (normalized) return normalized;
  }

  return null;
}
