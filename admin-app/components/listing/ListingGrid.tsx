'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { PropertyListItem } from '../../app/public/_shared/types';
import { TrackedLink } from '../analytics/TrackedLink';
import { PropertyCard } from '../cards/PropertyCard';
import { SidebarFilter } from './SidebarFilter';
import { IconFilter } from '../icons/SvgIcons';
import { withLocaleQuery } from '../../app/_lib/public-advisory';
import { en } from '../../app/_lib/i18n/en';
import { th } from '../../app/_lib/i18n/th';
import { localeFromPathname, withLocale } from '../../app/_lib/i18n/routing';
import { ShortlistStateHydrator } from '../shortlist/ShortlistStateHydrator';
import { PublicActionRow } from '../public/PublicActionRow';
import { PublicChip } from '../public/PublicChip';
import { PublicSurfaceCard } from '../public/PublicSurfaceCard';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

export function ListingGrid({ items }: { items: PropertyListItem[] }) {
  const [filtered, setFiltered] = useState<PropertyListItem[]>(items);
  const [sort, setSort] = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [activeFilterSummary, setActiveFilterSummary] = useState<string[]>([]);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const wasFiltersOpenRef = useRef(false);

  const pathname = usePathname() ?? '/';
  const locale = localeFromPathname(pathname);
  const dict = locale === 'th' ? th : en;

  const handleFilterApply = useCallback((next: PropertyListItem[], count: number, summary: string[]) => {
    setFiltered(next);
    setActiveFilterCount(count);
    setActiveFilterSummary(summary);
  }, []);

  useEffect(() => {
    if (wasFiltersOpenRef.current && !filtersOpen) {
      filterTriggerRef.current?.focus();
    }

    wasFiltersOpenRef.current = filtersOpen;
  }, [filtersOpen]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    if (sort === 'price_asc') out.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') out.sort((a, b) => Number(b.price) - Number(a.price));
    return out;
  }, [filtered, sort]);
  const listingRoute = pathname.includes('/rent') ? 'rent' : 'buy';
  const listingBaseHref = withLocale(locale, listingRoute === 'rent' ? '/rent' : '/buy');
  const sortLabel = sort === 'newest'
    ? dict.listing.newest
    : sort === 'price_asc'
      ? dict.listing.priceLowToHigh
      : dict.listing.priceHighToLow;
  const headerSummaryChips = [
    locale === 'th' ? `จัดเรียง: ${sortLabel}` : `Sort: ${sortLabel}`,
    ...activeFilterSummary,
  ];
  const filterTriggerMeta = activeFilterSummary.length
    ? `${activeFilterSummary.join(' • ')} • ${sortLabel}`
    : locale === 'th'
      ? `ยังไม่ได้ใช้ตัวกรอง • ${sortLabel}`
      : `No filters applied • ${sortLabel}`;
  const broadResultsPromptVisible = sorted.length >= 6 && activeFilterCount < 2;
  const noResultsPromptVisible = sorted.length === 0;
  const smartFinderPrompt = noResultsPromptVisible
    ? {
        variant: 'empty' as const,
        kicker: locale === 'th' ? 'ช่วงที่ยังลังเล' : 'Undecided moment',
        title: locale === 'th' ? 'ตัวกรองชุดนี้ยังไม่เหลือตัวเลือกที่พร้อมให้ตัดสินใจต่อ' : 'This filter set is not leaving you with a decision-ready listing',
        body: locale === 'th'
          ? 'ถ้าเงื่อนไขเริ่มแคบเกินไป ให้ใช้ตัวช่วยคัดตัวเลือกช่วยจัดโจทย์ใหม่ก่อน แล้วค่อยกลับมาดูรายการอีกครั้ง'
          : 'If the brief has become too narrow, use Smart Finder to reframe the intent before you come back to the live inventory.',
        lines: [
          locale === 'th'
            ? 'ตัวช่วยคัดตัวเลือกเหมาะเมื่อคุณยังไม่มั่นใจเรื่องงบ เวลา หรือรูปแบบการใช้งานหลักของทรัพย์ที่ต้องการ'
            : 'Smart Finder works best when budget, timing, or primary use case is still uncertain.',
          locale === 'th'
            ? 'ถ้าต้องการกลับไปดูคลังเดิม ให้รีเซ็ตกลับสู่หน้ารายการหลักของเส้นทางนี้'
            : 'If you want the live catalogue back, reset to the base listing route for this path.',
        ],
        primaryHref: withLocaleQuery(locale, '/smart-finder', {
          source: 'listing_no_results',
          listing_route: listingRoute,
          results: String(sorted.length),
          active_filters: String(activeFilterCount),
        }),
        primaryLabel: dict.advisory.useSmartFinder,
        secondaryHref: listingBaseHref,
        secondaryLabel: locale === 'th' ? 'รีเซ็ตกลับสู่รายการทั้งหมด' : 'Reset to the full listing set',
      }
    : broadResultsPromptVisible
      ? {
          variant: 'broad' as const,
          kicker: locale === 'th' ? 'จุดที่ควรบีบโจทย์ให้ชัด' : 'Recommendation prompt',
          title: locale === 'th' ? 'ผลลัพธ์ยังกว้างเกินไปสำหรับการเปิดดูทีละการ์ดแบบสุ่ม' : 'The result set is still too broad to keep opening cards at random',
          body: locale === 'th'
            ? 'ถ้ายังแยกไม่ออกว่าควรเริ่มจากยูนิตแบบไหน ให้ใช้ตัวช่วยคัดตัวเลือกช่วยบีบโจทย์ก่อน แล้วค่อยกลับมาสแกนการ์ดที่เหลือ'
            : 'If you still cannot tell which unit profile deserves the next click, let Smart Finder compress the brief first and then come back to scan the remaining cards.',
          lines: [
            locale === 'th'
              ? 'ใช้ตัวช่วยคัดตัวเลือกเมื่อชุดผลลัพธ์ยังดู “พอได้หลายตัว” มากกว่าจะมีตัวเต็งที่ชัดจริง'
              : 'Use Smart Finder when the live set still feels vaguely right across too many options.',
            locale === 'th'
              ? 'กลับมาที่หน้ารายการนี้เมื่อโจทย์แคบพอสำหรับเทียบข้อได้เปรียบและข้อแลกเปลี่ยนระดับยูนิต'
              : 'Come back to this listing shell once the brief is narrow enough for real unit-level tradeoffs.',
          ],
          primaryHref: withLocaleQuery(locale, '/smart-finder', {
            source: 'listing_broad_results',
            listing_route: listingRoute,
            results: String(sorted.length),
            active_filters: String(activeFilterCount),
          }),
          primaryLabel: dict.advisory.useSmartFinder,
          secondaryHref: withLocale(locale, '/projects'),
          secondaryLabel: locale === 'th' ? 'ดูโครงการที่เผยแพร่แล้ว' : 'Browse published projects',
        }
      : null;

  return (
    <>
      <ShortlistStateHydrator locale={locale} />

      <button
        ref={filterTriggerRef}
        type="button"
        className="listing-filter-trigger mobile-only mb-6"
        onClick={() => setFiltersOpen(true)}
        aria-controls="buy-filter-drawer"
        aria-expanded={filtersOpen}
      >
        <span className="listing-filter-trigger__label">
          <IconFilter size="sm" /> {dict.listing.filtersAndSort}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </span>
        <span className="listing-filter-trigger__meta">{filterTriggerMeta}</span>
      </button>

      <div className="listing-layout">
        <SidebarFilter
          items={items}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onApply={handleFilterApply}
        />

        <div>
          <div className="results-header">
            <div className="results-header__intro">
              <div className="results-count">{sorted.length} {dict.listing.results}</div>
              <p className="results-header__note">
                {locale === 'th'
                  ? 'สแกนการ์ดก่อน เปิดรายละเอียดเมื่อยูนิตนั้นผ่านการคัดรอบแรกแล้วค่อยบันทึกไว้'
                  : 'Scan the cards first. Open details when a unit survives the first pass, then save it to the shortlist.'}
              </p>
              <div className="results-header__summary" aria-label={locale === 'th' ? 'สรุปผลลัพธ์ปัจจุบัน' : 'Current result summary'}>
                <div className="results-header__summary-chips">
                  {headerSummaryChips.map((chip) => (
                    <PublicChip key={chip} className="results-header__summary-chip" size="sm">
                      {chip}
                    </PublicChip>
                  ))}
                </div>
              </div>
            </div>
            <div className="results-header__controls pattern-inline-controls">
              <label className="form-label form-label--compact">{dict.listing.sort}</label>
              <select
                className="form-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="newest">{dict.listing.newest}</option>
                <option value="price_asc">{dict.listing.priceLowToHigh}</option>
                <option value="price_desc">{dict.listing.priceHighToLow}</option>
              </select>
            </div>
          </div>

          {smartFinderPrompt ? (
            <PublicSurfaceCard
              as="section"
              tone={smartFinderPrompt.variant === 'empty' ? 'deep' : 'warm'}
              className={`listing-guidance-card listing-guidance-card--${smartFinderPrompt.variant}`}
            >
              <div className="listing-guidance-card__copy">
                <p className="listing-guidance-card__kicker type-label">{smartFinderPrompt.kicker}</p>
                <h2 className="listing-guidance-card__title type-h3">{smartFinderPrompt.title}</h2>
                <p className="listing-guidance-card__body type-body">{smartFinderPrompt.body}</p>
              </div>

              <div className="insight-list listing-guidance-card__list" aria-label={locale === 'th' ? 'คำแนะนำถัดไป' : 'Next recommendation'}>
                {smartFinderPrompt.lines.map((line) => (
                  <div key={line} className="insight-list__item">
                    <span className="insight-list__body">{line}</span>
                  </div>
                ))}
              </div>

              <PublicActionRow className="listing-guidance-card__actions" stackOnMobile>
                <TrackedLink
                  className="btn btn-primary"
                  href={smartFinderPrompt.primaryHref}
                  eventType="cta_click"
                  eventPayload={{
                    source_route: listingRoute,
                    cta_type: 'primary',
                    cta_label: smartFinderPrompt.primaryLabel,
                    entity_type: 'route',
                    entity_name: 'smart-finder',
                    user_intent: 'research',
                    context: {
                      prompt_variant: smartFinderPrompt.variant,
                      results: sorted.length,
                      active_filters: activeFilterCount,
                      sort,
                    },
                  }}
                >
                  {smartFinderPrompt.primaryLabel}
                </TrackedLink>

                {smartFinderPrompt.variant === 'empty' ? (
                  <Link className="btn btn-secondary" href={smartFinderPrompt.secondaryHref}>
                    {smartFinderPrompt.secondaryLabel}
                  </Link>
                ) : (
                  <TrackedLink
                    className="btn btn-secondary"
                    href={smartFinderPrompt.secondaryHref}
                    eventType="cta_click"
                    eventPayload={{
                      source_route: listingRoute,
                      cta_type: 'secondary',
                      cta_label: smartFinderPrompt.secondaryLabel,
                      entity_type: 'route',
                      entity_name: 'projects',
                      user_intent: 'research',
                      context: {
                        prompt_variant: smartFinderPrompt.variant,
                        results: sorted.length,
                        active_filters: activeFilterCount,
                        sort,
                      },
                    }}
                  >
                    {smartFinderPrompt.secondaryLabel}
                  </TrackedLink>
                )}
              </PublicActionRow>
            </PublicSurfaceCard>
          ) : null}

          {sorted.length ? (
            <div className="grid grid-3" role="list" aria-label={dict.listing.results}>
              {sorted.map((p) => (
                <PropertyCard key={p.id} item={p} dict={dict} locale={locale} />
              ))}
            </div>
          ) : (
            <p>{dict.listing.noProperties}</p>
          )}
        </div>
      </div>
    </>
  );
}
