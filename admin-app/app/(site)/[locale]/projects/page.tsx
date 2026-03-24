import type { Metadata } from 'next';
import Link from 'next/link';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
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
  return makePageMetadata(locale, 'projects', dict.nav.projects, dict.listing.exploreProjectsDesc, dict.brand.name);
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

function formatCompactPrice(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return `THB ${Math.round(value).toLocaleString()}`;
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

export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
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
      locale === 'th' ? `${sorted.length} โครงการที่เผยแพร่แล้ว` : `${sorted.length} published projects`,
      liveEntryPrice ? `${locale === 'th' ? 'เริ่มต้น' : 'Entry from'} ${formatCompactPrice(liveEntryPrice)}` : null,
      luxuryProjectCount > 0 ? (locale === 'th' ? `${luxuryProjectCount} luxury-led projects` : `${luxuryProjectCount} luxury-led projects`) : null,
      ...advisoryProofs,
    ].filter((item): item is string => Boolean(item)).slice(0, 4);
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
      <main id="main-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={locale === 'th' ? 'Published Pattaya projects, arranged for real decisions' : 'Published Pattaya projects, arranged for real decisions'}
          subtitle={locale === 'th'
            ? 'ใช้หน้านี้เพื่อเริ่มจากโครงการที่เผยแพร่แล้ว เห็นราคาเริ่มต้นเท่าที่มี และ handoff ไปยัง compare, shortlist, หรือ private tour ได้ทันที'
            : 'Use this page to start from published developments, see live entry pricing where available, and move straight into compare, shortlist, or a private tour.'}
          proofs={projectProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจาก inventory ที่เผยแพร่แล้วจริง' : 'Buyers who want to start from genuinely published inventory',
              body: locale === 'th'
                ? 'หน้านี้ควรเป็นฐานเริ่มต้นของ compare, smart finder, และการคุยกับทีม ไม่ใช่แค่รายการชื่อโครงการ'
                : 'This page should be the working base for compare, smart finder, and team handoff, not just a list of project names.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'เลือกจากโครงการ แล้วค่อยขยับไปยังยูนิตหรือ private tour' : 'Choose the development first, then move into units or a private tour',
              body: locale === 'th'
                ? 'หากยังไม่ชัดเรื่องทำเลหรือ strategy ให้ไปต่อที่ Smart Finder หรือให้ทีมคัด shortlist ต่อจากบริบทนี้'
                : 'If the area or strategy is still unclear, continue into Smart Finder or let the team narrow the shortlist from this context.',
              icon: 'check',
            },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทุกการ์ดควรบอกให้พอว่าจะคุยต่อหรือคัดออก' : 'Each card should give enough context to continue or cut',
            body: locale === 'th'
              ? 'เราเก็บ route สู่ shortlist และ team handoff ให้ชัด แม้บางโครงการยังไม่มีราคาเริ่มต้นครบ'
              : 'The shortlist and team-handoff route stays visible even when some projects still need direct pricing confirmation.',
            icon: 'shield',
          },
          ]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
            label: dict.cta.speakToAdvisor,
            eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/smart-finder'),
            label: dict.advisory.useSmartFinder,
            eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
          }}
        />
        <section className="section">
        <Container>
          <div className="section-header mb-6">
            <h2 className="section-title">{locale === 'th' ? 'Project catalogue' : 'Project catalogue'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'เรียง inventory ที่เผยแพร่แล้วเพื่อให้คุณเห็นทำเล ราคาเริ่มต้น และเส้นทาง handoff เร็วขึ้น'
                : 'Published inventory arranged so you can scan location, entry pricing, and the next handoff faster.'}
            </p>
          </div>

          <div className="cta-strip mb-6">
            <div className="cta-strip__text">
              {locale === 'th'
                ? 'ถ้าต้องการไล่จากยูนิตจริงหรือเริ่มจาก private tour route ให้ขยับต่อจากตรงนี้ได้ทันที'
                : 'If you want to move from development-level browsing into real units or a private-tour handoff, use the next action here.'}
            </div>
            <div className="cta-row">
              <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                {locale === 'th' ? 'ดู shortlist-ready listings' : 'Browse shortlist-ready listings'}
              </Link>
              <Link className="btn btn-tertiary" href={withLocaleQuery(locale, '/contact', { topic: 'private_tour', source: 'projects_catalogue' })}>
                {locale === 'th' ? 'Book private tour' : 'Book private tour'}
              </Link>
            </div>
          </div>

          <div className="grid grid-3">
            {sorted.map((p) => (
              <article key={p.id} className="card catalogue-card">
                <LocalMediaImage
                  media={{
                    cover_image_url: p.cover_image_url,
                    hero_image_url: p.hero_image_url,
                    images: p.images,
                  }}
                  alt={p.name}
                  className="media-shell"
                  imageClassName="media-shell__img"
                  aspectRatio="16 / 10"
                />
                <div className="catalogue-card__eyebrow">
                  {resolveProjectArea(p as unknown as Record<string, unknown>) || (locale === 'th' ? 'Published project' : 'Published project')}
                </div>
                <h2 className="card-title">{p.name}</h2>
                <p className="card-subtitle">
                  {p.status?.trim()
                    ? locale === 'th'
                      ? `Status: ${p.status} · ${resolveProjectArea(p as unknown as Record<string, unknown>) || 'Pattaya'}`
                      : `Status: ${p.status} · ${resolveProjectArea(p as unknown as Record<string, unknown>) || 'Pattaya'}`
                    : locale === 'th'
                      ? `ใช้ต่อสำหรับ shortlist, compare, และ team handoff · ${resolveProjectArea(p as unknown as Record<string, unknown>) || 'Pattaya'}`
                      : `Ready for shortlist, compare, and team handoff · ${resolveProjectArea(p as unknown as Record<string, unknown>) || 'Pattaya'}`}
                </p>
                <div className="catalogue-card__meta">
                  <span>
                    {p.starting_price && Number.isFinite(p.starting_price)
                      ? `${locale === 'th' ? 'Entry from' : 'Entry from'} ${formatCompactPrice(p.starting_price)}`
                      : locale === 'th'
                        ? 'Price on request · verify unit mix with the team'
                        : 'Price on request · verify unit mix with the team'}
                  </span>
                </div>
                <div className="card-actions">
                  <Link className="btn btn-secondary" href={`/${locale}/projects/${p.slug}`}>
                    {dict.listing.viewDetails}
                  </Link>
                  <Link
                    className="btn btn-tertiary"
                    href={withLocaleQuery(locale, '/contact', {
                      intent: 'project_shortlist',
                      source: 'projects_grid',
                      project: p.slug,
                    })}
                  >
                    {dict.cta.speakToAdvisor}
                  </Link>
                </div>
              </article>
            ))}
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
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.nav.projects}
        subtitle={dict.listing.projectsSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ใช้ที่กำลังเริ่มจากภาพรวมโครงการ' : 'Visitors starting from a project-level overview',
            body: locale === 'th'
              ? 'หน้านี้จัดภาพรวมโครงการให้พร้อมสำหรับการคัดรายการต่อจากบรีฟของคุณ'
              : 'The page turns the project overview into a usable shortlist starting point for your brief.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ใช้รายการนี้เป็นจุดเริ่มต้นของการคัดรายการ' : 'Use the list as the shortlist starting point',
            body: locale === 'th'
              ? 'เปิดดูรายละเอียดโครงการ หรือส่งบริบทต่อไปยังทีมเพื่อคัดตัวเลือกเร็วขึ้น'
              : 'Open a project detail page or hand your context to the team to narrow faster.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'หน้านี้ยังยึดกับรายการจริงในระบบ' : 'This page stays grounded in live inventory context',
            body: locale === 'th'
              ? 'คุณจะถูกพาไปยังขั้นตอนถัดไปที่เหมาะ ไม่ว่าจะเป็นดูรายละเอียดโครงการหรือให้ทีมช่วยคัดต่อ'
              : 'You are routed into the best next move, whether that is a live project page or a concierge shortlist.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <section className="section">
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{dict.nav.projects}</h1>
          <p className="section-subtitle">{dict.listing.projectsSubtitle}</p>
        </div>
        <EmptyStateCard
          title={dict.advisory.noPublishedDataTitle}
          body={projectsFetchOk
            ? dict.advisory.noPublishedDataBody
            : (locale === 'th'
              ? 'ไม่สามารถโหลดรายการโครงการที่เผยแพร่ได้ในขณะนี้ หน้านี้จึงไม่แสดง fallback ที่อาจทำให้เข้าใจว่าเป็นโครงการจริง'
              : 'Published project data could not be loaded right now, so this page intentionally avoids showing a misleading fallback.')}
          action={
            <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          }
        />
      </Container>
      </section>
    </main>
  );
}

