import Image from 'next/image';
import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import type { Dictionary } from '../../app/_lib/i18n/types';
import { resolveImageUrl } from '../../app/_lib/public-api-shared';

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export function PropertyCard({ item, dict }: { item: PropertyListItem; dict: Dictionary }) {
  const href = item.slug ? `/property/${encodeURIComponent(item.slug)}` : '/rent';
  const img = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0] ?? null);

  return (
    <Link href={href} className="property-card">
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
