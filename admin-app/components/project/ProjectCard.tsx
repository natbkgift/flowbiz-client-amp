import Link from 'next/link';

import { withLocale } from '@/app/_lib/i18n/routing';
import type { Dictionary } from '@/app/_lib/i18n/types';

export function ProjectCard({
  name,
  count,
  slug,
  locale,
  dict,
}: {
  name: string;
  count: number;
  slug?: string;
  locale?: 'en' | 'th';
  dict: Dictionary;
}) {
  const inner = (
    <div className="property-card property-card--tight">
      <div className="card-content">
        <div className="card-title">{name}</div>
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
