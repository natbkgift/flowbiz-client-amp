import { Container } from '@/components/layout/Container';
import { RemoteImage } from '@/components/media/RemoteImage';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import {
  fetchMarketplaceCategories,
  fetchMarketplaceItems,
} from '@/app/_lib/public-api-server';

export default async function MarketplacePage({ params }: { params: { locale: string } }) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);

  const [cats, items] = await Promise.all([
    fetchMarketplaceCategories(),
    fetchMarketplaceItems(),
  ]);

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="section-header">
          <h1 className="section-title">Marketplace</h1>
          <p className="section-subtitle">
            Vetted partners and services that support international buyers.
          </p>
        </div>

        <div className="grid grid-3">
          {cats.map((c) => (
            <div key={c.id} className="card reveal">
              <h3 className="card-title">{c.title}</h3>
              <p className="card-subtitle">Category</p>
            </div>
          ))}
        </div>

        <div className="section-header" style={{ marginTop: 32 }}>
          <h2 className="section-title">Featured services</h2>
          <p className="section-subtitle">Published listings</p>
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
          <p>No listings yet.</p>
        )}
      </Container>
    </main>
  );
}
