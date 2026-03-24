'use client';

import { useMemo } from 'react';

import { normalizeLocalMediaPath, pickRenderableLocalMedia } from '@/app/_lib/local-media';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';

type RecordShape = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  return candidate || null;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toStringOrNull(item))
    .filter((item): item is string => Boolean(item));
}

function toRecord(value: unknown): RecordShape | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as RecordShape;
}

function resolveMediaRecord(value: unknown): {
  alt: string;
  image_url?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  images?: string[];
  local_images?: string[];
} | null {
  const record = toRecord(value);
  if (!record) return null;

  const alt = [
    toStringOrNull(record.name),
    toStringOrNull(record.title),
    toStringOrNull(record.slug),
    'Content media',
  ].find((item): item is string => Boolean(item))!;

  const image_url =
    toStringOrNull(record.photo_url)
    || toStringOrNull(record.logo_url)
    || toStringOrNull(record.image_url);

  const media = {
    alt,
    image_url,
    cover_image: toStringOrNull(record.cover_image),
    cover_image_url: toStringOrNull(record.cover_image_url),
    hero_image_url: toStringOrNull(record.hero_image_url),
    images: toStringList(record.images),
    local_images: toStringList(record.local_images),
  };

  const candidate =
    normalizeLocalMediaPath(media.image_url)
    || pickRenderableLocalMedia(media);

  if (!candidate) return null;
  return media;
}

export function AdminRecordMediaPreview({
  record,
  compact = false,
  className,
}: {
  record: unknown;
  compact?: boolean;
  className?: string;
}) {
  const media = useMemo(() => resolveMediaRecord(record), [record]);

  if (!media) return null;

  return (
    <div
      className={[
        'admin-record-media',
        compact ? 'admin-record-media--compact' : 'admin-record-media--full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <LocalMediaImage
        media={media}
        alt={media.alt}
        className="media-shell admin-record-media__frame"
        imageClassName="media-shell__img admin-record-media__image"
        aspectRatio={compact ? '4 / 3' : '16 / 10'}
      />
    </div>
  );
}
