'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buildLeadCaptureQuery, withLocaleQuery } from '@/app/_lib/public-advisory';
import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import { EmptyStateCard, InlineStatusMessage, LoadingCardGrid } from '@/components/ui/StateBlocks';
import { trackEvent } from '@/lib/analytics';
import { SHORTLIST_UPDATED_EVENT, fetchCurrentShortlist, publishShortlist, readCachedShortlistForCurrentOwner, removePropertyFromShortlist, resolveShortlistCompareProjects, shareCurrentShortlist, type ShortlistCompareProject, type ShortlistDetail, type ShortlistPropertyItem } from '@/lib/shortlist';

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
    return locale === 'th' ? 'ดูรายละเอียด listing' : 'View listing details';
  }

  return locale === 'th' ? 'ดู buy listings เพิ่ม' : 'Browse buy listings';
}

function getShortlistAdvisorLabel(locale: 'en' | 'th', compareReady: boolean): string {
  if (compareReady) {
    return locale === 'th' ? 'ส่ง shortlist นี้ให้ที่ปรึกษาช่วยรีวิว' : 'Send this shortlist for advisor review';
  }

  return locale === 'th' ? 'รีวิว shortlist นี้กับที่ปรึกษา' : 'Review this shortlist with an advisor';
}

function getShortlistSummaryContent(input: {
  locale: 'en' | 'th';
  itemCount: number;
  compareProjectCount: number;
}) {
  const { locale, itemCount, compareProjectCount } = input;
  const compareReady = compareProjectCount >= 2;

  if (compareReady) {
    return {
      title: locale === 'th'
        ? `ขั้นถัดไปที่คุ้มสุด: เทียบ ${compareProjectCount} โครงการจาก shortlist นี้`
        : `Best next move: compare ${compareProjectCount} saved projects`,
      body: locale === 'th'
        ? `ตอนนี้ shortlist นี้มี ${itemCount} รายการและ resolve ได้ ${compareProjectCount} โครงการแล้ว จึงควรอ่าน trade-off แบบ side-by-side ก่อน แล้วค่อยส่ง context เดิมต่อให้ที่ปรึกษาถ้ายังต้อง pressure-test ผู้ชนะ`
        : `This shortlist now holds ${itemCount} saved listings and already resolves to ${compareProjectCount} projects, so the highest-value next step is a side-by-side compare before handing the same context to an advisor if a winner still needs pressure-testing.`,
      primaryLabel: locale === 'th'
        ? `เทียบ ${compareProjectCount} โครงการจาก shortlist`
        : `Compare ${compareProjectCount} saved projects`,
      browseUtilityLabel: locale === 'th' ? 'ดู listings เพิ่มต่อ' : 'Keep adding listings',
    };
  }

  return {
    title: locale === 'th'
      ? 'ขั้นถัดไปที่คุ้มสุด: เพิ่มอีก 1 ตัวเลือกที่ผูกกับโครงการ'
      : 'Best next move: add one more project-backed listing',
    body: locale === 'th'
      ? `ตอนนี้ shortlist นี้มี ${itemCount} รายการ แต่ compare จะเริ่มคุ้มเมื่อ resolve ได้อย่างน้อย 2 โครงการในเฟรมเดียวกัน เพิ่มอีก 1 ตัวเลือกก่อน หรือส่ง shortlist นี้ให้ทีมช่วยรีวิวถ้าการค้นหาเริ่มแคบแล้ว`
      : `This shortlist currently has ${itemCount} saved listing${itemCount === 1 ? '' : 's'}, but compare only becomes decision-useful once at least 2 projects resolve in the same frame. Add one more strong option first, or send this shortlist to the team if the search is already narrowing.`,
    primaryLabel: locale === 'th' ? 'เพิ่มอีก 1 ตัวเลือกก่อน' : 'Add one more listing first',
    browseUtilityLabel: null,
  };
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
  const compareProjectIds = compareProjects.map((item) => item.projectId).filter(Boolean);

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

    fetchCurrentShortlist(locale, { publish: false })
      .then((response) => {
        if (!isActive) return;
        publishShortlist(response.shortlist ?? null, 'fetch');
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

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== w.localStorage) {
        return;
      }

      if (event.key !== 'amp_shortlist_cache_v1' && event.key !== 'amp_shortlist_owner_v1' && event.key !== null) {
        return;
      }

      syncFromShortlist(readCachedShortlistForCurrentOwner());
      setError(null);
    };

    w.addEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
    w.addEventListener('storage', handleStorage);
    return () => {
      w.removeEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
      w.removeEventListener('storage', handleStorage);
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
    trackEvent('shortlist_action', window.location.pathname || `/${locale}/shortlist`, {
      source_route: 'shortlist',
      cta_type: 'secondary',
      cta_label: locale === 'th' ? 'นำออกจาก shortlist' : 'Remove from shortlist',
      entity_type: 'property',
      entity_id: propertyId,
      user_intent: 'research',
      context: {
        from_shortlist: true,
        compare_ids: compareProjectIds,
      },
      action: 'remove',
    });
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
    trackEvent('cta_click', window.location.pathname || `/${locale}/shortlist`, {
      source_route: 'shortlist',
      cta_type: 'tertiary',
      cta_label: locale === 'th' ? 'สร้างลิงก์แชร์' : 'Create share link',
      entity_type: 'shortlist',
      entity_name: 'shortlist',
      user_intent: 'research',
      context: {
        from_shortlist: true,
        compare_ids: compareProjectIds,
      },
    });

    try {
      const response = await shareCurrentShortlist(locale);
      const nextShareUrl = `${window.location.origin}${withLocale(locale, `/shortlist/shared/${response.share_token}`)}`;
      setShareUrl(nextShareUrl);

      try {
        await window.navigator.clipboard?.writeText(nextShareUrl);
        setShareNotice(locale === 'th' ? 'คัดลอกลิงก์แชร์แล้ว ลิงก์นี้เปิดแบบดูอย่างเดียวและซ่อนข้อมูลเจ้าของ' : 'Share link copied. This link stays read-only and hides owner identity.');
      } catch {
        setShareNotice(locale === 'th' ? 'สร้างลิงก์แชร์แล้ว คัดลอกต่อได้ด้านล่าง ลิงก์นี้เปิดแบบดูอย่างเดียวและซ่อนข้อมูลเจ้าของ' : 'Share link created. Copy it below. This link stays read-only and hides owner identity.');
      }
    } catch {
      setError(locale === 'th' ? 'สร้างลิงก์แชร์ shortlist ไม่สำเร็จ' : 'Unable to create a shortlist share link.');
    } finally {
      setIsSharing(false);
    }
  }

  if (isLoading) {
    return (
      <EmptyStateCard
        title={locale === 'th' ? 'กำลังเช็ก shortlist ล่าสุด' : 'Checking your latest shortlist'}
        body={
          locale === 'th'
            ? 'ถ้ามีรายการที่เคยบันทึกไว้ ระบบจะดึงกลับมาในหน้านี้อัตโนมัติ คุณยังเปิด inventory ต่อได้ทันทีระหว่างรอ.'
            : 'If you already saved listings, they will reappear here automatically. You can keep browsing inventory while this page checks the latest shortlist state.'
        }
        action={(
          <Link className="btn btn-secondary" href={withLocale(locale, '/buy')}>
            {locale === 'th' ? 'ดู listings ที่บันทึกได้' : 'Browse shortlist-ready listings'}
          </Link>
        )}
      />
    );
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
  const shortlistProjectNames = Array.from(new Set(items.map((item) => item.project || item.title).filter(Boolean)));
  const compareReady = compareProjects.length >= 2;
  const shortlistSummary = getShortlistSummaryContent({
    locale,
    itemCount: items.length,
    compareProjectCount: compareProjects.length,
  });
  const advisorLabel = getShortlistAdvisorLabel(locale, compareReady);
  const compareHref = compareProjects.length >= 2
    ? withLocaleQuery(locale, '/compare', {
        ids: compareProjects.map((item) => item.projectId).join(','),
        ...buildLeadCaptureQuery({
          intent: 'project_compare',
          source: 'shortlist_compare',
          projects: compareProjectNames,
          buyerFit: 'shortlist_narrowing',
          signalLevel: compareProjects.length >= 3 ? 'high' : 'medium',
        }),
      })
    : null;
  const contactHref = withLocaleQuery(locale, '/contact', buildLeadCaptureQuery({
    intent: 'project_shortlist',
    source: 'shortlist_contact',
    projects: shortlistProjectNames,
    buyerFit: 'shortlist_narrowing',
    signalLevel: items.length >= 3 ? 'high' : 'medium',
  }));

  return (
    <div className="shortlist-surface">
      <div className="cta-strip shortlist-surface__summary">
        <div className="cta-strip__text">
          <strong className="shortlist-surface__summary-title">{shortlistSummary.title}</strong>
          <span>{shortlistSummary.body}</span>
        </div>
        <div className="card-actions shortlist-surface__summary-actions">
          {compareReady ? (
            <Link
              className="btn btn-cta"
              href={compareHref ?? withLocale(locale, '/compare')}
              data-amp-event-type="compare_action"
              data-amp-event-payload={JSON.stringify({
                source_route: 'shortlist',
                cta_type: 'primary',
                cta_label: shortlistSummary.primaryLabel,
                entity_type: 'shortlist',
                entity_name: 'shortlist',
                user_intent: 'compare',
                context: {
                  from_shortlist: true,
                  compare_ids: compareProjectIds,
                },
              })}
            >
              {shortlistSummary.primaryLabel}
            </Link>
          ) : (
            <Link className="btn btn-cta" href={withLocale(locale, '/buy')}>
              {shortlistSummary.primaryLabel}
            </Link>
          )}
          <Link
            className="btn btn-secondary"
            href={contactHref}
            data-amp-event-type="cta_click"
            data-amp-event-payload={JSON.stringify({
              source_route: 'shortlist',
              cta_type: 'secondary',
              cta_label: advisorLabel,
              entity_type: 'shortlist',
              entity_name: 'shortlist',
              user_intent: compareProjects.length >= 2 ? 'compare' : 'research',
              context: {
                from_shortlist: true,
                compare_ids: compareProjectIds,
              },
            })}
          >
            {advisorLabel}
          </Link>
        </div>
      </div>

      <div className="shortlist-compare-panel" aria-live="polite">
        <div className="shortlist-compare-panel__header">
          <h2 className="card-title mb-0">
            {compareReady
              ? (locale === 'th' ? 'โครงการชุดนี้พร้อมเข้า compare แล้ว' : 'These saved projects are ready for compare')
              : (locale === 'th' ? 'ยังขาดอีก 1 โครงการก่อนเข้า compare' : 'You still need one more project before compare')}
          </h2>
          <p className="card-subtitle mb-0">
            {compareReady
              ? (locale === 'th'
                  ? 'ระบบ resolve เฉพาะโครงการที่ผูกกับ listing ที่คุณบันทึกไว้ และพาไปอ่าน trade-off แบบ side-by-side โดยยังไม่แตะ contact flow'
                  : 'Only project-backed saves are carried into compare, so you can read trade-offs side by side before touching the contact flow.')
              : (locale === 'th'
                  ? 'ตอนนี้ shortlist นี้ยัง resolve ได้ไม่พอสำหรับ compare แบบมีน้ำหนัก จึงควรเพิ่มอีก 1 ตัวเลือกหรือส่ง shortlist นี้ให้ทีมช่วยรีวิว'
                  : 'This shortlist does not yet resolve enough project-backed options for a useful compare read, so the next move is either one more save or an advisor review.')}
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

      <div className="card-actions shortlist-surface__utility-actions">
        {shortlistSummary.browseUtilityLabel ? (
          <Link className="btn btn-tertiary" href={withLocale(locale, '/buy')}>
            {shortlistSummary.browseUtilityLabel}
          </Link>
        ) : null}
        <button type="button" className="btn btn-tertiary" onClick={handleShare} disabled={isSharing}>
          {isSharing
            ? (locale === 'th' ? 'กำลังสร้างลิงก์แชร์…' : 'Creating share link…')
            : shareUrl
              ? (locale === 'th' ? 'คัดลอกลิงก์แชร์อีกครั้ง' : 'Copy share link again')
              : (locale === 'th' ? 'สร้างลิงก์แชร์' : 'Create share link')}
        </button>
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
            {shareNotice ?? (locale === 'th' ? 'ลิงก์นี้เปิด shortlist แบบดูอย่างเดียว ซ่อนข้อมูลเจ้าของ และไม่เชื่อมเข้า CRM' : 'This link opens a read-only shortlist view, hides owner identity, and does not connect to CRM.')}
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
                  <span>{formatPriceTHB(Number(item.price), locale)}</span>
                  <span>{formatShortlistSize(item.size, locale)}</span>
                  <span>
                    {locale === 'th'
                      ? `${item.bedrooms ?? '-'} ห้องนอน • ${item.bathrooms ?? '-'} ห้องน้ำ`
                      : `${item.bedrooms ?? '-'} beds • ${item.bathrooms ?? '-'} baths`}
                  </span>
                </div>

                <div className="card-actions">
                  <Link
                    className="btn btn-primary"
                    href={propertyHref}
                    data-amp-event-type="cta_click"
                    data-amp-event-payload={JSON.stringify({
                      source_route: 'shortlist',
                      cta_type: 'primary',
                      cta_label: getPrimaryListingActionLabel(locale, item),
                      entity_type: 'property',
                      entity_id: item.property_id,
                      entity_name: item.title,
                      user_intent: 'research',
                      bedroom: item.bedrooms != null ? String(item.bedrooms) : undefined,
                      location: item.location ?? undefined,
                      context: {
                        from_shortlist: true,
                        compare_ids: compareProjectIds,
                      },
                    })}
                  >
                    {getPrimaryListingActionLabel(locale, item)}
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
