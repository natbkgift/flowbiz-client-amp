import type { Metadata } from 'next';

import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug } from '@/app/_lib/public-api-server';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return {
    title: `${dict.brand.name} | Project`,
    description: 'Project detail',
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

  return (
    <main className="section" id="main-content">
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
      </Container>
    </main>
  );
}
