import Link from 'next/link';

import { pickRenderableLocalMedia } from '@/app/_lib/local-media';
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
  '/images/project-overview.png',
  '/images/condo-view.png',
  '/images/property-exterior.png',
  '/images/property-interior.png',
  '/images/property-pool.png',
  '/images/villa-garden.png',
];

export function FeaturedProjects({
  projects,
  locale,
  kicker,
  title,
  subtitle,
}: {
  projects: ProjectItem[];
  locale: 'en' | 'th';
  kicker?: string;
  title: string;
  subtitle: string;
}) {
  const badgeLabels = {
    new: locale === 'th' ? 'ใหม่' : 'New',
    hot: locale === 'th' ? 'มาแรง' : 'Hot',
    beachfront: locale === 'th' ? 'ติดทะเล' : 'Beachfront',
  };

  const labels = {
    from: locale === 'th' ? 'เริ่มต้น' : 'From',
    status: locale === 'th' ? 'สถานะ' : 'Status',
    type: locale === 'th' ? 'ประเภท' : 'Type',
    delivery: locale === 'th' ? 'ส่งมอบ' : 'Delivery',
    curatedLabel: locale === 'th' ? 'AMP Curated' : 'AMP Curated',
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
          title={locale === 'th' ? 'ให้ทีมช่วยคัดรายการล่าสุดให้คุณ' : 'Ask the team for today\'s shortlist'}
          body={locale === 'th' ? 'ดูโครงการที่เผยแพร่แล้วทั้งหมด หรือส่ง brief ให้ทีมจัดชุดโครงการที่เหมาะกับงบและเป้าหมายของคุณ' : 'Browse published developments or send your brief so the team can assemble a shortlist matched to your budget and goals.'}
        />
      </div>
    );
  }

  function normalizeToken(input: string | null | undefined): string {
    return String(input ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  }

  function collectProjectTokens(project: ProjectItem, area: string | null): string[] {
    const dynamicProject = project as ProjectItem & {
      tags?: string[];
      badges?: string[];
      features?: string[];
      label?: string | null;
    };

    return [
      project.name,
      project.status,
      dynamicProject.label,
      area,
      ...(dynamicProject.tags ?? []),
      ...(dynamicProject.badges ?? []),
      ...(dynamicProject.features ?? []),
    ].map((token) => normalizeToken(token));
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

  function extractAreaLabel(project: ProjectItem): string | null {
    const dynamicProject = project as ProjectItem & {
      area_name?: string | null;
      area?: { name?: string | null } | null;
      city?: string | null;
      district?: string | null;
    };

    const areaName = dynamicProject.area_name || dynamicProject.area?.name || dynamicProject.district || dynamicProject.city;
    return areaName && areaName.trim() ? areaName : null;
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

    return [
      { label: labels.status, value: normalizedStatus || '' },
      { label: labels.type, value: propertyType || '' },
      { label: labels.delivery, value: deliveryRaw || '' },
    ].filter((fact) => fact.value.trim().length > 0);
  }

  function extractDecisionSignals(project: ProjectItem, index: number, area: string | null): string[] {
    const tokens = collectProjectTokens(project, area);
    const signals: string[] = [];

    if (index === 0) {
      signals.push(locale === 'th' ? 'Best Pick' : 'Best Pick');
    }
    if (tokens.some((token) => token.includes('roi') || token.includes('yield') || token.includes('invest'))) {
      signals.push(locale === 'th' ? 'High ROI' : 'High ROI');
    }
    if (tokens.some((token) => token.includes('beachfront') || token.includes('sea view') || token.includes('ocean view') || token.includes('beach'))) {
      signals.push(locale === 'th' ? 'Sea View' : 'Sea View');
    }
    if (!signals.length && index < 3) {
      signals.push(locale === 'th' ? 'Best Pick' : 'Best Pick');
    }

    return [...new Set(signals)].slice(0, 3);
  }

  return (
    <div>
      <div className="section-header">
        {kicker ? <div className="home-section-kicker">{kicker}</div> : null}
        <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full mb-3">
          {locale === 'th' ? 'โครงการคัดสรรของ AMP' : 'AMP curated shortlist'}
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
          const hasLocalMedia = Boolean(pickRenderableLocalMedia(media));
          const price = p.starting_price ? formatPrice(Number(p.starting_price)) : null;
          const badges = extractBadgeSet(p);
          const facts = extractQuickFacts(p);
          const area = extractAreaLabel(p);
          const decisionSignals = extractDecisionSignals(p, index, area);
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
                  altFallback={locale === 'th' ? `ภาพประกอบโครงการ ${p.name}` : `Project image for ${p.name}`}
                  className="media-shell"
                  imageClassName={`absolute inset-0 h-full w-full object-cover ${hasLocalMedia ? '' : 'premium-project-card__fallback-image'}`}
                  fallbackSrc={fallbackImage}
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                  quality={72}
                  unoptimized={false}
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
                  <span>{labels.curatedLabel}</span>
                </div>
              </div>
              <div className="card-content premium-project-card__body">
                <div className="premium-project-card__header">
                  <h3 className="card-title premium-project-card__title">{p.name}</h3>
                  {area ? <p className="premium-project-card__area">{area}</p> : null}
                </div>

                {price ? (
                  <div className="premium-project-card__price-row">
                    <span className="premium-project-card__price-label">{labels.from}</span>
                    <span className="premium-project-card__price-value">{price}</span>
                  </div>
                ) : null}

                {decisionSignals.length > 0 ? (
                  <div className="premium-project-card__signals" aria-label={locale === 'th' ? 'สัญญาณการตัดสินใจ' : 'Decision signals'}>
                    {decisionSignals.map((signal) => (
                      <span key={`${p.id}-${signal}`} className="premium-project-card__signal">{signal}</span>
                    ))}
                  </div>
                ) : null}

                {facts.length > 0 ? (
                  <div className="premium-project-card__facts" aria-label={locale === 'th' ? 'ข้อมูลสำคัญ' : 'Quick facts'}>
                    {facts.map((fact) => (
                      <div key={fact.label} className="premium-project-card__fact-item">
                        <span className="premium-project-card__fact-label">{fact.label}</span>
                        <span className="premium-project-card__fact-value">{fact.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="premium-project-card__footer">
                  <span className="premium-project-card__footer-label">
                    {locale === 'th' ? 'ราคา ทำเล และ highlights อยู่บนการ์ดก่อนกด' : 'Price, location, and highlights show before you click'}
                  </span>
                  <span className="premium-project-card__cta">
                    {locale === 'th' ? 'ดูดีเทล' : 'View Details'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
