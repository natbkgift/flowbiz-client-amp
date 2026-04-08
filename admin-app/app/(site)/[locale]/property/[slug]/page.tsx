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
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicAdvisoryHero } from '@/components/public/PublicAdvisoryHero';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
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

function uniqueItems(items: Array<string | null>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)).map((item) => item.trim()).filter(Boolean))];
}

function buildPropertyTypeDescriptor(locale: 'en' | 'th', type: string | null | undefined): string {
  const normalized = String(type || '').toLowerCase();

  if (normalized === 'rent') return locale === 'th' ? 'รายการเช่า' : 'rental listing';
  if (normalized === 'resale') return locale === 'th' ? 'ยูนิตขายต่อ' : 'resale unit';
  if (normalized === 'new') return locale === 'th' ? 'ยูนิตโครงการใหม่' : 'new-launch unit';

  return locale === 'th' ? 'ยูนิตนี้' : 'unit';
}

function buildPropertyBedroomDescriptor(locale: 'en' | 'th', bedrooms: number | null | undefined): string | null {
  if (typeof bedrooms !== 'number' || Number.isNaN(bedrooms) || bedrooms < 0) return null;
  if (bedrooms === 0) return locale === 'th' ? 'สตูดิโอ' : 'studio';
  return locale === 'th' ? `${bedrooms} ห้องนอน` : `${bedrooms}-bedroom`;
}

function buildPropertyFallbackDescription(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
): string[] {
  const priceLabel = Number.isFinite(Number(property.price)) ? formatPriceTHB(Number(property.price)) : null;
  const typeDescriptor = buildPropertyTypeDescriptor(locale, property.type);
  const bedroomDescriptor = buildPropertyBedroomDescriptor(locale, property.bedrooms);
  const sizeLabel = formatPropertyMeasure(locale, property.size, 'sqm');
  const locationLabel = property.city || (locale === 'th' ? 'พัทยา' : 'Pattaya');

  return uniqueItems([
    locale === 'th'
      ? `${property.title} เป็น${bedroomDescriptor ? `${bedroomDescriptor} ` : ''}${typeDescriptor}${sizeLabel ? ` ขนาด ${sizeLabel}` : ''}ใน ${locationLabel} ที่ควรถูกอ่านแบบตัดสินใจระดับยูนิต ไม่ใช่ปล่อยให้เป็นเพียงรายการ placeholder`
      : `${property.title} is a ${bedroomDescriptor ? `${bedroomDescriptor} ` : ''}${typeDescriptor}${sizeLabel ? ` with ${sizeLabel}` : ''} in ${locationLabel}, so it should be read as a unit-level decision point instead of a placeholder listing.`,
    priceLabel
      ? (locale === 'th'
        ? `ใช้ราคา ${priceLabel} เป็น anchor ก่อน แล้วค่อยตัดสินว่ายูนิตนี้ควรอยู่ต่อใน shortlist หรือควรถูกเทียบกับทางเลือกใกล้เคียง`
        : `Use the ${priceLabel} price point as the anchor, then decide whether this unit keeps a shortlist slot or should be tested against nearby alternatives.`)
      : (locale === 'th'
        ? 'เริ่มจากข้อเท็จจริงของยูนิตและบริบททำเลก่อน แล้วค่อยขอราคา live หรือเงื่อนไขล่าสุดจากทีม'
        : 'Start from the unit facts and location context here before you request live pricing or the latest terms from the team.'),
    property.type === 'rent'
      ? (locale === 'th'
        ? 'ถ้าอ่านเป็นเคสเช่า ให้เช็กช่วงย้ายเข้า สัญญา และความพร้อมเข้าอยู่ก่อนทุกครั้ง'
        : 'If you are reading this as a rental case, confirm move-in timing, lease terms, and readiness before every next step.')
      : (locale === 'th'
        ? 'ถ้าอ่านเป็นเคสซื้อ ให้เช็กค่าโอน ownership fit และตัวเลือกงบใกล้เคียงควบคู่กันไป'
        : 'If you are reading this as a purchase case, confirm transfer costs, ownership fit, and the nearby options in the same budget at the same time.'),
  ]).slice(0, 3);
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
        ? 'ถ้าใช้เพื่อเช่า ควรเช็กเงื่อนไขสัญญา ระยะเวลา การวางมัดจำ และความพร้อมเข้าอยู่ก่อนให้ยูนิตนี้อยู่ต่อใน shortlist.'
        : 'If this is a rental case, confirm contract terms, duration, deposit structure, and move-in readiness before this unit keeps its shortlist slot.')
      : (locale === 'th'
        ? 'ถ้าใช้เพื่อซื้อ ควรเช็กค่าโอน ownership fit และตัวเลือกที่ใกล้เคียงในงบเดียวกัน ก่อนพาเรื่องไปสู่การคุยเงื่อนไขต่อ.'
        : 'If this is a purchase case, confirm transfer costs, ownership fit, and nearby alternatives in the same budget range before you move into deal terms.'),
  ];
}

function buildPropertyHighlightLines(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
  galleryCount: number,
): string[] {
  const priceLabel = Number.isFinite(Number(property.price)) ? formatPriceTHB(Number(property.price)) : null;
  const typeDescriptor = buildPropertyTypeDescriptor(locale, property.type);
  const bedroomDescriptor = buildPropertyBedroomDescriptor(locale, property.bedrooms);
  const sizeLabel = formatPropertyMeasure(locale, property.size, 'sqm');

  return uniqueItems([
    locale === 'th'
      ? `${property.title} เป็น${bedroomDescriptor ? `${bedroomDescriptor} ` : ''}${typeDescriptor}${priceLabel ? ` ราคา ${priceLabel}` : ''}${sizeLabel ? ` และขนาด ${sizeLabel}` : ''} ซึ่งเพียงพอสำหรับการตัดสินใจรอบแรกแบบจริงจัง`
      : `${property.title} is a ${bedroomDescriptor ? `${bedroomDescriptor} ` : ''}${typeDescriptor}${priceLabel ? ` at ${priceLabel}` : ''}${sizeLabel ? ` with ${sizeLabel}` : ''}, which is enough for a serious first-pass decision.`,
    property.type === 'rent'
      ? (locale === 'th'
        ? 'จุดแข็งของหน้านี้คือการคัด rental shortlist ที่พร้อมย้ายเข้าได้เร็ว ไม่ใช่การไล่ดูรายการเช่ากว้าง ๆ'
        : 'This read is strongest when you want a move-in-ready rental shortlist instead of another broad rental scan.')
      : (locale === 'th'
        ? 'จุดแข็งของหน้านี้คือการเทียบยูนิตจริงกับตัวเลือกใกล้เคียง โดยไม่ย้อนกลับไปดู marketing ระดับโครงการ'
        : 'This read is strongest when you want to compare a concrete unit against nearby stock, not go back to project-level marketing.'),
    galleryCount <= 1
      ? (locale === 'th'
        ? 'แม้ภาพจะยังบาง แต่ราคา ขนาด และข้อเท็จจริงระดับยูนิตยังชัดพอให้ใช้คัดกรองต่อได้'
        : 'Even with a thin media pack, the price, size, and unit facts are already strong enough to filter this listing forward.')
      : (locale === 'th'
        ? 'ภาพที่มีอยู่ช่วยเช็กบรรยากาศและสภาพห้องได้ แต่การคัดสินใจยังควรอิง price-fit และ local context ร่วมกัน'
        : 'The current visuals help confirm layout feel, but the shortlist call should still come from price fit and local context together.'),
  ]).slice(0, 3);
}

function buildPropertyLocalContextLines(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
  relatedCount: number,
): string[] {
  return uniqueItems([
    property.city
      ? (locale === 'th'
        ? `อ่านยูนิตนี้ในบริบทของ ${property.city} และตำแหน่งของอาคารจริง ไม่ใช่ดูเป็นตัวเลขราคาเดี่ยว ๆ`
        : `Read this unit inside the ${property.city} district context and its exact building position, not as an isolated price point.`)
      : (locale === 'th'
        ? 'อ่านยูนิตนี้ในบริบทของทำเลจริงก่อนตัดสินใจเชิงตัวเลข'
        : 'Read this unit inside its real location context before making a purely numeric decision.'),
    property.address && property.city
      ? (locale === 'th'
        ? `${property.address}, ${property.city} บอกได้ว่าความสะดวกของถนนจริงสำคัญพอ ๆ กับตัวห้องเอง`
        : `${property.address}, ${property.city} suggests that street-level convenience matters as much as the room itself.`)
      : null,
    property.type === 'rent'
      ? (locale === 'th'
        ? 'สำหรับเคสเช่า ความเหมาะของทำเลถูกตัดสินจากการเดินทาง ช่วงย้ายเข้า และความเร็วที่ยูนิตแบบเดียวกันหายไปจากตลาด'
        : 'For rental decisions, location fit is really about commute, move-in timing, and how quickly comparable units disappear from the market.')
      : (locale === 'th'
        ? 'สำหรับเคสซื้อ ความเหมาะของทำเลคือการดูว่าราคา ขนาด และ bedroom mix นี้ยังแข่งขันกับยูนิตใกล้เคียงได้หรือไม่'
        : 'For purchase decisions, location fit means asking whether this price, size, and bedroom mix still competes well against nearby units.'),
    relatedCount > 0
      ? (locale === 'th'
        ? `route นี้มีตัวเทียบใกล้เคียง ${relatedCount} รายการ จึงใช้ตัดสินได้ว่ายูนิตนี้เป็นตัวนำหรือเป็นเพียง benchmark`
        : `There are ${relatedCount} nearby comparables on this route, so use them to judge whether this unit is the lead candidate or just the benchmark.`)
      : (locale === 'th'
        ? 'ถ้าตัวเทียบใกล้เคียงยังบาง ให้ใช้ยูนิตนี้เป็น anchor ของ brief แล้วขอทีมคัดตัวเลือกที่ใกล้กันต่อ'
        : 'If the nearby compare set is still thin, use this unit as the anchor of the brief and ask the team for tighter alternatives.'),
  ]).slice(0, 4);
}

function buildPropertyShortlistFitLines(
  locale: 'en' | 'th',
  property: NonNullable<Awaited<ReturnType<typeof fetchPropertyBySlug>>>,
  relatedCount: number,
): string[] {
  return uniqueItems([
    property.type === 'rent'
      ? (locale === 'th'
        ? 'ให้ยูนิตนี้อยู่ต่อใน shortlist เมื่อช่วงย้ายเข้า เงื่อนไขเช่า และความพร้อมของห้องดูสะอาดกว่าตัวเลือกเช่าอื่น'
        : 'Keep this unit in the shortlist when the move-in timing, lease terms, and room readiness read cleaner than the other rental options.')
      : (locale === 'th'
        ? 'ให้ยูนิตนี้อยู่ต่อใน shortlist เมื่อราคา ขนาด และห้องนอนยังมีน้ำหนักกว่าตัวเลือกซื้อใกล้เคียงในงบเดียวกัน'
        : 'Keep this unit in the shortlist when its price, size, and bedroom mix still hold more weight than nearby purchase options in the same budget.'),
    relatedCount > 0
      ? (locale === 'th'
        ? `ถ้าเทียบกับตัวเลือกใกล้เคียง ${relatedCount} รายการแล้วยูนิตนี้ยังอธิบายโจทย์ของคุณได้ชัดที่สุด ก็สมควรเป็นตัวที่พาไปคุยกับทีมต่อ`
        : `If this unit still explains your brief better than the ${relatedCount} nearby comparables, it deserves the next advisor conversation.`)
      : (locale === 'th'
        ? 'ถ้าตัวเทียบยังไม่พอ ให้ใช้ยูนิตนี้เป็น benchmark แล้วขอทีมคัด shortlist ที่แคบกว่าเดิม'
        : 'If the compare set is still thin, use this unit as the benchmark and ask the team for a tighter shortlist.'),
    locale === 'th'
      ? 'ถ้ายังลังเล ให้ใช้ section นี้ร่วมกับ verified facts และ local context ก่อนคุยเรื่องเงื่อนไขหรือการนัดดู'
      : 'If the decision is still close, read this together with the verified facts and local context before discussing terms or scheduling.',
  ]).slice(0, 3);
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
  const propertyHighlightLines = buildPropertyHighlightLines(locale, property, gallery.length);
  const propertyLocalContextLines = buildPropertyLocalContextLines(locale, property, relatedProperties.length);
  const propertyShortlistFitLines = buildPropertyShortlistFitLines(locale, property, relatedProperties.length);
  const priorityInternalLinks = internalLinks.filter((item) => (
    item.href.endsWith('/buy') || item.href.endsWith('/invest') || item.href.endsWith('/contact')
  ));
  const propertyPrimaryCtaLabel = property.type === 'rent'
    ? (locale === 'th' ? 'เช็กเงื่อนไขเช่าล่าสุด' : 'Check live rental terms')
    : (locale === 'th' ? 'คุยต่อเกี่ยวกับยูนิตนี้' : 'Review this unit with advisor');
  const propertyConsultationHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
    intent: 'project_consultation',
    source: 'property_detail',
    sourceRoute: 'property',
    ctaType: 'primary',
    ctaLabel: propertyPrimaryCtaLabel,
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
    cta_label: propertyPrimaryCtaLabel,
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
  const propertyRailNote = locale === 'th'
    ? 'เริ่มจากการคุยตรงกับทีมได้ทันที หรือส่งบรีฟด้านล่างเมื่ออยากให้ทีมถือบริบทของยูนิตนี้ไปต่อแบบครบกว่าเดิม.'
    : 'Start with a direct message now, or use the brief below when you want the team to carry this unit context forward in one handoff.';

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
            <div id="gallery-section" className="property-gallery">
              <div className="gallery-main property-gallery__main">
                <Image
                  src={main}
                  alt={property.title}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  className="property-gallery__main-image object-cover"
                  priority
                />
                <div className="gallery-counter property-gallery__counter">1 / {Math.max(gallery.length, 1)}</div>
              </div>

              {gallery.length > 1 ? (
                <div className="gallery-thumbnails property-gallery__thumbnails">
                  {gallery.slice(0, 12).map((src, idx) => (
                    <div key={src} className={idx === 0 ? 'gallery-thumbnail property-gallery__thumb active' : 'gallery-thumbnail property-gallery__thumb'}>
                      <Image
                        src={src}
                        alt={`${dict.property.galleryPhoto} ${idx + 1}`}
                        width={80}
                        height={60}
                        unoptimized
                        className="property-gallery__thumb-image object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <PublicSurfaceCard as="div" tone="warm" id="property-hero" className="property-header">
              <div className="property-title">
                <p className="public-hero__eyebrow">{dict.advisory.heroEyebrow}</p>
                <h1>{property.title}</h1>
                <p className="property-location property-location--primary">
                  {property.address}, {property.city}
                </p>
                <p className="section-subtitle">{propertySummary}</p>
              </div>
              <div className="property-price-block">
                <p className="property-price-label">{locale === 'th' ? 'ราคาอ้างอิง' : 'Guide price'}</p>
                <div className="property-price">{formatPriceTHB(Number(property.price))}</div>
                <p className="property-price-note">
                  {locale === 'th'
                    ? 'ใช้ราคาในหน้านี้เป็นฐานก่อนเช็ก availability และยูนิตที่ยังเปิดอยู่จริง'
                    : 'Use this price as the starting point before confirming live availability and active units.'}
                </p>
              </div>
            </PublicSurfaceCard>

            <PublicActionRow id="property-primary-actions" className="cta-row mb-6" stackOnMobile>
              <TrackedLink
                id="property_consultation_primary"
                className="btn btn-primary"
                href={propertyConsultationHref}
                eventType="cta_click"
                eventPayload={propertyConsultationPayload}
              >
                {propertyPrimaryCtaLabel}
              </TrackedLink>
              <ShortlistSaveButton
                className="btn btn-secondary"
                locale={locale}
                propertyId={property.id}
                sourceSurface="property_detail"
                readOnMount
              />
            </PublicActionRow>
            <p id="property-action-note" className="decision-page__support-note mb-6">
              {propertyActionNote}
            </p>

            <div id="property-core-facts" className="property-facts">
              <div className="property-fact-card">
                <div className="property-fact-card__icon">
                  <IconBed size="sm" />
                </div>
                <div className="property-fact-card__content">
                  <strong className="property-fact-card__value">{property.bedrooms ?? '-'}</strong>
                  <div className="property-fact-card__label text-sm text-[var(--color-text-secondary)]">
                    {dict.property.bedrooms}
                  </div>
                </div>
              </div>
              <div className="property-fact-card">
                <div className="property-fact-card__icon">
                  <IconBath size="sm" />
                </div>
                <div className="property-fact-card__content">
                  <strong className="property-fact-card__value">{property.bathrooms ?? '-'}</strong>
                  <div className="property-fact-card__label text-sm text-[var(--color-text-secondary)]">
                    {dict.property.bathrooms}
                  </div>
                </div>
              </div>
              <div className="property-fact-card">
                <div className="property-fact-card__icon">
                  <IconArea size="sm" />
                </div>
                <div className="property-fact-card__content">
                  <strong className="property-fact-card__value">{property.size ?? '-'}</strong>
                  <div className="property-fact-card__label text-sm text-[var(--color-text-secondary)]">
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
              <div id="property-gallery-status" className="property-gallery__status mb-4">
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

            <section id="property-confidence-pack" className="signal-grid signal-grid--two-up reveal decision-pack property-confidence-pack mb-6">
              <div className="authority-card property-confidence-card property-confidence-card--verified">
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

              <div className="authority-card property-confidence-card property-confidence-card--confirm">
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

            <section id="property-description" className="authority-card property-description-card property-description-card--bridge mb-6">
              <h2 className="card-title">{dict.property.description}</h2>
              <div className="content-article mb-0">
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section id="property-narrative-grid" className="signal-grid signal-grid--three-up reveal mb-6">
              <div id="property-highlights" className="authority-card">
                <h2 className="card-title">{dict.property.highlightsTitle}</h2>
                <p className="card-subtitle">{dict.property.highlightsSubtitle}</p>
                <div className="insight-list mt-3">
                  {propertyHighlightLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="property-local-context" className="authority-card">
                <h2 className="card-title">{dict.property.localContextTitle}</h2>
                <p className="card-subtitle">{dict.property.localContextSubtitle}</p>
                <div className="insight-list mt-3">
                  {propertyLocalContextLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="property-shortlist-fit" className="authority-card">
                <h2 className="card-title">{dict.property.shortlistFitTitle}</h2>
                <p className="card-subtitle">{dict.property.shortlistFitSubtitle}</p>
                <div className="insight-list mt-3">
                  {propertyShortlistFitLines.map((item) => (
                    <div key={item} className="insight-list__item">
                      <span className="insight-list__body">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="property-decision-grid" className="signal-grid signal-grid--two-up reveal property-decision-grid mb-6">
              <div id="property-decision-cues" className="authority-card property-decision-card property-decision-card--lead">
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

              <div id="property-next-tools" className="authority-card property-decision-card property-decision-card--tools">
                <h2 className="card-title">{locale === 'th' ? 'เครื่องมือช่วยตัดสินใจและทางไปต่อ' : 'Investor tools and next moves'}</h2>
                <p className="card-subtitle">
                  {locale === 'th'
                    ? 'ถ้าต้องคำนวณผลตอบแทนหรือเทียบหลายทางเลือกต่อ ให้ไปยังเครื่องมือและหน้าที่ใช้ตัดสินใจต่อได้ทันที'
                    : 'If you need a yield sense-check or a multi-option comparison, move directly into the supporting tools below.'}
                </p>
                <div className="card-actions property-decision-card__actions mt-3">
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
              <section id="property-related-listings" className="signal-grid signal-grid--three-up reveal property-related-listings mb-6">
                {relatedProperties.map((item) => {
                  const relatedImage = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0]) ?? PROPERTY_DETAIL_FALLBACK;
                  const relatedHref = item.slug ? withLocale(locale, `/property/${encodeURIComponent(item.slug)}`) : withLocale(locale, item.type === 'rent' ? '/rent' : '/buy');
                  return (
                    <Link key={item.id} href={relatedHref} className="authority-card card-interactive property-related-listing-card">
                      <div className="card-image property-related-listing-card__image relative" style={{ aspectRatio: '4 / 3' }}>
                        <Image src={relatedImage} alt={item.title} fill unoptimized sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover rounded-[18px] property-related-listing-card__img" />
                      </div>
                      <div className="mt-4 property-related-listing-card__body">
                        <div className="editorial-card__meta property-related-listing-card__meta">
                          <span>{formatListingType(locale, item.type)}</span>
                          {item.city ? <span>{item.city}</span> : null}
                        </div>
                        <h3 className="card-title property-related-listing-card__title">{item.title}</h3>
                        <p className="card-subtitle property-related-listing-card__price">{formatPriceTHB(Number(item.price))}</p>
                      </div>
                    </Link>
                  );
                })}
              </section>
            ) : null}

            <div id="property-next-steps" className="authority-card property-next-steps-card reveal mb-6">
              <h2 className="card-title">{dict.property.nextSteps}</h2>
              <p className="card-subtitle">{dict.property.exploreRelated}</p>
              <div className="card-actions property-next-steps-card__actions">
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

          <aside className="detail-sidebar detail-stack property-advisor-rail">
            <div id="property-direct-channels" className="agent-card property-advisor-card property-advisor-card--channels">
              <div className="property-advisor-card__identity">
                <div className="property-advisor-avatar">
                  {dict.brand.shortName}
                </div>
                <div>
                  <h3 className="mb-1">{dict.property.agentName}</h3>
                  <p className="mb-0 property-advisor-role">
                    {dict.property.agentRole}
                  </p>
                </div>
              </div>

              <div className="property-advisor-actions">
                <a href={CTA.lineUrl} className="btn btn-primary btn-block" target="_blank" rel="noreferrer">
                  {dict.property.lineChat}
                </a>
                <a href={CTA.phoneTel} className="btn btn-secondary btn-block">
                  {dict.property.callAgent}
                </a>
              </div>
              <p className="property-advisor-note mb-0">{propertyRailNote}</p>
            </div>

            <div id="property-lead-form" className="property-advisor-form-shell mt-6">
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
        eyebrow={locale === 'th' ? 'ส่งต่อไปยัง advisor' : 'Advisor handoff'}
        variant="property"
        title={locale === 'th' ? 'พร้อมคุยต่อเกี่ยวกับยูนิตนี้' : 'Ready to move forward on this unit'}
        description={locale === 'th'
          ? 'ส่งต่อสรุปยูนิตนี้ให้ทีมทันที หรือโทรหาที่ปรึกษาเมื่อพร้อมยืนยันขั้นถัดไป.'
          : 'Send this unit brief to the advisory team now, or call when you are ready to confirm the next step.'}
        primaryAction={{
          id: 'property_mobile_consultation_primary',
          href: propertyConsultationHref,
          label: propertyPrimaryCtaLabel,
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


