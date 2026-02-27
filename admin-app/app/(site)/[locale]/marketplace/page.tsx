import { Container } from '@/components/layout/Container';
import { RemoteImage } from '@/components/media/RemoteImage';
import { ListingGrid } from '@/components/listing/ListingGrid';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import {
  fetchAreas,
  fetchDevelopers,
  fetchProjects,
  fetchProperties,
  fetchMarketplaceCategories,
  fetchMarketplaceItems,
} from '@/app/_lib/public-api-server';
 

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'marketplace', dict.marketplace.title, dict.marketplace.subtitle, dict.brand.name);
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);

  let cats: Awaited<ReturnType<typeof fetchMarketplaceCategories>>;
  let items: Awaited<ReturnType<typeof fetchMarketplaceItems>>;
  let properties: Awaited<ReturnType<typeof fetchProperties>>;
  let areas: Awaited<ReturnType<typeof fetchAreas>> = [];
  let developers: Awaited<ReturnType<typeof fetchDevelopers>> = [];
  let projects: Awaited<ReturnType<typeof fetchProjects>> = [];
  try {
    [cats, items, properties, areas, developers, projects] = await Promise.all([
      fetchMarketplaceCategories(),
      fetchMarketplaceItems(),
      fetchProperties({ limit: 200, sort: 'newest' }),
      fetchAreas(),
      fetchDevelopers(),
      fetchProjects({ limit: 200, page: 1, status_filter: 'published' }),
    ]);
  } catch {
    cats = [];   // graceful degradation
    items = [];  // graceful degradation
    properties = { data: [], meta: { page: 1, limit: 200, total: 0 } };
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.name })).sort((a, b) => a.label.localeCompare(b.label));
  const developerOptions = developers.map((d) => ({ value: d.id, label: d.name })).sort((a, b) => a.label.localeCompare(b.label));
  const allowedProjectIds = new Set((properties.data ?? []).map((item) => item.project_id).filter((id): id is string => !!id));
  const projectOptions = projects
    .filter((p) => allowedProjectIds.has(p.id))
    .map((p) => ({ value: p.id, label: p.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header">
          <h1 className="section-title">{dict.marketplace.title}</h1>
          <p className="section-subtitle">
            {dict.marketplace.subtitle}
          </p>
        </div>

        <div className="grid grid-3">
          {cats.map((c) => (
            <div key={c.id} className="card reveal">
              <h3 className="card-title">{c.title}</h3>
              <p className="card-subtitle">{dict.marketplace.category}</p>
            </div>
          ))}
        </div>

        <div className="section-header mt-8">
          <h2 className="section-title">{dict.marketplace.featuredTitle}</h2>
          <p className="section-subtitle">{dict.marketplace.featuredSubtitle}</p>
        </div>

        {items.length ? (
          <div className="grid grid-3">
            {items.slice(0, 9).map((it) => (
              <div key={it.id} className="card reveal">
                {it.image_url ? (
                  <RemoteImage
                    src={it.image_url}
                    alt={it.name}
                    className="w-full h-44 object-cover rounded"
                    width={640}
                    height={352}
                  />
                ) : null}
                <h3 className="card-title">{it.name}</h3>
                <p className="card-subtitle">{it.summary ?? dict.home.insightSubtitle}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>{dict.marketplace.noListings}</p>
        )}

        <div className="section-header mt-10">
          <h2 className="section-title">{locale === 'th' ? 'อสังหาในมาร์เก็ตเพลส' : 'Property Marketplace Listings'}</h2>
          <p className="section-subtitle">{locale === 'th' ? 'ค้นหายูนิตตามงบประมาณ ทำเล และโครงการ' : 'Filter units by budget, location, and project context.'}</p>
        </div>
        <ListingGrid
          items={properties.data ?? []}
          areaOptions={areaOptions}
          developerOptions={developerOptions}
          projectOptions={projectOptions}
          preset={{ status: 'active' }}
          listingSource="marketplace"
        />
      </Container>
    </main>
  );
}
