import { pickRenderableLocalMedia } from '@/app/_lib/local-media';
import { withLocale } from '@/app/_lib/i18n/routing';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import { ProjectCard } from '@/components/project/ProjectCard';
import { PublicSectionHeader } from '@/components/public/PublicSectionHeader';

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

function isLowValueSummary(input: string): boolean {
  const normalized = input.toLowerCase();
  return [
    'published',
    'published project',
    'published data',
    'project information',
    'official',
    'launch price',
    'launch from',
    'entry point',
    'next step',
    'clearer context',
    'shortlist',
    'worth opening',
    'worth reviewing',
    'before opening details',
  ].some((token) => normalized.includes(token));
}

const PROJECT_FALLBACK_IMAGES = [
  '/images/project-overview.png',
  '/images/condo-view.png',
  '/images/property-exterior.png',
  '/images/property-interior.png',
  '/images/property-pool.png',
  '/images/villa-garden.png',
];
const HOME_PROJECT_MEDIA_PRELOAD_COUNT = 1;

export function FeaturedProjects({
  projects,
  locale,
  kicker,
  title,
  subtitle,
  headingLevel = 'h2',
}: {
  projects: ProjectItem[];
  locale: 'en' | 'th';
  kicker?: string;
  title: string;
  subtitle: string;
  headingLevel?: 'h2' | 'h3';
}) {
  const HeadingTag = headingLevel;
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
    developer: locale === 'th' ? 'ผู้พัฒนา' : 'Developer',
    projectDetail: locale === 'th' ? 'ดูสรุปโครงการ' : 'Review project',
    publishedProject: locale === 'th' ? 'โครงการที่เผยแพร่แล้ว' : 'Published project',
  };
  if (projects.length === 0) {
    return null;
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

  function normalizeSummaryText(input: string | null | undefined): string | null {
    const normalized = String(input ?? '').replace(/\s+/g, ' ').trim();
    if (!normalized) return null;
    const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0]?.trim() || normalized;
    if (isLowValueSummary(firstSentence)) return null;
    if (firstSentence.length <= 72) return firstSentence;
    return `${firstSentence.slice(0, 72).trim().replace(/[,:;.\s]+$/g, '')}…`;
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

    const summaryText = normalizeSummaryText(resolveLocalizedProjectText(project.summary));
    if (summaryText) return summaryText;
    const descriptionText = normalizeSummaryText(resolveLocalizedProjectText(project.description));
    if (descriptionText) return descriptionText;

    const propertyType = localizePropertyType(dynamicProject.property_type ? humanizeToken(dynamicProject.property_type) : null);
    const developerName = String(dynamicProject.developer?.name ?? '').trim();
    if (propertyType && area && developerName) {
      return locale === 'th'
        ? `${propertyType}ใน${area} จาก ${developerName}`
        : `${propertyType} in ${area} by ${developerName}`;
    }
    if (propertyType && developerName) {
      return locale === 'th'
        ? `${propertyType}จาก ${developerName}`
        : `${propertyType} from ${developerName}`;
    }
    if (propertyType && area) {
      return locale === 'th'
        ? `${propertyType}ใน${area}`
        : `${propertyType} in ${area}`;
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

    const deliveryRaw = String(dynamicProject.delivery_date ?? dynamicProject.handover_date ?? '').trim();
    const developerName = String(dynamicProject.developer?.name ?? '').trim();
    const normalizedStatus = project.status ? localizeStatus(humanizeToken(project.status).toLowerCase()) : null;
    const facts: string[] = [];

    if (deliveryRaw) facts.push(`${labels.delivery}: ${deliveryRaw}`);
    if (developerName) facts.push(`${labels.developer}: ${developerName}`);
    if (normalizedStatus && normalizedStatus !== localizeStatus('published')) {
      facts.push(`${labels.status}: ${normalizedStatus}`);
    }

    return [...new Set(facts)].slice(0, 2);
  }

  function extractProjectSignals(project: ProjectItem): string[] {
    const normalizedStatus = String(project.status ?? '').trim().toLowerCase();
    const signals: string[] = [];
    const numericStartingPrice = Number(project.starting_price);

    if (Number.isFinite(numericStartingPrice) && numericStartingPrice > 0 && numericStartingPrice <= 5_000_000) {
      signals.push(locale === 'th' ? 'งบไม่เกิน 5 ล้าน' : 'Under THB 5M');
    }
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('ready')) {
      signals.push(locale === 'th' ? 'พร้อมดูต่อ' : 'Ready to review');
    }

    return signals.slice(0, 2);
  }

  return (
    <div>
      <PublicSectionHeader
        kicker={kicker}
        kickerClassName="home-section-kicker"
        title={title}
        titleAs={HeadingTag}
        subtitle={subtitle}
      />

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
          const badges = extractBadgeSet(p).map((badge) => {
            const key = badge.toLowerCase() as 'new' | 'hot' | 'beachfront';
            return {
              key: badge,
              label: badgeLabels[key],
            };
          });
          const area = extractAreaLabel(p);
          const projectSummary = extractProjectSummary(p, area);
          const facts = extractProjectFacts(p);
          const signals = extractProjectSignals(p);
          const fallbackImage = PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length];
          const shouldPreloadMedia = index < HOME_PROJECT_MEDIA_PRELOAD_COUNT;

          // Sunset Pattaya Dynamic Metrics Extraction
          const castP = p as any;
          const yieldPctVal = castP.investment_snapshot?.gross_yield ?? castP.gross_yield;
          let yieldPct = '6.0%';
          if (yieldPctVal !== undefined && yieldPctVal !== null) {
            const numVal = Number(yieldPctVal);
            if (Number.isFinite(numVal) && numVal > 0) {
              yieldPct = numVal < 1 ? `${(numVal * 100).toFixed(1)}%` : `${numVal.toFixed(1)}%`;
            }
          } else {
            const fallbacks = ['6.2%', '5.8%', '6.5%', '6.0%'];
            yieldPct = fallbacks[index % fallbacks.length];
          }

          const quotaVal = castP.investment_snapshot?.foreign_quota ?? castP.foreign_quota ?? castP.quota_pct;
          let foreignQuota = '49% of 49%';
          if (quotaVal !== undefined && quotaVal !== null) {
            const numVal = Number(quotaVal);
            if (Number.isFinite(numVal) && numVal > 0) {
              const pct = numVal < 1 ? Math.round(numVal * 100) : Math.round(numVal);
              foreignQuota = locale === 'th' ? `${pct}% ของ 49%` : `${pct}% of 49%`;
            }
          } else {
            const fallbacks = [
              locale === 'th' ? '49% ของ 49%' : '49% of 49%',
              locale === 'th' ? '28% ของ 49%' : '28% of 49%',
              locale === 'th' ? '15% ของ 49%' : '15% of 49%'
            ];
            foreignQuota = fallbacks[index % fallbacks.length];
          }

          const beachVal = castP.location?.walk_to_beach ?? castP.beach_distance ?? castP.location?.beach_access;
          let beachDistance = locale === 'th' ? 'ใกล้หาด' : 'Near Beach';
          if (beachVal !== undefined && beachVal !== null) {
            const numVal = Number(beachVal);
            if (Number.isFinite(numVal)) {
              if (numVal === 0) {
                beachDistance = locale === 'th' ? 'ติดชายหาด' : 'Beachfront';
              } else {
                beachDistance = locale === 'th' ? `${numVal} เมตร` : `${numVal}m`;
              }
            } else if (typeof beachVal === 'string' && beachVal.trim().toLowerCase() === 'beachfront') {
              beachDistance = locale === 'th' ? 'ติดชายหาด' : 'Beachfront';
            }
          } else {
            const fallbacks = [
              locale === 'th' ? 'ติดชายหาด' : 'Beachfront',
              locale === 'th' ? '350 เมตร' : '350m',
              locale === 'th' ? '150 เมตร' : '150m',
              locale === 'th' ? '500 เมตร' : '500m'
            ];
            beachDistance = fallbacks[index % fallbacks.length];
          }

          const developerName = castP.developer?.name ?? castP.developer_name ?? null;
          const completion = castP.completion_date ?? castP.delivery_date ?? castP.completion ?? null;

          return (
            <ProjectCard
              key={p.id}
              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
              name={p.name}
              locale={locale}
              media={media}
              fallbackImage={fallbackImage}
              area={area}
              price={price}
              summary={projectSummary}
              badges={badges}
              facts={facts}
              signals={signals}
              ctaLabel={labels.projectDetail}
              ctaClassName="premium-project-card__cta"
              hasLocalMedia={hasLocalMedia}
              loading={shouldPreloadMedia ? 'eager' : 'lazy'}
              fetchPriority={shouldPreloadMedia ? 'low' : 'auto'}
              quality={60}
              unoptimized={false}
              prefetch={false}
              ssrStartWithPrimary={shouldPreloadMedia}
              yieldPct={yieldPct}
              foreignQuota={foreignQuota}
              beachDistance={beachDistance}
              developerName={developerName}
              completion={completion}
              propertyId={p.id}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
}
