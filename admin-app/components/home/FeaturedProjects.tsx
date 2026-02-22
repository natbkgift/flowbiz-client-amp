import Link from 'next/link';
import Image from 'next/image';

import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { ProjectItem } from '@/app/_lib/public-api-server';

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '';
  return `฿${Math.round(price).toLocaleString()}`;
}

export function FeaturedProjects({
  projects,
  locale,
  title,
  subtitle,
}: {
  projects: ProjectItem[];
  locale: 'en' | 'th';
  title: string;
  subtitle: string;
}) {
  if (projects.length === 0) return null;

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>

      <div className="grid grid-3">
        {projects.map((p) => {
          const img = resolveImageUrl(p.cover_image_url ?? null);
          const price = p.starting_price ? formatPrice(Number(p.starting_price)) : null;

          return (
            <Link
              key={p.id}
              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
              className="property-card reveal"
            >
              <div className="card-image">
                {img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="card-content">
                <div className="card-title">{p.name}</div>
                {price ? (
                  <div className="card-price">
                    {locale === 'th' ? 'เริ่ม' : 'From'} {price}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
