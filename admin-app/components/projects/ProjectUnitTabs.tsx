'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { resolveImageUrl } from '@/app/_lib/public-api-shared';

type UnitItem = {
  id: string;
  title: string;
  type: string;
  price: number;
  address: string;
  slug: string | null;
  cover_image?: string | null;
  local_images?: string[] | null;
  images?: string[] | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size?: number | null;
};

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

function priceRange(units: UnitItem[]): string {
  if (!units.length) return '-';
  const prices = units.map((u) => Number(u.price)).filter(Number.isFinite);
  if (!prices.length) return '-';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function ProjectUnitTabs({
  units,
  locale,
}: {
  units: UnitItem[];
  locale: 'en' | 'th';
}) {
  const saleUnits = units.filter((u) => u.type === 'resale' || u.type === 'new');
  const rentUnits = units.filter((u) => u.type === 'rent');
  const [tab, setTab] = useState<'sale' | 'rent'>(saleUnits.length ? 'sale' : 'rent');

  const activeUnits = tab === 'sale' ? saleUnits : rentUnits;

  const labels = {
    sale: locale === 'th' ? 'ขาย' : 'For Sale',
    rent: locale === 'th' ? 'เช่า' : 'For Rent',
    units: locale === 'th' ? 'ยูนิต' : 'units',
    range: locale === 'th' ? 'ช่วงราคา' : 'Price Range',
    noUnits: locale === 'th' ? 'ยังไม่มียูนิตในหมวดนี้' : 'No units available in this category',
    bed: locale === 'th' ? 'ห้องนอน' : 'Bed',
    sqm: locale === 'th' ? 'ตร.ม.' : 'sqm',
  };

  return (
    <div className="mt-8">
      {/* Tab headers */}
      <div className="flex gap-0 border-b border-[var(--color-gray-200,#e5e7eb)]">
        <button
          type="button"
          onClick={() => setTab('sale')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            tab === 'sale'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          {labels.sale} ({saleUnits.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('rent')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            tab === 'rent'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          {labels.rent} ({rentUnits.length})
        </button>
      </div>

      {/* Summary */}
      {activeUnits.length > 0 ? (
        <div className="mt-4 mb-4 flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
          <span>{activeUnits.length} {labels.units}</span>
          <span>{labels.range}: {priceRange(activeUnits)}</span>
        </div>
      ) : null}

      {/* Unit grid */}
      {activeUnits.length > 0 ? (
        <div className="grid grid-2">
          {activeUnits.map((u) => {
            const img = resolveImageUrl(u.cover_image ?? u.local_images?.[0] ?? u.images?.[0] ?? null);
            const href = u.slug ? `/${locale}/property/${encodeURIComponent(u.slug)}` : '#';
            return (
              <Link key={u.id} href={href} className="property-card">
                <div className="card-image">
                  {img ? (
                    <Image
                      src={img}
                      alt={u.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="card-content">
                  <div className="card-price">
                    {formatPrice(Number(u.price))}
                    {tab === 'rent' ? <span className="text-xs font-normal"> /mo</span> : null}
                  </div>
                  <div className="card-title">{u.title}</div>
                  <div className="card-location">
                    {u.bedrooms != null ? `${u.bedrooms} ${labels.bed}` : ''}
                    {u.size != null ? ` · ${u.size} ${labels.sqm}` : ''}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 p-6 text-center text-[var(--color-text-secondary)] bg-[var(--color-surface)] rounded-xl">
          {labels.noUnits}
        </div>
      )}
    </div>
  );
}
