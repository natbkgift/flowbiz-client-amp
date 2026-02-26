import type { Metadata } from 'next';

import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { EmptyStateCard, InlineStatusMessage } from '@/components/ui/StateBlocks';
import { fetchDevelopers, fetchProjects } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

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

export default async function DevelopersIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  let developers: Awaited<ReturnType<typeof fetchDevelopers>>;
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

  const fallbackIds = Array.from(
    new Set((projects ?? []).map((p) => String(p.developer_id ?? '').trim()).filter(Boolean))
  ).slice(0, 30);

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
                ? 'ข้อมูลหลักมาจาก developers entity โดยตรง; หากยังไม่ครบ ระบบจะ fallback จาก projects ชั่วคราว'
                : 'Primary source is the developers entity; if incomplete, temporary fallback is derived from projects.'}
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
                <Link key={developer.id} href={withLocale(locale, `/developers/${encodeURIComponent(developer.slug)}`)} className="card">
                  <div className="card-title">{developer.name}</div>
                  <div className="card-subtitle">{developer.tier ?? dict.listing.viewDetails}</div>
                </Link>
              ))}
            </div>
          ) : fallbackIds.length ? (
            <div className="grid grid-3">
              {fallbackIds.map((id) => (
                <Link key={id} href={withLocale(locale, `/developers/${encodeURIComponent(id)}`)} className="card">
                  <div className="card-title">{id}</div>
                  <div className="card-subtitle">
                    {locale === 'th' ? 'Fallback จาก projects (TODO: เติม developers entity)' : 'Fallback from projects (TODO: populate developers entity)'}
                  </div>
                </Link>
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
