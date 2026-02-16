import Image from 'next/image';
import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { resolveImageUrl } from '../../app/_lib/public-api-shared';

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export function PropertyCard({ item }: { item: PropertyListItem }) {
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
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            style={{ objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div className="card-content">
        <div className="card-price">{formatPriceTHB(Number(item.price))}</div>
        <div className="card-title">{item.title}</div>
        <div className="card-location">{item.address}</div>

        <div className="card-actions">
          <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
            View
          </span>
          <span className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
            Contact
          </span>
        </div>
      </div>
    </Link>
  );
}
