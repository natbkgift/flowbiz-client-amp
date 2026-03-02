'use client';

import { useMemo } from 'react';

import { pickPrimaryLocalMedia, type LocalMediaInput } from '@/app/_lib/local-media';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';

const DEFAULT_FALLBACK_SRC = '/images/property-placeholder.svg';

export function LocalMediaImage({
  media,
  alt,
  altFallback,
  className,
  imageClassName,
  aspectRatio = '4 / 3',
  loading = 'lazy',
  fallbackSrc = DEFAULT_FALLBACK_SRC,
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
  const src = useMemo(() => pickPrimaryLocalMedia(media), [media]);
  const safeAlt = (alt && alt.trim()) || altFallback || 'Property image';

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
        fallbackSrc={fallbackSrc}
      />
    </div>
  );
}
