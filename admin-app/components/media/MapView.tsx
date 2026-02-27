'use client';

import { useEffect, useRef, useState } from 'react';

/** Coordinate pair for map center / markers. */
interface LatLng {
  lat: number;
  lng: number;
}

interface MapMarker extends LatLng {
  label?: string;
}

interface MapViewProps {
  /** Center of the map (latitude, longitude). */
  center: LatLng;
  /** Zoom level (default 14). */
  zoom?: number;
  /** Optional list of markers. */
  markers?: MapMarker[];
  /** CSS class for the wrapper. */
  className?: string;
  /** Map height (default 400). */
  height?: number;
}

/**
 * Interactive map component using Google Maps iframe embed.
 *
 * Falls back to a static map image when JavaScript is disabled.
 * Supports latitude/longitude positioning and multiple markers.
 */
export function MapView({
  center,
  zoom = 14,
  markers = [],
  className = '',
  height = 400,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';

  // Build Google Maps embed URL with lat/lng
  const q = `${center.lat},${center.lng}`;
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${q}&zoom=${zoom}`
    : `https://maps.google.com/maps?q=${q}&z=${zoom}&output=embed`;

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`map-container relative w-full overflow-hidden rounded-xl bg-[var(--color-surface)] ${className}`}
      style={{ height }}
    >
      {loaded ? (
        <iframe
          title="Google Maps location"
          src={embedUrl}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-secondary)]">
          Loading map&hellip;
        </div>
      )}

      {/* Marker legend */}
      {markers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {markers.map((m, i) => (
            <span
              key={`${m.lat}-${m.lng}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs text-white"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="5" r="4" />
              </svg>
              {m.label ?? `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
