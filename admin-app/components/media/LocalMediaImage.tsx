'use client';

import { useMemo } from 'react';

import { pickPrimaryLocalMedia, type LocalMediaInput } from '@/app/_lib/local-media';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';

const DEFAULT_FALLBACK_SRC = '/images/property-placeholder.svg';
const CONTRACT_IMAGE_FALLBACK_SRC = '/images/project-overview.png';
const LOCAL_PREFIXES = ['/media/', '/storage/', '/uploads/', '/assets/', '/images/'];

function normalizeRuntimeLocalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith('//') || raw.includes('://')) return null;

  if (raw.startsWith("/media/") || raw.startsWith("/storage/")) return raw;
  if (LOCAL_PREFIXES.some((prefix) => raw.startsWith(prefix))) return raw;

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  if (withLeadingSlash.startsWith("/media/") || withLeadingSlash.startsWith("/storage/")) return withLeadingSlash;
  if (LOCAL_PREFIXES.some((prefix) => withLeadingSlash.startsWith(prefix))) return withLeadingSlash;

  return null;
}

export function LocalMediaImage({
  media,
  alt,
  altFallback,
  className,
  imageClassName,
  aspectRatio = '4 / 3',
  loading = 'lazy',
  fallbackSrc,
}: {
  media: LocalMediaInput;
  alt?: string | null;
  altFallback?: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
}) {
  const src = useMemo(() => {
    const directCandidates: Array<string | null | undefined> = [
      media.cover_image,
      media.cover_image_url,
      media.hero_image_url,
      media.image_url,
      ...(media.local_images ?? []),
      ...(media.images ?? []),
    ];

    for (const candidate of directCandidates) {
      const normalized = normalizeRuntimeLocalPath(candidate);
      if (normalized) return normalized;
    }

    const picked = pickPrimaryLocalMedia(media);
    return normalizeRuntimeLocalPath(picked) ?? picked;
  }, [media]);
  const safeAlt = (alt && alt.trim()) || altFallback || 'Property image';
  const resolvedFallback = [fallbackSrc, DEFAULT_FALLBACK_SRC, CONTRACT_IMAGE_FALLBACK_SRC].find(
    (candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0,
  ) ?? DEFAULT_FALLBACK_SRC;

  return (
    <div
      className={className ?? 'media-shell'}
      style={{ aspectRatio }}
      data-media-kind={src ? 'local' : 'fallback'}
    >
      <SafeCoverImage
        src={src}
        alt={safeAlt}
        className={imageClassName ?? 'media-shell__img'}
        loading={loading}
        fallbackSrc={resolvedFallback}
      />
    </div>
  );
}
