import Image from 'next/image';
import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import type { Dictionary } from '../../app/_lib/i18n/types';
import { resolveImageUrl } from '../../app/_lib/public-api-shared';

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export function PropertyCard({
  item,
  dict,
  locale,
}: {
  item: PropertyListItem;
  dict: Dictionary;
  locale: 'en' | 'th';
}) {
  const href = item.slug ? `/${locale}/property/${encodeURIComponent(item.slug)}` : `/${locale}/contact`;
  const img = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0] ?? null);
  const facts: string[] = [];
  if (Number.isFinite(Number(item.bedrooms))) facts.push(`${item.bedrooms} ${dict.filters.bedrooms}`);
  if (Number.isFinite(Number(item.bathrooms))) facts.push(`${item.bathrooms} ${dict.filters.bathrooms}`);
  if (Number.isFinite(Number(item.size_sqm))) facts.push(`${Math.round(Number(item.size_sqm))} m²`);
  if (item.view_label) facts.push(item.view_label);

  return (
    <Link
      href={href}
      className="property-card"
      data-amp-event-type="featured_click"
      data-amp-event-payload={JSON.stringify({ from: 'property_listing', property_id: item.id, property_slug: item.slug ?? null })}
    >
      <div className="card-image">
        {img ? (
          <Image
            src={img}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 20vw"
            loading="lazy"
            decoding="async"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="card-content">
        <div className="card-price">{formatPriceTHB(Number(item.price))}</div>
        <div className="card-title">{item.title}</div>
        <div className="card-location">{item.address}</div>

        {facts.length ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
            {facts.slice(0, 4).map((fact) => (
              <span key={fact} className="rounded-full border border-[var(--color-border)] px-2 py-1">{fact}</span>
            ))}
          </div>
        ) : null}

        {item.tags?.length ? (
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">{item.tags.slice(0, 3).join(' • ')}</div>
        ) : null}

        <div className="card-actions">
          <span className="btn btn-primary pointer-events-none">
            {dict.listing.view}
          </span>
          <span className="btn btn-secondary pointer-events-none">
            {dict.listing.contact}
          </span>
        </div>
      </div>
    </Link>
  );
}
