import Link from 'next/link';
import Image from 'next/image';

import type { PropertyListItem } from '../public/_shared/types';
import {
  formatPriceTHB,
  normalizeNoWatermark,
  pickCoverImage,
  resolveImageUrl,
  toPropertyHref,
} from './public-api-shared';

function toVerifiedBadge(status: string | undefined): boolean {
  return status === 'active';
}

export function PropertyCard({ item }: { item: PropertyListItem }) {
  const cover = pickCoverImage(item);
  const href = toPropertyHref(item);

  const isVerified = toVerifiedBadge(item.status);
  const imageSrc = resolveImageUrl(cover) ? normalizeNoWatermark(cover!) : null;

  return (
    <Link
      href={href}
      className={
        'group relative overflow-hidden rounded-2xl bg-white shadow-sm transition ' +
        'hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400'
      }
    >
      <div className="relative aspect-[4/3] w-full bg-slate-200">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={false}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100" />
        )}

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {formatPriceTHB(Number(item.price))}
          </div>
          {isVerified ? (
            <div className="rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-semibold text-slate-950">
              Verified
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug line-clamp-2">
            {item.title}
          </h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 group-hover:bg-amber-50 group-hover:text-amber-800">
            {item.type}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 line-clamp-1">{item.address}</p>
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.city}</p>
      </div>
    </Link>
  );
}

export function PropertyGrid({ items }: { items: PropertyListItem[] }) {
  if (!items.length) return <p>No properties found</p>;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => (
        <PropertyCard key={p.id} item={p} />
      ))}
    </section>
  );
}
