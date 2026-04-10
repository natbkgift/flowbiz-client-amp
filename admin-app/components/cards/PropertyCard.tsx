import Link from 'next/link';

import type { PropertyListItem } from '../../app/public/_shared/types';
import type { Dictionary } from '../../app/_lib/i18n/types';
import { formatPriceTHB, resolveImageUrl } from '../../app/_lib/public-api-shared';
import { withLocale } from '../../app/_lib/i18n/routing';
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicChip } from '@/components/public/PublicChip';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { ShortlistSaveButton } from '@/components/shortlist/ShortlistSaveButton';

const PROPERTY_CARD_FALLBACK = '/images/property-placeholder.svg';

type PropertyDecisionSignal = {
  transactionLabel: string;
  priceLabel: string;
  fitLabel: string;
  fitBody: string;
  nextCheckLabel: string;
  nextCheckBody: string;
  primaryCtaLabel: string;
};

function formatPropertyType(value: string | null | undefined, locale: 'en' | 'th'): string | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return null;

  if (locale === 'th') {
    if (normalized === 'condo' || normalized === 'condominium') return 'คอนโด';
    if (normalized === 'villa') return 'วิลล่า';
    if (normalized === 'house') return 'บ้าน';
    if (normalized === 'townhouse') return 'ทาวน์เฮาส์';
    if (normalized === 'studio') return 'สตูดิโอ';
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPropertySpecs(item: PropertyListItem, locale: 'en' | 'th'): string[] {
  const specs: string[] = [];

  if (typeof item.bedrooms === 'number' && Number.isFinite(item.bedrooms) && item.bedrooms > 0) {
    specs.push(locale === 'th' ? `${item.bedrooms} ห้องนอน` : `${item.bedrooms} BR`);
  }

  const sizeValue = Number(item.size_sqm ?? item.size ?? null);
  if (Number.isFinite(sizeValue) && sizeValue > 0) {
    specs.push(locale === 'th' ? `${Math.round(sizeValue).toLocaleString()} ตร.ม.` : `${Math.round(sizeValue).toLocaleString()} sqm`);
  }

  return specs;
}

function joinSpecsForSignal(specs: string[]): string | null {
  if (!specs.length) return null;
  return specs.join(' • ');
}

function buildPropertyDecisionSignal(
  item: PropertyListItem,
  locale: 'en' | 'th',
  specsSummary: string | null,
): PropertyDecisionSignal {
  const cityLabel = item.city || item.address || (locale === 'th' ? 'ทำเลนี้' : 'this area');

  if (item.type === 'rent') {
    return {
      transactionLabel: locale === 'th' ? 'เช่าล่าสุด' : 'Rental live',
      priceLabel: locale === 'th' ? 'ค่าเช่าล่าสุด / เดือน' : 'Live monthly rent',
      fitLabel: locale === 'th' ? 'เหมาะกับ' : 'Best fit',
      fitBody: locale === 'th'
        ? `เหมาะกับคนเช่าที่ต้องคัดยูนิตใน ${cityLabel}${specsSummary ? ` จาก ${specsSummary}` : ''} ก่อนนัดดูจริง`
        : `Best for renters screening ${cityLabel}${specsSummary ? ` units from ${specsSummary}` : ''} before booking a viewing.`,
      nextCheckLabel: locale === 'th' ? 'เช็กต่อ' : 'Next check',
      nextCheckBody: locale === 'th'
        ? 'เช็กสัญญา ระยะเวลาเข้าอยู่ และรายการเฟอร์นิเจอร์ที่รวมก่อนคุยต่อ'
        : 'Confirm lease term, move-in timing, and included furnishings before you move forward.',
      primaryCtaLabel: locale === 'th' ? 'เช็กโจทย์การเช่า' : 'Check rental fit',
    };
  }

  if (item.type === 'new') {
    return {
      transactionLabel: locale === 'th' ? 'โครงการใหม่' : 'New launch',
      priceLabel: locale === 'th' ? 'ราคาเปิดขายล่าสุด' : 'Live launch price',
      fitLabel: locale === 'th' ? 'เหมาะกับ' : 'Best fit',
      fitBody: locale === 'th'
        ? `เหมาะกับผู้ซื้อที่ใช้ราคาเปิดขายล่าสุด${specsSummary ? `และ ${specsSummary}` : ''} เพื่อตัดสินใจก่อนคุยเรื่องโควตาและแผนชำระ`
        : `Best for buyers using the launch-stage price${specsSummary ? ` and ${specsSummary}` : ''} to decide if this unit deserves quota and payment-plan review.`,
      nextCheckLabel: locale === 'th' ? 'เช็กต่อ' : 'Next check',
      nextCheckBody: locale === 'th'
        ? 'เช็กแผนผ่อน โควตาต่างชาติ และกำหนดส่งมอบก่อนเทียบกับตัวเลือกรีเซล'
        : 'Confirm payment plan, foreign quota, and handover timing before comparing it with resale options.',
      primaryCtaLabel: locale === 'th' ? 'เช็กโจทย์การซื้อ' : 'Check buy fit',
    };
  }

  return {
    transactionLabel: locale === 'th' ? 'สัญญาณซื้อ' : 'Buy signal',
    priceLabel: locale === 'th' ? 'ราคาเสนอขายล่าสุด' : 'Live asking price',
    fitLabel: locale === 'th' ? 'เหมาะกับ' : 'Best fit',
    fitBody: locale === 'th'
      ? `เหมาะกับผู้ซื้อที่ใช้ราคาเสนอขายล่าสุด${specsSummary ? `พร้อม ${specsSummary}` : ''} เพื่อตัดสินใจก่อนลงลึกเรื่องโครงการ เอกสาร หรือการต่อรอง`
      : `Best for buyers using the live asking price${specsSummary ? ` plus ${specsSummary}` : ''} to decide if this unit deserves deeper project or legal review.`,
    nextCheckLabel: locale === 'th' ? 'เช็กต่อ' : 'Next check',
    nextCheckBody: locale === 'th'
      ? 'เช็กกรรมสิทธิ์ ค่าโอน และสภาพห้องก่อนคุยต่อหรือเริ่มต่อรอง'
      : 'Confirm ownership structure, transfer costs, and room condition before negotiation.',
    primaryCtaLabel: locale === 'th' ? 'เช็กโจทย์การซื้อ' : 'Check buy fit',
  };
}

export function PropertyCard({
  item,
  dict,
  locale,
}: {
  item: PropertyListItem;
  dict: Dictionary;
  locale: 'en' | 'th';
}) {
  const href = item.slug
    ? withLocale(locale, `/property/${encodeURIComponent(item.slug)}`)
    : withLocale(locale, item.type === 'rent' ? '/rent' : '/buy');
  const img = resolveImageUrl(item.cover_image ?? item.local_images?.[0] ?? item.images?.[0] ?? null) ?? PROPERTY_CARD_FALLBACK;
  const propertyTypeLabel = formatPropertyType(item.property_type ?? item.type, locale);
  const propertySpecs = formatPropertySpecs(item, locale);
  const propertySpecsSummary = joinSpecsForSignal(propertySpecs);
  const decisionSignal = buildPropertyDecisionSignal(item, locale, propertySpecsSummary);
  const propertyLocation = item.address || item.city;

  return (
    <PublicSurfaceCard as="article" tone="warm" interactive className="property-card">
      <Link href={href} className="property-card__link">
        <div className="card-image property-card__media">
          <SafeCoverImage
            src={img}
            alt={item.title}
            fallbackSrc={PROPERTY_CARD_FALLBACK}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover property-card__image"
            unoptimized={false}
            ssrStartWithPrimary={img !== PROPERTY_CARD_FALLBACK}
          />
          <div className="property-card__media-scrim" aria-hidden="true" />
          <div className="property-card__media-topline" aria-hidden="true">
            {propertyTypeLabel ? (
              <PublicChip tone="deep" size="sm" className="property-card__media-chip">
                {propertyTypeLabel}
              </PublicChip>
            ) : null}
            <PublicChip size="sm" className="property-card__media-chip property-card__media-chip--signal">
              {decisionSignal.transactionLabel}
            </PublicChip>
          </div>
        </div>

        <div className="card-content property-card__body">
          <div className="property-card__price-block">
            <div className="property-card__price-label">{decisionSignal.priceLabel}</div>
            <div className="card-price property-card__price">{formatPriceTHB(Number(item.price), locale)}</div>
          </div>
          <div className="property-card__copy">
            <div className="card-title property-card__title">{item.title}</div>
            <div className="card-location property-card__location">{propertyLocation}</div>
          </div>
          <div
            className="insight-list property-card__signals"
            aria-label={locale === 'th' ? 'สัญญาณช่วยตัดสินใจของยูนิต' : 'Unit decision signals'}
          >
            <div className="insight-list__item property-card__signal-item">
              <span className="insight-list__title">{decisionSignal.fitLabel}</span>
              <span className="insight-list__body">{decisionSignal.fitBody}</span>
            </div>
            <div className="insight-list__item property-card__signal-item">
              <span className="insight-list__title">{decisionSignal.nextCheckLabel}</span>
              <span className="insight-list__body">{decisionSignal.nextCheckBody}</span>
            </div>
          </div>
          {propertySpecs.length ? (
            <div className="card-specs property-card__specs" aria-label={locale === 'th' ? 'ข้อมูลเบื้องต้นของทรัพย์' : 'Property quick specs'}>
              {propertySpecs.map((spec) => (
                <PublicChip key={spec} className="card-specs__item property-card__spec-chip" size="sm">
                  {spec}
                </PublicChip>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      <div className="property-card__actions">
        <PublicActionRow className="card-actions property-card__decision-ladder" stackOnMobile>
          <Link className="btn btn-primary property-card__primary-action" href={href}>
            {decisionSignal.primaryCtaLabel}
          </Link>
          <ShortlistSaveButton
            className="property-card__secondary-action"
            locale={locale}
            propertyId={item.id}
            sourceSurface={item.type === 'rent' ? 'rent_listing_card' : 'buy_listing_card'}
          />
        </PublicActionRow>
      </div>
    </PublicSurfaceCard>
  );
}
