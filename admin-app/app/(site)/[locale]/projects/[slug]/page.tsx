import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug, fetchProjectEvaluation } from '@/app/_lib/public-api-server';
import { getInternalLinks } from '@/app/_lib/internal-links';

import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;
const PROJECT_DETAIL_FETCH_TIMEOUT_MS = 8000;

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = PROJECT_DETAIL_FETCH_TIMEOUT_MS): Promise<T> {
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

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
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

  const title = projectName ? `${projectName} | ${dict.brand.name}` : `${dict.brand.name} | ${dict.nav.projects}`;
  const description = dict.property.projectMetaDescription;
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
      locale: ogLocale(locale),
    },
  };
}

export default async function ProjectDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const advisoryLabels = getAdvisoryLabels(locale);

  const internalLinks = getInternalLinks(locale, dict, { from: 'project_detail', includeProjects: true });

  const projectResult = await withTimeout(
    fetchProjectBySlug(params.slug).then((value) => ({ kind: 'loaded' as const, value })),
    { kind: 'timeout' as const },
  );
  const project = projectResult.kind === 'loaded' ? projectResult.value : null;

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(params.slug)}`;

  if (projectResult.kind === 'timeout') {
    const fallbackTitle = locale === 'th' ? 'กำลังเตรียมข้อมูลโครงการนี้' : 'Preparing this project snapshot';
    const fallbackBody = locale === 'th'
      ? 'ข้อมูลเชิงลึกของโครงการนี้ยังดึงมาไม่ครบในรอบนี้ แต่คุณยังเปิด shortlist หรือส่งบริบทให้ทีมช่วยจัดทางเลือกต่อได้ทันที'
      : 'The deeper snapshot for this project is not fully available in this request window yet, but you can still move into shortlist mode or hand context to the team right away.';

    return (
      <main className="section" id="main-content">
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={fallbackTitle}
          subtitle={fallbackBody}
          proofs={advisoryProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: formatSlugTitle(params.slug),
              body: locale === 'th'
                ? 'ใช้ snapshot นี้เพื่อส่งบริบทให้ทีมช่วยคัด shortlist หรือไปต่อยัง inventory ที่เผยแพร่แล้ว'
                : 'Use this snapshot to hand context to the team or continue into the published inventory.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'ต่อไปยัง shortlist หรือ Smart Finder' : 'Move next into shortlist or Smart Finder',
              body: locale === 'th'
                ? 'แม้รายละเอียดโครงการยังไม่ครบ คุณยังไม่ติด dead-end และไปต่อยังเส้นทางหลักได้ทันที'
                : 'Even if the deeper project details are not ready yet, you are not stuck in a dead-end state.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'แสดงเฉพาะสิ่งที่ยืนยันได้จากข้อมูลจริง' : 'Only verified snapshot signals are shown',
              body: locale === 'th'
                ? 'เมื่อข้อมูลเชิงลึกกลับมาครบ หน้านี้จะขยายเป็น project review เต็มรูปแบบ'
                : 'When the deeper data becomes available, this route expands back into the full project review surface.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'project_shortlist', project: params.slug }),
            label: dict.cta.speakToAdvisor,
            eventPayload: { cta: 'speak_to_advisor', from: 'project_detail_timeout' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/projects'),
            label: dict.advisory.browseVerifiedInventory,
            eventPayload: { cta: 'browse_verified_inventory', from: 'project_detail_timeout' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
          }}
        />
      </main>
    );
  }

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

  const evaluation = await withTimeout(fetchProjectEvaluation(project.id), null);
  const hasEvaluationSnapshot = Boolean(
    evaluation?.area_statistics?.avg_price ||
    evaluation?.area_statistics?.avg_rent ||
    evaluation?.area_statistics?.roi_percent ||
    (evaluation?.badges?.length ?? 0) > 0,
  );
  const projectSubtitle = locale === 'th'
    ? [
        project.area?.name ? `ทำเล ${project.area.name}` : null,
        project.developer?.name ? `ผู้พัฒนา ${project.developer.name}` : null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ')
    : [
        project.area?.name ? `Area: ${project.area.name}` : null,
        project.developer?.name ? `Developer: ${project.developer.name}` : null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ');

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
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={project.name}
        subtitle={projectSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'เหมาะกับผู้ซื้อที่เริ่มจากโครงการก่อนยูนิต' : 'Best for project-first buyers',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อคุณต้องการดูความน่าเชื่อถือของโครงการ, บริบทของทำเล, และสัญญาณสำหรับการ shortlist'
              : 'Use this page when the project brand, location context, and shortlist signals matter before unit-level review.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ต่อไปยัง compare, shortlist, หรือพูดคุยกับทีม' : 'Move next into compare, shortlist, or advisory support',
            body: locale === 'th'
              ? 'หากโครงการนี้เริ่มตรงโจทย์ ให้เทียบต่อใน compare หรือส่ง context ให้ทีมช่วยคัดทางเลือก'
              : 'If this project looks relevant, compare it next or hand the context to the team for a tighter shortlist.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: hasEvaluationSnapshot
              ? locale === 'th' ? 'มี snapshot สำหรับ deep review แล้ว' : 'Snapshot signals are available for deep review'
              : locale === 'th' ? 'deep review ยังอยู่ในโหมด conservative' : 'The deep review is currently conservative',
            body: hasEvaluationSnapshot
              ? locale === 'th'
                ? 'หน้านี้ใช้สัญญาณที่ดึงได้จริงจากโครงการและพื้นที่เพื่อช่วยการตัดสินใจ'
                : 'The page uses project and area signals grounded in live data to support the decision flow.'
              : locale === 'th'
                ? 'เมื่อ snapshot ยังไม่ครบ ระบบจะบอกตามจริงและไม่เติมข้อมูลที่ยืนยันไม่ได้'
                : 'When the snapshot is partial, the page stays explicit and does not invent missing data.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'project_consultation', project: project.slug }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'speak_to_advisor', from: 'project_detail' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/compare'),
          label: dict.compare.startCompare,
          eventPayload: { cta: 'compare', from: 'project_detail' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <Container>
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

        {evaluation ? <ProjectDeepReview locale={locale} evaluation={evaluation} /> : null}
      </Container>
    </main>
  );
}


