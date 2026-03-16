import Image from 'next/image';
import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import type { Dictionary } from '../../app/_lib/i18n/types';
import { resolveImageUrl } from '../../app/_lib/public-api-shared';
import { withLocale } from '../../app/_lib/i18n/routing';
import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';

const PROPERTY_CARD_FALLBACK = '/images/property-placeholder.svg';

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
  const href = item.slug
    ? withLocale(locale, `/property/${encodeURIComponent(item.slug)}`)
    : withLocale(locale, item.type === 'rent' ? '/rent' : '/buy');
  const img = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0] ?? null) ?? PROPERTY_CARD_FALLBACK;

  return (
    <article className="property-card">
      <Link href={href} className="property-card__link">
        <div className="card-image">
          <Image
            src={img}
            alt={item.title}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="card-content">
          <div className="card-price">{formatPriceTHB(Number(item.price))}</div>
          <div className="card-title">{item.title}</div>
          <div className="card-location">{item.address}</div>
        </div>
      </Link>

      <div className="property-card__actions">
        <div className="card-actions">
          <Link className="btn btn-primary" href={href}>
            {dict.listing.viewDetails}
          </Link>
          <ShortlistSaveButton
            locale={locale}
            propertyId={item.id}
            sourceSurface={item.type === 'rent' ? 'rent_listing_card' : 'buy_listing_card'}
          />
        </div>
      </div>
    </article>
  );
}
