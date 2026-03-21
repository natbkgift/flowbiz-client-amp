'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname } from '../../app/_lib/i18n/routing';

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
  onApply,
}: {
  items: PropertyListItem[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filtered: PropertyListItem[]) => void;
}) {
  const prices = useMemo(() => items.map((p) => Number(p.price)).filter((n) => Number.isFinite(n)), [items]);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const [draftPriceMin, setDraftPriceMin] = useState(minPrice);
  const [draftPriceMax, setDraftPriceMax] = useState(maxPrice);
  const [draftBeds, setDraftBeds] = useState<Set<number>>(new Set());
  const [draftAreas, setDraftAreas] = useState<Set<string>>(new Set());
  const [appliedPriceMin, setAppliedPriceMin] = useState(minPrice);
  const [appliedPriceMax, setAppliedPriceMax] = useState(maxPrice);
  const [appliedBeds, setAppliedBeds] = useState<Set<number>>(new Set());
  const [appliedAreas, setAppliedAreas] = useState<Set<string>>(new Set());

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

  const draftFiltered = useMemo(() => {
    return items.filter((p) => {
      const price = Number(p.price);
      if (Number.isFinite(price)) {
        if (price < draftPriceMin || price > draftPriceMax) return false;
      }

      if (draftBeds.size) {
        const b = parseBedroomsFromTitle(p.title);
        if (b == null || !draftBeds.has(b)) return false;
      }

      if (draftAreas.size) {
        const a = (p.city || '').trim();
        if (!a || !draftAreas.has(a)) return false;
      }

      return true;
    });
  }, [draftAreas, draftBeds, draftPriceMax, draftPriceMin, items]);

  function clear() {
    const resetBeds = new Set<number>();
    const resetAreas = new Set<string>();
    setDraftPriceMin(minPrice);
    setDraftPriceMax(maxPrice);
    setDraftBeds(resetBeds);
    setDraftAreas(resetAreas);
    setAppliedPriceMin(minPrice);
    setAppliedPriceMax(maxPrice);
    setAppliedBeds(resetBeds);
    setAppliedAreas(resetAreas);
    onApply(items);
  }

  function apply() {
    if (draftPriceMin > draftPriceMax) {
      return;
    }

    setAppliedPriceMin(draftPriceMin);
    setAppliedPriceMax(draftPriceMax);
    setAppliedBeds(new Set(draftBeds));
    setAppliedAreas(new Set(draftAreas));
    onApply(draftFiltered);
    if (isOpen) {
      onClose();
    }
  }

  function handleClose() {
    setDraftPriceMin(appliedPriceMin);
    setDraftPriceMax(appliedPriceMax);
    setDraftBeds(new Set(appliedBeds));
    setDraftAreas(new Set(appliedAreas));
    onClose();
  }

  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;
  const headingId = useId();
  const priceRangeErrorId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const priceRangeError =
    draftPriceMin > draftPriceMax
      ? locale === 'th'
        ? 'ราคาเริ่มต้นต้องไม่มากกว่าราคาสูงสุด'
        : 'Minimum price cannot be greater than maximum price.'
      : null;

  useEffect(() => {
    if (!isOpen) return;

    drawerRef.current?.focus();
  }, [isOpen]);

  return (
    <aside
      id="buy-filter-drawer"
      ref={drawerRef}
      className={isOpen ? 'filter-sidebar active' : 'filter-sidebar'}
      aria-label={dict.filters.heading}
      aria-labelledby={headingId}
      aria-modal={isOpen ? 'true' : undefined}
      role={isOpen ? 'dialog' : 'complementary'}
      tabIndex={isOpen ? -1 : undefined}
    >
      <h3 id={headingId} className="mb-6">{dict.filters.heading}</h3>

      <div className="filter-section">
        <h3>{dict.filters.priceRange}</h3>
        <div className="grid gap-3">
          <label>
            <div className="text-sm text-[var(--color-text-secondary)] mb-1.5">{dict.filters.min}</div>
            <input
              className="form-input"
              aria-describedby={priceRangeError ? priceRangeErrorId : undefined}
              aria-invalid={priceRangeError ? 'true' : 'false'}
              inputMode="numeric"
              value={draftPriceMin}
              onChange={(e) => setDraftPriceMin(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            <div className="text-sm text-[var(--color-text-secondary)] mb-1.5">{dict.filters.max}</div>
            <input
              className="form-input"
              aria-describedby={priceRangeError ? priceRangeErrorId : undefined}
              aria-invalid={priceRangeError ? 'true' : 'false'}
              inputMode="numeric"
              value={draftPriceMax}
              onChange={(e) => setDraftPriceMax(Number(e.target.value) || 0)}
            />
          </label>
        </div>
        {priceRangeError ? (
          <p id={priceRangeErrorId} className="form-helper" role="alert">
            {priceRangeError}
          </p>
        ) : null}
      </div>

      <div className="filter-section">
        <h3>{dict.filters.bedrooms}</h3>
        <div className="chips-group">
          {bedOptions.map((b) => {
            const active = draftBeds.has(b);
            return (
              <button
                key={b}
                type="button"
                className={active ? 'chip active' : 'chip'}
                onClick={() => {
                  setDraftBeds((prev) => {
                    const next = new Set(prev);
                    if (next.has(b)) next.delete(b);
                    else next.add(b);
                    return next;
                  });
                }}
              >
                {b === 0 ? dict.filters.studio : b}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.area}</h3>
        <div className="checkbox-group">
          {areaOptions.slice(0, 12).map((a) => (
            <label key={a} className="checkbox-label">
              <input
                type="checkbox"
                checked={draftAreas.has(a)}
                onChange={() => {
                  setDraftAreas((prev) => {
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

      <div className="flex gap-3">
        <button type="button" className="btn btn-primary btn-block" onClick={apply} disabled={Boolean(priceRangeError)}>
          {dict.filters.apply}
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={clear}>
          {dict.filters.clear}
        </button>
        <button type="button" className="btn btn-secondary btn-block mobile-only" onClick={handleClose}>
          {dict.filters.close}
        </button>
      </div>
    </aside>
  );
}
