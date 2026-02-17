import Link from 'next/link';

import { withLocale } from '@/app/_lib/i18n/routing';

export function ProjectCard({
  name,
  count,
  slug,
  locale,
}: {
  name: string;
  count: number;
  slug?: string;
  locale?: 'en' | 'th';
}) {
  const inner = (
    <div className="property-card property-card--tight">
      <div className="card-content">
        <div className="card-title">{name}</div>
        <div className="card-location">{count ? `${count} listings` : 'View details'}</div>
      </div>
    </div>
  );

  if (slug && locale) {
    return <Link href={withLocale(locale, `/projects/${slug}`)}>{inner}</Link>;
  }

  return inner;
}
