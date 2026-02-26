import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { LeadForm } from '@/components/forms/LeadForm';
import { Gallery } from '@/components/media/Gallery';
import { Reviews } from '@/components/ux/Reviews';
import { IconBed, IconBath, IconArea } from '@/components/icons/SvgIcons';
import {
  fetchAreas,
  fetchDevelopers,
  fetchProjects,
  fetchProperties,
  fetchPropertyBySlug,
} from '@/app/_lib/public-api-server';
import { CTA } from '@/app/_lib/public-cta';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { ogLocale, withLocale } from '@/app/_lib/i18n/routing';
import { getInternalLinks } from '@/app/_lib/internal-links';
import {
  realEstateListingSchema,
  residenceSchema,
  breadcrumbSchema,
} from '@/app/_lib/schema-markup';

export const revalidate = 300;

type PageProps = { params: Promise<{ locale: string; slug: string }> };

function toLocalPropertyImage(input: string | null | undefined): string | null {
  const resolved = resolveImageUrl(input);
  if (!resolved) return null;
  if (resolved.startsWith('/media/')) return resolved;
  if (resolved.startsWith('/images/')) return resolved;
  if (resolved.startsWith('/uploads/')) return resolved;
  return null;
}

function uniqStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function prettyText(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPriceSuffix(locale: 'en' | 'th', period: string | null | undefined): string {
  const normalized = String(period ?? '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'month' || normalized === 'monthly' || normalized === 'mo') {
    return locale === 'th' ? ' / เดือน' : ' /mo';
  }
  if (normalized === 'year' || normalized === 'yearly' || normalized === 'yr') {
    return locale === 'th' ? ' / ปี' : ' /yr';
  }
  return ` /${normalized}`;
}

/**
 * Clean property title: strip source IDs, "rentthai" references, and numeric prefixes.
 */
function cleanTitle(raw: string): string {
  let title = raw;
  // Remove "rentthai" in any case variation
  title = title.replace(/rentthai/gi, '').trim();
  // Remove leading property IDs like "RT-12345 -" or "rent-12345-"
  title = title.replace(/^(RT|rent|sale|resale|new)-?\d+[\s\-–—:]+/i, '').trim();
  // Remove trailing source IDs
  title = title.replace(/[\s\-–—]+[A-Z]{2,4}-?\d{3,}$/i, '').trim();
  // Collapse multiple spaces
  title = title.replace(/\s{2,}/g, ' ');
  return title || raw;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const canonical = `/${locale}/property/${encodeURIComponent(slug)}`;

  let p = null;
  try {
    p = await fetchPropertyBySlug(slug);
  } catch {
    p = null;
  }
  if (!p) {
    const title = `${dict.brand.name} | ${dict.nav.buy}`;
    return {
      title,
      alternates: {
        canonical,
        languages: {
          en: `/en/property/${encodeURIComponent(slug)}`,
          th: `/th/property/${encodeURIComponent(slug)}`,
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

  const cleaned = cleanTitle(p.title);
  const title = `${cleaned} | ${dict.brand.name}`;
  const description = `${cleaned} — ${p.address}, ${p.city}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/property/${encodeURIComponent(slug)}`,
        th: `/th/property/${encodeURIComponent(slug)}`,
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
  const { locale: rawLocale, slug } = await params;
  const locale = normalizeLocale(rawLocale);
  const dict = getDictionary(locale);
  const internalLinks = getInternalLinks(locale, dict, { from: 'property_detail', includeProjects: true });
  const property = await fetchPropertyBySlug(slug).catch(() => null);
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

  const displayTitle = cleanTitle(property.title);
  const siteUrl = 'https://amppattaya.com';
  const canonicalUrl = `${siteUrl}/${locale}/property/${encodeURIComponent(slug)}`;

  const localImages = uniqStrings((property.local_images ?? []).map((u) => toLocalPropertyImage(u)));
  const fallbackLocalImages = uniqStrings((property.images ?? []).map((u) => toLocalPropertyImage(u)));
  const cover = toLocalPropertyImage(property.cover_image) ?? localImages[0] ?? fallbackLocalImages[0] ?? null;
  const gallery = uniqStrings([cover, ...localImages, ...fallbackLocalImages]);

  const [projectsResult, areasResult, developersResult, propertiesResult] = await Promise.all([
    fetchProjects({ limit: 200 }).catch(() => []),
    fetchAreas().catch(() => []),
    fetchDevelopers().catch(() => []),
    fetchProperties({ limit: 100, type: property.type }).catch(() => ({
      data: [],
      meta: { page: 1, limit: 100, total: 0 },
    })),
  ]);

  const projects = projectsResult ?? [];
  const areas = areasResult ?? [];
  const developers = developersResult ?? [];
  const projectById = new Map(projects.map((item) => [item.id, item]));
  const areaById = new Map(areas.map((item) => [item.id, item]));
  const developerById = new Map(developers.map((item) => [item.id, item]));

  const relatedProject = property.project_id ? projectById.get(property.project_id) ?? null : null;
  const relatedArea = property.area_id ? areaById.get(property.area_id) ?? null : null;
  const relatedDeveloper = property.developer_id ? developerById.get(property.developer_id) ?? null : null;

  const contextualLinks = [
    relatedProject?.slug
      ? {
          href: `/${locale}/projects/${encodeURIComponent(relatedProject.slug)}`,
          label: locale === 'th' ? `โครงการ: ${relatedProject.name}` : `Project: ${relatedProject.name}`,
        }
      : null,
    relatedArea?.slug
      ? {
          href: `/${locale}/areas/${encodeURIComponent(relatedArea.slug)}`,
          label: locale === 'th' ? `พื้นที่: ${relatedArea.name}` : `Area: ${relatedArea.name}`,
        }
      : null,
    relatedDeveloper?.slug
      ? {
          href: `/${locale}/developers/${encodeURIComponent(relatedDeveloper.slug)}`,
          label: locale === 'th' ? `ผู้พัฒนา: ${relatedDeveloper.name}` : `Developer: ${relatedDeveloper.name}`,
        }
      : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  const priceNumber = Number(property.price);
  const priceValue = Number.isFinite(priceNumber) ? Math.round(priceNumber) : undefined;
  const sizeDisplay = property.size_sqm ?? property.size;
  const isRent = property.type === 'rent';
  const priceSuffix = formatPriceSuffix(locale, property.price_period);
  const displayView = prettyText(property.view_label ?? property.view);
  const displayFurnishing = prettyText(property.furnishing);
  const displayPropertyType = prettyText(property.property_type);
  const tags = (property.tags ?? []).filter(Boolean).slice(0, 6);
  const descriptionText =
    property.description?.trim()
    || (locale === 'th'
      ? 'รายละเอียดเพิ่มเติมสามารถขอได้จากที่ปรึกษาอสังหาริมทรัพย์ของเรา'
      : 'Additional details are available from our property advisor.');

  const similarProperties = (propertiesResult.data ?? [])
    .filter((candidate) => candidate.slug && candidate.slug !== property.slug)
    .filter((candidate) => (
      (property.project_id && candidate.project_id === property.project_id)
      || (property.area_id && candidate.area_id === property.area_id)
      || (property.developer_id && candidate.developer_id === property.developer_id)
      || (candidate.city && candidate.city === property.city)
    ))
    .slice(0, 3);

  const jsonLd = JSON.stringify(
    [
      realEstateListingSchema({
        name: displayTitle,
        description: property.description ?? `${property.address}, ${property.city}`,
        url: canonicalUrl,
        image: gallery[0] ?? undefined,
        price: priceValue,
        currency: property.currency || 'THB',
        address: property.address,
        locality: property.city ?? 'Pattaya',
      }),
      residenceSchema({
        name: displayTitle,
        description: property.description ?? `${property.address}, ${property.city}`,
        sizeSqm: sizeDisplay ? Number(sizeDisplay) : undefined,
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
      }),
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: displayTitle,
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
          priceCurrency: property.currency || 'THB',
          price: priceValue,
          availability: 'https://schema.org/InStock',
        },
      },
      breadcrumbSchema([
        { name: dict.property.breadcrumbHome, url: `${siteUrl}/${locale}` },
        { name: isRent ? dict.nav.rent : dict.nav.buy, url: `${siteUrl}/${locale}/${isRent ? 'rent' : 'buy'}` },
        { name: displayTitle, url: canonicalUrl },
      ]),
    ],
    null,
    0
  );


  return (
    <main className="section" id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container variant="full">
        <Breadcrumbs
          items={[
            { label: dict.property.breadcrumbHome, href: `/${locale}` },
            { label: isRent ? dict.nav.rent : dict.nav.buy, href: `/${locale}/${isRent ? 'rent' : 'buy'}` },
            { label: displayTitle, href: `/${locale}/property/${encodeURIComponent(slug)}` },
          ]}
        />
        <div className="detail-layout">
          <div className="detail-main">
            <div id="gallery-section">
              {gallery.length > 0 ? (
                <Gallery images={gallery} alt={dict.property.galleryPhoto} />
              ) : (
                <div className="gallery-main" style={{ aspectRatio: '4 / 3', background: 'var(--color-surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {locale === 'th' ? 'ยังไม่มีรูปภาพ' : 'No images available'}
                  </p>
                </div>
              )}
            </div>

            {/* Conversion CTA above fold */}
            <div className="cta-row mt-4 mb-2">
              <a href={CTA.lineUrl} className="btn btn-cta" target="_blank" rel="noreferrer">
                {dict.property.lineChat}
              </a>
              <Link className="btn btn-secondary" href={withLocale(locale, '/contact')}>
                {dict.cta.speakToAdvisor}
              </Link>
            </div>

            <div className="property-header">
              <div className="property-title">
                <h1>{displayTitle}</h1>
                <p className="property-location">
                  {property.address}, {property.city}
                </p>
              </div>
              <div className="property-price">
                {formatPriceTHB(priceNumber)}
                {(isRent || priceSuffix) ? <span className="text-sm font-normal text-[var(--color-text-secondary)]">{priceSuffix || (locale === 'th' ? ' / เดือน' : ' /mo')}</span> : null}
              </div>
            </div>

            <div className="property-facts" aria-label={locale === 'th' ? 'รายละเอียดหลักของอสังหาริมทรัพย์' : 'Key property details'}>
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
                  <strong>{sizeDisplay ?? '-'}</strong>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {dict.property.sqm}
                  </div>
                </div>
              </div>
              {property.floor ? (
                <div className="flex items-center gap-2">
                  <span className="icon icon--sm" aria-hidden="true">&#8593;</span>
                  <div>
                    <strong>{property.floor}</strong>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {locale === 'th' ? 'ชั้น' : 'Floor'}
                    </div>
                  </div>
                </div>
              ) : null}
              {property.furnishing ? (
                <div className="flex items-center gap-2">
                  <span className="icon icon--sm" aria-hidden="true">&#9733;</span>
                  <div>
                    <strong>{displayFurnishing}</strong>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {locale === 'th' ? 'เฟอร์นิเจอร์' : 'Furnishing'}
                    </div>
                  </div>
                </div>
              ) : null}
              {displayView ? (
                <div className="flex items-center gap-2">
                  <span className="icon icon--sm" aria-hidden="true">&#127748;</span>
                  <div>
                    <strong>{displayView}</strong>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {locale === 'th' ? 'วิว' : 'View'}
                    </div>
                  </div>
                </div>
              ) : null}
              {displayPropertyType ? (
                <div className="flex items-center gap-2">
                  <span className="icon icon--sm" aria-hidden="true">&#9632;</span>
                  <div>
                    <strong>{displayPropertyType}</strong>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {locale === 'th' ? 'ประเภททรัพย์' : 'Property type'}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {tags.length > 0 ? (
              <div className="mt-3 mb-6 flex flex-wrap gap-2" aria-label={locale === 'th' ? 'แท็กทรัพย์' : 'Property tags'}>
                {tags.map((tag) => (
                  <span key={tag} className="pill">
                    {prettyText(tag) ?? tag}
                  </span>
                ))}
              </div>
            ) : null}

            {contextualLinks.length > 0 ? (
              <div className="card reveal mb-6">
                <h2 className="card-title">{locale === 'th' ? 'ข้อมูลที่เกี่ยวข้อง' : 'Related context'}</h2>
                <p className="card-subtitle">{locale === 'th' ? 'ไปยังหน้าโครงการ พื้นที่ หรือผู้พัฒนา' : 'Navigate to linked project, area, or developer pages'}</p>
                <div className="card-actions">
                  {contextualLinks.map((item) => (
                    <Link key={item.href} className="btn btn-secondary" href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
              <h2 className="mb-4">{dict.property.description}</h2>
              <p className="mb-0">{descriptionText}</p>
            </div>

            <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
              <h2 className="mb-4">{locale === 'th' ? 'แปลนห้อง' : 'Floor Plan'}</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {locale === 'th'
                  ? 'แปลนห้องสามารถขอได้จากเจ้าหน้าที่ ติดต่อเราเพื่อรับข้อมูลเพิ่มเติม'
                  : 'Floor plan layouts available upon request. Contact our agent for detailed floor plan drawings and unit specifications.'}
              </p>
            </div>

            <div className="mb-6">
              <Reviews
                reviews={(property as Record<string, unknown>).reviews as [] ?? []}
                heading={locale === 'th' ? 'รีวิวจากลูกค้า' : 'Customer Reviews'}
              />
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
              {similarProperties.length > 0 ? (
                <div className="grid grid-2">
                  {similarProperties.map((candidate) => {
                    const candidateImage =
                      toLocalPropertyImage(candidate.cover_image)
                      ?? toLocalPropertyImage(candidate.local_images?.[0])
                      ?? toLocalPropertyImage(candidate.images?.[0]);
                    return (
                      <article key={candidate.id} className="property-card">
                        {candidateImage ? (
                          <div className="card-image relative overflow-hidden">
                            <Image
                              src={candidateImage}
                              alt={cleanTitle(candidate.title)}
                              fill
                              sizes="(min-width: 1024px) 33vw, 100vw"
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="card-image" aria-hidden="true" style={{ background: 'var(--color-surface)' }} />
                        )}
                        <div className="card-content">
                          <div className="card-title">{cleanTitle(candidate.title)}</div>
                          <div className="card-location">{candidate.address}, {candidate.city}</div>
                          <div className="card-price">{formatPriceTHB(Number(candidate.price))}</div>
                          {candidate.slug ? (
                            <div className="mt-3">
                              <Link className="btn btn-secondary" href={`/${locale}/property/${encodeURIComponent(candidate.slug)}`}>
                                {locale === 'th' ? 'ดูรายละเอียด' : 'View details'}
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  </div>
              ) : (
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
              )}
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
