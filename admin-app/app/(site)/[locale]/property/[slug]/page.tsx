import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { buildAdvisorWhatsApp, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

import { LeadForm } from '@/components/forms/LeadForm';
import { IconBed, IconBath, IconArea } from '@/components/icons/SvgIcons';
import { fetchPropertyBySlug, fetchProperties } from '@/app/_lib/public-api-server';
import { CTA } from '@/app/_lib/public-cta';
import { resolveImageUrl } from '@/app/_lib/public-api-shared';
import { getDictionary, normalizeLocale } from '@/app/_lib/i18n/get-dictionary';
import { ogLocale, withLocale } from '@/app/_lib/i18n/routing';
import { getInternalLinks } from '@/app/_lib/internal-links';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';

export const revalidate = 300;

type PageProps = { params: Promise<{ locale: string; slug: string }> };
const PROPERTY_DETAIL_FALLBACK = '/images/project-overview.png';
const PROPERTY_FETCH_TIMEOUT_MS = 8000;
type PropertyLoadState =
  | { kind: 'loaded'; value: Awaited<ReturnType<typeof fetchPropertyBySlug>> }
  | { kind: 'timeout' };

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = PROPERTY_FETCH_TIMEOUT_MS): Promise<T> {
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

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
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

function formatListingType(locale: 'en' | 'th', type: string): string {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'rent') return locale === 'th' ? 'เช่า' : 'Rent';
  if (normalized === 'resale') return locale === 'th' ? 'ขายต่อ' : 'Resale';
  if (normalized === 'new') return locale === 'th' ? 'โครงการใหม่' : 'New launch';
  return locale === 'th' ? 'อสังหาฯ ในพัทยา' : 'Pattaya property';
}

function formatPropertyMeasure(locale: 'en' | 'th', value: number | null | undefined, unit: string): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return `${value.toLocaleString()} ${unit === 'sqm' ? (locale === 'th' ? 'ตร.ม.' : 'sqm') : unit}`;
}

export default async function PropertyPage(props: PageProps) {
  const params = await props.params;
  const locale = normalizeLocale(params.locale);
  const dict = getDictionary(locale);
  const advisoryProofs = getAdvisoryProofs(dict);
  const advisoryLabels = getAdvisoryLabels(locale);
  const internalLinks = getInternalLinks(locale, dict, { from: 'property_detail', includeProjects: true });
  const propertyResult = await withTimeout<PropertyLoadState>(
    fetchPropertyBySlug(params.slug).then((value) => ({ kind: 'loaded' as const, value })),
    { kind: 'timeout' as const },
  );
  const property = propertyResult.kind === 'loaded' ? propertyResult.value : null;

  if (propertyResult.kind === 'timeout') {
    const fallbackTitle = formatSlugTitle(params.slug);
    const fallbackBody = locale === 'th'
      ? 'ใช้หน้านี้เพื่อไปต่อยัง inventory, shortlist, หรือส่ง brief ให้ทีมช่วยคัดตัวเลือกที่เหมาะกับคุณ'
      : 'Use this page to continue into inventory, shortlist, or hand your brief to the advisory team.';

    return (
      <main className="section" id="main-content">
        <Container>
          <Breadcrumbs
            items={[
              { label: dict.property.breadcrumbHome, href: `/${locale}` },
              { label: dict.nav.buy, href: `/${locale}/buy` },
              { label: formatSlugTitle(params.slug), href: `/${locale}/property/${encodeURIComponent(params.slug)}` },
            ]}
          />
        </Container>
        <PublicAdvisoryHero
          eyebrow={dict.advisory.heroEyebrow}
          title={fallbackTitle}
          subtitle={fallbackBody}
          proofs={advisoryProofs}
          proofsLabel={advisoryLabels.proofsLabel}
          guidanceLabel={advisoryLabels.guidanceLabel}
          signals={[
            {
              kicker: dict.advisory.bestFor,
              title: formatSlugTitle(params.slug),
              body: locale === 'th'
                ? 'ใช้ state นี้เมื่อคุณต้องการส่งบริบทของ listing ให้ทีมช่วย shortlist หรือหาทางเลือกใกล้เคียง'
                : 'Use this state to hand the listing context to the team or pivot into nearby shortlist options.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'ต่อไปยังคลังรายการหรือพูดคุยกับทีม' : 'Move next into inventory or advisory support',
              body: locale === 'th'
                ? 'จากหน้านี้คุณยังเปิด inventory ที่ตรวจสอบแล้วหรือคุยกับทีมต่อได้ทันที'
                : 'From here you can jump straight into verified inventory or advisor review right away.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'หน้านี้ยังยึดกับบริบทของ listing จริง' : 'The page stays grounded in verified listing context',
              body: locale === 'th'
                ? 'เมื่อ listing brief ถูกรีเฟรช หน้านี้จะขยายกลับมาเป็นรายละเอียดเต็มรูปแบบ'
                : 'When the listing brief refreshes, this route expands back into the full detail view.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'listing_snapshot', slug: params.slug }),
            label: dict.cta.speakToAdvisor,
            eventPayload: { cta: 'listing_snapshot', from: 'property_detail_timeout' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/buy'),
            label: dict.advisory.browseVerifiedInventory,
            eventPayload: { cta: 'browse_verified_inventory', from: 'property_detail_timeout' },
          }}
          tertiaryAction={{
            href: buildAdvisorWhatsApp(locale, dict),
            label: dict.cta.whatsapp,
          }}
        />
      </main>
    );
  }

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
  const propertySummary = locale === 'th'
    ? [
        formatListingType(locale, property.type),
        property.city || null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ')
    : [
        formatListingType(locale, property.type),
        property.city || null,
        dict.property.projectSubtitle,
      ].filter(Boolean).join(' • ');
  const relatedResponse = await withTimeout(
    fetchProperties({
      limit: 12,
      sort: 'newest',
      type: property.type === 'rent' || property.type === 'resale' ? property.type : undefined,
    }),
    { data: [], meta: { page: 1, limit: 0, total: 0 } },
  );
  const relatedProperties = relatedResponse.data
    .filter((item) => item.slug && item.title !== property.title)
    .sort((left, right) => {
      const leftScore = Number(left.city === property.city) + Number(left.type === property.type);
      const rightScore = Number(right.city === property.city) + Number(right.type === property.type);
      return rightScore - leftScore;
    })
    .slice(0, 3);
  const listingSignals = [
    typeof property.price === 'number' && Number.isFinite(property.price)
      ? locale === 'th' ? `ราคาเสนออยู่ที่ ${formatPriceTHB(Number(property.price))}` : `Current asking price is ${formatPriceTHB(Number(property.price))}`
      : null,
    property.city
      ? locale === 'th' ? `ทรัพย์นี้อยู่ในโซน ${property.city}` : `This listing sits in ${property.city}.`
      : null,
    formatPropertyMeasure(locale, property.size, 'sqm')
      ? locale === 'th' ? `ขนาดยูนิต ${formatPropertyMeasure(locale, property.size, 'sqm')}` : `Unit size ${formatPropertyMeasure(locale, property.size, 'sqm')}`
      : null,
    property.type === 'rent'
      ? (locale === 'th' ? 'เหมาะกับผู้เช่าที่ต้องการตัดสินใจเร็วและเปรียบเทียบหลายยูนิตพร้อมกัน' : 'Useful for renters who need a fast shortlist across comparable units.')
      : (locale === 'th' ? 'เหมาะกับผู้ซื้อที่ต้องการเทียบยูนิตจริงก่อนคุยเรื่องเงื่อนไขต่อรอง' : 'Useful for buyers who want a unit-level comparison before negotiating next steps.'),
  ].filter((item): item is string => Boolean(item));

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
                <p className="public-hero__eyebrow">{dict.advisory.heroEyebrow}</p>
                <h1>{property.title}</h1>
                <p className="property-location">
                  {property.address}, {property.city}
                </p>
                <p className="section-subtitle">{propertySummary}</p>
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

            <div className="cta-row mb-6">
              <TrackedLink
                className="btn btn-cta"
                href={withLocaleQuery(locale, '/contact', { intent: 'listing_consultation', slug: params.slug })}
                eventType="cta_click"
                eventPayload={{ cta: 'speak_to_advisor', from: 'property_detail' }}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <a className="btn btn-secondary" href={buildAdvisorWhatsApp(locale, dict)} target="_blank" rel="noreferrer">
                {dict.cta.whatsapp}
              </a>
            </div>

            <div className="public-hero__proofs mb-6" role="note" aria-label={advisoryLabels.proofsLabel}>
              <span className="public-hero__proof">{formatListingType(locale, property.type)}</span>
              <span className="public-hero__proof">{property.city}</span>
              <span className="public-hero__proof">
                {locale === 'th' ? `${property.bedrooms ?? '-'} ห้องนอน` : `${property.bedrooms ?? '-'} bedrooms`}
              </span>
              <span className="public-hero__proof">
                {locale === 'th' ? `${property.bathrooms ?? '-'} ห้องน้ำ` : `${property.bathrooms ?? '-'} bathrooms`}
              </span>
              <span className="public-hero__proof">
                {locale === 'th' ? `${property.size ?? '-'} ตร.ม.` : `${property.size ?? '-'} sqm`}
              </span>
            </div>

            <div className="bg-[var(--color-white)] p-6 rounded-xl mb-6">
              <h2 className="mb-4">{dict.property.description}</h2>
              <p className="mb-0">{property.description ?? '—'}</p>
            </div>

            <section className="signal-grid signal-grid--two-up reveal mb-6">
              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'Listing decision cues' : 'Listing decision cues'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ใช้สัญญาณระดับยูนิตนี้เพื่อประเมินว่าควรคุยต่อทันทีหรือเทียบ inventory ใกล้เคียงก่อน'
                    : 'Use the unit-level signals below to decide whether to move straight into advisor review or compare nearby inventory first.'}
                </p>
                <div className="insight-list mt-3">
                  {listingSignals.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'Investor tools และ next moves' : 'Investor tools and next moves'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ถ้าต้องคำนวณ yield หรือเทียบหลายทางเลือกต่อ ให้ไปยังเครื่องมือและ route ที่ใช้ตัดสินใจต่อได้ทันที'
                    : 'If you need a yield sense-check or a multi-option comparison, move directly into the supporting tools below.'}
                </p>
                <div className="card-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                    {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                  </Link>
                  <Link className="btn btn-tertiary" href={withLocale(locale, '/compare')}>
                    {locale === 'th' ? 'ไปที่ compare' : 'Go to compare'}
                  </Link>
                </div>
              </div>
            </section>

            {relatedProperties.length ? (
              <section className="signal-grid signal-grid--three-up reveal mb-6">
                {relatedProperties.map((item) => {
                  const relatedImage = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0]) ?? PROPERTY_DETAIL_FALLBACK;
                  const relatedHref = item.slug ? withLocale(locale, `/property/${encodeURIComponent(item.slug)}`) : withLocale(locale, item.type === 'rent' ? '/rent' : '/buy');
                  return (
                    <Link key={item.id} href={relatedHref} className="authority-card card-interactive">
                      <div className="card-image relative" style={{ aspectRatio: '4 / 3' }}>
                        <Image src={relatedImage} alt={item.title} fill unoptimized sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover rounded-[18px]" />
                      </div>
                      <div className="mt-4">
                        <div className="editorial-card__meta">
                          <span>{formatListingType(locale, item.type)}</span>
                          {item.city ? <span>{item.city}</span> : null}
                        </div>
                        <h3 className="card-title">{item.title}</h3>
                        <p className="card-subtitle">{formatPriceTHB(Number(item.price))}</p>
                      </div>
                    </Link>
                  );
                })}
              </section>
            ) : null}

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


