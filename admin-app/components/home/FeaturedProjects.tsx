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
    from: locale === 'th' ? 'ราคา live เริ่มต้น' : 'From live pricing',
    status: locale === 'th' ? 'สถานะ' : 'Status',
    type: locale === 'th' ? 'ประเภท' : 'Type',
    delivery: locale === 'th' ? 'ส่งมอบ' : 'Delivery',
    curatedLabel: locale === 'th' ? 'พร้อมเปิดดูต่อ' : 'Shortlist ready',
    locationPrefix: locale === 'th' ? 'ทำเล' : 'Location',
  };
  const emptyStatePrimaryHref = withLocale(locale, '/projects');
  const emptyStateSecondaryHref = withLocale(locale, '/contact');
  const emptyStateSignals = locale === 'th'
    ? [
        'เปิดรายการที่เผยแพร่ล่าสุดได้ทันที',
        'ส่งโจทย์งบและทำเลให้ทีมได้เลย',
        'รับตัวเลือกที่พร้อมเช็กราคาต่อ',
      ]
    : [
        'Open the latest published inventory instantly',
        'Send the team your budget and location brief',
        'Get matched options ready for price checks',
      ];
  const emptyStatePreviewTitle = locale === 'th'
    ? 'ทีมจะคัดโครงการที่ควรเปิดก่อนให้คุณ'
    : 'The team will line up the next projects worth opening';
  const emptyStatePreviewBody = locale === 'th'
    ? 'ถ้าโครงการที่เหมาะยังไม่ขึ้นบนหน้าในตอนนี้ ส่ง brief แล้วทีมจะช่วยคัดราคา fit และ next step ที่ควรทำต่อ'
    : 'If the right launch is not already surfaced, send the brief and get pricing, fit, and the clearest next step in one reply.';

  if (projects.length === 0) {
    return (
      <div>
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="home-project-empty reveal">
          <div className="home-project-empty__copy">
            <p className="home-project-empty__eyebrow">
              {locale === 'th' ? 'โต๊ะคัดโครงการของ AMP' : 'AMP advisory desk'}
            </p>
            <EmptyStateCard
              className="premium-empty-state home-project-empty__card"
              title={locale === 'th' ? 'ให้ทีมช่วยคัดรายการล่าสุดให้คุณ' : 'Ask the team for today\'s matched picks'}
              body={locale === 'th' ? 'ดูโครงการที่เผยแพร่แล้วทั้งหมด หรือส่ง brief ให้ทีมจัดชุดโครงการที่เหมาะกับงบและเป้าหมายของคุณ' : 'Browse published developments or send your brief so the team can assemble options matched to your budget and goals.'}
              action={(
                <div className="home-project-empty__actions">
                  <Link href={emptyStatePrimaryHref} className="home-project-empty__action home-project-empty__action--primary">
                    {locale === 'th' ? 'เปิดโครงการทั้งหมด' : 'Browse live projects'}
                  </Link>
                  <Link href={emptyStateSecondaryHref} className="home-project-empty__action home-project-empty__action--secondary">
                    {locale === 'th' ? 'ส่งโจทย์ให้ทีม' : 'Send the team your brief'}
                  </Link>
                </div>
              )}
            />
          </div>
          <div className="home-project-empty__preview" aria-hidden="true">
            <div className="home-project-empty__preview-card">
              <span className="home-project-empty__preview-kicker">
                {locale === 'th' ? 'เส้นทางต่อจาก stock ที่ตรวจแล้ว' : 'Verified live handoff'}
              </span>
              <strong className="home-project-empty__preview-title">{emptyStatePreviewTitle}</strong>
              <p className="home-project-empty__preview-body">{emptyStatePreviewBody}</p>
              <div className="home-project-empty__signal-list">
                {emptyStateSignals.map((item) => (
                  <span key={item} className="home-project-empty__signal">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
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

  function extractProjectHighlights(project: ProjectItem, area: string | null, decisionSignals: string[], index: number): string[] {
    const dynamicProject = project as ProjectItem & {
      property_type?: string | null;
      delivery_date?: string | null;
      handover_date?: string | null;
    };

    const normalizedStatus = project.status ? project.status.replace(/_/g, ' ') : null;
    const propertyType = dynamicProject.property_type ? String(dynamicProject.property_type).replace(/_/g, ' ') : null;
    const deliveryRaw = dynamicProject.delivery_date || dynamicProject.handover_date;
    const highlights: string[] = [];

    if (decisionSignals.includes(locale === 'th' ? 'High ROI' : 'High ROI')) {
      highlights.push(locale === 'th' ? 'เหมาะกับสายผลตอบแทนและปล่อยเช่า' : 'High rental-demand fit for ROI-led shortlists.');
    }
    if (decisionSignals.includes(locale === 'th' ? 'Sea View' : 'Sea View')) {
      highlights.push(locale === 'th' ? 'วิวทะเลที่ช่วยทั้งอยู่อาศัยและ resale' : 'Sea-view positioning with stronger resale appeal.');
    }
    if (!highlights.length) {
      highlights.push(
        index === 0
          ? (locale === 'th' ? 'ตัวเลือกแรกที่ควรเปิดเมื่อเริ่มคัดโครงการ' : 'A strong first shortlist option.')
          : (locale === 'th' ? 'เหมาะกับการเทียบราคา ทำเล และจังหวะเข้าดู' : 'Useful for fast price-and-location comparison.'),
      );
    }
    if (normalizedStatus) {
      highlights.push(`${labels.status}: ${normalizedStatus}`);
    } else if (propertyType) {
      highlights.push(locale === 'th' ? `${propertyType} พร้อมรายละเอียดโครงการที่ยืนยันแล้ว` : `${propertyType} with verified project detail ready.`);
    }
    if (deliveryRaw) {
      highlights.push(`${labels.delivery}: ${deliveryRaw}`);
    } else if (area) {
      highlights.push(locale === 'th' ? `ดูยูนิต ราคา current และแปลนของ ${area}` : `Live units, pricing, and plans in ${area}.`);
    }

    return [...new Set(highlights)].slice(0, 2);
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
        <div className="home-section-collection-tag">
          {locale === 'th' ? 'โครงการคัดสรรของ AMP' : 'AMP curated shortlist'}
        </div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>

        <div className="home-project-grid-shell">
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
          const area = extractAreaLabel(p);
          const decisionSignals = extractDecisionSignals(p, index, area);
          const highlights = extractProjectHighlights(p, area, decisionSignals, index);
          const fallbackImage = PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length];
          const cardVariantClass = index === 0
            ? 'premium-project-card--lead'
            : index < 3
              ? 'premium-project-card--priority'
              : 'premium-project-card--standard';

          return (
            <Link
              key={p.id}
              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
              className={`premium-project-card ${cardVariantClass} reveal card-interactive`}
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
                  {area ? <p className="premium-project-card__area">{labels.locationPrefix} • {area}</p> : null}
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

                {highlights.length > 0 ? (
                  <ul className="premium-project-card__facts" aria-label={locale === 'th' ? 'เหตุผลที่ควรเปิดดูต่อ' : 'Why this belongs on a shortlist'}>
                    {highlights.map((highlight) => (
                      <li key={highlight} className="premium-project-card__fact-item">
                        <span className="premium-project-card__fact-label" aria-hidden="true">+</span>
                        <span className="premium-project-card__fact-value text-left">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="premium-project-card__footer">
                  <span className="premium-project-card__footer-label">
                    {locale === 'th' ? 'ยูนิต ราคา current และแปลน' : 'Live units, pricing, and floor plans'}
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
    </div>
  );
}
