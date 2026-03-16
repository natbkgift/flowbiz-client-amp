'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { withLocale } from '@/app/_lib/i18n/routing';
import { trackEvent } from '@/lib/analytics';
import { SHORTLIST_UPDATED_EVENT, fetchCurrentShortlist, readCachedShortlistForCurrentOwner, removePropertyFromShortlist, savePropertyToShortlist, type ShortlistDetail } from '@/lib/shortlist';

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
    fetchCurrentShortlist(locale)
      .then((response) => {
        if (!isActive) return;
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

    w.addEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
    return () => {
      w.removeEventListener(SHORTLIST_UPDATED_EVENT, handleUpdate);
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
        trackEvent('cta_click', pathname, {
          cta: 'remove_from_shortlist',
          from: sourceSurface,
          property_id: propertyId,
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
        trackEvent('cta_click', pathname, {
          cta: 'save_to_shortlist',
          from: sourceSurface,
          property_id: propertyId,
        });
        const response = await savePropertyToShortlist({
          locale,
          propertyId,
          sourceSurface,
        });
        syncFromShortlist(response.shortlist);
      }
    } catch {
      setError(
        isSaved
          ? (locale === 'th' ? 'นำ shortlist ออกไม่สำเร็จ' : 'Unable to remove from shortlist.')
          : (locale === 'th' ? 'บันทึก shortlist ไม่สำเร็จ' : 'Unable to save to shortlist.'),
      );
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
      {error ? <p className="guided-dialog__step mt-2">{error}</p> : null}
    </div>
  );
}