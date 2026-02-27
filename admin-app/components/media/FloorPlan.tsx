'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FloorPlanUnit {
  /** Label for this floor plan (e.g. "1 Bedroom", "Penthouse"). */
  label: string;
  /** Image URL for the floor plan diagram. */
  imageUrl: string;
  /** Size in sqm (optional). */
  size?: string;
}

interface FloorPlanProps {
  /** Array of floor plan variants. */
  plans: FloorPlanUnit[];
  /** CSS class for the wrapper. */
  className?: string;
}

/**
 * Floor plan display component for property detail pages.
 *
 * Shows selectable tabs for each floor plan variant with
 * a zoomable image viewer.
 */
export function FloorPlan({ plans, className = '' }: FloorPlanProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (plans.length === 0) return null;
  const active = plans[activeIdx];

  return (
    <div className={`floorplan ${className}`}>
      <h3 className="mb-4 text-lg font-semibold">Floor Plan</h3>

      {/* Tabs */}
      {plans.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {plans.map((plan, idx) => (
            <button
              key={plan.label}
              type="button"
              onClick={() => { setActiveIdx(idx); setZoomed(false); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                idx === activeIdx
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)]'
              }`}
            >
              {plan.label}
            </button>
          ))}
        </div>
      )}

      {/* Floor plan image */}
      <div
        className={`floorplan-viewer relative mx-auto cursor-zoom-in overflow-hidden rounded-xl bg-white transition-all ${
          zoomed ? 'max-h-[80vh] cursor-zoom-out' : 'max-h-[500px]'
        }`}
        onClick={() => setZoomed(!zoomed)}
        role="button"
        aria-label={zoomed ? 'Zoom out floor plan' : 'Zoom in floor plan'}
        tabIndex={0}
      >
        <Image
          src={active.imageUrl}
          alt={`Floor plan - ${active.label}`}
          width={800}
          height={600}
          className={`mx-auto transition-transform duration-300 ${zoomed ? 'scale-150' : 'scale-100'}`}
          loading="lazy"
        />
      </div>

      {/* Size info */}
      {active.size && (
        <p className="mt-3 text-center text-sm text-[var(--color-text-secondary)]">
          {active.label} &mdash; {active.size} sqm
        </p>
      )}
    </div>
  );
}
