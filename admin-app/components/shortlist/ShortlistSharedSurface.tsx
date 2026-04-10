'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getDictionary } from '@/app/_lib/i18n/get-dictionary';
import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { buildLeadCaptureQuery, withLocaleQuery } from '@/app/_lib/public-advisory';
import { withLocale } from '@/app/_lib/i18n/routing';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';
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

function getPrimaryListingActionLabel(locale: 'en' | 'th', item: ShortlistPropertyItem): string {
  if (item.slug) {
    return locale === 'th' ? 'ดูรายละเอียดยูนิตนี้' : 'View listing details';
  }

  return locale === 'th' ? 'ดูตัวเลือกฝั่งซื้อเพิ่ม' : 'Browse buy listings';
}

function getSharedShortlistSummary(locale: 'en' | 'th', itemCount: number) {
  return {
    title: locale === 'th'
      ? 'เริ่มจากดูรายการคัดไว้ที่แชร์มานี้ก่อน'
      : 'Review the shared shortlist first',
    body: locale === 'th'
      ? `ลิงก์นี้เปิดให้ดู ${itemCount} รายการในโหมดอ่านอย่างเดียว โดยซ่อนข้อมูลเจ้าของไว้ ใช้หน้านี้ดูว่ามียูนิตไหนควรเปิดเช็กต่อ แล้วค่อยเริ่มรายการคัดไว้ของคุณเองหากต้องการเทียบตัวเลือกเพิ่ม`
      : `This owner-safe link opens ${itemCount} saved listing${itemCount === 1 ? '' : 's'} in read-only mode. Use it to decide which listings deserve a deeper check, then start your own shortlist if you want to compare alternatives on your side.`,
    advisorLabel: locale === 'th' ? 'ให้ AMP Pattaya ช่วยรีวิวรายการคัดไว้ชุดนี้' : 'Ask AMP Pattaya to review this shortlist',
    actionLabel: locale === 'th' ? 'เริ่มรายการคัดไว้ของคุณ' : 'Start your own shortlist',
  };
}

function formatShortlistUpdatedAt(value: string, locale: 'en' | 'th'): string | null {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(parsed));
}

function parseSharedShortlistError(error: unknown): { title: string; body: string; tone: 'error' | 'info' } | null {
  const message = error instanceof Error ? error.message : '';
  const statusMatch = message.match(/\((\d{3})\)/);
  const status = statusMatch ? Number(statusMatch[1]) : null;

  if (status === 404) {
    return {
      tone: 'error',
      title: 'expired',
      body: 'expired',
    };
  }

  if (status === 401 || status === 403) {
    return {
      tone: 'error',
      title: 'restricted',
      body: 'restricted',
    };
  }

  return null;
}

function buildShortlistItemContext(item: ShortlistPropertyItem, locationPending: string): string {
  return [item.project, item.location].filter(Boolean).join(' • ') || locationPending;
}

export function ShortlistSharedSurface({ locale, shareToken }: { locale: 'en' | 'th'; shareToken: string }) {
  const shortlistCopy = getDictionary(locale).shortlist;
  const [shortlist, setShortlist] = useState<SharedShortlistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ title: string; body: string; tone: 'error' | 'info' } | null>(null);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);
    setShortlist(null);

    fetchSharedShortlist({ locale, shareToken })
      .then((response) => {
        if (!isActive) return;
        setError(null);
        setShortlist(response.shortlist);
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        setShortlist(null);
        const parsedError = parseSharedShortlistError(error);
        if (parsedError?.title === 'expired') {
          setError({
            tone: 'error',
            title: locale === 'th' ? 'ลิงก์รายการคัดไว้ชุดนี้หมดอายุแล้ว' : 'This shared shortlist link has expired',
            body: locale === 'th'
              ? 'ขอให้ผู้ส่งสร้างลิงก์แชร์ใหม่เพื่อเปิดรายการคัดไว้ชุดนี้อีกครั้ง'
              : 'Ask the sender to create a new shared link so you can reopen this shortlist.',
          });
          return;
        }

        if (parsedError?.title === 'restricted') {
          setError({
            tone: 'error',
            title: locale === 'th' ? 'ลิงก์รายการคัดไว้ชุดนี้ไม่มีสิทธิ์เข้าถึง' : 'This shared shortlist link is restricted',
            body: locale === 'th'
              ? 'ลิงก์นี้อาจถูกจำกัดสิทธิ์หรือถูกปิดการเข้าถึงแล้ว'
              : 'This link may now be restricted or no longer shared with this audience.',
          });
          return;
        }

        setError({
          tone: 'error',
          title: shortlistCopy.sharedUnavailableTitle,
          body: shortlistCopy.sharedUnavailableBody,
        });
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [locale, shareToken, shortlistCopy]);

  if (isLoading) {
    return <LoadingCardGrid cards={3} />;
  }

  if (error) {
    return (
      <EmptyStateCard
        className="ui-empty"
        title={error.title}
        body={error.body}
        action={
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'เริ่มรายการคัดไว้ของคุณเอง' : 'Start your own shortlist'}
          </Link>
        }
      />
    );
  }

  if (!shortlist || !shortlist.items.length) {
    return (
      <EmptyStateCard
        title={locale === 'th' ? 'รายการคัดไว้ที่แชร์มายังไม่มีรายการ' : 'This shared shortlist has no listings'}
        body={
          locale === 'th'
            ? 'ลิงก์นี้เปิดได้แบบอ่านอย่างเดียวเท่านั้น หากต้องการเริ่มรายการคัดไว้ของคุณเอง ให้กลับไปที่หน้ารวมอสังหาริมทรัพย์'
            : 'This is a read-only shared view. To start your own shortlist, return to the listings overview.'
        }
        action={
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'เริ่มรายการคัดไว้ของคุณเอง' : 'Start your own shortlist'}
          </Link>
        }
      />
    );
  }

  const updatedAtLabel = formatShortlistUpdatedAt(shortlist.updated_at, locale);
  const shortlistSummary = getSharedShortlistSummary(locale, shortlist.item_count);
  const shortlistProjectNames = Array.from(
    new Set(shortlist.items.map((item) => item.project || item.title).filter(Boolean)),
  );
  const contactHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
    intent: 'project_shortlist',
    source: 'shortlist_shared',
    projects: shortlistProjectNames,
    buyerFit: 'shortlist_narrowing',
    signalLevel: shortlist.item_count >= 3 ? 'high' : 'medium',
  }));

  return (
    <div className="shortlist-surface">
      <div id="shared-shortlist-summary" className="cta-strip shortlist-surface__summary">
        <div className="cta-strip__text">
          <strong className="shortlist-surface__summary-title">{shortlistSummary.title}</strong>
          <span>{shortlistSummary.body}</span>
        </div>
        <div className="card-actions shortlist-surface__summary-actions">
          <Link className="btn btn-cta" href={contactHref}>
            {shortlistSummary.advisorLabel}
          </Link>
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {shortlistSummary.actionLabel}
          </Link>
        </div>
      </div>

      <div className="shortlist-compare-panel" aria-live="polite">
        <div className="shortlist-compare-panel__header">
          <h2 className="card-title mb-0">
            {locale === 'th' ? 'วิธีใช้รายการคัดไว้ที่แชร์มานี้' : 'How to use this shared shortlist'}
          </h2>
          <p className="card-subtitle mb-0">
            {locale === 'th'
              ? 'ดูชุดที่คัดไว้ก่อน เปิดยูนิตที่อยากเช็กเพิ่ม แล้วค่อยเลือกว่าจะให้ทีมช่วยรีวิวต่อ หรือเริ่มรายการคัดไว้ของคุณเองเมื่ออยากเทียบตัวเลือกเพิ่มในบริบทของคุณ'
              : 'Read the curated set first, open the listings that need a deeper check, then either ask the team to review this shortlist or start your own shortlist when you want to save alternatives on your side.'}
          </p>
        </div>
        <div className="shortlist-compare-panel__chips">
          <span className="shortlist-compare-panel__chip">
            {locale === 'th' ? `จำนวน ${shortlist.item_count} รายการ` : `${shortlist.item_count} listings`}
          </span>
          <span className="shortlist-compare-panel__chip">
            {locale === 'th' ? 'อ่านอย่างเดียวและซ่อนข้อมูลเจ้าของ' : 'Read-only and owner-safe'}
          </span>
          {updatedAtLabel ? (
            <span className="shortlist-compare-panel__chip">
              {locale === 'th' ? `อัปเดตล่าสุด ${updatedAtLabel}` : `Updated ${updatedAtLabel}`}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shortlist-surface__items">
        {shortlist.items.map((item, index) => {
          const image = resolveImageUrl(item.image) ?? SHORTLIST_FALLBACK_IMAGE;
          const propertyHref = buildPropertyHref(locale, item);
          return (
            <article key={`${item.property_id}-${item.position}`} className="shortlist-item-card">
              <div className="shortlist-item-card__media">
                <SafeCoverImage
                  src={image}
                  alt={item.title}
                  fallbackSrc={SHORTLIST_FALLBACK_IMAGE}
                  sizes="(min-width: 1024px) 280px, 100vw"
                  className="object-cover"
                  unoptimized={false}
                  ssrStartWithPrimary={image !== SHORTLIST_FALLBACK_IMAGE}
                />
              </div>

              <div className="shortlist-item-card__content">
                <div className="shortlist-item-card__eyebrow">
                  <span className="shortlist-item-card__badge">
                    {locale === 'th' ? `รายการที่แชร์ ${index + 1}` : `Shared #${index + 1}`}
                  </span>
                  <span className="shortlist-item-card__badge shortlist-item-card__badge--accent">
                    {locale === 'th' ? 'อ่านอย่างเดียว' : 'Read-only'}
                  </span>
                </div>

                <div>
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-subtitle mb-0">
                    {buildShortlistItemContext(item, shortlistCopy.locationPending)}
                  </p>
                </div>

                <div className="shortlist-item-card__facts">
                  <span>{formatPriceTHB(Number(item.price), locale)}</span>
                  <span>{formatShortlistSize(item.size, locale)}</span>
                  <span>
                    {locale === 'th'
                      ? `${item.bedrooms ?? '-'} ห้องนอน • ${item.bathrooms ?? '-'} ห้องน้ำ`
                      : `${item.bedrooms ?? '-'} beds • ${item.bathrooms ?? '-'} baths`}
                  </span>
                </div>

                <div className="card-actions">
                  <Link className="btn btn-primary" href={propertyHref}>
                    {getPrimaryListingActionLabel(locale, item)}
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
