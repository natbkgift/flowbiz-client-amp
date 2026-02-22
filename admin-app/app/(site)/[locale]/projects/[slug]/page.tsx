import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { LeadForm } from '@/components/forms/LeadForm';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug, fetchProjectEvaluation } from '@/app/_lib/public-api-server';
import { getInternalLinks } from '@/app/_lib/internal-links';
 

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/projects/${encodeURIComponent(slug)}`;

  let projectName: string | null = null;
  try {
    const project = await fetchProjectBySlug(slug);
    projectName = project?.name ?? null;
  } catch {
    projectName = null;
  }

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | ${dict.nav.projects}`;
  const description = dict.property.projectMetaDescription;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/projects/${encodeURIComponent(slug)}`,
        th: `/th/projects/${encodeURIComponent(slug)}`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: dict.brand.name,
      locale: ogLocale(locale),
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  const internalLinks = getInternalLinks(locale, dict, { from: 'project_detail', includeProjects: true });

  const project = await fetchProjectBySlug(slug);

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(slug)}`;

  if (!project) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1 className="section-title">{dict.property.projectNotFound}</h1>
          <p className="section-subtitle">{dict.property.projectMayBeUnpublished}</p>
          <div className="card reveal mt-6">
            <h2 className="card-title">{dict.property.exploreMore}</h2>
            <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
            <div className="card-actions">
              {internalLinks.map((it) => (
                <Link
                  key={it.href}
                  className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                  href={it.href}
                  data-amp-event-type={it.eventType}
                  data-amp-event-payload={JSON.stringify(it.eventPayload)}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const evaluation = await fetchProjectEvaluation(project.id);

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: project.name,
        url: canonicalUrl,
        inLanguage: locale,
      },
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
            name: dict.property.breadcrumbHome,
            item: `${siteUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: dict.nav.projects,
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

  return (
    <main className="section" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container>
        <Breadcrumbs
          items={[
            { label: dict.property.breadcrumbHome, href: `/${locale}` },
            { label: dict.nav.projects, href: `/${locale}/projects` },
            { label: project.name, href: `/${locale}/projects/${encodeURIComponent(slug)}` },
          ]}
        />
        <div className="section-header">
          <h1 className="section-title">{project.name}</h1>
          <p className="section-subtitle">{dict.property.projectSubtitle}</p>
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

        <div className="card reveal mt-6">
          <h2 className="card-title">{dict.property.exploreMore}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <div className="card-actions">
            {internalLinks.map((it) => (
              <Link
                key={it.href}
                className={it.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-tertiary'}
                href={it.href}
                data-amp-event-type={it.eventType}
                data-amp-event-payload={JSON.stringify(it.eventPayload)}
              >
                {it.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card reveal mt-6">
          <h2 className="card-title">{'Request a Shortlist'}</h2>
          <p className="card-subtitle">{dict.property.navigateToKeyPages}</p>
          <LeadForm defaultMessage={`Project: ${project.name}`} />
        </div>

        {evaluation ? <ProjectDeepReview locale={locale} evaluation={evaluation} /> : null}
      </Container>
    </main>
  );
}
