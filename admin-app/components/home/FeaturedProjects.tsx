import Link from 'next/link';

import { pickPrimaryLocalMedia } from '@/app/_lib/local-media';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

type BadgeLabel = 'New' | 'Hot' | 'Beachfront';

function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return '';
  return `฿${Math.round(price).toLocaleString()}`;
}

const PROJECT_FALLBACK_IMAGES = [
  '/media/project-covers/the-riviera-jomtien/cover_31dde7af340e.jpg',
  '/media/project-covers/the-riviera-monaco/cover_84a7b41c3c79.jpg',
  '/media/project-covers/copacabana-beach-jomtien/cover_44839d734c2f.jpg',
  '/media/project-covers/city-garden-pratumnak/cover_19d5cc49057c.webp',
  '/media/project-covers/grand-solaire/cover_e831b1643816.webp',
  '/media/project-covers/wongamat-tower/cover_b688a580f462.jpg',
];

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
        <EmptyStateCard
          className="ui-empty"
          title={locale === 'th' ? 'ยังไม่มีโครงการแนะนำในขณะนี้' : 'No featured projects available right now'}
          body={locale === 'th' ? 'กำลังเตรียมรายการคัดสรรสำหรับหน้าแรก' : 'We are curating the next set of premium projects for this section.'}
        />
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
          const dynamicProject = p as ProjectItem & {
            hero_image_url?: string | null;
            images?: Array<string | null | undefined> | null;
          };
          const media = {
            cover_image_url: p.cover_image_url ?? null,
            hero_image_url: dynamicProject.hero_image_url ?? null,
            images: dynamicProject.images ?? null,
          };
          const hasLocalMedia = Boolean(pickPrimaryLocalMedia(media));
          const price = p.starting_price ? formatPrice(Number(p.starting_price)) : null;
          const badges = extractBadgeSet(p);
          const facts = extractQuickFacts(p);
          const area = extractAreaLabel(p);
          const fallbackImage = PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length];

          return (
            <Link
              key={p.id}
              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
              className="premium-project-card reveal card-interactive"
            >
              <div className="card-image premium-project-card__media">
                <LocalMediaImage
                  media={media}
                  alt={p.name}
                  altFallback={locale === 'th' ? `ภาพประกอบโครงการ ${p.name}` : `Project preview for ${p.name}`}
                  className="media-shell"
                  imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-project-card__fallback-image'}`}
                  fallbackSrc={fallbackImage}
                />
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
                  <span>
                    {hasLocalMedia
                      ? (locale === 'th' ? 'AMP Curated' : 'AMP Curated')
                      : (locale === 'th' ? 'ภาพตัวอย่าง — รอรูปจริง' : 'Preview image — real photo pending')}
                  </span>
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
