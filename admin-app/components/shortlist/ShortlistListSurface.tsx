'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buildLeadCaptureQuery, withLocaleQuery } from '@/app/_lib/public-advisory';
import { resolveImageUrl, formatPriceTHB } from '@/app/_lib/public-api-shared';
import { withLocale } from '@/app/_lib/i18n/routing';
import { PublicActionRow } from '@/components/public/PublicActionRow';
import { PublicChip } from '@/components/public/PublicChip';
import { PublicSectionHeader } from '@/components/public/PublicSectionHeader';
import { PublicSurfaceCard } from '@/components/public/PublicSurfaceCard';
import { EmptyStateCard, InlineStatusMessage } from '@/components/ui/StateBlocks';
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

function summarizeProjectNames(names: string[], locale: 'en' | 'th'): string {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));

  if (!uniqueNames.length) {
    return locale === 'th' ? 'shortlist ชุดนี้' : 'this shortlist';
  }

  if (uniqueNames.length <= 2) {
    return uniqueNames.join(', ');
  }

  const visibleNames = uniqueNames.slice(0, 2).join(', ');
  const hiddenCount = uniqueNames.length - 2;
  return locale === 'th'
    ? `${visibleNames} และอีก ${hiddenCount} รายการ`
    : `${visibleNames}, and ${hiddenCount} more`;
}

type ShortlistConversionCard = {
  key: string;
  title: string;
  body: string;
  lines: string[];
  tone: 'light' | 'warm' | 'deep';
};

function buildShortlistConversionPack(input: {
  locale: 'en' | 'th';
  itemCount: number;
  compareProjectCount: number;
  shortlistNames: string[];
  compareProjectNames: string[];
}) {
  const { locale, itemCount, compareProjectCount, shortlistNames, compareProjectNames } = input;
  const compareReady = compareProjectCount >= 2;
  const shortlistNameSummary = summarizeProjectNames(shortlistNames, locale);
  const compareNameSummary = summarizeProjectNames(compareProjectNames, locale);

  if (compareReady) {
    return {
      kicker: locale === 'th' ? 'Shortlist พร้อมเข้าสู่ decision round' : 'Compare-ready shortlist',
      title: locale === 'th' ? 'เปลี่ยน shortlist นี้ให้เป็น decision round ถัดไป' : 'Turn this shortlist into the next decision round',
      subtitle: locale === 'th'
        ? 'ตอนนี้ shortlist ชุดนี้พร้อมสำหรับการอ่าน trade-off แบบ side-by-side แล้ว จากนั้นค่อยส่ง context เดิมต่อให้ทีมถ้าผู้ชนะยังต้อง pressure-test เพิ่ม'
        : 'This shortlist is already strong enough for a side-by-side compare. Use that round to cut weaker options, then hand the same frame to the team if the winner still needs pressure-testing.',
      cards: [
        {
          key: 'status',
          title: locale === 'th' ? 'shortlist นี้ยืนยันอะไรได้แล้ว' : 'What this shortlist already confirms',
          body: locale === 'th'
            ? 'ตอนนี้คุณไม่ได้อยู่ในโหมด browse กว้าง ๆ แล้ว แต่กำลังอยู่ใน shortlist ที่พอจะตัดสินใจรอบจริงได้'
            : 'This is no longer a raw browsing state. The shortlist is already narrow enough to support a real decision round.',
          lines: [
            locale === 'th'
              ? `${itemCount} listing ที่บันทึกไว้กำลังถูกอ่านใน shortlist นี้`
              : `${itemCount} saved listings are active in this shortlist review.`,
            locale === 'th'
              ? `${compareProjectCount} โครงการ resolve เข้าสู่ compare frame เดียวกันได้แล้ว`
              : `${compareProjectCount} projects already resolve into the same compare frame.`,
            locale === 'th'
              ? 'ขั้นนี้เหมาะกับการ pressure-test ผู้ชนะ ไม่ใช่การกลับไปเริ่มค้นหาใหม่'
              : 'This stage is for pressure-testing likely winners, not restarting discovery.',
          ],
          tone: 'light',
        },
        {
          key: 'next',
          title: locale === 'th' ? 'ใช้ compare เพื่อตัดตัวเลือกที่อ่อนกว่า' : 'Use compare to remove weaker options',
          body: locale === 'th'
            ? 'Compare คือ step ที่คุ้มที่สุดตอนนี้ เพราะช่วยอ่าน trade-off ก่อนส่งต่อให้ทีม'
            : 'Compare is the highest-value next move because it forces the trade-offs into one frame before advisor review.',
          lines: [
            locale === 'th'
              ? `เปิด compare ด้วย ${compareNameSummary}`
              : `Open compare with ${compareNameSummary}.`,
            locale === 'th'
              ? 'กลับมาที่ shortlist นี้หลังดูตาราง เพื่อเก็บผู้ชนะและตัดรายการที่อ่อนลง'
              : 'Return to this shortlist after the table to keep the winner and remove weaker options.',
            locale === 'th'
              ? 'ถ้าผลยังไม่ขาด ค่อยส่ง shortlist frame เดิมนี้ต่อให้ทีมโดยไม่ต้องอธิบายใหม่'
              : 'If the result is still not decisive, send the same shortlist frame to the team without rebuilding the brief.',
          ],
          tone: 'warm',
        },
        {
          key: 'handoff',
          title: locale === 'th' ? 'สิ่งที่ถูกพกต่อไปยังทีม' : 'What carries into advisor handoff',
          body: locale === 'th'
            ? 'Contact route ควรเห็น shortlist และ compare-ready frame เดียวกับที่คุณกำลังใช้อยู่ตอนนี้'
            : 'The contact route should receive the same shortlist and compare-ready frame you are using now.',
          lines: [
            locale === 'th'
              ? `โครงการในบริบทนี้: ${shortlistNameSummary}`
              : `Projects in scope: ${shortlistNameSummary}.`,
            locale === 'th'
              ? 'compare-ready project IDs จะถูกพกไปกับ advisor link ด้วย'
              : 'Compare-ready project IDs travel with the advisor link.',
            locale === 'th'
              ? 'หลัง compare แล้วคุณไม่ต้องสรุป shortlist ซ้ำอีกครั้ง'
              : 'You do not need to restate the shortlist after compare.',
          ],
          tone: 'light',
        },
      ] satisfies ShortlistConversionCard[],
    };
  }

  return {
    kicker: locale === 'th' ? 'Shortlist ยังอยู่ในขั้น narrowing' : 'Shortlist still narrowing',
    title: locale === 'th' ? 'เสริม shortlist นี้ให้พร้อมก่อนเข้า compare' : 'Strengthen this shortlist before compare',
    subtitle: locale === 'th'
      ? 'ตอนนี้ shortlist ชุดนี้ยังขาดอีกอย่างน้อย 1 โครงการที่ผูกกับ compare frame เดียวกัน ดังนั้น step ที่คุ้มกว่าคือเพิ่ม save อีก 1 ตัวเลือกหรือส่ง shortlist ปัจจุบันให้ทีมช่วยคัดต่อ'
      : 'This shortlist is still at least one project short of a meaningful compare, so the higher-value move is either one more save or an advisor review on the current shortlist.',
    cards: [
      {
        key: 'status',
        title: locale === 'th' ? 'shortlist นี้ยืนยันอะไรได้แล้ว' : 'What this shortlist already confirms',
        body: locale === 'th'
          ? 'การค้นหาเริ่มแคบลงแล้ว แต่ compare ยังไม่พร้อมพอสำหรับตารางที่มีน้ำหนัก'
          : 'The search is clearly narrowing, but compare is not ready for a meaningful table yet.',
        lines: [
          locale === 'th'
            ? `${itemCount} listing ที่บันทึกไว้กำลังถูกอ่านใน shortlist นี้`
            : `${itemCount} saved listing${itemCount === 1 ? '' : 's'} are active in this shortlist review.`,
          locale === 'th'
            ? `${compareProjectCount} โครงการที่ผูกกับ compare frame ถูก resolve ได้ตอนนี้`
            : `${compareProjectCount} project-backed option${compareProjectCount === 1 ? '' : 's'} currently resolve for compare.`,
          locale === 'th'
            ? 'หน้านี้ยังเป็นพื้นที่ owner-safe สำหรับเก็บ ตัด หรือแชร์ตัวเลือกเดิมต่อได้'
            : 'This page remains the owner-safe place to keep, cut, or share the current options.',
        ],
        tone: 'light',
      },
      {
        key: 'next',
        title: locale === 'th' ? 'อีก 1 save จะทำให้ compare คุ้มขึ้น' : 'One more save makes compare useful',
        body: locale === 'th'
          ? 'Compare จะเริ่มมีน้ำหนักเมื่ออย่างน้อย 2 โครงการ resolve อยู่ในเฟรมเดียวกัน'
          : 'Compare only becomes decision-useful once at least 2 projects resolve in the same frame.',
        lines: [
          locale === 'th'
            ? 'เพิ่มอีก 1 project-backed listing จากหน้า buy หรือ property detail'
            : 'Add one more project-backed listing from buy or property detail.',
          locale === 'th'
            ? 'ถ้าการค้นหาแคบพอแล้ว คุณข้ามไป advisor review ด้วย shortlist ชุดนี้ได้ทันที'
            : 'If the search is already tight, skip straight to advisor review with this shortlist.',
          locale === 'th'
            ? 'เมื่อมีตัวเลือกสดอีก 1 ตัวในเฟรมนี้ ค่อยกลับมาเปิด compare'
            : 'Come back once one more live project belongs in this frame.',
        ],
        tone: 'warm',
      },
      {
        key: 'handoff',
        title: locale === 'th' ? 'สิ่งที่ยังพกต่อไปยังทีมได้' : 'What still carries into advisor handoff',
        body: locale === 'th'
          ? 'แม้ compare จะยังไม่พร้อม แต่ shortlist ปัจจุบันก็ส่งต่อให้ทีมช่วยคัดต่อได้แล้ว'
          : 'Even before compare is ready, the current shortlist can still move forward into advisor review.',
        lines: [
          locale === 'th'
            ? `โครงการในบริบทนี้: ${shortlistNameSummary}`
            : `Projects in scope: ${shortlistNameSummary}.`,
          locale === 'th'
            ? 'advisor link จะพกชื่อ shortlist และ stage ของการตัดสินใจนี้ต่อไปด้วย'
            : 'The advisor link keeps the shortlist names and this decision stage together.',
          locale === 'th'
            ? 'ทีมช่วยชี้ได้ว่าควรเก็บ ตัด หรือแทนตัวเลือกไหนก่อน compare จะพร้อม'
            : 'The team can suggest what to keep, cut, or replace before compare is ready.',
        ],
        tone: 'light',
      },
    ] satisfies ShortlistConversionCard[],
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
  const shortlistConversionPack = buildShortlistConversionPack({
    locale,
    itemCount: items.length,
    compareProjectCount: compareProjects.length,
    shortlistNames: shortlistProjectNames,
    compareProjectNames,
  });
  const advisorLabel = getShortlistAdvisorLabel(locale, compareReady);
  const summarySignals = [
    {
      label: locale === 'th' ? `${items.length} รายการที่บันทึกไว้` : `${items.length} saved listing${items.length === 1 ? '' : 's'}`,
      tone: 'neutral' as const,
    },
    {
      label: isResolvingCompare
        ? (locale === 'th' ? 'กำลังเตรียม compare-ready projects' : 'Preparing compare-ready projects')
        : compareReady
          ? (locale === 'th' ? `${compareProjects.length} โครงการพร้อม compare` : `${compareProjects.length} compare-ready projects`)
          : (locale === 'th' ? `${compareProjects.length} โครงการที่ resolve ได้` : `${compareProjects.length} project-backed option${compareProjects.length === 1 ? '' : 's'}`),
      tone: isResolvingCompare ? 'neutral' as const : compareReady ? 'accent' as const : 'neutral' as const,
    },
    {
      label: compareReady
        ? (locale === 'th' ? 'พร้อมส่งต่อ shortlist frame เดิม' : 'Shortlist frame ready to hand off')
        : (locale === 'th' ? 'ยังคุยกับทีมต่อได้ทันที' : 'Advisor review still available'),
      tone: 'deep' as const,
    },
  ];
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
    compareIds: compareReady ? compareProjectIds : undefined,
  }));

  return (
    <div className="shortlist-surface">
      <PublicSurfaceCard as="section" className="shortlist-surface__summary" tone={compareReady ? 'warm' : 'light'}>
        <div className="shortlist-surface__summary-copy">
          <strong className="shortlist-surface__summary-title">{shortlistSummary.title}</strong>
          <p className="shortlist-surface__summary-body">{shortlistSummary.body}</p>
        </div>

        <div className="shortlist-surface__summary-signals" aria-label={locale === 'th' ? 'สัญญาณของ shortlist ตอนนี้' : 'Current shortlist signals'}>
          {summarySignals.map((signal) => (
            <PublicChip key={signal.label} tone={signal.tone}>{signal.label}</PublicChip>
          ))}
        </div>

        <PublicActionRow className="shortlist-surface__summary-actions" stackOnMobile>
          {isResolvingCompare ? (
            <button type="button" className="btn btn-cta" disabled>
              {locale === 'th' ? 'กำลังเตรียม compare-ready projects…' : 'Preparing compare-ready projects…'}
            </button>
          ) : compareReady ? (
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
        </PublicActionRow>
      </PublicSurfaceCard>

      <section id="shortlist-conversion-pack" className="shortlist-conversion-pack" aria-label={locale === 'th' ? 'ขั้นถัดไปจาก shortlist นี้' : 'Next-step decision layer for this shortlist'}>
        <PublicSectionHeader
          align="start"
          kicker={shortlistConversionPack.kicker}
          title={shortlistConversionPack.title}
          subtitle={shortlistConversionPack.subtitle}
        />

        <div className="signal-grid signal-grid--three-up shortlist-conversion-grid">
          {shortlistConversionPack.cards.map((card) => (
            <PublicSurfaceCard key={card.key} as="section" className={`shortlist-conversion-card shortlist-conversion-card--${card.key}`} tone={card.tone}>
              <div className="shortlist-conversion-card__copy">
                <h4 className="card-title">{card.title}</h4>
                <p className="card-subtitle">{card.body}</p>
              </div>

              <div className="insight-list shortlist-conversion-card__list">
                {card.lines.map((line) => (
                  <div key={line} className="insight-list__item">
                    <span className="insight-list__body">{line}</span>
                  </div>
                ))}
              </div>
            </PublicSurfaceCard>
          ))}
        </div>
      </section>

      <PublicSurfaceCard as="section" className="shortlist-compare-panel" tone={compareReady ? 'warm' : 'light'} aria-live="polite">
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
      </PublicSurfaceCard>

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
