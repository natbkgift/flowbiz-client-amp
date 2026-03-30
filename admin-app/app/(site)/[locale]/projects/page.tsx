import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { withLocale } from '@/app/_lib/i18n/routing';
import { Container } from '@/components/layout/Container';
import { fetchProjects } from '@/app/_lib/public-api-server';

import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(
    locale,
    'projects',
    locale === 'th' ? 'โครงการพัทยาที่เผยแพร่แล้ว จัดให้พร้อมสำหรับการตัดสินใจจริง' : 'Published Pattaya projects, arranged for real decisions',
    locale === 'th'
      ? 'เริ่มจากโครงการที่เผยแพร่แล้ว เห็นบริบทราคา ทำเล และไปต่อสู่รายการคัดสรรหรือการนัดชมแบบส่วนตัวได้ทันที'
      : 'Start from published Pattaya developments with clearer pricing context, location cues, and a faster handoff into shortlist or private tour.',
    dict.brand.name
  );
}

const PROJECTS_FETCH_TIMEOUT_MS = 8000;
type ProjectsLoadState =
  | { kind: 'loaded'; value: Awaited<ReturnType<typeof fetchProjects>> }
  | { kind: 'timeout' };

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = PROJECTS_FETCH_TIMEOUT_MS): Promise<T> {
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

function formatCompactPrice(value: number | null | undefined, locale: 'en' | 'th'): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  if (locale === 'th') {
    if (value >= 1_000_000) {
      const millionValue = value / 1_000_000;
      const decimals = millionValue >= 10 || Math.round(millionValue * 10) % 10 === 0 ? 0 : 1;
      return `${millionValue.toLocaleString('th-TH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })} ล้านบาท`;
    }
    return `${Math.round(value).toLocaleString('th-TH')} บาท`;
  }
  return `THB ${Math.round(value).toLocaleString()}`;
}

function localizeAreaLabel(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  if (locale !== 'th') return trimmed;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const areaMap: Record<string, string> = {
    'wongamat': 'วงศ์อมาตย์',
    'wong amat': 'วงศ์อมาตย์',
    'jomtien': 'จอมเทียน',
    'na jomtien': 'นาจอมเทียน',
    'north pattaya': 'พัทยาเหนือ',
    'central pattaya': 'พัทยากลาง',
    'south pattaya': 'พัทยาใต้',
    'east pattaya': 'พัทยาตะวันออก',
    'pratumnak': 'พระตำหนัก',
    'pratamnak': 'พระตำหนัก',
    'huay yai': 'ห้วยใหญ่',
    'bang saray': 'บางเสร่',
    'nong plalai': 'หนองปลาไหล',
    'pattaya': 'พัทยา',
  };

  return areaMap[normalized] ?? trimmed;
}

function localizeProjectStatus(locale: 'en' | 'th', value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (locale !== 'th') return normalized;

  if (normalized === 'published') return 'เผยแพร่แล้ว';
  if (normalized === 'draft') return 'ฉบับร่าง';
  if (normalized === 'archived') return 'เก็บถาวร';
  return normalized;
}

function resolveProjectArea(project: Record<string, unknown>): string | null {
  const directArea = typeof project.area_name === 'string' ? project.area_name.trim() : '';
  if (directArea) return directArea;
  const area = project.area;
  if (area && typeof area === 'object' && typeof (area as { name?: unknown }).name === 'string') {
    const nestedName = String((area as { name?: unknown }).name).trim();
    if (nestedName) return nestedName;
  }
  const district = typeof project.district === 'string' ? project.district.trim() : '';
  if (district) return district;
  const city = typeof project.city === 'string' ? project.city.trim() : '';
  return city || null;
}

export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  noStore();
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/projects`;

  let projects: Awaited<ReturnType<typeof fetchProjects>>;
  let projectsFetchOk = true;
  const projectsResult = await withTimeout<ProjectsLoadState>(
    fetchProjects({ limit: 100 }).then((value) => ({ kind: 'loaded', value })),
    { kind: 'timeout' },
  );
  projects = projectsResult.kind === 'loaded' ? projectsResult.value : [];
  if (projectsResult.kind !== 'loaded' || projects.length === 0) {
    projectsFetchOk = false;
  }
  if (projects.length) {
    const sorted = [...projects].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || (a.slug ?? '').localeCompare(b.slug ?? ''));
    const liveEntryPrice = sorted
      .map((project) => project.starting_price)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
      .sort((left, right) => left - right)[0] ?? null;
    const luxuryProjectCount = sorted.filter((project) =>
      typeof project.starting_price === 'number' && Number.isFinite(project.starting_price) && project.starting_price >= 10_000_000
    ).length;
    const projectProofs = [
      locale === 'th' ? `${sorted.length} โครงการที่เผยแพร่แล้ว` : `${sorted.length} published projects`,
      liveEntryPrice ? `${locale === 'th' ? 'เริ่มต้น' : 'Entry from'} ${formatCompactPrice(liveEntryPrice, locale)}` : null,
      luxuryProjectCount > 0 ? (locale === 'th' ? `${luxuryProjectCount} โครงการกลุ่มลักชัวรี` : `${luxuryProjectCount} luxury-led projects`) : null,
      ...advisoryProofs,
    ].filter((item): item is string => Boolean(item)).slice(0, 4);
    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: dict.nav.projects,
        url: canonicalUrl,
        itemListElement: sorted.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.name,
          url: `${siteUrl}/${locale}/projects/${encodeURIComponent(p.slug)}`,
        })),
        isPartOf: {
          '@type': 'WebSite',
          name: dict.brand.name,
          url: siteUrl,
        },
      },
      null,
      0
    );

    return (
      <main id="main-content" className="projects-page decision-page--confidence">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={locale === 'th' ? 'โครงการพัทยาที่เผยแพร่แล้ว จัดให้พร้อมสำหรับการตัดสินใจจริง' : 'Published Pattaya projects, arranged for real decisions'}
          subtitle={locale === 'th'
            ? 'ใช้หน้านี้เพื่อเริ่มจากโครงการที่เผยแพร่แล้ว เห็นราคาเริ่มต้นเท่าที่มี และไปต่อสู่การเปรียบเทียบ รายการคัดสรร หรือการนัดชมแบบส่วนตัวได้ทันที'
            : 'Use this page to start from published developments, see live entry pricing where available, and move straight into compare, shortlist, or a private tour.'}
          proofs={projectProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจากโครงการที่เผยแพร่แล้วจริง' : 'Buyers who want to start from genuinely published inventory',
              body: locale === 'th'
                ? 'หน้านี้ควรเป็นฐานเริ่มต้นของการเปรียบเทียบ การใช้ Smart Finder และการคุยกับทีม ไม่ใช่แค่รายการชื่อโครงการ'
                : 'This page should be the working base for compare, smart finder, and team handoff, not just a list of project names.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'เลือกจากโครงการ แล้วค่อยไปต่อสู่ยูนิตหรือการนัดชมแบบส่วนตัว' : 'Choose the development first, then move into units or a private tour',
              body: locale === 'th'
                ? 'หากยังไม่ชัดเรื่องทำเลหรือแนวทาง ให้ไปต่อที่ Smart Finder หรือให้ทีมช่วยคัดรายการต่อจากบริบทนี้'
                : 'If the area or strategy is still unclear, continue into Smart Finder or let the team narrow the shortlist from this context.',
              icon: 'check',
            },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ทุกการ์ดควรบอกให้พอว่าจะคุยต่อหรือคัดออก' : 'Each card should give enough context to continue or cut',
            body: locale === 'th'
              ? 'เราเก็บทางไปสู่รายการคัดสรรและการส่งต่อให้ทีมไว้ชัด แม้บางโครงการยังไม่มีราคาเริ่มต้นครบ'
              : 'The shortlist and team-handoff route stays visible even when some projects still need direct pricing confirmation.',
            icon: 'shield',
          },
          ]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
            label: locale === 'th' ? 'ให้ทีมคัดโครงการ' : 'Build project shortlist',
            eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/smart-finder'),
            label: dict.advisory.useSmartFinder,
            eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
          }}
          supportNote={locale === 'th'
            ? 'ส่งชื่อโครงการที่ชอบมาได้เลย แล้วทีมจะช่วยบีบรายการคัดสรร เส้นทางเปรียบเทียบ หรือการนัดชมแบบส่วนตัวให้คมขึ้น'
            : 'Share the projects you like and the team will tighten the shortlist, compare route, or private-tour path from there.'}
        />
        <section className="section projects-catalogue-section">
        <Container>
          <div className="section-header mb-6">
            <h2 className="section-title">{locale === 'th' ? 'รายการโครงการ' : 'Project catalogue'}</h2>
            <p className="section-subtitle">
              {locale === 'th'
                ? 'เรียงโครงการที่เผยแพร่แล้วเพื่อให้คุณเห็นทำเล ราคาเริ่มต้น และขั้นตอนถัดไปได้เร็วขึ้น'
                : 'Published inventory arranged so you can scan location, entry pricing, and the next handoff faster.'}
            </p>
          </div>

          <div className="cta-strip projects-catalogue-strip mb-6">
            <div className="cta-strip__text">
              {locale === 'th'
                ? 'หากต้องการขยับจากระดับโครงการไปดูยูนิตจริง หรือเริ่มจากการนัดชมแบบส่วนตัว ให้ไปต่อจากตรงนี้ได้ทันที'
                : 'If you want to move from development-level browsing into real units or a private-tour handoff, use the next action here.'}
            </div>
            <div className="cta-row">
              <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
                {locale === 'th' ? 'ดูยูนิตคัดสรร' : 'Browse shortlist-ready listings'}
              </Link>
              <Link className="btn btn-tertiary" href={withLocaleQuery(locale, '/contact', { topic: 'private_tour', source: 'projects_catalogue' })}>
                {locale === 'th' ? 'จองนัดชมแบบส่วนตัว' : 'Book private tour'}
              </Link>
            </div>
          </div>

          <div className="grid grid-3 projects-catalogue-grid">
            {sorted.map((p, index) => {
              const area = localizeAreaLabel(locale, resolveProjectArea(p as unknown as Record<string, unknown>)) || (locale === 'th' ? 'พัทยา' : 'Pattaya');
              const hasEntryPrice = Boolean(p.starting_price && Number.isFinite(p.starting_price));
              const localizedStatus = localizeProjectStatus(locale, p.status);
              return (
                <article
                  key={p.id}
                  className={`card catalogue-card project-catalogue-card${index === 0 ? ' project-catalogue-card--lead' : index < 3 ? ' project-catalogue-card--priority' : ''}`}
                >
                  <div className="card-image project-catalogue-card__visual">
                    <LocalMediaImage
                      media={{
                        cover_image_url: p.cover_image_url,
                        hero_image_url: p.hero_image_url,
                        images: p.images,
                      }}
                      alt={p.name}
                      className="media-shell project-catalogue-card__media"
                      imageClassName="media-shell__img"
                      aspectRatio="16 / 10"
                    />
                    <div className="project-catalogue-card__media-scrim" aria-hidden="true" />
                    <div className="project-catalogue-card__chips">
                      <span className="project-catalogue-card__chip">{area}</span>
                      <span className="project-catalogue-card__chip project-catalogue-card__chip--value">
                        {hasEntryPrice
                          ? `${locale === 'th' ? 'เริ่ม' : 'Entry'} ${formatCompactPrice(p.starting_price ?? null, locale)}`
                          : (locale === 'th' ? 'ราคาเมื่อขอ' : 'Price on request')}
                      </span>
                    </div>
                  </div>
                  <div className="project-catalogue-card__copy">
                    <div className="catalogue-card__eyebrow project-catalogue-card__eyebrow">
                      {localizedStatus
                        ? `${locale === 'th' ? 'สถานะ' : 'Status'} • ${localizedStatus}`
                        : (locale === 'th' ? 'โครงการที่เผยแพร่แล้ว' : 'Published project')}
                    </div>
                    <h2 className="card-title project-catalogue-card__title">{p.name}</h2>
                    <p className="card-subtitle project-catalogue-card__summary">
                      {hasEntryPrice
                        ? (locale === 'th'
                          ? 'เริ่มจากราคาและทำเลที่ชัดก่อน แล้วค่อยเปิดรายละเอียดเพื่อดูยูนิตจริงกับแปลนห้อง'
                          : `Start from live entry pricing and location context, then open the detail page for real units and floor plans.`)
                        : (locale === 'th'
                          ? 'ดูบริบทโครงการและทำเลก่อน แล้วให้ทีมยืนยันราคาและยูนิตที่พร้อมคุยต่อ'
                          : `Open the project context first, then let the team confirm live pricing and the units worth carrying forward.`)}
                    </p>
                    <div className="catalogue-card__meta project-catalogue-card__meta">
                      <span>{area}</span>
                      <span>
                        {hasEntryPrice
                          ? `${locale === 'th' ? 'ราคาเริ่มต้นล่าสุด' : 'Live entry pricing'}`
                          : (locale === 'th' ? 'ยืนยันราคาและประเภทห้องกับทีม' : 'Confirm pricing and unit mix with the team')}
                      </span>
                    </div>
                    <div className="card-actions project-catalogue-card__actions">
                      <Link className="btn btn-secondary" href={`/${locale}/projects/${p.slug}`}>
                        {dict.listing.viewDetails}
                      </Link>
                      <Link
                        className="btn btn-tertiary"
                        href={withLocaleQuery(locale, '/contact', {
                          intent: 'project_shortlist',
                          source: 'projects_grid',
                          project: p.slug,
                        })}
                      >
                        {dict.cta.speakToAdvisor}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
        </section>
      </main>
    );
  }

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: dict.nav.projects,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: dict.brand.name,
        url: siteUrl,
      },
    },
    null,
    0
  );

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={dict.nav.projects}
        subtitle={dict.listing.projectsSubtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ใช้ที่กำลังเริ่มจากภาพรวมโครงการ' : 'Visitors starting from a project-level overview',
            body: locale === 'th'
              ? 'หน้านี้จัดภาพรวมโครงการให้พร้อมสำหรับการคัดรายการต่อจากบรีฟของคุณ'
              : 'The page turns the project overview into a usable shortlist starting point for your brief.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'ใช้รายการนี้เป็นจุดเริ่มต้นของการคัดรายการ' : 'Use the list as the shortlist starting point',
            body: locale === 'th'
              ? 'เปิดดูรายละเอียดโครงการ หรือส่งบริบทต่อไปยังทีมเพื่อคัดตัวเลือกเร็วขึ้น'
              : 'Open a project detail page or hand your context to the team to narrow faster.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'หน้านี้ยังยึดกับรายการจริงในระบบ' : 'This page stays grounded in live inventory context',
            body: locale === 'th'
              ? 'คุณจะถูกพาไปยังขั้นตอนถัดไปที่เหมาะ ไม่ว่าจะเป็นดูรายละเอียดโครงการหรือให้ทีมช่วยคัดต่อ'
              : 'You are routed into the best next move, whether that is a live project page or a concierge shortlist.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'shortlist', source: 'projects_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'projects_shortlist', from: 'projects_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/smart-finder'),
          label: dict.advisory.useSmartFinder,
          eventPayload: { cta: 'use_smart_finder', from: 'projects_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <section className="section">
      <Container>
        <div className="section-header mb-6">
          <h1 className="section-title">{dict.nav.projects}</h1>
          <p className="section-subtitle">{dict.listing.projectsSubtitle}</p>
        </div>
        <EmptyStateCard
          title={dict.advisory.noPublishedDataTitle}
          body={projectsFetchOk
            ? dict.advisory.noPublishedDataBody
            : (locale === 'th'
              ? 'ไม่สามารถโหลดรายการโครงการที่เผยแพร่ได้ในขณะนี้ หน้านี้จึงไม่แสดง fallback ที่อาจทำให้เข้าใจว่าเป็นโครงการจริง'
              : 'Published project data could not be loaded right now, so this page intentionally avoids showing a misleading fallback.')}
          action={
            <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
              {dict.cta.speakToAdvisor}
            </a>
          }
        />
      </Container>
      </section>
    </main>
  );
}

