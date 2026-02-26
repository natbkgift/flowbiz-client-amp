'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

interface GalleryProps {
  /** Array of image URLs to display. */
  images: string[];
  /** Alt text base (suffixed with index). */
  alt?: string;
  /** CSS class for the wrapper. */
  className?: string;
}

/**
 * Reusable image gallery with lightbox-style preview and thumbnails.
 *
 * Supports keyboard navigation (ArrowLeft / ArrowRight / Escape)
 * and a responsive thumbnail strip.
 */
export function Gallery({ images, alt = 'Gallery photo', className = '' }: GalleryProps) {
  const safeImages = images.map((s) => s.trim()).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = safeImages.length;
  if (total === 0) return null;

  const next = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + total) % total), [total]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') setLightboxOpen(false);
    },
    [next, prev],
  );

  return (
    <div className={`gallery ${className}`} onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Image gallery">
      {/* Main image */}
      <div
        className="gallery-main relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-[var(--color-surface)]"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={safeImages[activeIndex]}
          alt={`${alt} ${activeIndex + 1}`}
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="object-cover"
          priority={activeIndex === 0}
        />
        <div className="gallery-counter absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {activeIndex + 1} / {total}
        </div>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Next image"
            >
              &#8250;
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="gallery-thumbnails mt-3 flex gap-2 overflow-x-auto">
          {safeImages.slice(0, 12).map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`gallery-thumbnail relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                idx === activeIndex
                  ? 'border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
                  : 'border-transparent opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              <Image src={src} alt={`${alt} ${idx + 1}`} width={80} height={60} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-label="Image lightbox"
        >
          <button
            type="button"
            className="absolute right-4 top-4 text-3xl text-white hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            &times;
          </button>
          <div className="relative h-[80vh] w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={safeImages[activeIndex]}
              alt={`${alt} ${activeIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-2xl text-white hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Previous image"
              >
                &#8249;
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-2xl text-white hover:bg-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Next image"
              >
                &#8250;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
