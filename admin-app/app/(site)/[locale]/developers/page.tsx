import type { Metadata } from 'next';

import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { fetchProjects } from '@/app/_lib/public-api-server';
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

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  try {
    projects = await fetchProjects({ limit: 200 });
  } catch {
    projects = [];
  }

  const ids = Array.from(
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
            <h2 className="section-title">{locale === 'th' ? 'รายชื่อ (ตัวอย่างจากข้อมูลโครงการ)' : 'List (derived from projects)'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'หากระบบยังไม่มีข้อมูล developer แบบสมบูรณ์ ให้ใช้ลิงก์นี้เป็น placeholder ก่อน'
                : 'If developer records are not fully populated yet, these links act as placeholders.'}
            </p>
          </div>

          {ids.length ? (
            <div className="grid grid-3">
              {ids.map((id) => (
                <Link key={id} href={withLocale(locale, `/developers/${encodeURIComponent(id)}`)} className="card">
                  <div className="card-title">{id}</div>
                  <div className="card-subtitle">{dict.listing.viewDetails}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-title">{locale === 'th' ? 'ยังไม่มีข้อมูล Developer' : 'No developer data yet'}</div>
              <div className="card-subtitle">
                {locale === 'th'
                  ? 'สามารถดูโครงการทั้งหมดก่อน หรือคุยกับที่ปรึกษาเพื่อรับ shortlist'
                  : 'Browse projects first or request a shortlist from an advisor.'}
              </div>
              <div className="cta-row">
                <a className="btn btn-cta" href={withLocale(locale, '/projects')}>
                  {dict.nav.projects}
                </a>
                <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                  {dict.cta.speakToAdvisor}
                </a>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
