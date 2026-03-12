'use client';

import Image, { type ImageLoaderProps } from 'next/image';
import { useEffect, useMemo, useState } from 'react';

const DEFAULT_FALLBACK_SRC = '/images/project-overview.png';
const CONTRACT_FALLBACK_SRC = '/images/property-exterior.png';
const LOCAL_SAFE_FALLBACK_SRC = '/images/property-placeholder.svg';

function normalizeSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  return s ? s : null;
}

function passthroughLoader({ src }: ImageLoaderProps): string {
  return src;
}

/**
 * Production-safe cover image renderer:
 * - Always shows a luxury placeholder when src is missing or fails to load.
 * - Uses unoptimized next/image with a passthrough loader so remote host config
 *   does not block runtime fallback handling.
 */
export function SafeCoverImage({
  src,
  alt,
  className,
  sizes,
  loading = 'lazy',
  fallbackSrc = DEFAULT_FALLBACK_SRC,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
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
  // SSR-safe: always render the fallback first so the browser never shows a
  // broken-image icon before React hydration attaches the onError handler.
  const [currentSrc, setCurrentSrc] = useState<string>(primaryFallback);
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
      loading={loading}
      loader={passthroughLoader}
      unoptimized
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
