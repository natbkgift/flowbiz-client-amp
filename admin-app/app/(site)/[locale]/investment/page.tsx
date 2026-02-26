import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ForeignQuotaExplainer } from '@/components/knowledge/ForeignQuotaExplainer';
import { OwnershipComparison } from '@/components/knowledge/OwnershipComparison';
import { LeadForm } from '@/components/forms/LeadForm';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import { withLocale } from '@/app/_lib/i18n/routing';
import { fetchAreas, fetchDevelopers, fetchProjects, fetchProperties } from '@/app/_lib/public-api-server';
 

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'investment', dict.segments.investment.heroTitle, dict.segments.investment.heroSubtitle, dict.brand.name);
}

export default async function InvestmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const seg = dict.segments.investment;

  let listing: Awaited<ReturnType<typeof fetchProperties>>;
  let areas: Awaited<ReturnType<typeof fetchAreas>> = [];
  let developers: Awaited<ReturnType<typeof fetchDevelopers>> = [];
  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    [listing, areas, developers, projects] = await Promise.all([
      fetchProperties({ type: 'new', limit: 200, sort: 'newest' }),
      fetchAreas(),
      fetchDevelopers(),
      fetchProjects({ limit: 200, page: 1, status_filter: 'published' }),
    ]);
  } catch {
    listing = { data: [], meta: { page: 1, limit: 200, total: 0 } };
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.name })).sort((a, b) => a.label.localeCompare(b.label));
  const developerOptions = developers.map((d) => ({ value: d.id, label: d.name })).sort((a, b) => a.label.localeCompare(b.label));
  const allowedProjectIds = new Set((listing.data ?? []).map((item) => item.project_id).filter((id): id is string => !!id));
  const projectOptions = projects
    .filter((p) => allowedProjectIds.has(p.id))
    .map((p) => ({ value: p.id, label: p.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <main id="main-content">
      <Breadcrumbs
        items={[
          { label: dict.nav.home, href: `/${locale}` },
          { label: seg.heroTitle, href: `/${locale}/investment` },
        ]}
      />
      <section className="hero hero--page">
        <Container>
          <h1 className="headline">{seg.heroTitle}</h1>
          <p className="subhead">{seg.heroSubtitle}</p>
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
            <h2 className="section-title">{seg.roiTitle}</h2>
            <p className="section-subtitle">{seg.roiSubtitle}</p>
          </div>
          <ul className="bullet-list">
            {seg.roiBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{seg.ownershipTitle}</h2>
            <p className="section-subtitle">{seg.ownershipSubtitle}</p>
          </div>
          <div className="grid grid-3">
            {seg.ownershipCards.map((c) => (
              <div key={c.title} className="card">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <ForeignQuotaExplainer locale={locale} />
      <OwnershipComparison locale={locale} />

      <section className="section section--alt">
        <Container>
          <div className="section-header">
            <h2 className="section-title">{locale === 'th' ? 'โอกาสการลงทุนที่คัดแล้ว' : 'Curated Investment Opportunities'}</h2>
            <p className="section-subtitle">{locale === 'th' ? 'รายการที่เน้นศักยภาพผลตอบแทนและสภาพคล่อง' : 'Listings prioritised for yield potential and resale liquidity.'}</p>
          </div>
          <ListingGrid
            items={listing.data ?? []}
            areaOptions={areaOptions}
            developerOptions={developerOptions}
            projectOptions={projectOptions}
            preset={{ type: 'new', status: 'active' }}
            listingSource="investment"
          />
        </Container>
      </section>

      <section className="section section--cta">
        <Container>
          <div className="cta-panel">
            <div>
              <h2 className="cta-title">{seg.ctaTitle}</h2>
              <p className="cta-body">{seg.ctaBody}</p>
            </div>
            <div className="cta-panel__form">
              <LeadForm defaultMessage={seg.ctaBody} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
