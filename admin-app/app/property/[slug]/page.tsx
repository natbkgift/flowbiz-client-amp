import type { Metadata } from 'next';

import { fetchPropertyBySlug, normalizeNoWatermark, pickCoverImage } from '../../_lib/public-api';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await fetchPropertyBySlug(params.slug);
  if (!p) {
    return { title: 'Property Not Found | AMP Pattaya' };
  }

  const cover = pickCoverImage(p);

  return {
    title: `${p.title} | AMP Pattaya`,
    description: `${p.address}, ${p.city} • ${Number(p.price).toLocaleString()} THB`,
    openGraph: {
      title: p.title,
      description: `${p.address}, ${p.city}`,
      images: cover ? [normalizeNoWatermark(cover)] : [],
    },
  };
}

export default async function PropertySlugPage({ params }: PageProps) {
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) {
    return <main className="max-w-4xl mx-auto p-6">Property not found</main>;
  }

  const images = property.local_images ?? property.images ?? [];
  const cover = pickCoverImage(property);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 shrink-0">
            {property.type}
          </span>
        </div>
        <p className="text-2xl font-bold">{Number(property.price).toLocaleString()} THB</p>
        <p className="text-slate-600">
          {property.address}, {property.city}
        </p>
      </header>

      <section className="space-y-3">
        {cover ? (
          <img
            src={normalizeNoWatermark(cover)}
            alt={property.title}
            className="w-full h-80 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-80 bg-slate-200 rounded-lg" />
        )}

        {images.length > 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.slice(0, 12).map((url) => (
              <img key={url} src={normalizeNoWatermark(url)} alt="" className="h-24 w-full object-cover rounded" loading="lazy" />
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Bedrooms</p>
          <p className="text-lg font-semibold">{property.bedrooms ?? '-'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Bathrooms</p>
          <p className="text-lg font-semibold">{property.bathrooms ?? '-'}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500">Size</p>
          <p className="text-lg font-semibold">{property.size != null ? `${property.size} sqm` : '-'}</p>
        </div>
      </section>

      {property.description ? (
        <section className="bg-white rounded-lg shadow-sm p-6 space-y-2">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="text-slate-700 whitespace-pre-line">{property.description}</p>
        </section>
      ) : null}
    </main>
  );
}
