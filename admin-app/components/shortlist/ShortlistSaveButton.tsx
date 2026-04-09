'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { withLocale } from '@/app/_lib/i18n/routing';
import { trackEvent } from '@/lib/analytics';
import { SHORTLIST_UPDATED_EVENT, fetchCurrentShortlist, publishShortlist, readCachedShortlistForCurrentOwner, removePropertyFromShortlist, savePropertyToShortlist, type ShortlistDetail } from '@/lib/shortlist';

type ShortlistSaveButtonProps = {
  locale: 'en' | 'th';
  propertyId: string;
  sourceSurface: string;
  className?: string;
  readOnMount?: boolean;
};

export function ShortlistSaveButton({
  locale,
  propertyId,
  sourceSurface,
  className = 'btn btn-secondary',
  readOnMount = false,
}: ShortlistSaveButtonProps) {
  const pathname = usePathname() ?? '/';
  const [pendingAction, setPendingAction] = useState<'save' | 'remove' | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retryLabel = locale === 'th' ? 'ลองอีกครั้ง' : 'Try again';

  function buildShortlistErrorMessage(action: 'save' | 'remove', cause: unknown): string {
    const fallback =
      locale === 'th'
        ? action === 'remove'
          ? 'ตรวจสอบการเชื่อมต่อแล้วลองนำออกจาก shortlist อีกครั้ง'
          : 'ตรวจสอบการเชื่อมต่อแล้วลองบันทึก shortlist อีกครั้ง'
        : action === 'remove'
          ? 'Check your connection and try removing this item again.'
          : 'Check your connection and try saving this item again.';

    if (!(cause instanceof Error)) {
      return fallback;
    }

    const statusMatch = cause.message.match(/\((\d{3})\)/);
    const statusCode = statusMatch ? Number(statusMatch[1]) : null;

    if (statusCode && statusCode >= 500) {
      return locale === 'th'
        ? 'ระบบ shortlist ใช้งานไม่ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง'
        : 'Shortlist is temporarily unavailable. Please try again.';
    }

    if (statusCode && statusCode >= 400) {
      return locale === 'th'
        ? 'ข้อมูล shortlist เปลี่ยนไประหว่างทำรายการ กรุณาลองใหม่อีกครั้ง'
        : 'Your shortlist changed before we could update it. Please try again.';
    }

    return fallback;
  }

  const syncFromShortlist = useCallback((shortlist: ShortlistDetail | null) => {
    setItemCount(shortlist?.item_count ?? 0);
    setIsSaved(Boolean(shortlist?.items.some((item) => item.property_id === propertyId)));
  }, [propertyId]);

  useEffect(() => {
    const cachedShortlist = readCachedShortlistForCurrentOwner();
    if (cachedShortlist) {
      syncFromShortlist(cachedShortlist);
    }

    if (!readOnMount) return;

    let isActive = true;
    fetchCurrentShortlist(locale, { publish: false })
      .then((response) => {
        if (!isActive) return;
        publishShortlist(response.shortlist ?? null, 'fetch');
        syncFromShortlist(response.shortlist);
      })
      .catch(() => {
        if (!isActive) return;
        setError(locale === 'th' ? 'ยังโหลด shortlist ไม่สำเร็จ' : 'Unable to load shortlist yet.');
      });

    return () => {
      isActive = false;
    };
  }, [locale, readOnMount, syncFromShortlist]);

  useEffect(() => {
    const w = window;
    const handleUpdate = (event: Event) => {
      const shortlist = (event as CustomEvent<ShortlistDetail | null>).detail;
      syncFromShortlist(shortlist);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== w.localStorage) {
        return;
      }

      if (event.key !== 'amp_shortlist_cache_v1' && event.key !== 'amp_shortlist_owner_v1' && event.key !== null) {
        return;
      }

      syncFromShortlist(readCachedShortlistForCurrentOwner());
    };

    w.addEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
    w.addEventListener('storage', handleStorage);
    return () => {
      w.removeEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
      w.removeEventListener('storage', handleStorage);
    };
  }, [syncFromShortlist]);

  const label = useMemo(() => {
    if (pendingAction === 'save') return locale === 'th' ? 'กำลังบันทึก…' : 'Saving…';
    if (pendingAction === 'remove') return locale === 'th' ? 'กำลังนำออก…' : 'Removing…';
    if (isSaved) {
      return locale === 'th' ? 'นำออกจาก shortlist' : 'Remove from shortlist';
    }
    return locale === 'th' ? 'บันทึกลง shortlist' : 'Save to shortlist';
  }, [isSaved, locale, pendingAction]);

  async function handleClick() {
    if (pendingAction) return;

    setError(null);

    try {
      if (isSaved) {
        setPendingAction('remove');
        trackEvent('click_cta', pathname, {
          source_route: sourceSurface === 'property_detail' ? 'property' : 'shared',
          cta_type: 'secondary',
          cta_label: locale === 'th' ? 'นำออกจาก shortlist' : 'Remove from shortlist',
          entity_type: 'property',
          entity_id: propertyId,
          user_intent: 'research',
          context: {
            from_shortlist: true,
          },
        });
        const response = await removePropertyFromShortlist({
          locale,
          propertyId,
        });
        syncFromShortlist(response.shortlist);
        if (response.action === 'not_found') {
          setIsSaved(false);
        }
      } else {
        setPendingAction('save');
        trackEvent('shortlist_add', pathname, {
          source_route: sourceSurface === 'property_detail' ? 'property' : 'shared',
          cta_type: 'secondary',
          cta_label: locale === 'th' ? 'บันทึกลง shortlist' : 'Save to shortlist',
          entity_type: 'property',
          entity_id: propertyId,
          user_intent: 'research',
          context: {
            from_shortlist: true,
            source_surface: sourceSurface,
          },
        });
        const response = await savePropertyToShortlist({
          locale,
          propertyId,
          sourceSurface,
        });
        syncFromShortlist(response.shortlist);
      }
    } catch (cause) {
      setError(buildShortlistErrorMessage(isSaved ? 'remove' : 'save', cause));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={Boolean(pendingAction)}>
        {label}
      </button>
      {typeof itemCount === 'number' && itemCount > 0 ? (
        <div>
          <Link className="shortlist-inline-link" href={withLocale(locale, '/shortlist')}>
            {locale === 'th' ? `ดู shortlist (${itemCount})` : `View shortlist (${itemCount})`}
          </Link>
        </div>
      ) : null}
      {error ? (
        <div className="guided-dialog__step mt-2" role="alert">
          <p>{error}</p>
          <button type="button" className="shortlist-inline-link mt-2" onClick={handleClick}>
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
