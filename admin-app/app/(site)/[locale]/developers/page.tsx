import type { Metadata } from 'next';
import Image from 'next/image';

import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { EmptyStateCard, InlineStatusMessage } from '@/components/ui/StateBlocks';
import { fetchDeveloperBySlug, fetchDevelopers, fetchProjects } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const title = locale === 'th' ? 'ผู้พัฒนาโครงการ (Developers)' : 'Developers (Pattaya)';
  const desc = locale === 'th'
    ? 'รวมผู้พัฒนาโครงการในพัทยา และลิงก์ไปยังโครงการที่เกี่ยวข้อง'
    : 'A hub of Pattaya developers with links to related projects.';
  return makePageMetadata(locale, 'developers', title, desc, dict.brand.name);
}

function toLocalDeveloperImage(input: string | null | undefined): string | null {
  const resolved = resolveImageUrl(input);
  if (!resolved) return null;
  if (resolved.startsWith('/media/')) return resolved;
  if (resolved.startsWith('/images/')) return resolved;
  if (resolved.startsWith('/uploads/')) return resolved;
  return null;
}

function pickLocalizedSummary(summary: Record<string, unknown> | null | undefined, locale: 'en' | 'th'): string {
  if (!summary) return '';
  const localized = summary[locale];
  const english = summary.en;
  const thai = summary.th;

  const stringCandidate = [localized, english, thai].find((value) => typeof value === 'string');
  if (typeof stringCandidate === 'string') return stringCandidate.trim();

  const objectCandidate = [localized, english, thai].find(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  ) as Record<string, unknown> | undefined;
  if (!objectCandidate) return '';

  const desc = objectCandidate.summary ?? objectCandidate.about ?? objectCandidate.profile;
  return typeof desc === 'string' ? desc.trim() : '';
}

function pickFocusAreas(summary: Record<string, unknown> | null | undefined, locale: 'en' | 'th'): string[] {
  if (!summary) return [];
  const localized = summary[locale];
  const english = summary.en;
  const thai = summary.th;
  const objectCandidate = [localized, english, thai].find(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  ) as Record<string, unknown> | undefined;
  if (!objectCandidate) return [];

  const focus = objectCandidate.focus_areas ?? objectCandidate.focusAreas;
  if (!Array.isArray(focus)) return [];
  return focus.map((item) => String(item).trim()).filter(Boolean);
}

export default async function DevelopersIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let developers: Awaited<ReturnType<typeof fetchDevelopers>> = [];
  let developersFetchOk = true;
  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  let projectsFetchOk = true;

  try {
    developers = await fetchDevelopers();
  } catch {
    developersFetchOk = false;
    developers = [];
  }

  try {
    projects = await fetchProjects({ limit: 200 });
  } catch {
    projectsFetchOk = false;
    projects = [];
  }

  const detailEntries = await Promise.all(
    developers.map(async (developer) => {
      const detail = await fetchDeveloperBySlug(developer.slug).catch(() => null);
      return [developer.slug, detail] as const;
    })
  );
  const detailBySlug = new Map(detailEntries);

  const projectsCountByDeveloperId = new Map<string, number>();
  for (const project of projects ?? []) {
    const developerId = String(project.developer_id ?? '').trim();
    if (!developerId) continue;
    projectsCountByDeveloperId.set(developerId, (projectsCountByDeveloperId.get(developerId) ?? 0) + 1);
  }

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'ผู้พัฒนาโครงการ' : 'Developers', href: `/${locale}/developers` },
  ];

  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? 'ผู้พัฒนาโครงการ (Developers)' : 'Developers'}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'หน้าศูนย์รวมผู้พัฒนาโครงการ — ใช้เป็นจุดเริ่มต้นก่อนเลือกโครงการ'
              : 'A developer hub to help you shortlist projects with confidence.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'รายชื่อผู้พัฒนาโครงการ' : 'Developer Directory'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'ข้อมูลหลักมาจาก developers entity โดยตรง และจะแสดงเฉพาะฟิลด์ที่มีข้อมูลจริง'
                : 'Primary source is the developers entity, and only verified fields are rendered.'}
            </p>
          </div>

          {!developersFetchOk && !projectsFetchOk ? (
            <InlineStatusMessage
              tone="error"
              message={locale === 'th'
                ? 'โหลดข้อมูลผู้พัฒนาโครงการและโครงการไม่สำเร็จ'
                : 'Unable to load developers and projects right now.'}
            />
          ) : null}

          {developers.length ? (
            <div className="grid grid-3">
              {developers.map((developer) => (
                <article key={developer.id} className="card reveal">
                  {(() => {
                    const localImage = toLocalDeveloperImage(developer.logo_url);
                    if (!localImage) {
                      return (
                        <div className="mb-4 flex h-44 items-center justify-center rounded-xl bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]">
                          {locale === 'th' ? 'ยังไม่มีโลโก้ผู้พัฒนา' : 'Developer logo coming soon'}
                        </div>
                      );
                    }

                    return (
                      <div className="relative mb-4 h-44 overflow-hidden rounded-xl bg-[var(--color-surface)]">
                        <Image
                          src={localImage}
                          alt={developer.name}
                          fill
                          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                          className="object-contain p-4"
                        />
                      </div>
                    );
                  })()}

                  <h3 className="card-title">{developer.name}</h3>
                  <p className="card-subtitle">
                    {pickLocalizedSummary(detailBySlug.get(developer.slug)?.summary, locale)
                      || (locale === 'th'
                        ? 'โปรไฟล์กำลังอัปเดตในระบบ (TODO: เติม developer summary)'
                        : 'Profile is being updated in the system (TODO: add developer summary).')}
                  </p>

                  <ul className="bullet-list mt-3">
                    <li>
                      {locale === 'th' ? 'โครงการที่เชื่อมโยง' : 'Linked projects'}: {projectsCountByDeveloperId.get(developer.id) ?? 0}
                    </li>
                    {(() => {
                      const focusAreas = pickFocusAreas(detailBySlug.get(developer.slug)?.summary, locale);
                      if (!focusAreas.length) return null;
                      return <li>{locale === 'th' ? 'โฟกัส' : 'Focus'}: {focusAreas.slice(0, 2).join(', ')}</li>;
                    })()}
                  </ul>

                  <div className="card-actions mt-4">
                    <Link href={withLocale(locale, `/developers/${encodeURIComponent(developer.slug)}`)} className="btn btn-secondary">
                      {locale === 'th' ? 'ดูข้อมูลผู้พัฒนา' : 'View developer'}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title={locale === 'th' ? 'ยังไม่มีข้อมูล Developer' : 'No developer data yet'}
              body={locale === 'th'
                ? 'สามารถดูโครงการทั้งหมดก่อน หรือคุยกับที่ปรึกษาเพื่อรับ shortlist'
                : 'Browse projects first or request a shortlist from an advisor.'}
              action={(
                <div className="cta-row">
                  <a className="btn btn-cta" href={withLocale(locale, '/projects')}>
                    {dict.nav.projects}
                  </a>
                  <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                    {dict.cta.speakToAdvisor}
                  </a>
                </div>
              )}
            />
          )}
        </Container>
      </section>
    </main>
  );
}
