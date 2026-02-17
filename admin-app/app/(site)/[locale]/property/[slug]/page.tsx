import type { Metadata } from 'next';
import Image from 'next/image';

import { Container } from '@/components/layout/Container';
import { LeadForm } from '@/components/forms/LeadForm';
import { fetchPropertyBySlug } from '@/app/_lib/public-api-server';
import { CTA } from '@/app/_lib/public-cta';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await fetchPropertyBySlug(params.slug);
  if (!p) return { title: 'Property Not Found | Asset Management Property' };
  return {
    title: `${p.title} | Asset Management Property`,
    description: `${p.address}, ${p.city}`,
  };
}

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export default async function PropertyPage({ params }: PageProps) {
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1>Property not found</h1>
        </Container>
      </main>
    );
  }

  const images = (property.local_images ?? property.images ?? [])
    .map((u) => resolveImageUrl(u))
    .filter((v): v is string => Boolean(v));

  const cover = resolveImageUrl(property.cover_image) ?? images[0] ?? null;
  const gallery = cover ? [cover, ...images.filter((u) => u !== cover)] : images;
  const main = gallery[0] ?? null;

  return (
    <main className="section" id="main-content">
      <Container>
        <div className="detail-layout">
          <div className="detail-main">
            <div id="gallery-section">
              <div className="gallery-main">
                {main ? (
                  <Image
                    src={main}
                    alt={property.title}
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                ) : null}
                <div className="gallery-counter">1 / {Math.max(gallery.length, 1)}</div>
              </div>

              {gallery.length > 1 ? (
                <div className="gallery-thumbnails">
                  {gallery.slice(0, 12).map((src, idx) => (
                    <div key={src} className={idx === 0 ? 'gallery-thumbnail active' : 'gallery-thumbnail'}>
                      <Image src={src} alt="" width={80} height={60} style={{ objectFit: 'cover' }} loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="property-header">
              <div className="property-title">
                <h1>{property.title}</h1>
                <p className="property-location">
                  {property.address}, {property.city}
                </p>
              </div>
              <div className="property-price">{formatPriceTHB(Number(property.price))}</div>
            </div>

            <div className="property-facts">
              <div>
                <strong>{property.bedrooms ?? '-'}</strong>
                <div style={{ fontSize: 14, color: 'var(--color-gray-600)' }}>Bedrooms</div>
              </div>
              <div>
                <strong>{property.bathrooms ?? '-'}</strong>
                <div style={{ fontSize: 14, color: 'var(--color-gray-600)' }}>Bathrooms</div>
              </div>
              <div>
                <strong>{property.size ?? '-'}</strong>
                <div style={{ fontSize: 14, color: 'var(--color-gray-600)' }}>Sqm</div>
              </div>
            </div>

            <div style={{ background: 'var(--color-white)', padding: 24, borderRadius: 12, marginBottom: 24 }}>
              <h2 style={{ marginBottom: 16 }}>Description</h2>
              <p style={{ marginBottom: 0 }}>{property.description ?? '—'}</p>
            </div>

            <div>
              <h2 style={{ marginBottom: 24 }}>Similar Properties</h2>
              <div className="grid grid-2">
                <div className="property-card">
                  <div className="card-content">
                    <div className="card-title">Coming soon</div>
                    <div className="card-location" style={{ marginBottom: 0 }}>
                      Similar properties will appear here.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="detail-sidebar">
            <div className="agent-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  AMP
                </div>
                <div>
                  <h3 style={{ marginBottom: 4 }}>AMP Pattaya</h3>
                  <p style={{ marginBottom: 0, color: 'var(--color-gray-600)', fontSize: 14 }}>
                    Professional Property Management
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href={CTA.lineUrl} className="btn btn-primary btn-block" target="_blank" rel="noreferrer">
                  LINE Chat
                </a>
                <a href={CTA.phoneTel} className="btn btn-secondary btn-block">
                  Call: 063-453-3526
                </a>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <LeadForm
                heading="Interested in this property?"
                propertyId={property.id}
                defaultMessage={`I'm interested in ${property.title}. Please contact me.`}
              />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
