'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { withLocaleQuery } from '@/app/_lib/public-advisory';
import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import { EmptyStateCard, InlineStatusMessage, LoadingCardGrid } from '@/components/ui/StateBlocks';
import { SHORTLIST_UPDATED_EVENT, fetchCurrentShortlist, readCachedShortlistForCurrentOwner, removePropertyFromShortlist, resolveShortlistCompareProjects, shareCurrentShortlist, type ShortlistCompareProject, type ShortlistDetail, type ShortlistPropertyItem } from '@/lib/shortlist';

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
  const [compareProjects, setCompareProjects] = useState<ShortlistCompareProject[]>([]);
  const [isResolvingCompare, setIsResolvingCompare] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function syncFromShortlist(shortlist: ShortlistDetail | null) {
    const shortlistItems = [...(shortlist?.items ?? [])].sort((left, right) => left.position - right.position);
    setItems(shortlistItems);
  }

  useEffect(() => {
    let isActive = true;

    const cachedShortlist = readCachedShortlistForCurrentOwner();
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

  useEffect(() => {
    let isActive = true;

    if (!items.length) {
      setCompareProjects([]);
      setIsResolvingCompare(false);
      return () => {
        isActive = false;
      };
    }

    setIsResolvingCompare(true);
    resolveShortlistCompareProjects({ locale, items })
      .then((resolved) => {
        if (!isActive) return;
        setCompareProjects(resolved);
      })
      .catch(() => {
        if (!isActive) return;
        setCompareProjects([]);
      })
      .finally(() => {
        if (!isActive) return;
        setIsResolvingCompare(false);
      });

    return () => {
      isActive = false;
    };
  }, [items, locale]);

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

  async function handleShare() {
    if (isSharing) return;

    setIsSharing(true);
    setError(null);
    setShareNotice(null);

    try {
      const response = await shareCurrentShortlist(locale);
      const nextShareUrl = `${window.location.origin}${withLocale(locale, `/shortlist/shared/${response.share_token}`)}`;
      setShareUrl(nextShareUrl);

      try {
        await window.navigator.clipboard?.writeText(nextShareUrl);
        setShareNotice(locale === 'th' ? 'คัดลอกลิงก์แชร์แล้ว' : 'Share link copied.');
      } catch {
        setShareNotice(locale === 'th' ? 'สร้างลิงก์แชร์แล้ว คัดลอกต่อได้ด้านล่าง' : 'Share link created. Copy it below.');
      }
    } catch {
      setError(locale === 'th' ? 'สร้างลิงก์แชร์ shortlist ไม่สำเร็จ' : 'Unable to create a shortlist share link.');
    } finally {
      setIsSharing(false);
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

  const compareProjectNames = compareProjects
    .map((item) => item.projectName)
    .filter((value): value is string => Boolean(value));
  const compareHref = compareProjects.length >= 2
    ? withLocaleQuery(locale, '/compare', {
        ids: compareProjects.map((item) => item.projectId).join(','),
        intent: 'shortlist_review',
        source: 'shortlist_compare',
      })
    : null;

  return (
    <div className="shortlist-surface">
      <div className="cta-strip">
        <div className="cta-strip__text">
          {locale === 'th'
            ? `Shortlist นี้มี ${items.length} รายการสำหรับทบทวนต่อ โดยยังแยกจาก flow การติดต่อและ CRM ตาม guardrail เดิม`
            : `This shortlist currently contains ${items.length} listings for review, while remaining separate from contact handoff and CRM flows.`}
        </div>
        <div className="card-actions">
          {compareHref ? (
            <Link className="btn btn-primary" href={compareHref}>
              {locale === 'th'
                ? `เทียบ ${compareProjects.length} โครงการจาก shortlist`
                : `Compare ${compareProjects.length} saved projects`}
            </Link>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={handleShare} disabled={isSharing}>
            {isSharing
              ? (locale === 'th' ? 'กำลังสร้างลิงก์แชร์…' : 'Creating share link…')
              : shareUrl
                ? (locale === 'th' ? 'คัดลอกลิงก์แชร์อีกครั้ง' : 'Copy share link again')
                : (locale === 'th' ? 'สร้างลิงก์แชร์' : 'Create share link')}
          </button>
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู buy listings เพิ่ม' : 'Browse buy listings'}
          </Link>
          <Link className="btn btn-tertiary" href={withLocale(locale, '/contact')}>
            {locale === 'th' ? 'คุยกับที่ปรึกษา' : 'Speak to an advisor'}
          </Link>
        </div>
      </div>

      <div className="shortlist-compare-panel" aria-live="polite">
        <div className="shortlist-compare-panel__header">
          <h2 className="card-title mb-0">
            {locale === 'th' ? 'เปลี่ยน shortlist ไปเป็น compare surface' : 'Move this shortlist into compare'}
          </h2>
          <p className="card-subtitle mb-0">
            {locale === 'th'
              ? 'ระบบจะดึงเฉพาะโครงการที่ผูกกับ listing ที่คุณบันทึกไว้ แล้วส่งไปยัง compare แบบ descriptive เท่านั้น'
              : 'The compare step only carries forward projects that can be resolved from your saved listings, using the existing descriptive compare surface.'}
          </p>
        </div>

        {isResolvingCompare ? (
          <p className="guided-dialog__step mb-0">
            {locale === 'th' ? 'กำลังเตรียมโครงการที่ compare ได้จาก shortlist…' : 'Preparing compare-ready projects from this shortlist…'}
          </p>
        ) : compareProjects.length >= 2 ? (
          <>
            <p className="guided-dialog__step mb-0">
              {locale === 'th'
                ? `พร้อมเทียบ ${compareProjects.length} โครงการจาก shortlist นี้แบบ side-by-side โดยไม่แตะ contact flow หรือ CRM`
                : `${compareProjects.length} shortlist projects are ready for a side-by-side comparison without touching contact flow or CRM.`}
            </p>
            <div className="shortlist-compare-panel__chips">
              {compareProjectNames.map((name) => (
                <span key={name} className="shortlist-compare-panel__chip">{name}</span>
              ))}
            </div>
          </>
        ) : (
          <p className="guided-dialog__step mb-0">
            {locale === 'th'
              ? 'ตอนนี้ shortlist นี้ยัง resolve ได้ไม่ถึง 2 โครงการสำหรับ compare บันทึกเพิ่มอีกอย่างน้อย 1 โครงการเพื่อเปิดตารางเทียบ'
              : 'This shortlist does not yet resolve to 2 projects for compare. Save at least one more project-backed listing to open the comparison table.'}
          </p>
        )}
      </div>

      {shareUrl ? (
        <div className="shortlist-share-panel" aria-live="polite">
          <label className="shortlist-share-panel__label" htmlFor="shortlist-share-link">
            {locale === 'th' ? 'ลิงก์แชร์แบบ read-only' : 'Read-only share link'}
          </label>
          <input
            id="shortlist-share-link"
            className="shortlist-share-panel__input"
            type="text"
            value={shareUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <p className="guided-dialog__step mt-2">
            {shareNotice ?? (locale === 'th' ? 'ลิงก์นี้เปิด shortlist แบบดูอย่างเดียวและไม่เชื่อมเข้า CRM' : 'This link opens a read-only shortlist view and does not connect to CRM.')}
          </p>
        </div>
      ) : null}

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