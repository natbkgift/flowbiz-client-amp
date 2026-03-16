'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import { EmptyStateCard, InlineStatusMessage, LoadingCardGrid } from '@/components/ui/StateBlocks';
import { fetchSharedShortlist, type SharedShortlistDetail, type ShortlistPropertyItem } from '@/lib/shortlist';

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

export function ShortlistSharedSurface({ locale, shareToken }: { locale: 'en' | 'th'; shareToken: string }) {
  const [shortlist, setShortlist] = useState<SharedShortlistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    fetchSharedShortlist({ locale, shareToken })
      .then((response) => {
        if (!isActive) return;
        setShortlist(response.shortlist);
      })
      .catch(() => {
        if (!isActive) return;
        setError(locale === 'th' ? 'ไม่พบ shortlist ที่แชร์ไว้หรือเปิดลิงก์นี้ไม่ได้แล้ว' : 'This shared shortlist is unavailable or no longer accessible.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [locale, shareToken]);

  if (isLoading) {
    return <LoadingCardGrid cards={3} />;
  }

  if (error) {
    return <InlineStatusMessage tone="error" message={error} />;
  }

  if (!shortlist || !shortlist.items.length) {
    return (
      <EmptyStateCard
        title={locale === 'th' ? 'Shortlist ที่แชร์นี้ยังไม่มีรายการ' : 'This shared shortlist has no listings'}
        body={
          locale === 'th'
            ? 'ลิงก์นี้เป็นมุมมองแบบ read-only เท่านั้น หากต้องการเริ่ม shortlist ของคุณเอง ให้กลับไปที่หน้ารวม listings'
            : 'This is a read-only shared view. To start your own shortlist, return to the listings overview.'
        }
        action={
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู listings' : 'Browse listings'}
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
            ? `ลิงก์นี้แชร์ shortlist แบบดูอย่างเดียวจำนวน ${shortlist.item_count} รายการ โดยไม่เปิดสิทธิ์แก้ไขหรือเชื่อมเข้า CRM`
            : `This link shares a read-only shortlist with ${shortlist.item_count} listings and does not enable editing or CRM handoff.`}
        </div>
        <div className="card-actions">
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู buy listings' : 'Browse buy listings'}
          </Link>
        </div>
      </div>

      <div className="shortlist-surface__items">
        {shortlist.items.map((item, index) => {
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
                    {locale === 'th' ? `แชร์ลำดับ ${index + 1}` : `Shared #${index + 1}`}
                  </span>
                  <span className="shortlist-item-card__badge shortlist-item-card__badge--accent">
                    {locale === 'th' ? 'read-only' : 'Read-only'}
                  </span>
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
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}