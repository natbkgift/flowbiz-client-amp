import { mapProjectToPublicCardData } from '@/app/_lib/public-card-mappers';
import type { ProjectItem } from '@/app/_lib/public-api-server';
import { PublicSectionHeader } from '@/components/public/PublicSectionHeader';
import { ProjectCard as PublicProjectCard } from '@/components/public-system/components/ProjectCard';

type FeaturedProjectDynamicFields = ProjectItem & {
  area_name?: string | null;
  city?: string | null;
  completion?: string | number | null;
  completion_date?: string | null;
  delivery_date?: string | null;
  district?: string | null;
  foreign_quota?: string | number | null;
  gross_yield?: string | number | null;
  handover_date?: string | null;
  investment_snapshot?: {
    foreign_quota?: string | number | null;
    gross_yield?: string | number | null;
  } | null;
  location?: {
    beach_access?: string | number | null;
    walk_to_beach?: string | number | null;
  } | null;
  property_type?: string | null;
  quota_pct?: string | number | null;
  beach_distance?: string | number | null;
};

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
    wongamat: 'วงศ์อมาตย์',
    'wong amat': 'วงศ์อมาตย์',
    jomtien: 'จอมเทียน',
    'na jomtien': 'นาจอมเทียน',
    'north pattaya': 'พัทยาเหนือ',
    'central pattaya': 'พัทยากลาง',
    'south pattaya': 'พัทยาใต้',
    'east pattaya': 'พัทยาตะวันออก',
    pratumnak: 'พระตำหนัก',
    pratamnak: 'พระตำหนัก',
    'huay yai': 'ห้วยใหญ่',
    'bang saray': 'บางเสร่',
    pattaya: 'พัทยา',
  };

  return areaMap[normalized] ?? trimmed;
}

function trimText(value: unknown): string | null {
  const trimmed = typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
  return trimmed || null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const trimmed = trimText(value);
    if (trimmed) return trimmed;
  }
  return null;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function resolveLocalizedProjectText(
  locale: 'en' | 'th',
  input: Record<string, unknown> | null | undefined,
): string | null {
  if (!input) return null;
  for (const key of [locale, 'en', 'th']) {
    const candidate = trimText(input[key]);
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
  return `${firstSentence.slice(0, 72).trim().replace(/[,:;.\s]+$/g, '')}...`;
}

function humanizeToken(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function localizePropertyType(locale: 'en' | 'th', value: string | null): string | null {
  if (!value) return null;
  if (locale !== 'th') return value;
  return value
    .replace(/condo/gi, 'คอนโดมิเนียม')
    .replace(/villa/gi, 'วิลล่า')
    .replace(/house/gi, 'บ้าน')
    .replace(/townhome/gi, 'ทาวน์โฮม')
    .replace(/apartment/gi, 'อพาร์ตเมนต์');
}

function extractAreaLabel(locale: 'en' | 'th', project: ProjectItem): string | null {
  const dynamicProject = project as FeaturedProjectDynamicFields;
  const areaName = dynamicProject.area_name || dynamicProject.area?.name || dynamicProject.district || dynamicProject.city;
  return localizeAreaLabel(locale, areaName);
}

function extractProjectSummary(locale: 'en' | 'th', project: ProjectItem, area: string | null): string | null {
  const dynamicProject = project as FeaturedProjectDynamicFields;
  const summaryText = normalizeSummaryText(resolveLocalizedProjectText(locale, project.summary));
  if (summaryText) return summaryText;
  const descriptionText = normalizeSummaryText(resolveLocalizedProjectText(locale, project.description));
  if (descriptionText) return descriptionText;

  const propertyType = localizePropertyType(
    locale,
    dynamicProject.property_type ? humanizeToken(dynamicProject.property_type) : null,
  );
  const developerName = trimText(dynamicProject.developer?.name);
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

function localizeProjectStatus(locale: 'en' | 'th', status: string | null | undefined): string | null {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('new')) return locale === 'th' ? 'เปิดตัวใหม่' : 'New launch';
  if (normalized.includes('construction')) return locale === 'th' ? 'อยู่ระหว่างก่อสร้าง' : 'Under construction';
  if (normalized.includes('complete') || normalized.includes('ready')) return locale === 'th' ? 'พร้อมอยู่' : 'Ready';
  if (normalized.includes('sold') || normalized.includes('archived')) return locale === 'th' ? 'ปิดการขาย' : 'Sold out';
  return locale === 'th' ? 'เปิดขาย' : 'Available';
}

function formatYieldHighlight(locale: 'en' | 'th', value: unknown): string | null {
  const parsed = numberValue(value);
  if (parsed === null || parsed <= 0) return null;
  const pct = parsed < 1 ? parsed * 100 : parsed;
  return `${pct.toFixed(1)}% ${locale === 'th' ? 'ผลตอบแทน' : 'yield'}`;
}

function formatQuotaHighlight(locale: 'en' | 'th', value: unknown): string | null {
  const parsed = numberValue(value);
  if (parsed === null || parsed <= 0) return null;
  const pct = parsed < 1 ? Math.round(parsed * 100) : Math.round(parsed);
  return locale === 'th' ? `โควต้าต่างชาติ ${pct}%` : `Foreign quota ${pct}%`;
}

function formatBeachHighlight(locale: 'en' | 'th', value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = numberValue(value);
  if (numeric !== null) {
    if (numeric === 0) return locale === 'th' ? 'ติดชายหาด' : 'Beachfront';
    return locale === 'th' ? `${numeric} เมตรจากหาด` : `${numeric}m from beach`;
  }

  const text = trimText(value);
  if (!text) return null;
  return text.toLowerCase() === 'beachfront'
    ? (locale === 'th' ? 'ติดชายหาด' : 'Beachfront')
    : text;
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

  const labels = {
    projectDetail: locale === 'th' ? 'ดูสรุปโครงการ' : 'Review project',
  };
  if (projects.length === 0) {
    return null;
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
            const dynamicProject = p as FeaturedProjectDynamicFields;
            const area = extractAreaLabel(locale, p);
            const projectSummary = extractProjectSummary(locale, p, area);
            const completion = firstText(
              dynamicProject.completion_date,
              dynamicProject.delivery_date,
              dynamicProject.handover_date,
              dynamicProject.completion,
            );
            const yieldHighlight = formatYieldHighlight(
              locale,
              dynamicProject.investment_snapshot?.gross_yield ?? dynamicProject.gross_yield,
            );
            const quotaHighlight = formatQuotaHighlight(
              locale,
              dynamicProject.investment_snapshot?.foreign_quota ?? dynamicProject.foreign_quota ?? dynamicProject.quota_pct,
            );
            const beachHighlight = formatBeachHighlight(
              locale,
              dynamicProject.location?.walk_to_beach ?? dynamicProject.beach_distance ?? dynamicProject.location?.beach_access,
            );
            const highlights = [projectSummary, yieldHighlight, quotaHighlight, beachHighlight]
              .filter((item): item is string => Boolean(item));
            const fallbackImage = PROJECT_FALLBACK_IMAGES[index % PROJECT_FALLBACK_IMAGES.length];
            const shouldPreloadMedia = index < HOME_PROJECT_MEDIA_PRELOAD_COUNT;
            const publicProjectCard = mapProjectToPublicCardData(
              {
                id: p.id,
                slug: p.slug,
                name: p.name,
                starting_price: p.starting_price,
                status: p.status,
                cover_image_url: p.cover_image_url ?? undefined,
                hero_image_url: p.hero_image_url ?? undefined,
                images: p.images ?? undefined,
                location: area ?? undefined,
                status_label: localizeProjectStatus(locale, p.status) ?? undefined,
                completion: completion ?? undefined,
                highlights,
              },
              { locale },
            );

            return (
              <PublicProjectCard
                key={p.id}
                project={publicProjectCard}
                ctaLabel={labels.projectDetail}
                fallbackImageSrc={fallbackImage}
                imagePriority={shouldPreloadMedia}
                imageSizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 31vw"
              />
            );
          })}
          {/* PublicProjectCard buttons keep Link prefetch={false} through the shared Button primitive. */}
        </div>
      </div>
    </div>
  );
}
