'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PropertyListItem } from '../../app/public/_shared/types';

function parseBedroomsFromTitle(title: string): number | null {
  const t = (title || '').trim();
  if (!t) return null;
  if (/\bstudio\b/i.test(t)) return 0;
  const m = t.match(/\b(\d{1,2})\s*(?:br|bed|beds|bedroom|bedrooms)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function SidebarFilter({
  items,
  isOpen,
  onClose,
  onChange,
}: {
  items: PropertyListItem[];
  isOpen: boolean;
  onClose: () => void;
  onChange: (filtered: PropertyListItem[]) => void;
}) {
  const prices = useMemo(() => items.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)), [items]);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [beds, setBeds] = useState<Set<number>>(new Set());
  const [areas, setAreas] = useState<Set<string>>(new Set());

  const bedOptions = useMemo(() => {
    const set = new Set<number>();
    for (const p of items) {
      const b = parseBedroomsFromTitle(p.title);
      if (b != null) set.add(b);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [items]);

  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      const a = (p.city || '').trim();
      if (a) set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const price = Number(p.price);
      if (Number.isFinite(price)) {
        if (price < priceMin || price > priceMax) return false;
      }

      if (beds.size) {
        const b = parseBedroomsFromTitle(p.title);
        if (b == null || !beds.has(b)) return false;
      }

      if (areas.size) {
        const a = (p.city || '').trim();
        if (!a || !areas.has(a)) return false;
      }

      return true;
    });
  }, [areas, beds, items, priceMax, priceMin]);

  useEffect(() => {
    onChange(filtered);
  }, [filtered, onChange]);

  function clear() {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
    setBeds(new Set());
    setAreas(new Set());
  }

  return (
    <aside className={isOpen ? 'filter-sidebar active' : 'filter-sidebar'} aria-label="Filters">
      <h3 style={{ marginBottom: 24 }}>Filters</h3>

      <div className="filter-section">
        <h3>Price Range</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Min</div>
            <input
              className="form-input"
              inputMode="numeric"
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Max</div>
            <input
              className="form-input"
              inputMode="numeric"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value) || 0)}
            />
          </label>
        </div>
      </div>

      <div className="filter-section">
        <h3>Bedrooms</h3>
        <div className="chips-group">
          {bedOptions.map((b) => {
            const active = beds.has(b);
            return (
              <button
                key={b}
                type="button"
                className={active ? 'chip active' : 'chip'}
                onClick={() => {
                  setBeds((prev) => {
                    const next = new Set(prev);
                    if (next.has(b)) next.delete(b);
                    else next.add(b);
                    return next;
                  });
                }}
              >
                {b === 0 ? 'Studio' : b}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-section">
        <h3>Area</h3>
        <div className="checkbox-group">
          {areaOptions.slice(0, 12).map((a) => (
            <label key={a} className="checkbox-label">
              <input
                type="checkbox"
                checked={areas.has(a)}
                onChange={() => {
                  setAreas((prev) => {
                    const next = new Set(prev);
                    if (next.has(a)) next.delete(a);
                    else next.add(a);
                    return next;
                  });
                }}
              />
              <span>{a}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn btn-secondary btn-block" onClick={clear}>
          Clear
        </button>
        <button type="button" className="btn btn-primary btn-block mobile-only" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  );
}
