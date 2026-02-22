import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { ProjectCard } from '@/components/project/ProjectCard';
import { fetchProjects } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const title = locale === 'th'
    ? `ผู้พัฒนาโครงการ: ${params.slug}`
    : `Developer: ${params.slug}`;
  const desc = locale === 'th'
    ? 'ดูโครงการที่เกี่ยวข้องและขอคำแนะนำจากที่ปรึกษา'
    : 'Browse related projects and request advice from an advisor.';
  return makePageMetadata(locale, `developers/${params.slug}`, title, desc, dict.brand.name);
}

export default async function DeveloperDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'ผู้พัฒนาโครงการ' : 'Developers', href: `/${locale}/developers` },
    { label: params.slug, href: `/${locale}/developers/${encodeURIComponent(params.slug)}` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  try {
    projects = await fetchProjects({ limit: 200 });
  } catch {
    projects = [];
  }

  const related = (projects ?? []).filter((p) => String(p.developer_id ?? '').trim() === params.slug);

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? `ผู้พัฒนาโครงการ: ${params.slug}` : `Developer: ${params.slug}`}</h1>
          <p className="subhead">
            {locale === 'th'
              ? 'หน้านี้เป็น template ตาม blueprint (developer page). จะขยายข้อมูล logo/เว็บไซต์/สรุปเมื่อมีข้อมูล developers table'
              : 'This is a blueprint-driven template (developer page). We will enrich logo/site/summary once developers data is populated.'}
          </p>
          <div className="cta-row">
            <a className="btn btn-cta" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
            <a className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {dict.nav.projects}
            </a>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'โครงการที่เกี่ยวข้อง' : 'Related Projects'}</h2>
            <p className="section-subtitle">
              {related.length
                ? (locale === 'th' ? `พบ ${related.length} โครงการ` : `${related.length} projects found`)
                : (locale === 'th' ? 'ยังไม่พบโครงการที่ผูกกับ developer_id นี้' : 'No projects currently linked to this developer_id')}
            </p>
          </div>

          {related.length ? (
            <div className="grid grid-3">
              {related.slice(0, 30).map((p) => (
                <ProjectCard
                  key={p.id}
                  name={p.name}
                  count={0}
                  slug={p.slug}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-title">{locale === 'th' ? 'กำลังจัดเตรียมข้อมูล' : 'Data pending'}</div>
              <div className="card-subtitle">
                {locale === 'th'
                  ? 'ระหว่างนี้สามารถดูโครงการทั้งหมด หรือขอ shortlist จากที่ปรึกษา'
                  : 'Meanwhile, browse all projects or request a shortlist from an advisor.'}
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

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{locale === 'th' ? 'ขอคำแนะนำจากที่ปรึกษา' : 'Request Advice'}</h2>
              <p className="cta-body">
                {locale === 'th'
                  ? 'บอกงบ + ทำเล + สิ่งที่ต้องการ แล้วเราจะตอบกลับพร้อม shortlist'
                  : 'Share budget, area, and preferences. We will reply with a shortlist.'}
              </p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={`Developer: ${params.slug}`} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
