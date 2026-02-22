import Link from 'next/link';
import Image from 'next/image';

import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';

export function ProjectCard({
  name,
  count,
  slug,
  locale,
  dict,
  startingPrice,
  coverImage,
  propertyType,
}: {
  name: string;
  count: number;
  slug?: string;
  locale?: 'en' | 'th';
  dict: Dictionary;
  startingPrice?: number | null;
  coverImage?: string | null;
  propertyType?: string | null;
}) {
  const formattedPrice = startingPrice && Number.isFinite(startingPrice)
    ? `${dict.listing.startingFrom ?? 'From'} ฿${Math.round(startingPrice).toLocaleString()}`
    : null;

  const typeLabel = propertyType
    ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
    : null;

  const inner = (
    <div className="property-card">
      {coverImage ? (
        <div className="card-image">
          <Image
            src={coverImage}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
            loading="lazy"
          />
          {typeLabel ? (
            <span className="absolute top-2 left-2 rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
              {typeLabel}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="card-image" style={{ background: 'var(--color-surface)' }}>
          {typeLabel ? (
            <span className="absolute top-2 left-2 rounded bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
              {typeLabel}
            </span>
          ) : null}
        </div>
      )}
      <div className="card-content">
        <div className="card-title">{name}</div>
        {formattedPrice ? (
          <div className="card-price">{formattedPrice}</div>
        ) : null}
        <div className="card-location">
          {count
            ? `${count} ${dict.listing.listings}`
            : dict.listing.viewDetails}
        </div>
      </div>
    </div>
  );

  if (slug && locale) {
    return <Link href={withLocale(locale, `/projects/${slug}`)}>{inner}</Link>;
  }

  return inner;
}
