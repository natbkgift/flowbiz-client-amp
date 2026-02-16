import Link from 'next/link';

import type { PropertyListItem } from '../public/_shared/types';
import { normalizeNoWatermark, pickCoverImage, toPropertyHref } from './public-api';

export function PropertyGrid({ items }: { items: PropertyListItem[] }) {
  if (!items.length) return <p>No properties found</p>;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => {
        const thumb = pickCoverImage(p);
        const href = toPropertyHref(p);
        return (
          <Link
            key={p.id}
            href={href}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
          >
            {thumb ? (
              <img
                src={normalizeNoWatermark(thumb)}
                alt={p.title}
                className="h-44 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-44 w-full bg-slate-200" />
            )}
            <div className="p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-snug line-clamp-2">{p.title}</h2>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {p.type}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900">{Number(p.price).toLocaleString()} THB</p>
              <p className="text-sm text-slate-600">{p.address}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
