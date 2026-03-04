import { Container } from '@/components/layout/Container';
import { RemoteImage } from '@/components/media/RemoteImage';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { makePageMetadata } from '@/app/_lib/i18n/metadata';
import {
  fetchMarketplaceCategories,
  fetchMarketplaceItems,
} from '@/app/_lib/public-api-server';

export const revalidate = 300;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  return makePageMetadata(locale, 'marketplace', dict.marketplace.title, dict.marketplace.subtitle, dict.brand.name);
}

export default async function MarketplacePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  let cats: Awaited<ReturnType<typeof fetchMarketplaceCategories>>;
  let items: Awaited<ReturnType<typeof fetchMarketplaceItems>>;
  try {
    [cats, items] = await Promise.all([
      fetchMarketplaceCategories(),
      fetchMarketplaceItems(),
    ]);
  } catch {
    cats = [];   // graceful degradation
    items = [];  // graceful degradation
  }

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
      </Container>
    </main>
  );
}

