'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProjectCard } from '@/components/project/ProjectCard';
import { withLocale } from '@/app/_lib/i18n/routing';
import { withLocaleQuery } from '@/app/_lib/public-advisory';

// Basic Type matching ProjectItem in public-api-server
export interface ProjectItem {
  id: string;
  slug: string;
  name: string;
  starting_price?: number | null;
  status?: string | null;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  images?: string[] | null;
  area_name?: string | null;
  area?: any;
  district?: string | null;
  city?: string | null;
  summary?: any;
  description?: any;
  property_type?: string | null;
  delivery_date?: string | null;
  handover_date?: string | null;
  developer?: any;
  developer_name?: string | null;
  completion_date?: string | null;
  completion?: string | null;
  gross_yield?: number | null;
  foreign_quota?: number | null;
  quota_pct?: number | null;
  beach_distance?: number | null;
  location?: any;
  investment_snapshot?: any;
}

interface ProjectsListingClientProps {
  initialProjects: ProjectItem[];
  locale: 'en' | 'th';
  dict: any;
  copy: any;
}

// Map Area names to percentage coordinates on the Pattaya coastline map
const AREA_COORDINATES: Record<string, { x: number; y: number }> = {
  'wongamat': { x: 68, y: 22 },
  'wong amat': { x: 68, y: 22 },
  'pratumnak': { x: 58, y: 48 },
  'pratumnak hill': { x: 58, y: 48 },
  'pratamnak': { x: 58, y: 48 },
  'central pattaya': { x: 64, y: 34 },
  'jomtien': { x: 50, y: 70 },
  'na jomtien': { x: 42, y: 85 },
  'bang saray': { x: 25, y: 92 },
  'default': { x: 60, y: 50 },
};

function getProjectCoords(project: ProjectItem, index: number): { x: number; y: number } {
  const directArea = String(project.area_name ?? '').trim().toLowerCase();
  const nestedArea = project.area?.name ? String(project.area.name).trim().toLowerCase() : '';
  const city = String(project.city ?? '').trim().toLowerCase();
  
  let coords = AREA_COORDINATES.default;
  
  for (const key of Object.keys(AREA_COORDINATES)) {
    if (directArea.includes(key) || nestedArea.includes(key) || city.includes(key)) {
      coords = AREA_COORDINATES[key];
      break;
    }
  }
  
  // Add a slight deterministic offset based on the name/index to prevent pins from completely overlapping
  const offsetIndex = index % 5;
  const offsetX = (offsetIndex - 2) * 1.8;
  const offsetY = ((index % 3) - 1) * 1.5;
  
  return {
    x: Math.min(95, Math.max(5, coords.x + offsetX)),
    y: Math.min(95, Math.max(5, coords.y + offsetY)),
  };
}

export function ProjectsListingClient({ initialProjects, locale, dict, copy }: ProjectsListingClientProps) {
  const pathname = usePathname() ?? '/';
  
  // UI states
  const [view, setView] = useState<'split' | 'grid' | 'map'>('split');
  const [sort, setSort] = useState<string>('relevance');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    areas: [] as string[],
    status: [] as string[],
    bedrooms: [] as string[],
    priceMax: 60, // in Millions THB
    beach: 'any' as 'any' | 'front' | '100' | '500',
    foreignQuota: false,
  });
  
  // Compare State
  const [compareList, setCompareList] = useState<string[]>([]);

  // Setup options derived from projects data
  const availableAreas = useMemo(() => {
    const areasSet = new Set<string>();
    initialProjects.forEach(p => {
      const area = p.area_name || p.area?.name || p.district || p.city;
      if (area) areasSet.add(area);
    });
    return Array.from(areasSet).sort();
  }, [initialProjects]);

  // Handle updates to filters
  const toggleArea = (area: string) => {
    setFilters(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area],
    }));
  };

  const toggleStatus = (statusKey: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(statusKey)
        ? prev.status.filter(s => s !== statusKey)
        : [...prev.status, statusKey],
    }));
  };

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) {
        alert(locale === 'th' ? 'สามารถเปรียบเทียบได้สูงสุด 4 โครงการ' : 'You can compare up to 4 projects.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const resetFilters = () => {
    setFilters({
      areas: [],
      status: [],
      bedrooms: [],
      priceMax: 60,
      beach: 'any',
      foreignQuota: false,
    });
  };

  // Helper for pricing format
  const formatCompactPrice = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—';
    if (locale === 'th') {
      if (value >= 1_000_000) {
        const millionValue = value / 1_000_000;
        const decimals = millionValue >= 10 || Math.round(millionValue * 10) % 10 === 0 ? 0 : 1;
        return `${millionValue.toLocaleString('th-TH', {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        })} ล้านบาท`;
      }
      return `${Math.round(value).toLocaleString('th-TH')} บาท`;
    }
    return `THB ${(value / 1_000_000).toFixed(1)}M`;
  };

  // Apply filters and sort
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...initialProjects];

    // 1. Area Filter
    if (filters.areas.length > 0) {
      result = result.filter(p => {
        const area = p.area_name || p.area?.name || p.district || p.city || '';
        return filters.areas.includes(area);
      });
    }

    // 2. Status Filter
    if (filters.status.length > 0) {
      result = result.filter(p => {
        const status = p.status ? p.status.toLowerCase() : '';
        return filters.status.some(fs => status.includes(fs.toLowerCase()));
      });
    }

    // 3. Price Filter (priceMax is in Millions)
    result = result.filter(p => {
      const price = p.starting_price ?? 0;
      if (price === 0) return true; // keep unspecified prices
      return price <= filters.priceMax * 1_000_000;
    });

    // 4. Beach Distance Filter
    if (filters.beach !== 'any') {
      result = result.filter(p => {
        const distVal = p.location?.walk_to_beach ?? p.beach_distance ?? p.location?.beach_access;
        if (distVal === undefined || distVal === null) return false;
        
        const dist = typeof distVal === 'string' && distVal.toLowerCase() === 'beachfront' ? 0 : Number(distVal);
        if (Number.isNaN(dist)) return false;

        if (filters.beach === 'front') return dist === 0;
        if (filters.beach === '100') return dist <= 100;
        if (filters.beach === '500') return dist <= 500;
        return true;
      });
    }

    // 5. Foreign Quota Filter
    if (filters.foreignQuota) {
      result = result.filter(p => {
        const quotaVal = p.investment_snapshot?.foreign_quota ?? p.foreign_quota ?? p.quota_pct;
        if (quotaVal === undefined || quotaVal === null) return false;
        return Number(quotaVal) > 0;
      });
    }

    // Sort operations
    if (sort === 'price-asc') {
      result.sort((a, b) => (a.starting_price ?? 0) - (b.starting_price ?? 0));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (b.starting_price ?? 0) - (a.starting_price ?? 0));
    } else if (sort === 'yield') {
      result.sort((a, b) => {
        const yA = a.investment_snapshot?.gross_yield ?? a.gross_yield ?? 0;
        const yB = b.investment_snapshot?.gross_yield ?? b.gross_yield ?? 0;
        return yB - yA;
      });
    } else if (sort === 'completion') {
      result.sort((a, b) => {
        const cA = a.completion_date ?? a.delivery_date ?? a.completion ?? '9999';
        const cB = b.completion_date ?? b.delivery_date ?? b.completion ?? '9999';
        return cA.localeCompare(cB);
      });
    } else {
      // Relevance / Alphabetical
      result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }

    return result;
  }, [initialProjects, filters, sort]);

  const mapProjects = useMemo(() => {
    return filteredAndSortedProjects.map((p, idx) => ({
      ...p,
      coords: getProjectCoords(p, idx),
    }));
  }, [filteredAndSortedProjects]);

  return (
    <div className="w-full flex flex-col" style={{ background: 'var(--public-color-bone, #f8f4ea)' }}>
      {/* ── Toolbar / Header Strip ── */}
      <div 
        className="w-full border-b border-[var(--public-color-line-soft, #efe6d2)] py-8 px-6 md:px-10"
        style={{ background: 'var(--public-color-paper-warm, #fdfaf2)' }}
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
          <div>
            <span 
              className="text-[10px] md:text-xs font-mono uppercase tracking-[0.18em] font-semibold"
              style={{ color: 'var(--public-color-teal, #0e3a3a)' }}
            >
              {locale === 'th' ? 'โครงการ · เปิดใหม่ & พรีเซลล์' : 'Projects · New & off-plan'}
            </span>
            <h2 className="font-serif font-normal text-3xl md:text-4xl lg:text-5xl mt-2 tracking-tight leading-tight">
              {locale === 'th' ? (
                <>พบ {filteredAndSortedProjects.length} โครงการใน <em className="italic text-[var(--public-color-coral, #d96a4e)]">พัทยา</em></>
              ) : (
                <>{filteredAndSortedProjects.length} projects across <em className="italic text-[var(--public-color-coral, #d96a4e)]">Pattaya</em></>
              )}
            </h2>
            <div className="mt-2.5">
              <Link
                href={withLocale(locale, '/buy')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--public-color-teal,#0e3a3a)] hover:text-[var(--public-color-coral,#d96a4e)] transition-colors group"
              >
                <span>{copy.browseListingsLabel || 'Browse shortlist-ready listings'}</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
          
          {/* View Toggler and Sorting */}
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Toggle Segment */}
            <div className="inline-flex rounded-full p-1 bg-black/[0.04] dark:bg-white/[0.04] text-xs font-medium border border-black/[0.02]">
              {(['grid', 'split', 'map'] as const).map((v) => {
                const active = view === v;
                const label = v === 'grid' ? (locale === 'th' ? 'ตาราง' : 'Grid') : v === 'split' ? (locale === 'th' ? 'สองฝั่ง' : 'Split') : (locale === 'th' ? 'แผนที่' : 'Map');
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 rounded-full transition-all duration-300 ${
                      active
                        ? 'bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)] shadow-sm'
                        : 'text-[var(--public-color-ink, #14201f)]/70 hover:text-[var(--public-color-ink, #14201f)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Sorting Dropdown */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 text-xs font-semibold rounded-full border border-[var(--public-color-line-soft, #efe6d2)] outline-none cursor-pointer bg-white transition-all duration-300 hover:bg-[var(--public-color-sand-soft, #f3ead9)] text-[var(--public-color-ink, #14201f)]"
            >
              <option value="relevance">{locale === 'th' ? 'จัดเรียง: แนะนำสำหรับคุณ' : 'Sort: Most relevant'}</option>
              <option value="price-asc">{locale === 'th' ? 'ราคา: ต่ำไปสูง' : 'Price · low to high'}</option>
              <option value="price-desc">{locale === 'th' ? 'ราคา: สูงไปต่ำ' : 'Price · high to low'}</option>
              <option value="yield">{locale === 'th' ? 'ผลตอบแทนเช่า: สูงสุด' : 'Yield · highest'}</option>
              <option value="completion">{locale === 'th' ? 'สร้างเสร็จเร็วๆ นี้' : 'Soonest completion'}</option>
            </select>
          </div>
        </div>

        {/* Inline filter chips summary */}
        <div className="flex flex-wrap gap-2 items-center text-xs mt-4">
          <span 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold border border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)]"
            style={{ background: 'var(--public-color-sand-soft, #efe6d2)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>{locale === 'th' ? 'ตัวกรอง' : 'Filters'}</span>
          </span>
          
          {filters.areas.map(a => (
            <button key={a} onClick={() => toggleArea(a)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--public-color-teal, #0e3a3a)] bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)] hover:bg-opacity-90">
              <span>{a}</span>
              <span>×</span>
            </button>
          ))}
          {filters.status.map(s => {
            const label = s === 'new_launch' ? (locale === 'th' ? 'เปิดใหม่' : 'New launch') : s === 'under_construction' ? (locale === 'th' ? 'กำลังก่อสร้าง' : 'Under construction') : (locale === 'th' ? 'พร้อมอยู่' : 'Ready');
            return (
              <button key={s} onClick={() => toggleStatus(s)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--public-color-teal, #0e3a3a)] bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)] hover:bg-opacity-90">
                <span>{label}</span>
                <span>×</span>
              </button>
            );
          })}
          {filters.priceMax < 60 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--public-color-teal, #0e3a3a)] bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)]">
              <span>{locale === 'th' ? `สูงสุด ฿${filters.priceMax}ล้าน` : `Max ฿${filters.priceMax}M`}</span>
            </span>
          )}
          {filters.beach !== 'any' && (
            <button onClick={() => setFilters(f => ({ ...f, beach: 'any' }))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--public-color-teal, #0e3a3a)] bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)]">
              <span>{filters.beach === 'front' ? (locale === 'th' ? 'ติดทะเล' : 'Beachfront') : filters.beach === '100' ? '< 100m' : '< 500m'}</span>
              <span>×</span>
            </button>
          )}
          {filters.foreignQuota && (
            <button onClick={() => setFilters(f => ({ ...f, foreignQuota: false }))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--public-color-teal, #0e3a3a)] bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)]">
              <span>{locale === 'th' ? 'โควต้าต่างชาติ' : 'Foreign quota'}</span>
              <span>×</span>
            </button>
          )}

          {compareList.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-medium bg-black text-white text-[10px] md:ml-auto">
              {locale === 'th' ? `เลือกเปรียบเทียบ ${compareList.length} โครงการ` : `${compareList.length} projects to compare`}
            </span>
          )}
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div 
        className="w-full grid"
        style={{ 
          gridTemplateColumns: view === 'grid' 
            ? '280px 1fr' 
            : view === 'map' 
              ? '280px 1fr' 
              : '280px 1.1fr 1.3fr',
          gap: 0 
        }}
      >
        {/* Sidebar Filters */}
        <aside 
          className="p-6 md:p-8 sticky border-r border-[var(--public-color-line-soft, #efe6d2)] flex flex-col gap-6"
          style={{ top: '80px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}
        >
          {/* Price max slider */}
          <div className="border-b border-[var(--public-color-line-soft, #efe6d2)] pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--public-color-ink, #14201f)]">
              {locale === 'th' ? 'ช่วงราคาเริ่มต้น (ล้านบาท)' : 'Starting Price (THB)'}
            </h3>
            <div className="flex justify-between items-center mb-2 text-xs font-mono text-[var(--public-color-ink, #14201f)]/70">
              <span>0M</span>
              <span className="font-semibold text-[var(--public-color-teal, #0e3a3a)]">฿{filters.priceMax}M+</span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              value={filters.priceMax}
              onChange={(e) => setFilters(f => ({ ...f, priceMax: +e.target.value }))}
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--public-color-teal, #0e3a3a)' }}
            />
          </div>

          {/* Area check rows */}
          <div className="border-b border-[var(--public-color-line-soft, #efe6d2)] pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--public-color-ink, #14201f)]">
              {locale === 'th' ? 'เลือกย่าน / พื้นที่' : 'Area / Location'}
            </h3>
            <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-2">
              {availableAreas.map(areaName => {
                const count = initialProjects.filter(p => (p.area_name || p.area?.name || p.district || p.city) === areaName).length;
                const active = filters.areas.includes(areaName);
                return (
                  <label key={areaName} className="flex items-center justify-between text-xs cursor-pointer text-[var(--public-color-ink, #14201f)]">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleArea(areaName)}
                        className="rounded border-[var(--public-color-line-soft, #efe6d2)] focus:ring-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-teal, #0e3a3a)]"
                      />
                      <span className={active ? 'font-semibold' : ''}>{areaName}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Checkbox */}
          <div className="border-b border-[var(--public-color-line-soft, #efe6d2)] pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--public-color-ink, #14201f)]">
              {locale === 'th' ? 'สถานะโครงการ' : 'Project Status'}
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'new_launch', en: 'New Launch', th: 'เปิดตัวใหม่' },
                { key: 'under_construction', en: 'Under Construction', th: 'อยู่ระหว่างก่อสร้าง' },
                { key: 'completed', en: 'Ready to move', th: 'พร้อมอยู่ / สร้างเสร็จแล้ว' }
              ].map(s => {
                const active = filters.status.includes(s.key);
                return (
                  <label key={s.key} className="flex items-center gap-2 text-xs cursor-pointer text-[var(--public-color-ink, #14201f)]">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleStatus(s.key)}
                      className="rounded border-[var(--public-color-line-soft, #efe6d2)] focus:ring-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-teal, #0e3a3a)]"
                    />
                    <span className={active ? 'font-semibold' : ''}>
                      {locale === 'th' ? s.th : s.en}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Distance to beach */}
          <div className="border-b border-[var(--public-color-line-soft, #efe6d2)] pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--public-color-ink, #14201f)]">
              {locale === 'th' ? 'ระยะห่างหาด' : 'Distance to beach'}
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'any', en: 'Any distance', th: 'ทั้งหมด' },
                { key: 'front', en: 'Beachfront', th: 'ติดชายหาด' },
                { key: '100', en: 'Under 100m', th: 'ไม่เกิน 100 เมตร' },
                { key: '500', en: 'Under 500m', th: 'ไม่เกิน 500 เมตร' }
              ].map(b => (
                <label key={b.key} className="flex items-center gap-2.5 text-xs cursor-pointer text-[var(--public-color-ink, #14201f)]">
                  <input
                    type="radio"
                    name="beach_distance"
                    checked={filters.beach === b.key}
                    onChange={() => setFilters(f => ({ ...f, beach: b.key as any }))}
                    className="border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-teal, #0e3a3a)] focus:ring-[var(--public-color-teal, #0e3a3a)]"
                  />
                  <span>{locale === 'th' ? b.th : b.en}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Foreign Quota */}
          <div className="pb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-[var(--public-color-ink, #14201f)]">
              {locale === 'th' ? 'สิทธิ์โควต้าต่างชาติ' : 'Foreign quota'}
            </h3>
            <label className="flex items-center gap-2.5 text-xs cursor-pointer text-[var(--public-color-ink, #14201f)]">
              <input
                type="checkbox"
                checked={filters.foreignQuota}
                onChange={(e) => setFilters(f => ({ ...f, foreignQuota: e.target.checked }))}
                className="rounded border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-teal, #0e3a3a)] focus:ring-[var(--public-color-teal, #0e3a3a)]"
              />
              <span>{locale === 'th' ? 'โควต้าว่างสำหรับคนต่างชาติ' : 'Foreign quota available'}</span>
            </label>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="w-full py-2.5 px-4 mt-auto rounded-full text-xs font-semibold border border-[var(--public-color-line-soft, #efe6d2)] hover:bg-black/5 text-[var(--public-color-ink, #14201f)] transition-colors duration-200"
          >
            {locale === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
          </button>
        </aside>

        {/* List Results Column */}
        {view !== 'map' && (
          <div 
            className="p-6 md:p-8 flex flex-col gap-6"
            style={{ 
              maxHeight: view === 'split' ? 'calc(100vh - 80px)' : 'none',
              overflowY: view === 'split' ? 'auto' : 'visible'
            }}
          >
            {filteredAndSortedProjects.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center border border-dashed border-[var(--public-color-line-soft, #efe6d2)] rounded-2xl bg-white/50">
                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <p className="font-semibold mb-1 text-[var(--public-color-ink, #14201f)]">
                  {locale === 'th' ? 'ไม่พบโครงการที่ตรงกับตัวกรอง' : 'No projects match your filters'}
                </p>
                <p className="text-xs text-gray-400 max-w-xs px-4">
                  {locale === 'th' ? 'โปรดลองปรับช่วงราคา ย่าน หรือฟิลเตอร์อื่นๆ เพื่อดูโครงการเพิ่มเติม' : 'Try expanding your price range, choosing another location, or resetting filters.'}
                </p>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${
                  view === 'split' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {filteredAndSortedProjects.map((p, index) => {
                  const area = p.area_name || p.area?.name || p.district || p.city || copy.card.areaFallback;
                  const hasEntryPrice = Boolean(p.starting_price && Number.isFinite(p.starting_price));
                  
                  // Extract status translation
                  let localizedStatus = locale === 'th' ? 'เปิดขาย' : 'Available';
                  const normStat = String(p.status ?? '').toLowerCase();
                  if (normStat.includes('new')) {
                    localizedStatus = locale === 'th' ? 'เปิดตัวใหม่' : 'New launch';
                  } else if (normStat.includes('construction')) {
                    localizedStatus = locale === 'th' ? 'อยู่ระหว่างก่อสร้าง' : 'Under construction';
                  } else if (normStat.includes('complete') || normStat.includes('ready')) {
                    localizedStatus = locale === 'th' ? 'พร้อมอยู่' : 'Ready';
                  }

                  const badges = [
                    { key: 'status', label: localizedStatus },
                    ...(hasEntryPrice ? [{ key: 'entry', label: copy.card.entryLabel }] : []),
                  ];

                  const summary = p.summary?.[locale] || p.summary?.en || p.description?.[locale] || p.description?.en || '';
                  const shortSummary = summary.length > 80 ? `${summary.slice(0, 80).trim()}…` : summary;
                  
                  // Extract metric info
                  const yieldPctVal = p.investment_snapshot?.gross_yield ?? p.gross_yield;
                  const yieldPct = yieldPctVal ? `${(Number(yieldPctVal) * 100).toFixed(1)}%` : '6.0%';

                  const quotaVal = p.investment_snapshot?.foreign_quota ?? p.foreign_quota ?? p.quota_pct;
                  const foreignQuota = quotaVal ? `${Math.round(Number(quotaVal) * 100)}%` : '49%';

                  const beachVal = p.location?.walk_to_beach ?? p.beach_distance ?? p.location?.beach_access;
                  const beachDistance = beachVal !== undefined && beachVal !== null 
                    ? (Number(beachVal) === 0 ? (locale === 'th' ? 'ติดทะเล' : 'Beachfront') : `${beachVal}m`)
                    : 'Near Beach';

                  const developerName = p.developer?.name ?? p.developer_name ?? null;
                  const completion = p.completion_date ?? p.delivery_date ?? p.completion ?? null;
                  const coverImage = p.cover_image_url ?? '/images/project-overview.png';

                  const isSavedToCompare = compareList.includes(p.id);

                  if (view === 'split') {
                    // Split layout: horizontal list-row item
                    return (
                      <article 
                        key={p.id}
                        onMouseEnter={() => setHoveredProjectId(p.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                        className={`flex flex-col sm:flex-row rounded-2xl overflow-hidden border transition-all duration-300 bg-white hover:shadow-lg ${
                          hoveredProjectId === p.id 
                            ? 'border-[var(--public-color-teal, #0e3a3a)] translate-x-1' 
                            : 'border-[var(--public-color-line-soft, #efe6d2)]'
                        }`}
                      >
                        {/* Cover Image Left */}
                        <Link 
                          href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                          className="w-full sm:w-[220px] md:w-[260px] h-[200px] sm:h-auto relative overflow-hidden shrink-0"
                        >
                          <img 
                            src={coverImage} 
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <span 
                            className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md"
                          >
                            {localizedStatus}
                          </span>
                        </Link>

                        {/* Content Right */}
                        <div className="p-5 flex flex-col flex-1">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div>
                              <Link href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}>
                                <h3 className="font-serif text-xl md:text-2xl font-normal text-[var(--public-color-ink, #14201f)] tracking-tight hover:text-[var(--public-color-coral, #d96a4e)] transition-colors">
                                  {p.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span>{area}</span>
                                {developerName && <span>· {developerName}</span>}
                                {completion && <span>· {completion}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block text-[9.5px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                {locale === 'th' ? 'เริ่มต้น' : 'From'}
                              </span>
                              <span className="font-serif text-xl font-normal text-[var(--public-color-teal, #0e3a3a)]">
                                {formatCompactPrice(p.starting_price)}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-[var(--public-color-ink, #14201f)]/70 leading-relaxed mb-4">
                            {shortSummary}
                          </p>

                          {/* Details line */}
                          <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 mt-auto border-t border-[var(--public-color-line-soft, #efe6d2)] pt-3.5">
                            <span className="flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 22 22 2"/><path d="M22 22V2h-4v4h-4v4H9v4H5v8"/></svg>
                              <span>{yieldPct} {locale === 'th' ? 'ผลตอบแทน' : 'yield'}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
                              <span>{locale === 'th' ? `โควต้าต่างชาติ ${foreignQuota}` : `Foreign quota ${foreignQuota}`}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 10h20M2 14h20M2 18h20M2 22h20M2 6h20"/></svg>
                              <span>{beachDistance}</span>
                            </span>
                          </div>

                          {/* Quick CTA Actions */}
                          <div className="flex items-center gap-3 mt-4">
                            <Link
                              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                              className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--public-color-sand-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)] hover:bg-opacity-80 transition-colors"
                            >
                              {locale === 'th' ? 'รายละเอียดเพิ่มเติม →' : 'View details →'}
                            </Link>

                            <button
                              type="button"
                              onClick={() => toggleCompare(p.id)}
                              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                                isSavedToCompare
                                  ? 'bg-[var(--public-color-ink, #14201f)] border-[var(--public-color-ink, #14201f)] text-[var(--public-color-bone, #f8f4ea)]'
                                  : 'border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)] hover:bg-black/5'
                              }`}
                            >
                              {locale === 'th' ? 'เปรียบเทียบ' : 'Compare'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  // Grid Layout using ProjectCard
                  return (
                    <div key={p.id} className="relative group">
                      <ProjectCard
                        href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                        name={p.name}
                        locale={locale}
                        media={{
                          cover_image_url: coverImage,
                          hero_image_url: coverImage,
                          images: p.images ?? [],
                        }}
                        fallbackImage="/images/project-overview.png"
                        area={area}
                        price={formatCompactPrice(p.starting_price)}
                        summary={shortSummary}
                        badges={badges}
                        facts={[
                          p.property_type ? p.property_type : '',
                          developerName ? `${locale === 'th' ? 'ผู้พัฒนา' : 'Developer'} ${developerName}` : '',
                        ].filter(Boolean)}
                        ctaLabel={copy.card.reviewAction}
                        yieldPct={yieldPct}
                        foreignQuota={foreignQuota}
                        beachDistance={beachDistance}
                        developerName={developerName}
                        completion={completion}
                        propertyId={p.id}
                      />
                      
                      {/* Compare Overlay Button */}
                      <button
                        type="button"
                        onClick={() => toggleCompare(p.id)}
                        className={`absolute bottom-5 right-5 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border shadow-sm transition-all duration-300 ${
                          isSavedToCompare
                            ? 'bg-[var(--public-color-ink, #14201f)] text-[var(--public-color-bone, #f8f4ea)] border-[var(--public-color-ink, #14201f)]'
                            : 'bg-white text-[var(--public-color-ink, #14201f)] border-[var(--public-color-line-soft, #efe6d2)] hover:bg-[var(--public-color-sand-soft, #f3ead9)]'
                        }`}
                      >
                        {isSavedToCompare ? '✓ Selected' : '+ Compare'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Map Panel Column */}
        {view !== 'grid' && (
          <div 
            className="relative border-l border-[var(--public-color-line-soft, #efe6d2)] sticky"
            style={{ 
              top: '80px', 
              height: 'calc(100vh - 80px)', 
              minHeight: '600px', 
              background: '#e5e9f0' 
            }}
          >
            {/* Coastline shape (decorative) */}
            <div className="absolute inset-0 bg-[#e4dfd5] opacity-40 z-0 pointer-events-none" />
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            >
              {/* Gulf of Thailand (Water) */}
              <path d="M 65 -5 Q 70 30 60 50 Q 50 70 40 90 Q 30 105 0 100 L 100 105 L 105 -5 Z" fill="rgba(14,58,58,0.08)"/>
              <path d="M 65 0 Q 70 30 60 50 Q 50 70 40 90 Q 30 100 0 100" fill="none" stroke="rgba(14,58,58,0.15)" strokeWidth="0.5"/>
            </svg>

            {/* Map labels */}
            <div className="absolute left-[12%] top-[25%] text-[10px] md:text-xs font-mono font-bold tracking-[0.16em] text-[var(--public-color-teal, #0e3a3a)]/35 select-none z-10 pointer-events-none">
              GULF OF THAILAND
            </div>
            <div className="absolute right-[12%] top-[12%] text-[9px] md:text-[10px] font-mono tracking-widest text-[var(--public-color-teal, #0e3a3a)]/35 select-none z-10 pointer-events-none">
              SUKHUMVIT RD
            </div>
            <div className="absolute right-[8%] bottom-[12%] text-[9px] md:text-[10px] text-gray-500 font-medium select-none z-10 pointer-events-none">
              U-TAPAO AIRPORT
            </div>

            {/* Pins */}
            {mapProjects.map((p) => {
              const active = hoveredProjectId === p.id;
              return (
                <button 
                  key={p.id} 
                  type="button"
                  onClick={() => window.location.href = withLocale(locale, `/projects/${p.slug}`)}
                  onMouseEnter={() => setHoveredProjectId(p.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  style={{
                    position: 'absolute', 
                    left: `${p.coords.x}%`, 
                    top: `${p.coords.y}%`,
                    transform: `translate(-50%, -100%) scale(${active ? 1.08 : 1})`,
                    transformOrigin: 'bottom center',
                    transition: 'transform 0.2s',
                    zIndex: active ? 30 : 20,
                  }}
                  className="p-0 border-0 bg-transparent cursor-pointer group"
                >
                  <div 
                    className={`px-3 py-1.5 rounded-full font-mono text-[10px] md:text-xs font-semibold shadow-md transition-all duration-300 ${
                      active 
                        ? 'bg-[var(--public-color-coral, #d96a4e)] text-white scale-105' 
                        : 'bg-[var(--public-color-teal, #0e3a3a)] text-[var(--public-color-bone, #f8f4ea)] hover:bg-[var(--public-color-coral, #d96a4e)]'
                    }`}
                  >
                    {formatCompactPrice(p.starting_price)}
                  </div>
                  <div 
                    className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] mx-auto transition-colors ${
                      active ? 'border-t-[var(--public-color-coral, #d96a4e)]' : 'border-t-[var(--public-color-teal, #0e3a3a)] group-hover:border-t-[var(--public-color-coral, #d96a4e)]'
                    }`}
                  />
                </button>
              );
            })}

            {/* Hover card */}
            {hoveredProjectId && (() => {
              const p = mapProjects.find(x => x.id === hoveredProjectId);
              if (!p) return null;
              const coverImage = p.cover_image_url ?? '/images/project-overview.png';
              const area = p.area_name || p.area?.name || p.district || p.city || copy.card.areaFallback;
              return (
                <div 
                  style={{
                    position: 'absolute', 
                    left: `${p.coords.x}%`, 
                    top: `${p.coords.y - 4}%`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 40,
                  }}
                  className="w-56 bg-[var(--public-color-paper-warm, #fdfaf2)] rounded-xl overflow-hidden border border-[var(--public-color-line-soft, #efe6d2)] shadow-xl pointer-events-none transition-all duration-300"
                >
                  <div className="h-24 bg-center bg-cover" style={{ backgroundImage: `url(${coverImage})` }} />
                  <div className="p-3">
                    <h4 className="font-serif text-sm font-semibold text-[var(--public-color-ink, #14201f)] leading-tight mb-1">{p.name}</h4>
                    <div className="text-[10px] text-gray-500">
                      {area} · <span className="font-semibold text-[var(--public-color-teal, #0e3a3a)]">{formatCompactPrice(p.starting_price)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Map Controls */}
            <div className="absolute top-5 right-5 flex flex-col gap-2 z-20">
              <button 
                type="button"
                className="w-8 h-8 rounded-lg bg-[var(--public-color-paper-warm, #fdfaf2)] border border-[var(--public-color-line-soft, #efe6d2)] flex items-center justify-center cursor-pointer shadow-sm hover:bg-[var(--public-color-sand-soft, #f3ead9)] text-[var(--public-color-ink, #14201f)] font-bold text-base"
              >
                +
              </button>
              <button 
                type="button"
                className="w-8 h-8 rounded-lg bg-[var(--public-color-paper-warm, #fdfaf2)] border border-[var(--public-color-line-soft, #efe6d2)] flex items-center justify-center cursor-pointer shadow-sm hover:bg-[var(--public-color-sand-soft, #f3ead9)] text-[var(--public-color-ink, #14201f)] font-bold text-base"
              >
                −
              </button>
            </div>
            
            <div className="absolute top-5 left-5 z-20">
              <span 
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-[var(--public-color-line-soft, #efe6d2)] shadow-sm bg-[var(--public-color-paper-warm, #fdfaf2)] text-[var(--public-color-ink, #14201f)]"
              >
                🗺️ Coastline Map
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 px-6 z-[100] flex justify-center pointer-events-none">
          <div 
            className="w-full max-w-2xl bg-[var(--public-color-ink, #14201f)] text-[var(--public-color-bone, #f8f4ea)] px-6 py-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xl border border-white/10 pointer-events-auto"
          >
            <div className="flex-1">
              <div className="text-xs md:text-sm font-semibold flex items-center gap-2">
                <span>🔄</span>
                <span>
                  {locale === 'th' 
                    ? `เลือกไว้ ${compareList.length} โครงการเพื่อเปรียบเทียบ` 
                    : `${compareList.length} project${compareList.length > 1 ? 's' : ''} selected to compare`}
                </span>
              </div>
              <div className="text-[10px] text-[var(--public-color-bone, #f8f4ea)]/60 mt-0.5 truncate max-w-[280px] md:max-w-md">
                {locale === 'th' ? 'สามารถเพิ่มได้ถึง 4 โครงการ · ' : 'Add up to 4 · '}
                {compareList.map(id => initialProjects.find(p => p.id === id)?.name).join(' · ')}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCompareList([])}
                className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {locale === 'th' ? 'ยกเลิก' : 'Clear'}
              </button>
              
              <Link
                href={withLocaleQuery(locale, '/compare', { ids: compareList.join(',') })}
                className={`px-4 py-2 rounded-full text-xs font-bold text-white transition-all shadow-md ${
                  compareList.length < 2
                    ? 'bg-gray-700 cursor-not-allowed opacity-50'
                    : 'bg-[var(--public-color-coral, #d96a4e)] hover:bg-opacity-90 hover:scale-[1.02]'
                }`}
                onClick={(e) => {
                  if (compareList.length < 2) {
                    e.preventDefault();
                  }
                }}
              >
                {locale === 'th' ? 'เปรียบเทียบเลย →' : 'Compare now →'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
