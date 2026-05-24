import Link from 'next/link';

import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { cx } from '@/components/public/cx';
import { Button } from '@/components/public-system/components/Button';
import { Chip } from '@/components/public-system/components/Chip';
import { CardBase } from '@/components/public-system/primitives/CardBase';

export type PublicPropertyCardData = {
  id: string;
  title: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  location: string;
  priceLabel: string;
  listingType: 'sale' | 'rent';
  propertyType?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  sizeLabel?: string;
  viewLabel?: string;
  statusLabel?: string;
  isFeatured?: boolean;
};

export type PropertyCardProps = {
  property: PublicPropertyCardData;
  className?: string;
  ctaLabel?: string;
  fallbackImageSrc?: string;
  imagePriority?: boolean;
  imageSizes?: string;
  showActionPlaceholders?: boolean;
};

type FactItem = {
  key: string;
  label: string;
  value: string;
};

const DEFAULT_PROPERTY_FALLBACK = '/images/property-placeholder.svg';

function hasDisplayValue(value: string | number | undefined): value is string | number {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function buildPropertyFacts(property: PublicPropertyCardData): FactItem[] {
  const facts: FactItem[] = [];

  if (hasDisplayValue(property.bedrooms)) {
    facts.push({ key: 'bedrooms', label: 'Beds', value: String(property.bedrooms) });
  }

  if (hasDisplayValue(property.bathrooms)) {
    facts.push({ key: 'bathrooms', label: 'Baths', value: String(property.bathrooms) });
  }

  if (property.sizeLabel) {
    facts.push({ key: 'size', label: 'Size', value: property.sizeLabel });
  }

  if (property.viewLabel) {
    facts.push({ key: 'view', label: 'View', value: property.viewLabel });
  }

  return facts;
}

function listingTypeLabel(type: PublicPropertyCardData['listingType']): string {
  return type === 'rent' ? 'For rent' : 'For sale';
}

export function PropertyCard({
  property,
  className,
  ctaLabel = 'View Details',
  fallbackImageSrc = DEFAULT_PROPERTY_FALLBACK,
  imagePriority = false,
  imageSizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
  showActionPlaceholders = false,
}: PropertyCardProps) {
  const facts = buildPropertyFacts(property);
  const cardLabel = `${property.title}, ${property.location}`;

  return (
    <CardBase
      as="article"
      interactive
      className={cx('public-amp-card public-amp-card--interactive public-card-foundation public-property-card', className)}
      aria-label={cardLabel}
    >
      <div className="public-card-foundation__media">
        <Link href={property.href} className="public-card-foundation__media-link" aria-label={`${ctaLabel}: ${property.title}`}>
          <SafeCoverImage
            src={property.imageSrc}
            alt={property.imageAlt}
            fallbackSrc={fallbackImageSrc}
            priority={imagePriority}
            loading={imagePriority ? 'eager' : 'lazy'}
            sizes={imageSizes}
            className="public-card-foundation__image"
            ssrStartWithPrimary
          />
        </Link>

        <div className="public-card-foundation__badges" aria-label="Property badges">
          {property.isFeatured ? (
            <Chip size="sm" tone="accent" className="public-card-foundation__badge">
              Featured
            </Chip>
          ) : null}
          {property.statusLabel ? (
            <Chip size="sm" tone="deep" className="public-card-foundation__badge">
              {property.statusLabel}
            </Chip>
          ) : null}
          <Chip size="sm" className="public-card-foundation__badge">
            {listingTypeLabel(property.listingType)}
          </Chip>
        </div>
      </div>

      <div className="public-card-foundation__body">
        <div className="public-card-foundation__meta-row">
          <span className="public-card-foundation__location">{property.location}</span>
          {property.propertyType ? <span className="public-card-foundation__type">{property.propertyType}</span> : null}
        </div>

        <div className="public-card-foundation__headline">
          <h3 className="public-amp-card-title public-card-foundation__title">
            <Link href={property.href} className="public-card-foundation__title-link">
              {property.title}
            </Link>
          </h3>
          <p className="public-card-foundation__price">{property.priceLabel}</p>
        </div>

        {facts.length ? (
          <dl className="public-card-foundation__facts" aria-label="Property quick facts">
            {facts.map((fact) => (
              <div key={fact.key} className="public-card-foundation__fact">
                <dt className="public-card-foundation__fact-label">{fact.label}</dt>
                <dd className="public-card-foundation__fact-value">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="public-card-foundation__footer">
          {showActionPlaceholders ? (
            <div className="public-card-foundation__placeholder-actions" aria-label="Future card actions">
              <button type="button" className="public-card-foundation__placeholder-action" disabled>
                Shortlist
              </button>
              <button type="button" className="public-card-foundation__placeholder-action" disabled>
                Compare
              </button>
            </div>
          ) : null}
          <Button href={property.href} variant="primary" className="public-card-foundation__cta">
            {ctaLabel}
          </Button>
        </div>
      </div>
    </CardBase>
  );
}
