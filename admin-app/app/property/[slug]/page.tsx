import type { Metadata } from 'next';
import Image from 'next/image';

import { fetchPropertyBySlug } from '../../_lib/public-api-server';
import { fetchProperties } from '../../_lib/public-api-server';
import {
  formatPriceTHB,
  normalizeNoWatermark,
  pickCoverImage,
  resolveImageUrl,
} from '../../_lib/public-api-shared';
import { PropertyGrid } from '../../_lib/public-components';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await fetchPropertyBySlug(params.slug);
  if (!p) {
    return { title: 'Property Not Found | AMP Pattaya' };
  }

  const cover = pickCoverImage(p);
  const ogImage = cover && resolveImageUrl(cover) ? normalizeNoWatermark(cover) : null;

  return {
    title: `${p.title} | AMP Pattaya`,
    description: `${p.address}, ${p.city} • ${Number(p.price).toLocaleString()} THB`,
    openGraph: {
      title: p.title,
      description: `${p.address}, ${p.city}`,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function PropertySlugPage({ params }: PageProps) {
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) {
    return <main className="max-w-4xl mx-auto p-6">Property not found</main>;
  }

  const rawImages = property.local_images ?? property.images ?? [];
  const cover = pickCoverImage(property);

  const gallery = [cover, ...rawImages]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map((v) => (resolveImageUrl(v) ? normalizeNoWatermark(v) : null))
    .filter((v): v is string => Boolean(v));

  const mainImage = gallery[0] ?? null;

  const relatedRes = await fetchProperties({ type: property.type, limit: 12, sort: 'newest' });
  const related = (relatedRes.data ?? []).filter((p) => p.id !== property.id).slice(0, 6);

  return (
    <main className="bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              {property.type}
            </span>
            {property.status === 'active' ? (
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Verified
              </span>
            ) : null}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{property.title}</h1>
          <p className="text-lg text-slate-600">
            {property.address}, {property.city}
          </p>
          <p className="text-2xl font-bold text-slate-950">{formatPriceTHB(Number(property.price))}</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="space-y-4">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-200">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100" />
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gallery.slice(0, 12).map((src) => (
                  <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Bedrooms</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{property.bedrooms ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Bathrooms</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{property.bathrooms ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">Area</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {property.size != null ? `${property.size} sqm` : '-'}
                </p>
              </div>
            </div>

            {property.description ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-2">
                <h2 className="text-xl font-semibold">Description</h2>
                <p className="text-slate-700 whitespace-pre-line">{property.description}</p>
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Contact & Inquiry</p>
              <p className="mt-1 text-sm text-slate-600">
                Get availability, pricing, and viewing options.
              </p>
              <a
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900"
                href={`mailto:info@amppattaya.com?subject=${encodeURIComponent(`Inquiry: ${property.title}`)}`}
              >
                Send Inquiry
              </a>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">Trust</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>• Local images only</li>
                    <li>• Verified listing data</li>
                    <li>• Fast response</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {related.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Related properties</h2>
            <PropertyGrid items={related} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
