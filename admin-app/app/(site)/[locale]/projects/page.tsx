import type { Metadata } from 'next';
import Link from 'next/link';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { withLocale } from '@/app/_lib/i18n/routing';
import { Container } from '@/components/layout/Container';
import { fetchProjects } from '@/app/_lib/public-api-server';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = dict.projectsPage;
  return makePageMetadata(
    locale,
    'projects',
    copy.metadataTitle,
    copy.metadataDescription,
    dict.brand.name
  );
}

const PROJECTS_FETCH_TIMEOUT_MS = 8000;
type ProjectsLoadState =
  | { kind: 'loaded'; value: Awaited<ReturnType<typeof fetchProjects>> }
  | { kind: 'timeout' };

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = PROJECTS_FETCH_TIMEOUT_MS): Promise<T> {
  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  }
}

function formatCompactPrice(value: number | null | undefined, locale: 'en' | 'th'): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  if (locale === 'th') {
    if (value >= 1_000_000) {
      const millionValue = value / 1_000_000;
      const decimals = millionValue >= 10 || Math.round(millionValue * 10) % 10 === 0 ? 0 : 1;
      return `${millionValue.toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })} ล้านบาท`;
    }
    return `${Math.round(value).toLocaleString('th-TH')} บาท`;
  }
  return `THB ${Math.round(value).toLocaleString()}`;
}

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
    'nong plalai': 'หนองปลาไหล',
    'pattaya': 'พัทยา',
  };

  return areaMap[normalized] ?? trimmed;
}

function localizeProjectStatus(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (locale !== 'th') return normalized;

  if (normalized === 'published') return 'เผยแพร่แล้ว';
  if (normalized === 'draft') return 'ฉบับร่าง';
  if (normalized === 'archived') return 'เก็บถาวร';
  return normalized;
}

function resolveProjectArea(project: Record<string, unknown>): string | null {
  const directArea = typeof project.area_name === 'string' ? project.area_name.trim() : '';
  if (directArea) return directArea;
  const area = project.area;
  if (area && typeof area === 'object' && typeof (area as { name?: unknown }).name === 'string') {
    const nestedName = String((area as { name?: unknown }).name).trim();
    if (nestedName) return nestedName;
  }
  const district = typeof project.district === 'string' ? project.district.trim() : '';
  if (district) return district;
  const city = typeof project.city === 'string' ? project.city.trim() : '';
  return city || null;
}

function resolveLocalizedText(locale: 'en' | 'th', value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  for (const key of [locale, 'en', 'th']) {
    const candidate = typeof row[key] === 'string' ? row[key].trim() : '';
    if (candidate) return candidate;
  }
  return null;
}

function isLowValueSummary(input: string): boolean {
  const normalized = input.toLowerCase();
  return [
    'published project',
    'published data',
    'project information',
    'next step',
    'clearer context',
    'shortlist',
    'worth opening',
    'worth reviewing',
    'before opening details',
  ].some((token) => normalized.includes(token));
}

function summarizeProject(locale: 'en' | 'th', project: Record<string, unknown>): string | null {
  const localizedSummary = resolveLocalizedText(locale, project.summary);
  const localizedDescription = resolveLocalizedText(locale, project.description);
  const candidate = String(localizedSummary || localizedDescription || '').replace(/\s+/g, ' ').trim();
  if (!candidate) return null;
  const firstSentence = candidate.split(/(?<=[.!?])\s+/)[0]?.trim() || candidate;
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

function applyCountTemplate(template: string, count: number): string {
  return template.replace('{count}', String(count));
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

function extractProjectFacts(locale: 'en' | 'th', project: Record<string, unknown>): string[] {
  const propertyType = localizePropertyType(
    locale,
    typeof project.property_type === 'string' ? humanizeToken(project.property_type) : null,
  );
  const deliveryRaw = typeof project.delivery_date === 'string'
    ? project.delivery_date.trim()
    : typeof project.handover_date === 'string'
      ? project.handover_date.trim()
      : '';
  const developerName = project.developer && typeof project.developer === 'object' && typeof (project.developer as { name?: unknown }).name === 'string'
    ? String((project.developer as { name?: unknown }).name).trim()
    : '';

  const facts: string[] = [];
  if (propertyType) facts.push(propertyType);
  if (developerName) facts.push(locale === 'th' ? `ผู้พัฒนา ${developerName}` : `Developer ${developerName}`);
  if (deliveryRaw) facts.push(locale === 'th' ? `กำหนดแล้วเสร็จ ${deliveryRaw}` : `Delivery ${deliveryRaw}`);
  return [...new Set(facts)].slice(0, 2);
}

export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = dict.projectsPage;
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects`;

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  let projectsFetchOk = true;
  const projectsResult = await withTimeout<ProjectsLoadState>(
    fetchProjects({ limit: 100 }).then((value) => ({ kind: 'loaded', value })),
    { kind: 'timeout' },
  );
  projects = projectsResult.kind === 'loaded' ? projectsResult.value : [];
  if (projectsResult.kind !== 'loaded' || projects.length === 0) {
    projectsFetchOk = false;
  }
  if (projects.length) {
    const sorted = [...projects].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || (a.slug ?? '').localeCompare(b.slug ?? ''));
    const liveEntryPrice = sorted
      .map((project) => project.starting_price)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
      .sort((left, right) => left - right)[0] ?? null;
    const luxuryProjectCount = sorted.filter((project) =>
      typeof project.starting_price === 'number' && Number.isFinite(project.starting_price) && project.starting_price >= 10_000_000
    ).length;
    const projectProofs = [
      applyCountTemplate(copy.proofs.publishedProjectsTemplate, sorted.length),
      advisoryProofs[1] ?? null,
      liveEntryPrice ? `${copy.proofs.entryFromPrefix} ${formatCompactPrice(liveEntryPrice, locale)}` : null,
      luxuryProjectCount > 0 ? applyCountTemplate(copy.proofs.luxuryProjectsTemplate, luxuryProjectCount) : null,
      advisoryProofs[2] ?? null,
    ].filter((item): item is string => Boolean(item)).slice(0, 3);
    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: dict.nav.projects,
        url: canonicalUrl,
        itemListElement: sorted.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.name,
          url: `${siteUrl}/${locale}/projects/${encodeURIComponent(p.slug)}`,
        })),
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      null,
      0
    );

    return (
      <main id="main-content" className="page-template--catalogue projects-page decision-page--confidence">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <PublicAdvisoryHero
          eyebrow={copy.hero.eyebrow}
          title={copy.hero.title}
          subtitle={copy.hero.subtitle}
          proofs={projectProofs}
          supportNote={copy.hero.supportNote}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
            label: copy.hero.primaryActionLabel,
            eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
            prefetch: false,
          }}
          secondaryAction={{
            href: withLocale(locale, '/smart-finder'),
            label: dict.advisory.useSmartFinder,
            eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
            prefetch: false,
          }}
        />
        <section className="section projects-catalogue-section">
        <Container variant="wide">
          <div className="card-actions mb-4">
            <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')} prefetch={false}>
              {copy.browseListingsLabel}
            </Link>
          </div>
          <div className="grid grid-3 projects-catalogue-grid">
            {sorted.map((p, index) => {
              const area = localizeAreaLabel(locale, resolveProjectArea(p as unknown as Record<string, unknown>)) || copy.card.areaFallback;
              const hasEntryPrice = Boolean(p.starting_price && Number.isFinite(p.starting_price));
              const localizedStatus = localizeProjectStatus(locale, p.status);
              const summary = summarizeProject(locale, p as unknown as Record<string, unknown>);
              const facts = extractProjectFacts(locale, p as unknown as Record<string, unknown>);
              return (
                <article
                  key={p.id}
                  className="card catalogue-card project-catalogue-card"
                >
                  <div className="card-image project-catalogue-card__visual">
                    <LocalMediaImage
                      media={{
                        cover_image_url: p.cover_image_url,
                        hero_image_url: p.hero_image_url,
                        images: p.images,
                      }}
                      alt={p.name}
                      className="media-shell project-catalogue-card__media"
                      imageClassName="media-shell__img"
                      aspectRatio="16 / 9"
                    />
                    <div className="project-catalogue-card__media-scrim" aria-hidden="true" />
                    <div className="project-catalogue-card__chips">
                      {area ? <span className="project-catalogue-card__chip">{area}</span> : null}
                      {hasEntryPrice ? (
                        <span className="project-catalogue-card__chip project-catalogue-card__chip--value">
                          {`${copy.card.entryLabel} ${formatCompactPrice(p.starting_price ?? null, locale)}`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="project-catalogue-card__copy">
                    <div className="catalogue-card__eyebrow project-catalogue-card__eyebrow">
                      {localizedStatus
                        ? `${copy.card.statusLabel} • ${localizedStatus}`
                        : copy.card.publishedStatus}
                    </div>
                    <h2 className="card-title project-catalogue-card__title">{p.name}</h2>
                    {summary ? <p className="card-subtitle project-catalogue-card__summary">{summary}</p> : null}
                    {facts.length > 0 ? (
                      <div className="catalogue-card__meta project-catalogue-card__meta">
                        {facts.map((fact) => (
                          <span key={`${p.id}-${fact}`}>{fact}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="card-actions project-catalogue-card__actions">
                      <Link className="btn btn-secondary" href={`/${locale}/projects/${p.slug}`} prefetch={false}>
                        {copy.card.reviewAction}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
        </section>
      </main>
    );
  }

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: dict.nav.projects,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: dict.brand.name,
        url: siteUrl,
      },
    },
    null,
    0
  );

  return (
    <main id="main-content" className="page-template--catalogue projects-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicAdvisoryHero
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        subtitle={copy.hero.emptySubtitle}
        proofs={[
          copy.proofs.verifiedData,
          copy.proofs.advisorSupport,
        ]}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
          label: locale === 'th' ? 'คุยกับที่ปรึกษา' : dict.cta.speakToAdvisor,
          eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
          prefetch: false,
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
          prefetch: false,
        }}
      />
        <section className="section">
      <Container variant="wide">
        <div className="section-header mb-6">
          <h2 className="section-title">{copy.empty.sectionTitle}</h2>
          <p className="section-subtitle">{copy.empty.sectionSubtitle}</p>
        </div>
        <EmptyStateCard
          title={projectsFetchOk ? dict.advisory.noPublishedDataTitle : copy.empty.cardTitle}
          body={projectsFetchOk
            ? dict.advisory.noPublishedDataBody
            : copy.empty.cardBody}
          action={
            <Link className="btn btn-secondary" href={withLocale(locale, '/contact')} prefetch={false}>
              {dict.cta.speakToAdvisor}
            </Link>
          }
        />
      </Container>
      </section>
    </main>
  );
}
