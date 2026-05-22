'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

import type { LocalMediaInput } from '@/app/_lib/local-media';
import { LocalMediaImage } from '@/components/media/LocalMediaImage';
import { PublicChip } from '@/components/public/PublicChip';
import {
  SHORTLIST_UPDATED_EVENT,
  readCachedShortlistForCurrentOwner,
  savePropertyToShortlist,
  removePropertyFromShortlist,
  type ShortlistDetail
} from '@/lib/shortlist';
import { trackEvent } from '@/lib/analytics';

type ProjectCardBadge = {
  key: string;
  label: string;
};

export type ProjectCardProps = {
  href: string;
  name: string;
  locale: 'en' | 'th';
  media: LocalMediaInput;
  fallbackImage: string;
  area?: string | null;
  price?: string | null;
  summary?: string | null;
  badges?: ProjectCardBadge[];
  facts?: string[];
  signals?: string[];
  ctaLabel: string;
  ctaClassName?: string;
  hasLocalMedia?: boolean;
  shouldPreloadMedia?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  quality?: number;
  unoptimized?: boolean;
  prefetch?: false;
  ssrStartWithPrimary?: boolean;
  
  // Sunset Pattaya Luxury Props
  yieldPct?: string | number | null;
  foreignQuota?: string | number | null;
  beachDistance?: string | number | null;
  developerName?: string | null;
  completion?: string | null;
  size?: 'lg' | 'sm';
  propertyId?: string;
};

export function ProjectCard({
  href,
  name,
  locale,
  media,
  fallbackImage,
  area,
  price,
  summary,
  badges = [],
  facts = [],
  signals = [],
  ctaLabel,
  ctaClassName,
  hasLocalMedia = false,
  shouldPreloadMedia = false,
  loading,
  fetchPriority,
  quality,
  unoptimized,
  prefetch = false,
  ssrStartWithPrimary,
  
  // Sunset Pattaya Luxury Props
  yieldPct,
  foreignQuota,
  beachDistance,
  developerName,
  completion,
  size = 'lg',
  propertyId,
}: ProjectCardProps) {
  const pathname = usePathname() ?? '/';
  const [pendingAction, setPendingAction] = useState<'save' | 'remove' | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const syncFromShortlist = useCallback((shortlist: ShortlistDetail | null) => {
    if (!propertyId) return;
    setIsSaved(Boolean(shortlist?.items.some((item) => item.property_id === propertyId)));
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    const cachedShortlist = readCachedShortlistForCurrentOwner();
    if (cachedShortlist) {
      syncFromShortlist(cachedShortlist);
    }
  }, [propertyId, syncFromShortlist]);

  useEffect(() => {
    if (!propertyId) return;
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
  }, [propertyId, syncFromShortlist]);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (pendingAction || !propertyId) return;

    try {
      if (isSaved) {
        setPendingAction('remove');
        trackEvent('click_cta', pathname, {
          source_route: 'home',
          cta_type: 'secondary',
          cta_label: locale === 'th' ? 'นำออกจากรายการคัดไว้' : 'Remove from shortlist',
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
      } else {
        setPendingAction('save');
        trackEvent('shortlist_add', pathname, {
          source_route: 'home',
          cta_type: 'secondary',
          cta_label: locale === 'th' ? 'บันทึกลงรายการคัดไว้' : 'Save to shortlist',
          entity_type: 'property',
          entity_id: propertyId,
          user_intent: 'research',
          context: {
            from_shortlist: true,
            source_surface: 'home_featured',
          },
        });
        const response = await savePropertyToShortlist({
          locale,
          propertyId,
          sourceSurface: 'home_featured',
        });
        syncFromShortlist(response.shortlist);
      }
    } catch (err) {
      console.error('Failed to update shortlist:', err);
    } finally {
      setPendingAction(null);
    }
  };

  const imageLoading = loading ?? (shouldPreloadMedia ? 'eager' : 'lazy');
  const imageFetchPriority = fetchPriority ?? (shouldPreloadMedia ? 'low' : 'auto');
  const imageQuality = quality ?? 60;
  const imageUnoptimized = unoptimized ?? false;
  const imageSsrStart = ssrStartWithPrimary ?? shouldPreloadMedia;

  const showSunsetGrid = yieldPct !== undefined || foreignQuota !== undefined || beachDistance !== undefined;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="premium-project-card reveal card-interactive public-surface-card public-surface-card--interactive public-surface-card--warm"
    >
      <div 
        className="card-image premium-project-card__media overflow-hidden"
        style={{ paddingTop: 0, aspectRatio: size === 'lg' ? '4/3' : '3/2', position: 'relative' }}
      >
        <LocalMediaImage
          media={media}
          alt={name}
          altFallback={locale === 'th' ? `ภาพประกอบโครงการ ${name}` : `Project image for ${name}`}
          className="media-shell"
          imageClassName={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-105 ${hasLocalMedia ? '' : 'premium-project-card__fallback-image'}`}
          fallbackSrc={fallbackImage}
          sizes="(max-width: 767px) 92vw, (max-width: 1279px) 48vw, 31vw"
          loading={imageLoading}
          fetchPriority={imageFetchPriority}
          quality={imageQuality}
          unoptimized={imageUnoptimized}
          ssrStartWithPrimary={imageSsrStart}
        />
        <div className="premium-project-card__media-scrim" aria-hidden="true" />
        
        {badges.length > 0 ? (
          <div className="premium-project-card__badges" aria-label={locale === 'th' ? 'ป้ายกำกับโครงการ' : 'Project badges'}>
            {badges.map((badge) => (
              <PublicChip key={badge.key} as="span" tone="accent" size="sm" className="premium-badge">
                {badge.label}
              </PublicChip>
            ))}
          </div>
        ) : null}

        {propertyId && (
          <button
            onClick={handleHeartClick}
            aria-label={isSaved ? (locale === 'th' ? 'นำออกจากรายการคัดไว้' : 'Remove from shortlist') : (locale === 'th' ? 'บันทึกลงรายการคัดไว้' : 'Save to shortlist')}
            disabled={Boolean(pendingAction)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'rgba(255,255,255,.94)',
              border: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isSaved ? 'var(--color-accent)' : 'var(--color-text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              zIndex: 20,
              transition: 'transform 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
          >
            {isSaved ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            )}
          </button>
        )}

        {area && (
          <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,.6)', zIndex: 10 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{area}</span>
          </div>
        )}
      </div>
      
      <div className="card-content premium-project-card__body">
        <div className="premium-project-card__header">
          <h3 className="card-title premium-project-card__title font-serif font-normal tracking-tight" style={{ fontSize: size === 'lg' ? '24px' : '19px', lineHeight: 1.2 }}>
            {name}
          </h3>
          <p className="premium-project-card__area mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {developerName ? `${developerName}` : ''}
            {developerName && completion ? ' · ' : ''}
            {completion ? `${completion}` : ''}
          </p>
        </div>

        {showSunsetGrid ? (
          <>
            <div className="divider my-3 h-[1px] w-full" style={{ backgroundColor: 'var(--color-stone-strong)' }} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3 text-xs leading-normal">
              <div className="premium-project-card__metric">
                <span className="block text-[9.5px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-0.5">
                  {locale === 'th' ? 'เริ่มต้น' : 'From'}
                </span>
                <span className="font-serif text-lg font-normal tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {price ?? '—'}
                </span>
              </div>
              <div className="premium-project-card__metric">
                <span className="block text-[9.5px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-0.5">
                  {locale === 'th' ? 'ผลตอบแทน' : 'Yield'}
                </span>
                <span className="font-serif text-lg font-normal tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {yieldPct ?? '—'}
                </span>
              </div>
              <div className="premium-project-card__metric">
                <span className="block text-[9.5px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-0.5">
                  {locale === 'th' ? 'โควตาต่างชาติ' : 'Foreign quota'}
                </span>
                <span className="font-serif text-lg font-normal tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {foreignQuota ?? '—'}
                </span>
              </div>
              <div className="premium-project-card__metric">
                <span className="block text-[9.5px] uppercase tracking-[0.14em] font-semibold text-gray-500 mb-0.5">
                  {locale === 'th' ? 'ระยะหาด' : 'Beach'}
                </span>
                <span className="font-serif text-lg font-normal tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {beachDistance ?? '—'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {price ? (
              <div className="premium-project-card__price-row">
                <span className="premium-project-card__price-label">{locale === 'th' ? 'เริ่มต้น' : 'From'}</span>
                <span className="premium-project-card__price-value">{price}</span>
              </div>
            ) : null}

            {signals.length > 0 ? (
              <div className="premium-project-card__signals" aria-label={locale === 'th' ? 'สัญญาณการตัดสินใจของโครงการ' : 'Project decision cues'}>
                {signals.map((signal) => (
                  <PublicChip key={signal} as="span" size="sm" className="premium-project-card__signal">
                    {signal}
                  </PublicChip>
                ))}
              </div>
            ) : null}

            {summary ? (
              <p className="premium-project-card__summary line-clamp-2">
                {summary}
              </p>
            ) : null}

            {facts.length > 0 ? (
              <ul className="premium-project-card__facts" aria-label={locale === 'th' ? 'ข้อเท็จจริงของโครงการ' : 'Project facts'}>
                {facts.map((fact) => (
                  <li key={fact} className="premium-project-card__fact-item">
                    <span className="premium-project-card__fact-value text-left">{fact}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
        
        <div className="premium-project-card__footer">
          <span className={ctaClassName ?? 'premium-project-card__cta'}>
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
