import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { ProjectCard } from '@/components/project/ProjectCard';
import { fetchAreas, fetchDeveloperBySlug, fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { breadcrumbSchema } from '@/app/_lib/schema-markup';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  let detail = null;
  try {
    detail = await fetchDeveloperBySlug(slug);
  } catch {
    detail = null;
  }
  const displayName = detail?.developer.name ?? slug;
  const title = locale === 'th'
    ? `ผู้พัฒนาโครงการ: ${displayName}`
    : `Developer: ${displayName}`;
  const desc = locale === 'th'
    ? 'ดูโครงการที่เกี่ยวข้องและขอคำแนะนำจากที่ปรึกษา'
    : 'Browse related projects and request advice from an advisor.';
  return makePageMetadata(locale, `developers/${slug}`, title, desc, dict.brand.name);
}

function toLocalDeveloperImage(input: string | null | undefined): string | null {
  const resolved = resolveImageUrl(input);
  if (!resolved) return null;
  if (resolved.startsWith('/media/')) return resolved;
  if (resolved.startsWith('/images/')) return resolved;
  if (resolved.startsWith('/uploads/')) return resolved;
  return null;
}

function normalizeWebsiteUrl(input: string | null | undefined): string | null {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const candidate = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
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

function pickProofString(summary: Record<string, unknown> | null | undefined, locale: 'en' | 'th', key: string): string {
  if (!summary) return '';
  const localized = summary[locale];
  const english = summary.en;
  const thai = summary.th;
  const objectCandidate = [localized, english, thai].find(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  ) as Record<string, unknown> | undefined;
  if (!objectCandidate) return '';

  const value = objectCandidate[key];
  return typeof value === 'string' ? value.trim() : '';
}

function pickProofList(summary: Record<string, unknown> | null | undefined, locale: 'en' | 'th', key: string): string[] {
  if (!summary) return [];
  const localized = summary[locale];
  const english = summary.en;
  const thai = summary.th;
  const objectCandidate = [localized, english, thai].find(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  ) as Record<string, unknown> | undefined;
  if (!objectCandidate) return [];

  const value = objectCandidate[key];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export default async function DeveloperDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amppattaya.com';

  const [developer, projects, areas, propertiesResult] = await Promise.all([
    fetchDeveloperBySlug(slug).catch(() => null),
    fetchProjects({ limit: 200 }).catch(() => []),
    fetchAreas().catch(() => []),
    fetchProperties({ limit: 100 }).catch(() => ({ data: [], meta: { page: 1, limit: 100, total: 0 } })),
  ]);

  if (!developer) {
    notFound();
  }

  const breadcrumbItems = [
    { label: dict.nav.home, href: `/${locale}` },
    { label: locale === 'th' ? 'ผู้พัฒนาโครงการ' : 'Developers', href: `/${locale}/developers` },
    { label: developer.developer.name, href: `/${locale}/developers/${encodeURIComponent(slug)}` },
  ];
  const breadcrumbJsonLd = breadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: `${siteUrl}${item.href}` }))
  );

  const developerId = developer.developer.id;
  const related = (projects ?? []).filter((p) => {
    const projectDeveloperId = String(p.developer_id ?? '').trim();
    if (!projectDeveloperId) return false;
    if (projectDeveloperId === developerId) return true;
    return projectDeveloperId === slug;
  });

  const displayName = developer.developer.name;
  const summaryText = pickLocalizedSummary(developer.summary, locale);
  const safeWebsite = normalizeWebsiteUrl(developer.developer.website);
  const localLogo = toLocalDeveloperImage(developer.developer.logo_url);
  const trustYears = pickProofString(developer.summary, locale, 'years_in_business')
    || pickProofString(developer.summary, locale, 'years')
    || pickProofString(developer.summary, locale, 'established_year');
  const focusAreasPrimary = pickProofList(developer.summary, locale, 'focus_areas');
  const focusAreas = focusAreasPrimary.length ? focusAreasPrimary : pickProofList(developer.summary, locale, 'focusAreas');
  const proofSnippetsPrimary = pickProofList(developer.summary, locale, 'proof_snippets');
  const proofSnippets = proofSnippetsPrimary.length ? proofSnippetsPrimary : pickProofList(developer.summary, locale, 'proofs');

  const safeRelatedProjects = related.filter((project) => Boolean(project.slug));
  const relatedAreaIds = new Set(safeRelatedProjects.map((project) => String(project.area_id ?? '').trim()).filter(Boolean));
  const relatedAreas = areas
    .filter((area) => relatedAreaIds.has(String(area.id)))
    .filter((area) => Boolean(area.slug))
    .slice(0, 4);

  const relatedProjectIds = new Set(safeRelatedProjects.map((project) => String(project.id)).filter(Boolean));
  const relatedProperties = (propertiesResult.data ?? [])
    .filter((property) => Boolean(property.slug))
    .filter((property) => {
      const projectId = String(property.project_id ?? '').trim();
      const areaId = String(property.area_id ?? '').trim();
      return relatedProjectIds.has(projectId) || relatedAreaIds.has(areaId);
    })
    .slice(0, 6);

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Breadcrumbs items={breadcrumbItems} />

      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{locale === 'th' ? `ผู้พัฒนาโครงการ: ${displayName}` : `Developer: ${displayName}`}</h1>
          <p className="subhead">{summaryText || (locale === 'th'
            ? 'โปรไฟล์ผู้พัฒนากำลังอัปเดตในระบบ (TODO: เติม summary ใน developers entity)'
            : 'Developer profile is being updated in the system (TODO: add summary in developers entity).')}</p>
          {localLogo ? (
            <div className="relative mt-6 h-[260px] overflow-hidden rounded-xl bg-[var(--color-surface)]">
              <Image
                src={localLogo}
                alt={displayName}
                fill
                sizes="(min-width: 1280px) 70vw, 100vw"
                className="object-contain p-6"
              />
            </div>
          ) : (
            <div className="mt-6 flex h-[180px] items-center justify-center rounded-xl bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)]">
              {locale === 'th' ? 'ยังไม่มีโลโก้ผู้พัฒนา (TODO: เติม logo ใน developers entity)' : 'Developer logo not available yet (TODO: add logo in developers entity).'}
            </div>
          )}
          <div className="cta-row">
            {safeWebsite ? (
              <a className="btn btn-secondary" href={safeWebsite} target="_blank" rel="noopener noreferrer">
                {locale === 'th' ? 'เว็บไซต์ผู้พัฒนา' : 'Developer Website'}
              </a>
            ) : null}
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
          <div className="grid grid-2">
            <article className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'โปรไฟล์ผู้พัฒนา' : 'Developer profile'}</h2>
              <p className="card-subtitle">{summaryText || (locale === 'th'
                ? 'ยังไม่มี profile แบบละเอียดในรอบนี้'
                : 'No detailed profile is available in this dataset yet.')}</p>
            </article>

            <article className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'ข้อมูลยืนยัน (Trust block)' : 'Trust block'}</h2>
              <ul className="bullet-list mt-3">
                <li>{locale === 'th' ? 'สถานะ' : 'Status'}: {developer.developer.status || '—'}</li>
                {trustYears ? <li>{locale === 'th' ? 'ประสบการณ์/ปีที่ก่อตั้ง' : 'Experience / established'}: {trustYears}</li> : null}
                {focusAreas.length ? <li>{locale === 'th' ? 'โฟกัสหลัก' : 'Focus areas'}: {focusAreas.slice(0, 3).join(', ')}</li> : null}
                {safeWebsite ? <li>{locale === 'th' ? 'เว็บไซต์' : 'Website'}: {safeWebsite}</li> : null}
              </ul>
              {proofSnippets.length ? (
                <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {proofSnippets.slice(0, 2).map((snippet) => (
                    <p key={snippet}>• {snippet}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  {locale === 'th'
                    ? 'ยังไม่มี proof snippets เพิ่มเติมในข้อมูลชุดนี้'
                    : 'No additional proof snippets are currently available in this dataset.'}
                </p>
              )}
            </article>
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
                : (locale === 'th' ? 'ยังไม่พบโครงการที่ผูกกับ developer entity นี้' : 'No projects currently linked to this developer entity')}
            </p>
          </div>

          {related.length ? (
            <div className="grid grid-3">
              {safeRelatedProjects.slice(0, 30).map((p) => (
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

      <section className="section">
        <Container>
          <div className="grid grid-2">
            <article className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'ทำเลที่เกี่ยวข้อง' : 'Related areas'}</h2>
              {relatedAreas.length ? (
                <ul className="bullet-list mt-3">
                  {relatedAreas.map((area) => (
                    <li key={area.id}>
                      <Link href={withLocale(locale, `/areas/${area.slug}`)}>{area.name}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="card-subtitle">{locale === 'th' ? 'ยังไม่มี area relation ที่พร้อมแสดงผล' : 'No area relation data is currently available.'}</p>
              )}
            </article>

            <article className="card reveal">
              <h2 className="card-title">{locale === 'th' ? 'ทรัพย์ที่เกี่ยวข้อง' : 'Related properties'}</h2>
              {relatedProperties.length ? (
                <ul className="bullet-list mt-3">
                  {relatedProperties.map((property) => (
                    <li key={property.id}>
                      <Link href={withLocale(locale, `/property/${property.slug}`)}>{property.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="card-subtitle">{locale === 'th' ? 'ยังไม่มี property relation ที่พร้อมแสดงผล' : 'No property relation data is currently available.'}</p>
              )}
            </article>
          </div>
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
              <LeadForm defaultMessage={`Developer: ${slug}`} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
