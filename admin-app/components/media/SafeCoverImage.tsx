'use client';

import { useEffect, useMemo, useState } from 'react';

const DEFAULT_FALLBACK_SRC = '/images/property-placeholder.svg';

function normalizeSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  return s ? s : null;
}

/**
 * Production-safe cover image renderer:
 * - Always shows a luxury placeholder when src is missing or fails to load.
 * - Uses plain <img> to avoid Next Image remote host/protocol config breakage.
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
  const fallback = useMemo(() => normalizeSrc(fallbackSrc) ?? DEFAULT_FALLBACK_SRC, [fallbackSrc]);
  // SSR-safe: always render the fallback first so the browser never shows a
  // broken-image icon before React hydration attaches the onError handler.
  const [currentSrc, setCurrentSrc] = useState<string>(fallback);

  useEffect(() => {
    setCurrentSrc(initial ?? fallback);
  }, [initial, fallback]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={loading}
      decoding="async"
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
    />
  );
}
