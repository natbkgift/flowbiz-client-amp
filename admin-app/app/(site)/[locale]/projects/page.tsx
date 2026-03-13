import type { Metadata } from 'next';
import Link from 'next/link';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { withLocale } from '@/app/_lib/i18n/routing';
import { Container } from '@/components/layout/Container';
import { fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

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

type ProjectRow = { name: string; count: number };
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
  const startedAt = Date.now();
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
          title={dict.nav.projects}
          subtitle={dict.listing.exploreProjectsDesc}
          proofs={advisoryProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: locale === 'th' ? 'ผู้ซื้อที่ต้องการดู inventory ที่ตรวจสอบแล้ว' : 'Buyers who want verified published inventory',
              body: locale === 'th'
                ? 'หน้านี้คือคลังโครงการที่ใช้ต่อยอดไปยัง compare, smart finder, และ consultation'
                : 'This page is the working inventory base for compare, smart finder, and advisory consultation.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'เริ่มจากดูโครงการ แล้วค่อยคัด shortlist' : 'Browse projects first, then shortlist',
              body: locale === 'th'
                ? 'หากยังไม่แน่ใจเรื่องทำเลหรือกลยุทธ์ ให้ไปต่อที่ Smart Finder หรือคุยกับทีม'
                : 'If the area or strategy is still unclear, move next into Smart Finder or speak with the team.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'เราดันเฉพาะ inventory ที่เผยแพร่จริง' : 'Only published inventory is surfaced here',
              body: locale === 'th'
                ? 'ถ้ายังไม่มีโครงการ เราจะแสดง state ว่างอย่างชัดเจนแทนการยัด placeholder'
                : 'If there is no published inventory, the page shows a clear empty editorial state instead of fake placeholders.',
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
            <p className="section-subtitle">{dict.listing.publishedProjects}</p>
          </div>

          <div className="grid grid-3">
            {sorted.map((p) => (
              <article key={p.id} className="card catalogue-card">
                <div className="catalogue-card__eyebrow">
                  {locale === 'th' ? 'โครงการที่เผยแพร่แล้ว' : 'Published project'}
                </div>
                <h2 className="card-title">{p.name}</h2>
                <p className="card-subtitle">
                  {p.status?.trim()
                    ? locale === 'th'
                      ? `สถานะ: ${p.status}`
                      : `Status: ${p.status}`
                    : locale === 'th'
                      ? 'พร้อมใช้ต่อสำหรับ shortlist และการเปรียบเทียบ'
                      : 'Ready for shortlist and comparison work.'}
                </p>
                <div className="catalogue-card__meta">
                  <span>
                    {p.starting_price && Number.isFinite(p.starting_price)
                      ? locale === 'th'
                        ? `เริ่ม ${Math.round(p.starting_price).toLocaleString()} บาท`
                        : `From THB ${Math.round(p.starting_price).toLocaleString()}`
                      : locale === 'th'
                        ? 'ขอราคาและ unit mix จากที่ปรึกษา'
                        : 'Ask the advisor for pricing and unit mix.'}
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

  const projectsElapsedMs = Date.now() - startedAt;
  const shouldAttemptPropertyFallback = projectsFetchOk && projectsElapsedMs < 20_000;

  const res: Awaited<ReturnType<typeof fetchProperties>> = shouldAttemptPropertyFallback
    ? await withTimeout(
        fetchProperties({ limit: 100, sort: 'newest' }),
        { data: [], meta: { page: 1, limit: 100, total: 0 } },
      )
    : { data: [], meta: { page: 1, limit: 100, total: 0 } };

  const byName = new Map<string, number>();
  for (const p of res.data ?? []) {
    const name = (p.address || '').trim();
    if (!name) continue;
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }

  const rows: ProjectRow[] = Array.from(byName.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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
              ? 'แม้ snapshot นี้ยังไม่ครบ ระบบจะแสดงเฉพาะสิ่งที่ตีความได้จากข้อมูลจริง'
              : 'Even when the snapshot is incomplete, the page only shows what can be grounded in real system data.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ใช้รายการนี้เป็นจุดเริ่มต้นของ shortlist' : 'Use the list as the shortlist starting point',
            body: locale === 'th'
              ? 'เปิดดูรายละเอียดโครงการ หรือส่งบริบทต่อไปยังทีมเพื่อคัดตัวเลือกเร็วขึ้น'
              : 'Open a project detail page or hand your context to the team to narrow faster.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ไม่มีข้อมูลก็แสดงตรงไปตรงมา' : 'No data is shown transparently',
            body: locale === 'th'
              ? 'ถ้ายังไม่มีโครงการเผยแพร่ หน้านี้จะไม่แกล้งทำเป็นมีข้อมูล'
              : 'If there is no published inventory, the page will say so clearly instead of pretending otherwise.',
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

        {rows.length ? (
          <div className="grid grid-3">
            {rows.map((r) => (
              <article key={r.name} className="card catalogue-card">
                <div className="catalogue-card__eyebrow">
                  {locale === 'th' ? 'ภาพรวมจาก inventory ที่เผยแพร่แล้ว' : 'Published inventory signal'}
                </div>
                <h2 className="card-title">{r.name}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? `พบ ${r.count} รายการที่เกี่ยวข้องใน inventory ปัจจุบัน`
                    : `${r.count} related listing(s) found in the current inventory.`}
                </p>
                <div className="catalogue-card__meta">
                  <span>
                    {locale === 'th'
                      ? 'ใช้หน้านี้เป็นจุดเริ่มต้นก่อนให้ทีมคัด shortlist ที่ตรงงบและกลยุทธ์'
                      : 'Use this as the starting signal before the team prepares a tighter shortlist.'}
                  </span>
                </div>
                <div className="card-actions">
                  <Link
                    className="btn btn-secondary"
                    href={withLocaleQuery(locale, '/contact', {
                      intent: 'project_shortlist',
                      source: 'projects_inventory',
                      project: r.name,
                    })}
                  >
                    {dict.cta.speakToAdvisor}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title={dict.advisory.noPublishedDataTitle}
            body={dict.advisory.noPublishedDataBody}
            action={
              <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </a>
            }
          />
        )}
      </Container>
      </section>
    </main>
  );
}

