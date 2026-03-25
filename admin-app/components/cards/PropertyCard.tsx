import Image from 'next/image';
import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import type { Dictionary } from '../../app/_lib/i18n/types';
import { formatPriceTHB, resolveImageUrl } from '../../app/_lib/public-api-shared';
import { withLocale } from '../../app/_lib/i18n/routing';
import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';

const PROPERTY_CARD_FALLBACK = '/images/property-placeholder.svg';

function formatPropertyType(value: string | null | undefined, locale: 'en' | 'th'): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return null;

  if (locale === 'th') {
    if (normalized === 'condo' || normalized === 'condominium') return 'คอนโด';
    if (normalized === 'villa') return 'วิลล่า';
    if (normalized === 'house') return 'บ้าน';
    if (normalized === 'townhouse') return 'ทาวน์เฮาส์';
    if (normalized === 'studio') return 'สตูดิโอ';
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPropertySpecs(item: PropertyListItem, locale: 'en' | 'th'): string[] {
  const specs: string[] = [];

  if (typeof item.bedrooms === 'number' && Number.isFinite(item.bedrooms) && item.bedrooms > 0) {
    specs.push(locale === 'th' ? `${item.bedrooms} ห้องนอน` : `${item.bedrooms} BR`);
  }

  const sizeValue = Number(item.size_sqm ?? item.size ?? null);
  if (Number.isFinite(sizeValue) && sizeValue > 0) {
    specs.push(locale === 'th' ? `${Math.round(sizeValue).toLocaleString()} ตร.ม.` : `${Math.round(sizeValue).toLocaleString()} sqm`);
  }

  return specs;
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
  const propertyTypeLabel = formatPropertyType(item.property_type ?? item.type, locale);
  const propertySpecs = formatPropertySpecs(item, locale);

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
          <div className="card-price">{formatPriceTHB(Number(item.price), locale)}</div>
          {propertyTypeLabel ? <div className="card-type">{propertyTypeLabel}</div> : null}
          <div className="card-title">{item.title}</div>
          {propertySpecs.length ? (
            <div className="card-specs" aria-label={locale === 'th' ? 'ข้อมูลเบื้องต้นของทรัพย์' : 'Property quick specs'}>
              {propertySpecs.map((spec) => (
                <span key={spec} className="card-specs__item">{spec}</span>
              ))}
            </div>
          ) : null}
          <div className="card-location">{item.address}</div>
        </div>
      </Link>

      <div className="property-card__actions">
        <div className="card-actions property-card__decision-ladder">
          <Link className="btn btn-primary property-card__primary-action" href={href}>
            {dict.listing.viewDetails}
          </Link>
          <ShortlistSaveButton
            className="property-card__secondary-action"
            locale={locale}
            propertyId={item.id}
            sourceSurface={item.type === 'rent' ? 'rent_listing_card' : 'buy_listing_card'}
          />
        </div>
      </div>
    </article>
  );
}
