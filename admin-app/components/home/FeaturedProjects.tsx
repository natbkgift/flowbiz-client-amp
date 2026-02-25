import Link from 'next/link';
import Image from 'next/image';

import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import condoViewImage from '@/public/images/condo-view.png';
import projectOverviewImage from '@/public/images/project-overview.png';
import propertyExteriorImage from '@/public/images/property-exterior.png';
import propertyInteriorImage from '@/public/images/property-interior.png';
import propertyPoolImage from '@/public/images/property-pool.png';
import villaGardenImage from '@/public/images/villa-garden.png';

type BadgeLabel = 'New' | 'Hot' | 'Beachfront';

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '';
  return `฿${Math.round(price).toLocaleString()}`;
}

const PROJECT_FALLBACK_IMAGES = [
  projectOverviewImage,
  condoViewImage,
  propertyExteriorImage,
  propertyPoolImage,
  propertyInteriorImage,
  villaGardenImage,
];

function looksPlaceholderLike(url: string | null): boolean {
  if (!url) return true;
  const normalized = url.toLowerCase();
  return (
    normalized.includes('placeholder') ||
    normalized.includes('default-image') ||
    normalized.endsWith('.svg')
  );
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
  const badgeLabels = {
    new: locale === 'th' ? 'ใหม่' : 'New',
    hot: locale === 'th' ? 'มาแรง' : 'Hot',
    beachfront: locale === 'th' ? 'ติดทะเล' : 'Beachfront',
  };

  const labels = {
    factsPending: locale === 'th' ? 'ข้อมูลรออัปเดต' : 'Data pending',
    areaPending: locale === 'th' ? 'พื้นที่: รอข้อมูล' : 'Area: pending',
    from: locale === 'th' ? 'เริ่มต้น' : 'From',
    status: locale === 'th' ? 'สถานะ' : 'Status',
    type: locale === 'th' ? 'ประเภท' : 'Type',
    delivery: locale === 'th' ? 'ส่งมอบ' : 'Delivery',
  };

  if (projects.length === 0) {
    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="premium-empty-state" role="status" aria-live="polite">
          <h3>{locale === 'th' ? 'ยังไม่มีโครงการแนะนำในขณะนี้' : 'No featured projects available right now'}</h3>
          <p>{locale === 'th' ? 'กำลังเตรียมรายการคัดสรรสำหรับหน้าแรก' : 'We are curating the next set of premium projects for this section.'}</p>
        </div>
      </div>
    );
  }

  function normalizeToken(input: string | null | undefined): string {
    return String(input ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  }

  function extractBadgeSet(project: ProjectItem): BadgeLabel[] {
    const dynamicProject = project as ProjectItem & {
      tags?: string[];
      badges?: string[];
      features?: string[];
      label?: string | null;
    };

    const sourceTokens = [
      dynamicProject.status,
      dynamicProject.label,
      ...(dynamicProject.tags ?? []),
      ...(dynamicProject.badges ?? []),
      ...(dynamicProject.features ?? []),
    ].map((token) => normalizeToken(token));

    const hasNew = sourceTokens.some((token) => token.includes('new'));
    const hasHot = sourceTokens.some((token) => token.includes('hot') || token.includes('trending'));
    const hasBeachfront = sourceTokens.some((token) => token.includes('beachfront') || token.includes('beach front'));

    const result: BadgeLabel[] = [];
    if (hasNew) result.push('New');
    if (hasHot) result.push('Hot');
    if (hasBeachfront) result.push('Beachfront');
    return result.slice(0, 2);
  }

  function extractAreaLabel(project: ProjectItem): string {
    const dynamicProject = project as ProjectItem & {
      area_name?: string | null;
      area?: { name?: string | null } | null;
      city?: string | null;
      district?: string | null;
    };

    const areaName = dynamicProject.area_name || dynamicProject.area?.name || dynamicProject.district || dynamicProject.city;
    return areaName && areaName.trim() ? areaName : labels.areaPending;
  }

  function extractQuickFacts(project: ProjectItem): Array<{ label: string; value: string }> {
    const dynamicProject = project as ProjectItem & {
      property_type?: string | null;
      delivery_date?: string | null;
      handover_date?: string | null;
    };

    const normalizedStatus = project.status ? project.status.replace(/_/g, ' ') : null;
    const propertyType = dynamicProject.property_type ? String(dynamicProject.property_type).replace(/_/g, ' ') : null;
    const deliveryRaw = dynamicProject.delivery_date || dynamicProject.handover_date;

    const facts: Array<{ label: string; value: string }> = [
      { label: labels.status, value: normalizedStatus || labels.factsPending },
      { label: labels.type, value: propertyType || labels.factsPending },
      { label: labels.delivery, value: deliveryRaw || labels.factsPending },
    ];

    return facts;
  }

  return (
    <div>
      <div className="section-header">
        <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
          {locale === 'th' ? 'รายการคัดสรรของ AMP' : 'AMP curated shortlist'}
        </div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>

      <div className="project-grid-premium">
        {projects.map((p, index) => {
          const img = resolveImageUrl(p.cover_image_url ?? null);
          const useFallbackMedia = looksPlaceholderLike(img);
          const price = p.starting_price ? formatPrice(Number(p.starting_price)) : null;
          const badges = extractBadgeSet(p);
          const facts = extractQuickFacts(p);
          const area = extractAreaLabel(p);
          const fallbackImage = PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length];

          return (
            <Link
              key={p.id}
              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
              className="premium-project-card reveal"
            >
              <div className="card-image premium-project-card__media">
                {!useFallbackMedia && img ? (
                  <Image
                    src={img}
                    alt={p.name}
                    fill
                    sizes="(min-width: 2560px) 18vw, (min-width: 1920px) 22vw, (min-width: 1024px) 30vw, (min-width: 768px) 48vw, 100vw"
                    className="object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <>
                    <Image
                      src={fallbackImage}
                      alt={locale === 'th' ? `ภาพประกอบโครงการ ${p.name}` : `Project preview for ${p.name}`}
                      fill
                      sizes="(min-width: 2560px) 18vw, (min-width: 1920px) 22vw, (min-width: 1024px) 30vw, (min-width: 768px) 48vw, 100vw"
                      className="object-cover premium-project-card__fallback-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="premium-project-card__fallback">
                      <span className="premium-project-card__fallback-label">
                        {locale === 'th' ? 'ภาพตัวอย่าง — รอรูปจริง' : 'Preview image — real photo pending'}
                      </span>
                    </div>
                  </>
                )}
                <div className="premium-project-card__media-scrim" aria-hidden="true" />
                {badges.length > 0 ? (
                  <div className="premium-project-card__badges" aria-label={locale === 'th' ? 'ป้ายกำกับโครงการ' : 'Project badges'}>
                    {badges.map((badge) => {
                      const key = badge.toLowerCase() as 'new' | 'hot' | 'beachfront';
                      return <span key={badge} className="premium-badge">{badgeLabels[key]}</span>;
                    })}
                  </div>
                ) : null}
                <div className="premium-project-card__media-meta" aria-hidden="true">
                  <span>{locale === 'th' ? 'AMP Curated' : 'AMP Curated'}</span>
                </div>
              </div>
              <div className="card-content premium-project-card__body">
                <div className="premium-project-card__header">
                  <h3 className="card-title premium-project-card__title">{p.name}</h3>
                  <p className="premium-project-card__area">{area}</p>
                </div>

                <div className="premium-project-card__price-row">
                  <span className="premium-project-card__price-label">{labels.from}</span>
                  <span className="premium-project-card__price-value">{price ?? labels.factsPending}</span>
                </div>

                <div className="premium-project-card__facts" aria-label={locale === 'th' ? 'ข้อมูลสำคัญ' : 'Quick facts'}>
                  {facts.map((fact) => (
                    <div key={fact.label} className="premium-project-card__fact-item">
                      <span className="premium-project-card__fact-label">{fact.label}</span>
                      <span className="premium-project-card__fact-value">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
