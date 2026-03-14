import type { Metadata } from 'next';
import Link from 'next/link';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { Container } from '@/components/layout/Container';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { withLocale, ogLocale } from '@/app/_lib/i18n/routing';
import { fetchProjectBySlug, fetchProjectEvaluation, fetchBlogPosts } from '@/app/_lib/public-api-server';
import { getInternalLinks } from '@/app/_lib/internal-links';

import { ProjectDeepReview } from '@/components/projects/ProjectDeepReview';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { LeadForm } from '@/components/forms/LeadForm';

export const revalidate = 300;
const PROJECT_DETAIL_FETCH_TIMEOUT_MS = 8000;
type ProjectLoadState =
  | { kind: 'loaded'; value: Awaited<ReturnType<typeof fetchProjectBySlug>> }
  | { kind: 'timeout' };

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

function localizedText(locale: 'en' | 'th', value?: Record<string, string> | null): string {
  if (!value) return '';
  return value[locale] ?? value.en ?? value.th ?? Object.values(value)[0] ?? '';
}

function formatCurrency(locale: 'en' | 'th', value?: number | null): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(locale: 'en' | 'th', value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
  }).format(date);
}

function formatStatValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return new Intl.NumberFormat('en-US').format(value);
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

function toKeyValueList(record?: Record<string, unknown> | null): Array<{ label: string; value: string }> {
  if (!record) return [];
  return Object.entries(record)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      value: formatStatValue(value) ?? '',
    }))
    .filter((item) => item.value);
}

function containsContext(value: string, query: string | null | undefined): boolean {
  if (!query) return false;
  return value.toLowerCase().includes(query.toLowerCase());
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

  const projectResult = await withTimeout<ProjectLoadState>(
    fetchProjectBySlug(params.slug).then((value) => ({ kind: 'loaded' as const, value })),
    { kind: 'timeout' as const },
  );
  const project = projectResult.kind === 'loaded' ? projectResult.value : null;

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects/${encodeURIComponent(params.slug)}`;

  if (projectResult.kind === 'timeout') {
    const fallbackTitle = formatSlugTitle(params.slug);
    const fallbackBody = locale === 'th'
      ? 'ใช้หน้านี้เพื่อไปต่อยัง shortlist, compare, หรือพูดคุยกับทีมที่ปรึกษาได้ทันที'
      : 'Use this page to continue into shortlist, compare, or a direct advisory conversation.';

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
  const publishedBlogPosts = await withTimeout(fetchBlogPosts(), []);
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
  const summary = localizedText(locale, project.summary);
  const description = localizedText(locale, project.description ?? null);
  const deliveryLabel = formatDateLabel(locale, project.delivery_date);
  const startingPriceLabel = formatCurrency(locale, project.starting_price);
  const investmentFacts = toKeyValueList(project.investment_snapshot);
  const locationFacts = toKeyValueList(project.location);
  const projectMetrics = [
    { label: locale === 'th' ? 'ราคาเริ่มต้น' : 'Starting price', value: startingPriceLabel },
    { label: locale === 'th' ? 'ส่งมอบ' : 'Delivery', value: deliveryLabel },
    { label: locale === 'th' ? 'จำนวนยูนิต' : 'Units', value: formatStatValue(project.unit_count) },
    { label: locale === 'th' ? 'จำนวนชั้น' : 'Floors', value: formatStatValue(project.floors) },
    { label: locale === 'th' ? 'ก่อสร้างแล้ว' : 'Built', value: formatStatValue(project.year_built) },
    { label: locale === 'th' ? 'ประเภท' : 'Type', value: project.property_type || null },
  ].filter((item) => item.value);
  const evaluationSignals = evaluation?.badges?.map((badge) => badge.label).slice(0, 4) ?? [];
  const projectDecisionRead = [
    hasEvaluationSnapshot
      ? locale === 'th' ? 'มี live snapshot จากโครงการ/พื้นที่พอสำหรับใช้คุย shortlist ต่อ' : 'There is enough live project and area snapshot data to support a shortlist discussion.'
      : locale === 'th' ? 'snapshot ยังไม่ครบทุกมิติ จึงควรใช้หน้านี้เป็น conversion surface มากกว่าหน้าเปรียบเทียบขั้นสุดท้าย' : 'The snapshot is still partial, so this page works better as a conversion-detail surface than a final comparison sheet.',
    project.area?.name
      ? locale === 'th' ? `พื้นที่หลักของโครงการคือ ${project.area.name} จึงควรอ่านคู่กับบริบทของ area ก่อนตัดสินใจ` : `${project.area.name} remains a core part of the decision, so read this project together with the area context.`
      : null,
    startingPriceLabel
      ? locale === 'th' ? `ราคาเริ่มต้นปัจจุบันคือ ${startingPriceLabel}` : `Current starting price is ${startingPriceLabel}.`
      : null,
  ].filter((item): item is string => Boolean(item));
  const relatedReads = [...publishedBlogPosts]
    .filter((post) => {
      const titleText = localizedText(locale, post.title);
      const excerptText = localizedText(locale, post.excerpt ?? null);
      return containsContext(titleText, project.name) || containsContext(titleText, project.area?.name) || containsContext(excerptText, project.area?.name);
    })
    .slice(0, 2);

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
          label: dict.advisory.compareOpportunities,
          eventPayload: { cta: 'compare', from: 'project_detail' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <Container>
        <div className="detail-layout advisory-detail-layout mt-6">
          <div className="detail-stack">
            <section className="authority-card reveal">
              <div className="section-header">
                <h2 className="section-title section-title--sm">{locale === 'th' ? 'Project read for shortlist' : 'Project read for shortlist'}</h2>
                <p className="section-subtitle">
                  {summary || description || (locale === 'th'
                    ? 'ใช้หน้านี้เพื่อประเมินว่าควรคุยต่อในระดับโครงการหรือย้ายไปเทียบทางเลือกอื่น'
                    : 'Use this page to judge whether the project earns a deeper advisory discussion or a compare step next.')}
                </p>
              </div>

              {projectMetrics.length ? (
                <div className="signal-grid signal-grid--three-up">
                  {projectMetrics.map((metric) => (
                    <div key={metric.label} className="metric-card">
                      <span className="metric-card__label">{metric.label}</span>
                      <strong className="metric-card__value">{metric.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              {description ? (
                <article className="content-article mt-4">
                  {description.split(/\n+/).filter(Boolean).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ) : null}
            </section>

            <section className="signal-grid signal-grid--two-up reveal">
              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'Shortlist decision lens' : 'Shortlist decision lens'}</h2>
                <div className="insight-list mt-3">
                  {projectDecisionRead.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                  {evaluationSignals.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__title">{locale === 'th' ? 'Evaluation signal' : 'Evaluation signal'}</span>
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'Related advisory reads' : 'Related advisory reads'}</h2>
                <div className="insight-list mt-3">
                  {relatedReads.length ? relatedReads.map((post) => (
                    <Link key={post.slug} href={withLocale(locale, `/blog/${encodeURIComponent(post.slug)}`)} className="insight-list__item">
                      <span className="insight-list__title">{localizedText(locale, post.title) || post.slug}</span>
                      <span className="insight-list__body">{localizedText(locale, post.excerpt ?? null) || (locale === 'th' ? 'อ่านบทความฉบับเต็ม' : 'Open the full article.')}</span>
                    </Link>
                  )) : (
                    <div className="insight-list__item">
                      <span className="insight-list__body">{locale === 'th' ? 'อ่านต่อที่ investment, compare หรือ area guide เพื่อเสริมบริบทของการตัดสินใจ' : 'Continue into investment, compare, or the area guide to widen the decision context.'}</span>
                    </div>
                  )}
                </div>
                <div className="card-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                    {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                  </Link>
                </div>
              </div>
            </section>

            {(project.amenities?.length ?? 0) > 0 || investmentFacts.length > 0 || locationFacts.length > 0 ? (
              <section className="signal-grid signal-grid--two-up reveal">
                {(project.amenities?.length ?? 0) > 0 ? (
                  <div className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'Amenities และ livability' : 'Amenities and livability'}</h2>
                    <p className="card-subtitle">
                      {locale === 'th'
                        ? 'อ่านสิ่งอำนวยความสะดวกเป็นบริบทการอยู่อาศัย ไม่ใช่เพียง checklist ของโครงการ'
                        : 'Read the amenity mix as a livability signal, not just a project checklist.'}
                    </p>
                    <div className="chip-list mt-3">
                      {project.amenities?.map((item) => (
                        <span key={item} className="chip-list__item">{item}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {investmentFacts.length > 0 ? (
                  <div className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'Investment snapshot' : 'Investment snapshot'}</h2>
                    <div className="insight-list mt-3">
                      {investmentFacts.map((item) => (
                        <div key={item.label} className="insight-list__item">
                          <span className="insight-list__title">{item.label}</span>
                          <span className="insight-list__body">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {locationFacts.length > 0 ? (
                  <div className="authority-card">
                    <h2 className="card-title">{locale === 'th' ? 'Location context' : 'Location context'}</h2>
                    <div className="insight-list mt-3">
                      {locationFacts.map((item) => (
                        <div key={item.label} className="insight-list__item">
                          <span className="insight-list__title">{item.label}</span>
                          <span className="insight-list__body">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="authority-card">
                  <h2 className="card-title">{locale === 'th' ? 'Advisory next steps' : 'Advisory next steps'}</h2>
                  <p className="card-subtitle">
                    {locale === 'th'
                      ? 'ถ้าโครงการนี้ใกล้เคียงโจทย์ ให้เทียบต่อหรือส่ง brief เพื่อให้ทีมคัด shortlist ที่แคบลง'
                      : 'If this project is directionally right, compare it next or send the brief so the team can tighten the shortlist.'}
                  </p>
                  <div className="card-actions mt-3">
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
              </section>
            ) : null}

            {evaluation ? <ProjectDeepReview locale={locale} evaluation={evaluation} /> : null}
          </div>

          <aside className="detail-sidebar detail-stack">
            <div className="page-rail-card reveal">
              <h2 className="card-title">{locale === 'th' ? 'Project brief สำหรับ advisor' : 'Advisor project brief'}</h2>
              <p className="card-subtitle">
                {locale === 'th'
                  ? 'ส่งงบ ทำเล และช่วงเวลาเพื่อให้ทีมบอกได้เร็วขึ้นว่าโครงการนี้ควรอยู่ใน shortlist หรือไม่'
                  : 'Send your budget, preferred area, and timing so the team can judge quickly whether this project belongs in your shortlist.'}
              </p>
            </div>
            <LeadForm
              heading={locale === 'th' ? 'ขอ shortlist รอบโครงการนี้' : 'Request a shortlist around this project'}
              defaultPreferredArea={project.area?.name ?? undefined}
              defaultMessage={locale === 'th' ? `สนใจโครงการ ${project.name} และต้องการเทียบกับตัวเลือกใกล้เคียง` : `I am interested in ${project.name} and want to compare it with similar options.`}
            />
          </aside>
        </div>
      </Container>
    </main>
  );
}


