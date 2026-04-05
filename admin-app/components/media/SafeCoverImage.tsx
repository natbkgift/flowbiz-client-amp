'use client';

import Image, { type ImageLoaderProps } from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toRuntimeLocalMediaPath } from '@/app/_lib/local-media';

const DEFAULT_FALLBACK_SRC = '/images/project-overview.png';
const CONTRACT_FALLBACK_SRC = '/images/property-exterior.png';
const LOCAL_SAFE_FALLBACK_SRC = '/images/property-placeholder.svg';

function normalizeSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return toRuntimeLocalMediaPath(s) ?? s;
}

function passthroughLoader({ src }: ImageLoaderProps): string {
  return src;
}

/**
 * Production-safe cover image renderer:
 * - Always shows a luxury placeholder when src is missing or fails to load.
 * - Uses a passthrough loader only when rendering unoptimized assets so local
 *   optimized images do not trigger loader warnings in test/build environments.
 */
export function SafeCoverImage({
  src,
  alt,
  className,
  sizes,
  loading = 'lazy',
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  priority = false,
  fetchPriority,
  quality,
  unoptimized = true,
  ssrStartWithPrimary = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: number;
  unoptimized?: boolean;
  ssrStartWithPrimary?: boolean;
}) {
  const initial = useMemo(() => normalizeSrc(src), [src]);
  const fallbackChain = useMemo(() => {
    const candidates = [
      normalizeSrc(fallbackSrc),
      DEFAULT_FALLBACK_SRC,
      CONTRACT_FALLBACK_SRC,
      LOCAL_SAFE_FALLBACK_SRC,
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);
    return Array.from(new Set(candidates));
  }, [fallbackSrc]);
  const primaryFallback = fallbackChain[0] ?? LOCAL_SAFE_FALLBACK_SRC;
  // Allow selected critical surfaces to start fetching the real asset during SSR.
  const [currentSrc, setCurrentSrc] = useState<string>(
    ssrStartWithPrimary ? (initial ?? primaryFallback) : primaryFallback,
  );
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    setFallbackIndex(0);
    setCurrentSrc(initial ?? primaryFallback);
  }, [initial, primaryFallback]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      fill
      sizes={sizes ?? '100vw'}
      priority={priority}
      loading={loading}
      fetchPriority={fetchPriority}
      quality={quality}
      loader={unoptimized ? passthroughLoader : undefined}
      unoptimized={unoptimized}
      onError={() => {
        if (initial && currentSrc === initial) {
          setFallbackIndex(0);
          setCurrentSrc(primaryFallback);
          return;
        }

        const nextIndex = fallbackIndex + 1;
        if (nextIndex < fallbackChain.length) {
          setFallbackIndex(nextIndex);
          setCurrentSrc(fallbackChain[nextIndex]);
        }
      }}
    />
  );
}
