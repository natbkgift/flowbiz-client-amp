import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug } from '@/app/_lib/public-api-server';
import { getInternalLinks } from '@/app/_lib/internal-links';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/projects/${encodeURIComponent(params.slug)}`;

  let projectName: string | null = null;
  try {
    const project = await fetchProjectBySlug(params.slug);
    projectName = project?.name ?? null;
  } catch {
    projectName = null;
  }

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | Project`;
  const description = 'Project overview with advisory guidance for international buyers.';
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/projects/${encodeURIComponent(params.slug)}`,
        th: `/th/projects/${encodeURIComponent(params.slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: dict.brand.name,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const project = await fetchProjectBySlug(params.slug);

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(params.slug)}`;

  if (!project) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">Project not found</h1>
          <p className="section-subtitle">This project may be unpublished.</p>
        </Container>
      </main>
    );
  }

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'ApartmentComplex',
        name: project.name,
        url: canonicalUrl,
        identifier: project.slug,
        inLanguage: locale,
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: locale === 'th' ? 'หน้าแรก' : 'Home',
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Projects',
            item: `${siteUrl}/${locale}/projects`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.name,
            item: canonicalUrl,
          },
        ],
      },
    ],
    null,
    0
  );

  const internalLinks = getInternalLinks(locale, dict, { from: 'project_detail', includeProjects: true });

  return (
    <main className="section" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container>
        <div className="section-header">
          <h1 className="section-title">{project.name}</h1>
          <p className="section-subtitle">International buyer guidance with clear next steps.</p>
        </div>

        <div className="cta-row">
          <TrackedLink
            className="btn btn-cta"
            href={withLocale(locale, '/contact')}
            eventType="cta_click"
            eventPayload={{ cta: 'speak_to_advisor', from: 'project_detail' }}
          >
            {dict.cta.speakToAdvisor}
          </TrackedLink>
          <TrackedLink
            className="btn btn-secondary"
            href={withLocale(locale, '/buy')}
            eventType="cta_click"
            eventPayload={{ cta: 'buy', from: 'project_detail' }}
          >
            {dict.nav.buy}
          </TrackedLink>
        </div>

        <div className="card reveal" style={{ marginTop: 24 }}>
          <h2 className="card-title">{locale === 'th' ? 'ลิงก์ที่เกี่ยวข้อง' : 'Explore more'}</h2>
          <p className="card-subtitle">{locale === 'th' ? 'ไปยังหน้าสำคัญอื่น ๆ' : 'Navigate to key pages'}</p>
          <div className="card-actions">
            {internalLinks.map((it) => (
              <TrackedLink
                key={it.href}
                className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                href={it.href}
                eventType={it.eventType}
                eventPayload={it.eventPayload}
              >
                {it.label}
              </TrackedLink>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
