import Link from 'next/link';
import type { Metadata } from 'next';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import {
  fetchDevelopers,
  fetchProjects,
  type DeveloperItem,
  type ProjectItem,
} from '@/app/_lib/public-api-server';
import { Container } from '@/components/layout/Container';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { EmptyStateCard } from '@/components/ui/StateBlocks';

export const revalidate = 300;
const DEVELOPERS_FETCH_TIMEOUT_MS = 8000;

type ProjectDeveloperSignal = {
  key: string;
  name: string;
  developerId: string | null;
  developerSlug: string | null;
  firstProjectSlug: string | null;
  minStartingPrice: number | null;
  pricedProjectCount: number;
  projectCount: number;
  projectNames: string[];
  areaNames: string[];
};

type DeveloperPresenceCard = {
  key: string;
  name: string;
  tier: string | null;
  website: string | null;
  projectCount: number;
  projectNames: string[];
  areaNames: string[];
  firstProjectSlug: string | null;
  minStartingPrice: number | null;
  pricedProjectCount: number;
  contactParam: string;
  source: 'directory' | 'project';
};

function deriveAreaNamesFromDeveloper(developer: DeveloperItem): string[] {
  return (developer.primary_areas ?? [])
    .map((area) => area.name?.trim())
    .filter((areaName): areaName is string => Boolean(areaName))
    .slice(0, 3);
}

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = DEVELOPERS_FETCH_TIMEOUT_MS): Promise<T> {
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

function normalizeDeveloperToken(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function buildProjectDeveloperSignals(projects: ProjectItem[]): ProjectDeveloperSignal[] {
  const grouped = new Map<string, ProjectDeveloperSignal>();

  for (const project of projects) {
    if (!project.developer?.name) continue;

    const developerId = project.developer.id?.trim() || null;
    const developerSlug = project.developer.slug?.trim() || null;
    const developerName = project.developer.name.trim();
    const key = developerId || developerSlug || normalizeDeveloperToken(developerName);

    if (!key) continue;

    const current = grouped.get(key) ?? {
      key,
      name: developerName,
      developerId,
      developerSlug,
      firstProjectSlug: null,
      minStartingPrice: null,
      pricedProjectCount: 0,
      projectCount: 0,
      projectNames: [],
      areaNames: [],
    };

    current.projectCount += 1;

    if (!current.firstProjectSlug && project.slug) {
      current.firstProjectSlug = project.slug;
    }

    if (
      typeof project.starting_price === 'number'
      && Number.isFinite(project.starting_price)
      && project.starting_price > 0
    ) {
      current.pricedProjectCount += 1;
      current.minStartingPrice = current.minStartingPrice == null
        ? project.starting_price
        : Math.min(current.minStartingPrice, project.starting_price);
    }

    if (project.name && !current.projectNames.includes(project.name) && current.projectNames.length < 3) {
      current.projectNames.push(project.name);
    }

    if (project.area?.name && !current.areaNames.includes(project.area.name) && current.areaNames.length < 3) {
      current.areaNames.push(project.area.name);
    }

    grouped.set(key, current);
  }

  return [...grouped.values()].sort((left, right) => {
    if (right.projectCount !== left.projectCount) return right.projectCount - left.projectCount;
    return left.name.localeCompare(right.name);
  });
}

function findMatchingSignal(developer: DeveloperItem, signals: ProjectDeveloperSignal[]): ProjectDeveloperSignal | undefined {
  const nameToken = normalizeDeveloperToken(developer.name);

  return signals.find((signal) => {
    if (developer.id && signal.developerId === developer.id) return true;
    if (developer.slug && signal.developerSlug === developer.slug) return true;
    return nameToken.length > 0 && normalizeDeveloperToken(signal.name) === nameToken;
  });
}

function buildDeveloperPresenceCards(
  developers: DeveloperItem[],
  signals: ProjectDeveloperSignal[],
): DeveloperPresenceCard[] {
  const cards: DeveloperPresenceCard[] = [];
  const matchedSignals = new Set<string>();

  for (const developer of developers) {
    const signal = findMatchingSignal(developer, signals);
    if (signal) matchedSignals.add(signal.key);

    const fallbackProjectCount = developer.project_count ?? 0;
    const fallbackAreaNames = deriveAreaNamesFromDeveloper(developer);
    const fallbackMinStartingPrice = developer.price_range?.min ?? null;

    cards.push({
      key: developer.id,
      name: developer.name,
      tier: developer.tier?.trim() || null,
      website: developer.website?.trim() || null,
      projectCount: signal?.projectCount ?? fallbackProjectCount,
      projectNames: signal?.projectNames ?? [],
      areaNames: signal?.areaNames ?? fallbackAreaNames,
      firstProjectSlug: signal?.firstProjectSlug ?? null,
      minStartingPrice: signal?.minStartingPrice ?? fallbackMinStartingPrice,
      pricedProjectCount: signal?.pricedProjectCount ?? 0,
      contactParam: developer.slug || signal?.developerSlug || developer.id,
      source: 'directory',
    });
  }

  for (const signal of signals) {
    if (matchedSignals.has(signal.key)) continue;

    cards.push({
      key: `signal:${signal.key}`,
      name: signal.name,
      tier: null,
      website: null,
      projectCount: signal.projectCount,
      projectNames: signal.projectNames,
      areaNames: signal.areaNames,
      firstProjectSlug: signal.firstProjectSlug,
      minStartingPrice: signal.minStartingPrice,
      pricedProjectCount: signal.pricedProjectCount,
      contactParam: signal.developerSlug || signal.key,
      source: 'project',
    });
  }

  return cards.sort((left, right) => {
    if (right.projectCount !== left.projectCount) return right.projectCount - left.projectCount;
    if (left.source !== right.source) return left.source === 'directory' ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function pageCopy(locale: 'en' | 'th'): { title: string; subtitle: string; description: string } {
  if (locale === 'th') {
    return {
      title: 'ผู้พัฒนาโครงการ',
      subtitle: 'เปรียบเทียบผู้พัฒนาผ่านโครงการที่เผยแพร่อยู่จริงในระบบ',
      description: 'สำรวจผู้พัฒนาและโครงการที่เผยแพร่อยู่จริงบน AMP Pattaya เพื่อเริ่ม shortlist ได้อย่างมั่นใจ',
    };
  }

  return {
    title: 'Developers',
    subtitle: 'Compare developers through live published project coverage.',
    description: 'Explore developers and live published projects on AMP Pattaya before moving into a shortlist.',
  };
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  return makePageMetadata(locale, 'developers', copy.title, copy.description, dict.brand.name);
}

export default async function DevelopersPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const copy = pageCopy(locale);
  const advisoryLabels = getAdvisoryLabels(locale);
  const advisoryProofs = getAdvisoryProofs(dict);

  const [developers, projects] = await Promise.all([
    withTimeout(fetchDevelopers(), []),
    withTimeout(fetchProjects({ limit: 100 }), []),
  ]);

  const publishedProjects = projects.filter((project) => project.slug?.trim() && project.status === 'published');
  const developerSignals = buildProjectDeveloperSignals(publishedProjects);
  const cards = buildDeveloperPresenceCards(
    [...developers].sort((a, b) => a.name.localeCompare(b.name)),
    developerSignals,
  );
  const currencyFormatter = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  });
  const watchlistTitle = locale === 'th' ? 'รายชื่อผู้พัฒนาที่ควรจับตา' : 'Developer watchlist';
  const watchlistSubtitle = locale === 'th'
    ? 'เทียบ published presence, live project coverage และทางไปต่อยัง project review ได้จากหน้าเดียว'
    : 'Compare published presence, live project coverage, and the fastest route into project review from one page.';
  const watchlistStrip = locale === 'th'
    ? 'เมื่อ developer records ยังบาง ให้ใช้โครงการที่เผยแพร่อยู่จริงเป็นฐานเปรียบเทียบว่าแบรนด์ไหน active และควรไปต่อที่โครงการใดก่อน'
    : 'When direct developer records are thin, the cards below stay grounded in live published projects so you can see which brands are active and where to move next.';
  const liveBrandCount = developerSignals.length;
  const totalLiveProjects = cards.reduce((sum, card) => sum + card.projectCount, 0);
  const pricedBrandCount = cards.filter((card) => card.pricedProjectCount > 0).length;
  const uniqueAreas = [...new Set(cards.flatMap((card) => card.areaNames))].sort((left, right) => left.localeCompare(right));
  const topBrands = cards
    .filter((card) => card.projectCount > 0)
    .slice(0, 3)
    .map((card) => card.name);
  const snapshotTitle = locale === 'th' ? 'ภาพรวมสำหรับคนที่เริ่มจากผู้พัฒนา' : 'Snapshot for developer-led buyers';
  const snapshotSubtitle = locale === 'th'
    ? 'สรุปจาก published projects ที่ live อยู่จริง เพื่อช่วยตัดสินใจก่อนกดลงลึกในแต่ละโครงการ'
    : 'A compact brief built from live published projects so you can compare credibility before diving into individual project pages.';
  const snapshotMetrics = [
    {
      label: locale === 'th' ? 'แบรนด์ที่มีโครงการ live' : 'Live brands',
      value: liveBrandCount > 0 ? String(liveBrandCount) : null,
    },
    {
      label: locale === 'th' ? 'โครงการที่ใช้อ้างอิง' : 'Live projects',
      value: totalLiveProjects > 0 ? String(totalLiveProjects) : null,
    },
    {
      label: locale === 'th' ? 'แบรนด์ที่มีราคาเริ่มต้นให้ดู' : 'Brands with visible pricing',
      value: pricedBrandCount > 0 ? String(pricedBrandCount) : null,
    },
    {
      label: locale === 'th' ? 'ทำเลที่ครอบคลุม' : 'Areas represented',
      value: uniqueAreas.length > 0 ? String(uniqueAreas.length) : null,
    },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  const snapshotInsights = [
    developers.length > 0
      ? locale === 'th'
        ? `developer profiles ที่มีอยู่จะถูกเติมด้วย published project coverage เท่าที่ข้อมูลจริงรองรับ`
        : 'Available developer profiles are enriched with published project coverage wherever the current dataset supports it.'
      : locale === 'th'
        ? 'ตอนนี้หน้า public ยังพึ่ง live project coverage เป็นหลัก เพราะ direct developer profiles ที่เผยแพร่ยังบาง'
        : 'The public page currently leans on live project coverage because direct published developer profiles are still thin.',
    topBrands.length > 0
      ? locale === 'th'
        ? `แบรนด์ที่ขยับอยู่ตอนนี้: ${topBrands.join(', ')}`
        : `Most active brands right now: ${topBrands.join(', ')}.`
      : null,
    liveBrandCount > 0
      ? locale === 'th'
        ? `มี ${pricedBrandCount} จาก ${liveBrandCount} แบรนด์ที่มีราคาเริ่มต้นให้ดูทันที ส่วนที่เหลือต้องคอนเฟิร์มกับ advisor`
        : `${pricedBrandCount} of ${liveBrandCount} brands show visible starting prices right now; the remainder still needs advisor-confirmed pricing.`
      : null,
  ].filter((item): item is string => Boolean(item));
  const lowerCtaTitle = locale === 'th'
    ? 'เปลี่ยน watchlist นี้ให้เป็น shortlist ที่พร้อมใช้งาน'
    : 'Turn this watchlist into a shortlist you can act on';
  const lowerCtaBody = locale === 'th'
    ? 'หากชื่อผู้พัฒนาเริ่มชัดแล้ว ให้ทีมช่วยคัดโครงการต่อจากแบรนด์ งบ และทำเลที่คุณสนใจ หรือใช้ Smart Finder หากต้องการเริ่มจากเกณฑ์เปรียบเทียบด้วยตัวเองก่อนคุยกับทีม.'
    : 'Once a likely developer is emerging, move into a sharper shortlist by brand, budget, and area with the team, or use Smart Finder if you want to compare opportunities yourself first.';

  return (
    <main id="main-content">
      <PublicAdvisoryHero
        eyebrow={dict.advisory.heroEyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
        proofs={advisoryProofs}
        proofsLabel={advisoryLabels.proofsLabel}
        guidanceLabel={advisoryLabels.guidanceLabel}
        signals={[
          {
            kicker: dict.advisory.bestFor,
            title: locale === 'th' ? 'ผู้ซื้อที่ต้องการเริ่มจากความน่าเชื่อถือของผู้พัฒนา' : 'Buyers starting from developer credibility',
            body: locale === 'th'
              ? 'ใช้หน้านี้เมื่อต้องการเทียบ developer name, tier, และ published presence ก่อน'
              : 'Use this page when developer brand, tier, and published presence matter before unit-level review.',
            icon: 'building',
          },
          {
            kicker: dict.advisory.nextStep,
            title: locale === 'th' ? 'เลือก developer แล้วค่อยไปดู projects' : 'Choose the developer, then move into projects',
            body: locale === 'th'
              ? 'เมื่อเห็นรายชื่อที่ใช่แล้ว ค่อยไล่ต่อไปยัง inventory หรือปรึกษาทีม'
              : 'Once the likely developer is clear, move into inventory or advisory consultation.',
            icon: 'check',
          },
          {
            kicker: dict.advisory.trustSignal,
            title: locale === 'th' ? 'ยึดตามสัญญาณจากโครงการที่เผยแพร่อยู่จริง' : 'Built from live published project signals',
            body: locale === 'th'
              ? 'หน้านี้ใช้เฉพาะชื่อผู้พัฒนาและทางไปต่อที่อ้างอิงจากโครงการที่เผยแพร่อยู่จริง เพื่อไม่เติมความน่าเชื่อถือเกินข้อมูลที่มี'
              : 'Developer names and next steps shown here stay grounded in live published projects rather than speculative profile content.',
            icon: 'shield',
          },
        ]}
        primaryAction={{
          href: withLocaleQuery(locale, '/contact', { intent: 'developer_shortlist', source: 'developers_hero' }),
          label: dict.cta.speakToAdvisor,
          eventPayload: { cta: 'developer_shortlist', from: 'developers_hero' },
        }}
        secondaryAction={{
          href: withLocale(locale, '/projects'),
          label: dict.advisory.browseVerifiedInventory,
          eventPayload: { cta: 'browse_verified_inventory', from: 'developers_hero' },
        }}
        tertiaryAction={{
          href: buildAdvisorWhatsApp(locale, dict),
          label: dict.cta.whatsapp,
        }}
      />
      <section className="section section--alt">
        <Container>
          <div className="section-header mb-6">
            <h2 className="section-title">{snapshotTitle}</h2>
            <p className="section-subtitle">{snapshotSubtitle}</p>
          </div>

          <div className="authority-card">
            {snapshotMetrics.length ? (
              <div className="signal-grid signal-grid--four-up">
                {snapshotMetrics.map((item) => (
                  <div key={item.label} className="metric-card">
                    <span className="metric-card__label">{item.label}</span>
                    <strong className="metric-card__value">{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {snapshotInsights.length ? (
              <div className="insight-list mt-4">
                {snapshotInsights.map((item) => (
                  <div key={item} className="insight-list__item">
                    <span className="insight-list__body">{item}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {uniqueAreas.length ? (
              <div className="chip-list mt-4" aria-label={locale === 'th' ? 'ทำเลที่มีโครงการ live' : 'Areas with live project coverage'}>
                {uniqueAreas.map((areaName) => (
                  <span key={areaName} className="chip-list__item">{areaName}</span>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </section>
      <section className="section">
      <Container>
        <div className="section-header mb-6">
          <h2 className="section-title">{watchlistTitle}</h2>
          <p className="section-subtitle">{watchlistSubtitle}</p>
        </div>

        {cards.length ? (
          <div className="cta-strip mb-6">
            <div className="cta-strip__text">{watchlistStrip}</div>
            <Link className="btn btn-secondary" href={withLocale(locale, '/projects')}>
              {locale === 'th' ? 'ดูโครงการทั้งหมด' : 'Browse all projects'}
            </Link>
          </div>
        ) : null}

        {cards.length ? (
          <div className="grid grid-3">
            {cards.map((card) => (
              <article key={card.key} className="card catalogue-card">
                <div className="catalogue-card__eyebrow">
                  {card.source === 'directory'
                    ? (locale === 'th' ? 'ผู้พัฒนาที่เผยแพร่แล้ว' : 'Published developer')
                    : (locale === 'th' ? 'สัญญาณจากโครงการที่เผยแพร่แล้ว' : 'Signal from live projects')}
                </div>
                <h2 className="card-title">{card.name}</h2>
                <p className="card-subtitle">
                  {card.tier
                    ? card.projectCount > 0
                      ? `${card.tier} • ${locale === 'th' ? `${card.projectCount} โครงการที่เผยแพร่แล้ว` : `${card.projectCount} published projects`}`
                      : card.tier
                    : card.projectCount > 0
                      ? (locale === 'th' ? `${card.projectCount} โครงการที่เผยแพร่แล้ว` : `${card.projectCount} published projects`)
                      : (locale === 'th' ? 'ใช้หน้านี้เป็นจุดเริ่มต้นก่อนคุย shortlist' : 'Use this page as the starting point before a shortlist review')}
                </p>
                <div className="catalogue-card__meta">
                  {card.projectNames.length ? (
                    <span>
                      {locale === 'th'
                        ? `โครงการที่ live อยู่ตอนนี้: ${card.projectNames.join(', ')}`
                        : `Live projects now: ${card.projectNames.join(', ')}`}
                    </span>
                  ) : (
                    <span>
                      {locale === 'th'
                        ? 'ใช้ข้อมูลผู้พัฒนาเป็นจุดเริ่มต้นก่อนขอดู shortlist โครงการที่ตรงกลยุทธ์'
                        : 'Use developer context as the starting point before requesting a project shortlist.'}
                    </span>
                  )}
                  {card.areaNames.length ? (
                    <span>
                      {locale === 'th'
                        ? `ทำเลที่มีโครงการ live: ${card.areaNames.join(', ')}`
                        : `Live in areas: ${card.areaNames.join(', ')}`}
                    </span>
                  ) : null}
                  {card.minStartingPrice != null ? (
                    <span>
                      {locale === 'th'
                        ? `ราคาเริ่มต้นที่เห็นได้: ${currencyFormatter.format(card.minStartingPrice)}`
                        : `Visible pricing starts from ${currencyFormatter.format(card.minStartingPrice)}`}
                    </span>
                  ) : card.pricedProjectCount > 0 ? (
                    <span>
                      {locale === 'th'
                        ? `มีราคาเริ่มต้นให้ดู ${card.pricedProjectCount} โครงการ`
                        : `${card.pricedProjectCount} live projects show visible starting price.`}
                    </span>
                  ) : card.projectCount > 0 ? (
                    <span>
                      {locale === 'th'
                        ? 'บางโครงการยังต้องขอราคากับที่ปรึกษาโดยตรง'
                        : 'Some linked projects still require advisor-confirmed pricing.'}
                    </span>
                  ) : null}
                </div>
                {card.website ? (
                  <p className="card-subtitle">
                    <a href={card.website} rel="noopener noreferrer" target="_blank">
                      {card.website}
                    </a>
                  </p>
                ) : null}
                <div className="card-actions">
                  {card.firstProjectSlug ? (
                    <Link className="btn btn-secondary" href={withLocale(locale, `/projects/${card.firstProjectSlug}`)}>
                      {locale === 'th' ? 'ดูโครงการที่กำลัง live' : 'Review live project'}
                    </Link>
                  ) : null}
                  <Link
                    className={card.firstProjectSlug ? 'btn btn-tertiary' : 'btn btn-secondary'}
                    href={withLocaleQuery(locale, '/contact', {
                      intent: 'developer_shortlist',
                      source: 'developers_watchlist',
                      developer: card.contactParam,
                    })}
                  >
                    {dict.cta.speakToAdvisor}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title={dict.advisory.noPublishedDataTitle}
            body={dict.advisory.noPublishedDataBody}
            action={
              <a className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </a>
            }
          />
        )}
      </Container>
      </section>
      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{lowerCtaTitle}</h2>
              <p className="cta-body">{lowerCtaBody}</p>
            </div>
            <div className="cta-row">
              <Link
                className="btn btn-cta"
                href={withLocaleQuery(locale, '/contact', { intent: 'developer_shortlist', source: 'developers_bottom' })}
              >
                {dict.cta.speakToAdvisor}
              </Link>
              <Link className="btn btn-secondary" href={withLocale(locale, '/smart-finder')}>
                {dict.advisory.useSmartFinder}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

