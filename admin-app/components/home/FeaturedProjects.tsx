import Link from 'next/link';

import { pickRenderableLocalMedia } from '@/app/_lib/local-media';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

type BadgeLabel = 'New' | 'Hot' | 'Beachfront';

function localizeAreaLabel(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (locale !== 'th') return trimmed;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const areaMap: Record<string, string> = {
    'wongamat': 'วงศ์อมาตย์',
    'wong amat': 'วงศ์อมาตย์',
    'jomtien': 'จอมเทียน',
    'na jomtien': 'นาจอมเทียน',
    'north pattaya': 'พัทยาเหนือ',
    'central pattaya': 'พัทยากลาง',
    'south pattaya': 'พัทยาใต้',
    'east pattaya': 'พัทยาตะวันออก',
    'pratumnak': 'พระตำหนัก',
    'pratamnak': 'พระตำหนัก',
    'huay yai': 'ห้วยใหญ่',
    'bang saray': 'บางเสร่',
    'pattaya': 'พัทยา',
  };

  return areaMap[normalized] ?? trimmed;
}

function formatPrice(price: number, locale: 'en' | 'th'): string {
  if (!Number.isFinite(price)) return '';
  if (locale === 'th') {
    if (price >= 1_000_000) {
      const millionValue = price / 1_000_000;
      const decimals = millionValue >= 10 || Math.round(millionValue * 10) % 10 === 0 ? 0 : 1;
      return `${millionValue.toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })} ล้านบาท`;
    }
    return `${Math.round(price).toLocaleString('th-TH')} บาท`;
  }
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
    from: locale === 'th' ? 'ราคาเริ่มต้นล่าสุด' : 'From live pricing',
    status: locale === 'th' ? 'สถานะ' : 'Status',
    type: locale === 'th' ? 'ประเภท' : 'Type',
    delivery: locale === 'th' ? 'ส่งมอบ' : 'Delivery',
    developer: locale === 'th' ? 'ผู้พัฒนา' : 'Developer',
    projectDetail: locale === 'th' ? 'เปิดหน้าโครงการ' : 'Open project detail',
    publishedProject: locale === 'th' ? 'โครงการที่เผยแพร่แล้ว' : 'Published project',
    locationPrefix: locale === 'th' ? 'ทำเล' : 'Location',
  };
  const emptyStatePrimaryHref = withLocale(locale, '/projects');
  const emptyStateSecondaryHref = withLocale(locale, '/contact');
  const emptyStateSignals = locale === 'th'
    ? [
        'เปิดรายการที่เผยแพร่ล่าสุดได้ทันที',
        'ส่งโจทย์งบและทำเลให้ทีมได้เลย',
        'รับตัวเลือกที่พร้อมเช็กราคาและเอกสารต่อ',
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
    ? 'ถ้าโครงการที่เหมาะยังไม่ขึ้นบนหน้าในตอนนี้ ส่งรายละเอียดเบื้องต้นแล้วทีมจะช่วยคัดราคา ความเหมาะสม และลำดับการดูต่อให้ชัดขึ้น'
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
              body={locale === 'th' ? 'ดูโครงการที่เผยแพร่แล้วทั้งหมด หรือส่งโจทย์ให้ทีมจัดชุดโครงการที่เหมาะกับงบและเป้าหมายของคุณ' : 'Browse published developments or send your brief so the team can assemble options matched to your budget and goals.'}
              action={(
                <div className="home-project-empty__actions">
                  <Link href={emptyStatePrimaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--primary">
                    {locale === 'th' ? 'เปิดโครงการทั้งหมด' : 'Browse live projects'}
                  </Link>
                  <Link href={emptyStateSecondaryHref} prefetch={false} className="home-project-empty__action home-project-empty__action--secondary">
                    {locale === 'th' ? 'ส่งโจทย์ให้ทีม' : 'Send the team your brief'}
                  </Link>
                </div>
              )}
            />
          </div>
          <div className="home-project-empty__preview" aria-hidden="true">
            <div className="home-project-empty__preview-card">
              <span className="home-project-empty__preview-kicker">
                {locale === 'th' ? 'เส้นทางต่อจากรายการที่ยืนยันแล้ว' : 'Verified live route'}
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
    return localizeAreaLabel(locale, areaName);
  }

  function resolveLocalizedProjectText(input: Record<string, unknown> | null | undefined): string | null {
    if (!input) return null;
    for (const key of [locale, 'en', 'th']) {
      const candidate = typeof input[key] === 'string' ? input[key].trim() : '';
      if (candidate) return candidate;
    }
    return null;
  }

  function humanizeToken(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function localizePropertyType(value: string | null): string | null {
    if (!value) return null;
    if (locale !== 'th') return value;
    return value
      .replace(/condo/gi, 'คอนโดมิเนียม')
      .replace(/villa/gi, 'วิลล่า')
      .replace(/house/gi, 'บ้าน')
      .replace(/townhome/gi, 'ทาวน์โฮม')
      .replace(/apartment/gi, 'อพาร์ตเมนต์');
  }

  function localizeStatus(value: string | null): string | null {
    if (!value) return null;
    if (locale !== 'th') return value;
    if (value === 'published') return 'เผยแพร่แล้ว';
    if (value === 'draft') return 'ฉบับร่าง';
    if (value === 'archived') return 'เก็บถาวร';
    return value;
  }

  function extractProjectSummary(project: ProjectItem, area: string | null): string | null {
    const dynamicProject = project as ProjectItem & {
      property_type?: string | null;
      delivery_date?: string | null;
      handover_date?: string | null;
      developer?: { name?: string | null } | null;
    };

    const summaryText = resolveLocalizedProjectText(project.summary) || resolveLocalizedProjectText(project.description);
    if (summaryText) return summaryText;

    const propertyType = localizePropertyType(dynamicProject.property_type ? humanizeToken(dynamicProject.property_type) : null);
    const developerName = String(dynamicProject.developer?.name ?? '').trim();
    if (propertyType && area) {
      return locale === 'th'
        ? `${propertyType}ใน${area} พร้อมรายละเอียดโครงการที่เผยแพร่แล้ว`
        : `${propertyType} in ${area} with published project detail ready.`;
    }
    if (propertyType && developerName) {
      return locale === 'th'
        ? `${propertyType}จาก ${developerName} พร้อมข้อมูลโครงการที่เผยแพร่แล้ว`
        : `${propertyType} from ${developerName} with published project detail ready.`;
    }
    if (area) {
      return locale === 'th'
        ? `ดูบริบทโครงการใน${area}ก่อน แล้วค่อยเปิดราคาและยูนิตที่เกี่ยวข้องต่อ`
        : `Use the project page for ${area} context before opening pricing and related units.`;
    }
    return null;
  }

  function extractProjectFacts(project: ProjectItem): string[] {
    const dynamicProject = project as ProjectItem & {
      property_type?: string | null;
      delivery_date?: string | null;
      handover_date?: string | null;
      developer?: { name?: string | null } | null;
    };

    const propertyType = localizePropertyType(dynamicProject.property_type ? humanizeToken(dynamicProject.property_type) : null);
    const deliveryRaw = String(dynamicProject.delivery_date ?? dynamicProject.handover_date ?? '').trim();
    const developerName = String(dynamicProject.developer?.name ?? '').trim();
    const normalizedStatus = project.status ? localizeStatus(humanizeToken(project.status).toLowerCase()) : null;
    const facts: string[] = [];

    if (propertyType) facts.push(`${labels.type}: ${propertyType}`);
    if (deliveryRaw) facts.push(`${labels.delivery}: ${deliveryRaw}`);
    if (developerName) facts.push(`${labels.developer}: ${developerName}`);
    if (normalizedStatus && normalizedStatus !== localizeStatus('published')) {
      facts.push(`${labels.status}: ${normalizedStatus}`);
    }

    return [...new Set(facts)].slice(0, 3);
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
          const price = p.starting_price ? formatPrice(Number(p.starting_price), locale) : null;
          const badges = extractBadgeSet(p);
          const area = extractAreaLabel(p);
          const projectSummary = extractProjectSummary(p, area);
          const facts = extractProjectFacts(p);
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
              prefetch={false}
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
                  <span>{labels.publishedProject}</span>
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

                {projectSummary ? (
                  <p className="premium-project-card__summary line-clamp-3">
                    {projectSummary}
                  </p>
                ) : null}

                {facts.length > 0 ? (
                  <ul className="premium-project-card__facts" aria-label={locale === 'th' ? 'ข้อเท็จจริงของโครงการ' : 'Project facts'}>
                    {facts.map((fact) => (
                      <li key={fact} className="premium-project-card__fact-item">
                        <span className="premium-project-card__fact-label" aria-hidden="true">+</span>
                        <span className="premium-project-card__fact-value text-left">{fact}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="premium-project-card__footer">
                  <span className="premium-project-card__cta">
                    {labels.projectDetail}
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
