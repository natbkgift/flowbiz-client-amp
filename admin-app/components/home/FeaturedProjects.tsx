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
        <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
          Updated Q1 2026
        </div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>

      <div className="grid grid-fluid">
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
              <div className="card-content flex flex-col h-full p-6">
                <div className="card-title text-lg font-medium text-gray-900 mb-2">{p.name}</div>
                <div className="text-sm text-gray-500 mb-4">{locale === 'th' ? 'โดยผู้พัฒนาชั้นนำ' : 'Premium Developer'}</div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  {price ? (
                    <div className="card-price text-gray-900 font-semibold mb-0">
                      {locale === 'th' ? 'เริ่ม' : 'From'} {price}
                    </div>
                  ) : <div />}
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    6% Est. Yield
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
