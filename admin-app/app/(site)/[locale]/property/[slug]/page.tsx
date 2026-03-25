import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { buildLeadCaptureQuery, getAdvisoryLabels, getAdvisoryProofs, withLocaleQuery } from '@/app/_lib/public-advisory';
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
import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';
import { PageOwnedMobileCTA } from '@/components/ux/PageOwnedMobileCTA';

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

function hasMeaningfulDescription(value: string | null | undefined): boolean {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > 0 && !/^[\-—–]+$/.test(text);
}

function buildPropertyFallbackDescription(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
): string[] {
  return [
    locale === 'th'
      ? `${property.title} ใช้เป็นหน้าเช็กข้อเท็จจริงระดับยูนิตก่อนคุยต่อเรื่องราคา เงื่อนไข และตัวเลือกใกล้เคียง.`
      : `${property.title} works as a unit-level fact check before you move into pricing, terms, and nearby alternatives.`,
    property.city
      ? (locale === 'th'
        ? `รายการนี้อยู่ในโซน ${property.city} และควรอ่านคู่กับบริบทของทำเลและ inventory ที่ยัง active.`
        : `This listing sits in ${property.city} and should be read together with location context and currently active inventory.`)
      : (locale === 'th'
        ? 'ใช้รายการนี้เพื่อเช็กว่าควรคุยต่อทันทีหรือเปรียบเทียบกับทางเลือกใกล้เคียงก่อน.'
        : 'Use this listing to decide whether it deserves an immediate advisor review or a nearby comparison first.'),
  ];
}

function buildPropertyVerifiedLines(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
): string[] {
  return [
    Number.isFinite(Number(property.price))
      ? (locale === 'th'
        ? `ราคาเสนอปัจจุบัน ${formatPriceTHB(Number(property.price))}`
        : `Current asking price ${formatPriceTHB(Number(property.price))}`)
      : null,
    property.address && property.city
      ? (locale === 'th'
        ? `ที่ตั้ง: ${property.address}, ${property.city}`
        : `Location: ${property.address}, ${property.city}`)
      : null,
    formatPropertyMeasure(locale, property.size, 'sqm')
      ? (locale === 'th'
        ? `ขนาดยูนิต ${formatPropertyMeasure(locale, property.size, 'sqm')}`
        : `Unit size ${formatPropertyMeasure(locale, property.size, 'sqm')}`)
      : null,
    property.bedrooms != null || property.bathrooms != null
      ? (locale === 'th'
        ? `${property.bedrooms ?? '-'} ห้องนอน • ${property.bathrooms ?? '-'} ห้องน้ำ`
        : `${property.bedrooms ?? '-'} bedrooms • ${property.bathrooms ?? '-'} bathrooms`)
      : null,
  ].filter((item): item is string => Boolean(item));
}

function buildPropertyConfirmNextLines(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
  galleryCount: number,
): string[] {
  return [
    galleryCount <= 1
      ? (locale === 'th'
        ? 'ภาพในหน้านี้ยังมีจำกัด จึงควรขอภาพ walkthrough หรือมุมเพิ่มเติมก่อนนัดดูจริง.'
        : 'The visual pack is still limited here, so confirm walkthrough images or extra angles before the viewing step.')
      : (locale === 'th'
        ? 'ใช้ภาพชุดนี้ร่วมกับข้อเท็จจริงด้านราคาและทำเลก่อนคุยเรื่องเงื่อนไขต่อรอง.'
        : 'Use the current image set together with the price and location facts before discussing terms.'),
    locale === 'th'
      ? `เช็ก availability, เฟอร์นิเจอร์, และเงื่อนไขล่าสุดของ ${property.title} ก่อนตัดสินใจคุยเชิงลึก.`
      : `Confirm live availability, furnishing, and the latest deal terms for ${property.title} before going deeper.`,
    property.type === 'rent'
      ? (locale === 'th'
        ? 'ถ้าใช้เพื่อเช่า ควรเช็กเงื่อนไขสัญญา ระยะเวลา และความพร้อมเข้าอยู่ทันที.'
        : 'If this is a rental case, confirm contract terms, duration, and move-in readiness next.')
      : (locale === 'th'
        ? 'ถ้าใช้เพื่อซื้อ ควรเช็กค่าโอน ownership fit และตัวเลือกที่ใกล้เคียงในงบเดียวกันต่อ.'
        : 'If this is a purchase case, confirm transfer costs, ownership fit, and nearby alternatives in the same budget range next.'),
  ];
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
      ? 'ใช้หน้านี้เพื่อไปต่อยังคลังรายการ การคัดรายการ หรือส่งบรีฟให้ทีมช่วยคัดตัวเลือกที่เหมาะกับคุณ'
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
                ? 'ใช้หน้านี้เมื่อคุณต้องการส่งบริบทของรายการให้ทีมช่วยคัดรายการหรือหาทางเลือกใกล้เคียง'
                : 'Use this state to hand the listing context to the team or pivot into nearby shortlist options.',
              icon: 'building',
            },
            {
              kicker: dict.advisory.nextStep,
              title: locale === 'th' ? 'ต่อไปยังคลังรายการหรือคุยกับทีม' : 'Move next into inventory or advisory support',
              body: locale === 'th'
                ? 'จากหน้านี้คุณยังเปิดคลังรายการที่ตรวจสอบแล้วหรือคุยกับทีมต่อได้ทันที'
                : 'From here you can jump straight into verified inventory or advisor review right away.',
              icon: 'check',
            },
            {
              kicker: dict.advisory.trustSignal,
              title: locale === 'th' ? 'หน้านี้ยังยึดกับบริบทของรายการจริง' : 'The page stays grounded in verified listing context',
              body: locale === 'th'
                ? 'เมื่อสรุปรายการถูกรีเฟรช หน้านี้จะขยายกลับมาเป็นรายละเอียดเต็มรูปแบบ'
                : 'When the listing brief refreshes, this route expands back into the full detail view.',
              icon: 'shield',
            },
          ]}
          primaryAction={{
            href: withLocaleQuery(locale, '/contact', { intent: 'listing_snapshot', slug: params.slug }),
            label: dict.cta.speakToAdvisor,
            id: 'property_timeout_consultation_primary',
            eventPayload: { cta: 'listing_snapshot', from: 'property_detail_timeout' },
          }}
          secondaryAction={{
            href: withLocale(locale, '/buy'),
            label: dict.advisory.browseVerifiedInventory,
            id: 'property_timeout_inventory_secondary',
            eventPayload: { cta: 'browse_verified_inventory', from: 'property_detail_timeout' },
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
  const descriptionParagraphs = hasMeaningfulDescription(property.description)
    ? [String(property.description).trim()]
    : buildPropertyFallbackDescription(locale, property);
  const propertyVerifiedLines = buildPropertyVerifiedLines(locale, property);
  const propertyConfirmNextLines = buildPropertyConfirmNextLines(locale, property, gallery.length);
  const priorityInternalLinks = internalLinks.filter((item) => (
    item.href.endsWith('/buy') || item.href.endsWith('/invest') || item.href.endsWith('/contact')
  ));
  const propertyConsultationHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
    intent: 'project_consultation',
    source: 'property_detail',
    sourceRoute: 'property',
    ctaType: 'primary',
    ctaLabel: dict.cta.speakToAdvisor,
    entityType: 'property',
    entityId: property.id,
    entityName: property.title,
    userIntent: property.type === 'rent' ? 'research' : 'buy',
    bedroom: property.bedrooms != null ? String(property.bedrooms) : undefined,
    location: property.city,
    area: property.city,
    message: locale === 'th'
      ? `ต้องการคุยต่อเกี่ยวกับ ${property.title} พร้อมข้อมูลยูนิต ราคา และทางเลือกใกล้เคียง`
      : `I want to continue the conversation about ${property.title} with the current unit facts, price, and nearby alternatives.`,
  }));
  const propertyConsultationPayload = {
    source_route: 'property',
    cta_type: 'primary',
    cta_label: dict.cta.speakToAdvisor,
    entity_type: 'property',
    entity_id: property.id,
    entity_name: property.title,
    user_intent: property.type === 'rent' ? 'research' : 'buy',
    bedroom: property.bedrooms != null ? String(property.bedrooms) : undefined,
    location: property.city,
    context: {
      area: property.city,
    },
  };
  const propertyActionNote = locale === 'th'
    ? 'การส่งบรีฟจากหน้านี้จะพกชื่อรายการ ราคา และบริบทของยูนิตไปกับ inquiry เดียวกัน หรือจะบันทึกลง shortlist ก่อนแล้วค่อยส่งต่อก็ได้.'
    : 'This handoff carries the listing title, price, and unit context into the same inquiry, or you can save it to the shortlist first and continue later.';

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
    <main className="section decision-page decision-page--property" id="main-content">
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

            <div id="property-hero" className="property-header">
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

            <div id="property-primary-actions" className="cta-row mb-6">
              <TrackedLink
                id="property_consultation_primary"
                className="btn btn-cta"
                href={propertyConsultationHref}
                eventType="cta_click"
                eventPayload={propertyConsultationPayload}
              >
                {dict.cta.speakToAdvisor}
              </TrackedLink>
              <ShortlistSaveButton
                className="btn btn-secondary"
                locale={locale}
                propertyId={property.id}
                sourceSurface="property_detail"
                readOnMount
              />
            </div>
            <p id="property-action-note" className="decision-page__support-note mb-6">
              {propertyActionNote}
            </p>

            <div id="property-core-facts" className="property-facts">
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

            <div id="property-trust-cues" className="public-hero__proofs mb-6" role="note" aria-label={advisoryLabels.proofsLabel}>
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

            {gallery.length <= 1 ? (
              <div id="property-gallery-status" className="mb-4">
                <p className="text-caption mb-2">
                  {locale === 'th' ? 'ภาพประกอบของรายการยังมีจำกัด' : 'The listing media set is still limited'}
                </p>
                <p className="card-subtitle mb-0">
                  {locale === 'th'
                    ? 'ให้ใช้ข้อเท็จจริงด้านราคา ทำเล และยูนิตในหน้านี้ประกอบการตัดสินใจก่อนขอภาพเพิ่มหรือทัวร์จริง'
                    : 'The photo pack is still limited on this route, so use the verified price, location, and unit facts below before requesting more visuals or a live tour.'}
                </p>
              </div>
            ) : null}

            <section id="property-confidence-pack" className="signal-grid signal-grid--two-up reveal decision-pack mb-6">
              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'ยืนยันได้ในหน้านี้' : 'Verified on this page'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'เริ่มจากข้อเท็จจริงที่มีอยู่จริงของยูนิตนี้ก่อน แล้วค่อยเช็กสิ่งที่ต้องยืนยันเพิ่ม'
                    : 'Start with the facts already visible on this unit before moving into the items that still need confirmation.'}
                </p>
                <div className="insight-list mt-3">
                  {propertyVerifiedLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'ควรเช็กอะไรต่อก่อนคุยเชิงลึก' : 'What to confirm before going deeper'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ส่วนนี้ช่วยให้รายการที่ข้อมูลบางยังดูมีทางไปต่อ ไม่ใช่ดูเหมือนหน้าที่ข้อมูลขาด'
                    : 'This keeps thin-data listings actionable instead of feeling like incomplete pages.'}
                </p>
                <div className="insight-list mt-3">
                  {propertyConfirmNextLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="property-description" className="authority-card property-description-card mb-6">
              <h2 className="card-title">{dict.property.description}</h2>
              <div className="content-article mb-0">
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section id="property-decision-grid" className="signal-grid signal-grid--two-up reveal mb-6">
              <div id="property-decision-cues" className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'สัญญาณช่วยตัดสินใจระดับยูนิต' : 'Listing decision cues'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ใช้สัญญาณระดับยูนิตนี้เพื่อประเมินว่าควรคุยต่อทันทีหรือเทียบรายการใกล้เคียงก่อน'
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

              <div id="property-next-tools" className="authority-card">
                <h2 className="card-title">{locale === 'th' ? 'เครื่องมือช่วยตัดสินใจและทางไปต่อ' : 'Investor tools and next moves'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ถ้าต้องคำนวณผลตอบแทนหรือเทียบหลายทางเลือกต่อ ให้ไปยังเครื่องมือและหน้าที่ใช้ตัดสินใจต่อได้ทันที'
                    : 'If you need a yield sense-check or a multi-option comparison, move directly into the supporting tools below.'}
                </p>
                <div className="card-actions mt-3">
                  <Link className="btn btn-secondary" href={withLocale(locale, '/calculator')}>
                    {locale === 'th' ? 'เปิด calculator' : 'Open calculator'}
                  </Link>
                  <Link className="btn btn-tertiary" href={withLocale(locale, '/compare')}>
                    {locale === 'th' ? 'ไปหน้าเปรียบเทียบ' : 'Go to compare'}
                  </Link>
                </div>
              </div>
            </section>

            {relatedProperties.length ? (
              <section id="property-related-listings" className="signal-grid signal-grid--three-up reveal mb-6">
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

            <div id="property-next-steps" className="authority-card reveal mb-6">
              <h2 className="card-title">{dict.property.nextSteps}</h2>
              <p className="card-subtitle">{dict.property.exploreRelated}</p>
              <div className="card-actions">
                {priorityInternalLinks.map((it) => (
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

          <aside className="detail-sidebar detail-stack">
            <div id="property-direct-channels" className="agent-card">
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

            <div id="property-lead-form" className="mt-6">
              <LeadForm
                locale={locale}
                heading={dict.property.interestedHeading}
                propertyId={property.id}
                defaultPurpose={property.type === 'rent' ? 'rent' : 'buy'}
                defaultMessage={dict.property.interestedMessage}
                handoff={{
                  sourceRoute: 'property',
                  ctaType: 'primary',
                  ctaLabel: dict.property.interestedHeading,
                  entityType: 'property',
                  entityId: property.id,
                  entityName: property.title,
                  userIntent: property.type === 'rent' ? 'research' : 'buy',
                  bedroom: property.bedrooms != null ? String(property.bedrooms) : undefined,
                  location: property.city ?? undefined,
                  context: {
                    area: property.city ?? undefined,
                  },
                }}
              />
            </div>
          </aside>
        </div>
      </Container>
      <PageOwnedMobileCTA
        id="property-mobile-cta"
        title={locale === 'th' ? 'พร้อมคุยต่อเกี่ยวกับยูนิตนี้' : 'Ready to move forward on this unit'}
        description={locale === 'th'
          ? 'กดคุยกับทีมเพื่อส่งต่อข้อมูลยูนิตชุดนี้ทันที หรือโทรหาที่ปรึกษาในจังหวะที่พร้อม.'
          : 'Open an advisor brief with this unit context attached, or call the advisory desk when you are ready.'}
        primaryAction={{
          id: 'property_mobile_consultation_primary',
          href: propertyConsultationHref,
          label: dict.cta.speakToAdvisor,
          eventPayload: propertyConsultationPayload,
        }}
        secondaryAction={{
          id: 'property_mobile_call_secondary',
          href: CTA.phoneTel,
          label: dict.property.callAgent,
        }}
      />
    </main>
  );
}


