'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

import { withLocale } from '@/app/_lib/i18n/routing';
import { trackEvent } from '@/lib/analytics';
import { fetchCurrentShortlist, savePropertyToShortlist } from '@/lib/shortlist';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readOnMount) return;

    let isActive = true;
    fetchCurrentShortlist(locale)
      .then((response) => {
        if (!isActive) return;
        const shortlist = response.shortlist;
        setItemCount(shortlist?.item_count ?? 0);
        setIsSaved(Boolean(shortlist?.items.some((item) => item.property_id === propertyId)));
      })
      .catch(() => {
        if (!isActive) return;
        setError(locale === 'th' ? 'ยังโหลด shortlist ไม่สำเร็จ' : 'Unable to load shortlist yet.');
      });

    return () => {
      isActive = false;
    };
  }, [locale, propertyId, readOnMount]);

  const label = useMemo(() => {
    if (isSaving) return locale === 'th' ? 'กำลังบันทึก…' : 'Saving…';
    if (isSaved) {
      if (typeof itemCount === 'number' && itemCount > 0) {
        return locale === 'th' ? `บันทึกแล้ว (${itemCount})` : `Saved (${itemCount})`;
      }
      return locale === 'th' ? 'บันทึกแล้ว' : 'Saved';
    }
    return locale === 'th' ? 'บันทึกลง shortlist' : 'Save to shortlist';
  }, [isSaved, isSaving, itemCount, locale]);

  async function handleClick() {
    if (isSaving || isSaved) return;

    setIsSaving(true);
    setError(null);
    trackEvent('cta_click', pathname, {
      cta: 'save_to_shortlist',
      from: sourceSurface,
      property_id: propertyId,
    });

    try {
      const response = await savePropertyToShortlist({
        locale,
        propertyId,
        sourceSurface,
      });
      setIsSaved(response.action === 'saved' || response.action === 'already_saved');
      setItemCount(response.shortlist?.item_count ?? itemCount ?? 0);
    } catch {
      setError(locale === 'th' ? 'บันทึก shortlist ไม่สำเร็จ' : 'Unable to save to shortlist.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleClick} disabled={isSaving || isSaved}>
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