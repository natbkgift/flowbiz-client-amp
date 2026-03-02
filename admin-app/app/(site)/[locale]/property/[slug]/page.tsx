import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

const LeadForm = dynamic(
  () => import('@/components/forms/LeadForm').then((m) => m.LeadForm),
  { ssr: false },
);
import { IconBed, IconBath, IconArea } from '@/components/icons/SvgIcons';
import { fetchPropertyBySlug } from '@/app/_lib/public-api-server';
import { CTA } from '@/app/_lib/public-cta';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { ogLocale } from '@/app/_lib/i18n/routing';
import { getInternalLinks } from '@/app/_lib/internal-links';
import { PAGE_REVALIDATE_SECONDS } from '@/app/_lib/constants';

export const revalidate = PAGE_REVALIDATE_SECONDS;

type PageProps = { params: { locale: string; slug: string } };
const PROPERTY_DETAIL_FALLBACK = '/media/project-covers/the-riviera-jomtien/cover_31dde7af340e.jpg';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/property/${encodeURIComponent(params.slug)}`;

  const p = await fetchPropertyBySlug(params.slug);
  if (!p) {
    const title = `${dict.brand.name} | ${dict.nav.buy}`;
    return {
      title,
      alternates: {
        canonical,
        languages: {
          en: `/en/property/${encodeURIComponent(params.slug)}`,
          th: `/th/property/${encodeURIComponent(params.slug)}`,
        },
      },
      openGraph: {
        type: 'website',
        url: canonical,
        title,
        siteName: dict.brand.name,
        locale: ogLocale(locale),
      },
    };
  }

  const title = `${p.title} | ${dict.brand.name}`;
  const description = `${p.address}, ${p.city}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/property/${encodeURIComponent(params.slug)}`,
        th: `/th/property/${encodeURIComponent(params.slug)}`,
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

function formatPriceTHB(price: number): string {
  if (!Number.isFinite(price)) return '฿-';
  return `฿${Math.round(price).toLocaleString()}`;
}

export default async function PropertyPage({ params }: PageProps) {
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const internalLinks = getInternalLinks(locale, dict, { from: 'property_detail', includeProjects: true });
  const property = await fetchPropertyBySlug(params.slug);
  if (!property) {
    return (
      <main className="section" id="main-content">
        <Container>
          <h1>{dict.property.notFound}</h1>
          <div className="card reveal mt-6">
            <h2 className="card-title">{dict.property.nextSteps}</h2>
            <p className="card-subtitle">{dict.property.exploreRelated}</p>
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

  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/property/${encodeURIComponent(params.slug)}`;

  const images = (property.local_images ?? property.images ?? [])
    .map((u) => resolveImageUrl(u))
    .filter((v): v is string => Boolean(v));

  const cover = resolveImageUrl(property.cover_image) ?? images[0] ?? PROPERTY_DETAIL_FALLBACK;
  const gallery = [cover, ...images.filter((u) => u !== cover)];
  const main = gallery[0];

  const priceNumber = Number(property.price);
  const priceValue = Number.isFinite(priceNumber) ? Math.round(priceNumber) : undefined;

  const jsonLd = JSON.stringify(
    [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: property.title,
        description: property.description ?? undefined,
        sku: property.id,
        url: canonicalUrl,
        image: gallery.slice(0, 8),
        brand: {
          '@type': 'Brand',
          name: dict.brand.name,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'THB',
          price: priceValue,
          availability: 'https://schema.org/InStock',
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
            name: dict.nav.buy,
            item: `${siteUrl}/${locale}/buy`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: property.title,
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
      <Container>
        <Breadcrumbs
          items={[
            { label: dict.property.breadcrumbHome, href: `/${locale}` },
            { label: dict.nav.buy, href: `/${locale}/buy` },
            { label: property.title, href: `/${locale}/property/${encodeURIComponent(params.slug)}` },
          ]}
        />
        <div className="detail-layout">
          <div className="detail-main">
            <div id="gallery-section">
              <div className="gallery-main">
                <Image
                  src={main}
                  alt={property.title}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="gallery-counter">1 / {Math.max(gallery.length, 1)}</div>
              </div>

              {gallery.length > 1 ? (
                <div className="gallery-thumbnails">
                  {gallery.slice(0, 12).map((src, idx) => (
                    <div key={src} className={idx === 0 ? 'gallery-thumbnail active' : 'gallery-thumbnail'}>
                      <Image src={src} alt={`${dict.property.galleryPhoto} ${idx + 1}`} width={80} height={60} unoptimized className="object-cover" loading="lazy" />
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
              <div className="flex items-center gap-2">
                <IconBed size="sm" />
                <div>
                  <strong>{property.bedrooms ?? '-'}</strong>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {dict.property.bedrooms}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconBath size="sm" />
                <div>
                  <strong>{property.bathrooms ?? '-'}</strong>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {dict.property.bathrooms}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconArea size="sm" />
                <div>
                  <strong>{property.size ?? '-'}</strong>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {dict.property.sqm}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
              <h2 className="mb-4">{dict.property.description}</h2>
              <p className="mb-0">{property.description ?? '—'}</p>
            </div>

            <div className="card reveal mb-6">
              <h2 className="card-title">{dict.property.nextSteps}</h2>
              <p className="card-subtitle">{dict.property.exploreRelated}</p>
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

            <div>
              <h2 className="mb-6">{dict.property.similarProperties}</h2>
              <div className="grid grid-2">
                <div className="property-card">
                  <div className="card-content">
                    <div className="card-title">{dict.property.comingSoon}</div>
                    <div className="card-location mb-0">
                      {dict.property.similarComingSoonText}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="detail-sidebar">
            <div className="agent-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                  {dict.brand.shortName}
                </div>
                <div>
                  <h3 className="mb-1">{dict.property.agentName}</h3>
                  <p className="mb-0 text-[var(--color-text-secondary)] text-sm">
                    {dict.property.agentRole}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a href={CTA.lineUrl} className="btn btn-primary btn-block" target="_blank" rel="noreferrer">
                  {dict.property.lineChat}
                </a>
                <a href={CTA.phoneTel} className="btn btn-secondary btn-block">
                  {dict.property.callAgent}
                </a>
              </div>
            </div>

            <div className="mt-6">
              <LeadForm
                heading={dict.property.interestedHeading}
                propertyId={property.id}
                defaultMessage={dict.property.interestedMessage}
              />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
