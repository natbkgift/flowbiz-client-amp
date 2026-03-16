'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import { EmptyStateCard, InlineStatusMessage, LoadingCardGrid } from '@/components/ui/StateBlocks';
import { SHORTLIST_UPDATED_EVENT, fetchCurrentShortlist, readCachedShortlist, removePropertyFromShortlist, type ShortlistDetail, type ShortlistPropertyItem } from '@/lib/shortlist';

const SHORTLIST_FALLBACK_IMAGE = '/images/property-placeholder.svg';

function formatShortlistSize(value: number | string | null, locale: 'en' | 'th'): string {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return locale === 'th' ? 'ยังไม่ระบุขนาด' : 'Size not listed';
  }
  const rounded = Math.round(numericValue).toLocaleString();
  return locale === 'th' ? `${rounded} ตร.ม.` : `${rounded} sqm`;
}

function buildPropertyHref(locale: 'en' | 'th', item: ShortlistPropertyItem): string {
  if (item.slug) {
    return withLocale(locale, `/property/${encodeURIComponent(item.slug)}`);
  }
  return withLocale(locale, '/buy');
}

export function ShortlistListSurface({ locale }: { locale: 'en' | 'th' }) {
  const [items, setItems] = useState<ShortlistPropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function syncFromShortlist(shortlist: ShortlistDetail | null) {
    const shortlistItems = [...(shortlist?.items ?? [])].sort((left, right) => left.position - right.position);
    setItems(shortlistItems);
  }

  useEffect(() => {
    let isActive = true;

    const cachedShortlist = readCachedShortlist();
    if (cachedShortlist) {
      syncFromShortlist(cachedShortlist);
      setIsLoading(false);
    }

    fetchCurrentShortlist(locale)
      .then((response) => {
        if (!isActive) return;
        syncFromShortlist(response.shortlist);
      })
      .catch(() => {
        if (!isActive) return;
        setError(locale === 'th' ? 'ยังโหลด shortlist ไม่สำเร็จ' : 'Unable to load the shortlist right now.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [locale]);

  useEffect(() => {
    const w = window;
    const handleUpdate = (event: Event) => {
      syncFromShortlist((event as CustomEvent<ShortlistDetail | null>).detail);
      setError(null);
    };

    w.addEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
    return () => {
      w.removeEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  async function handleRemove(propertyId: string) {
    if (pendingPropertyId) return;

    setPendingPropertyId(propertyId);
    setError(null);
    try {
      const response = await removePropertyFromShortlist({
        locale,
        propertyId,
      });
      syncFromShortlist(response.shortlist);
    } catch {
      setError(locale === 'th' ? 'นำรายการออกจาก shortlist ไม่สำเร็จ' : 'Unable to remove the listing from shortlist.');
    } finally {
      setPendingPropertyId(null);
    }
  }

  if (isLoading) {
    return <LoadingCardGrid cards={3} />;
  }

  if (error) {
    return <InlineStatusMessage tone="error" message={error} />;
  }

  if (!items.length) {
    return (
      <EmptyStateCard
        title={locale === 'th' ? 'Shortlist ของคุณยังว่างอยู่' : 'Your shortlist is still empty'}
        body={
          locale === 'th'
            ? 'เริ่มจากการบันทึก listing ที่สนใจจากหน้า buy, rent, หรือ property detail แล้วกลับมาทบทวนที่นี่'
            : 'Save listings from buy, rent, or property detail surfaces first, then return here to review them.'
        }
        action={
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู listings ที่บันทึกได้' : 'Browse shortlist-ready listings'}
          </Link>
        }
      />
    );
  }

  return (
    <div className="shortlist-surface">
      <div className="cta-strip">
        <div className="cta-strip__text">
          {locale === 'th'
            ? `Shortlist นี้มี ${items.length} รายการสำหรับทบทวนต่อ โดยยังแยกจาก flow การติดต่อและ CRM ตาม guardrail เดิม`
            : `This shortlist currently contains ${items.length} listings for review, while remaining separate from contact handoff and CRM flows.`}
        </div>
        <div className="card-actions">
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู buy listings เพิ่ม' : 'Browse buy listings'}
          </Link>
          <Link className="btn btn-tertiary" href={withLocale(locale, '/contact')}>
            {locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}
          </Link>
        </div>
      </div>

      <div className="shortlist-surface__items">
        {items.map((item, index) => {
          const image = resolveImageUrl(item.image) ?? SHORTLIST_FALLBACK_IMAGE;
          const propertyHref = buildPropertyHref(locale, item);
          return (
            <article key={`${item.property_id}-${item.position}`} className="shortlist-item-card">
              <div className="shortlist-item-card__media">
                <Image
                  src={image}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 280px, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="shortlist-item-card__content">
                <div className="shortlist-item-card__eyebrow">
                  <span className="shortlist-item-card__badge">
                    {locale === 'th' ? `ลำดับ ${index + 1}` : `Saved #${index + 1}`}
                  </span>
                  {item.foreign_quota ? (
                    <span className="shortlist-item-card__badge shortlist-item-card__badge--accent">
                      {locale === 'th' ? 'มีสัญญาณ foreign quota' : 'Foreign quota signal'}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-subtitle mb-0">
                    {[item.project, item.location].filter(Boolean).join(' • ') || (locale === 'th' ? 'กำลังรอรายละเอียดทำเล' : 'Location details pending')}
                  </p>
                </div>

                <div className="shortlist-item-card__facts">
                  <span>{formatPriceTHB(Number(item.price))}</span>
                  <span>{formatShortlistSize(item.size, locale)}</span>
                  <span>
                    {locale === 'th'
                      ? `${item.bedrooms ?? '-'} ห้องนอน • ${item.bathrooms ?? '-'} ห้องน้ำ`
                      : `${item.bedrooms ?? '-'} beds • ${item.bathrooms ?? '-'} baths`}
                  </span>
                </div>

                <div className="card-actions">
                  <Link className="btn btn-primary" href={propertyHref}>
                    {locale === 'th' ? 'ดูรายละเอียด listing' : 'View listing details'}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleRemove(item.property_id)}
                    disabled={pendingPropertyId === item.property_id}
                  >
                    {pendingPropertyId === item.property_id
                      ? (locale === 'th' ? 'กำลังนำออก…' : 'Removing…')
                      : (locale === 'th' ? 'นำออกจาก shortlist' : 'Remove from shortlist')}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}