'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { mapProjectToPublicCardData } from '@/app/_lib/public-card-mappers';
import { withLocale } from '@/app/_lib/i18n/routing';
import { withLocaleQuery } from '@/app/_lib/public-advisory';
import { SafeCoverImage } from '@/components/media/SafeCoverImage';
import { ProjectCard as PublicProjectCard } from '@/components/public-system/components/ProjectCard';
import {
  IconArrowRight,
  IconCheck,
  IconFilter,
  IconLocation,
  IconSearch,
  IconTrendingUp,
} from '@/components/icons/SvgIcons';

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

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const trimmed = typeof value === 'string' || typeof value === 'number'
      ? String(value).trim()
      : '';
    if (trimmed) return trimmed;
  }
  return null;
}

function localizedRecordText(value: unknown, locale: 'en' | 'th'): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  return firstText(record[locale], record.en, record.th);
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function projectArea(project: ProjectItem, fallback: string): string {
  return firstText(project.area_name, project.area?.name, project.district, project.city) ?? fallback;
}

function projectDeveloper(project: ProjectItem): string | null {
  return firstText(project.developer?.name, project.developer_name);
}

function projectCompletion(project: ProjectItem): string | null {
  return firstText(project.completion_date, project.delivery_date, project.handover_date, project.completion);
}

function projectSummary(project: ProjectItem, locale: 'en' | 'th'): string | null {
  const summary = localizedRecordText(project.summary, locale) ?? localizedRecordText(project.description, locale);
  if (!summary) return null;
  const compact = summary.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  return compact.length > 96 ? `${compact.slice(0, 96).trim().replace(/[,:;.\s]+$/g, '')}…` : compact;
}

function projectStatusLabel(locale: 'en' | 'th', status: string | null | undefined): string | null {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (locale === 'th') {
    if (normalized === 'published') return 'เปิดขาย';
    if (normalized.includes('new')) return 'เปิดตัวใหม่';
    if (normalized.includes('construction')) return 'อยู่ระหว่างก่อสร้าง';
    if (normalized.includes('complete') || normalized.includes('ready')) return 'พร้อมอยู่';
    if (normalized.includes('archived') || normalized.includes('sold')) return 'ปิดการขาย';
    return humanizeToken(normalized);
  }
  if (normalized === 'published') return 'Available';
  if (normalized.includes('new')) return 'New launch';
  if (normalized.includes('construction')) return 'Under construction';
  if (normalized.includes('complete') || normalized.includes('ready')) return 'Ready';
  if (normalized.includes('archived') || normalized.includes('sold')) return 'Sold Out';
  return humanizeToken(normalized);
}

function numericMetric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(String(value).replace('%', '').trim());
  return Number.isFinite(numeric) ? numeric : null;
}

function percentLabel(value: unknown): string | null {
  const numeric = numericMetric(value);
  if (numeric === null || numeric <= 0) return null;
  const pct = numeric > 1 ? numeric : numeric * 100;
  const rounded = Math.round(pct * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function beachDistanceLabel(locale: 'en' | 'th', value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/beach\s*front|beachfront/i.test(text)) {
    return locale === 'th' ? 'ติดชายหาด' : 'Beachfront';
  }
  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    if (numeric <= 0) return locale === 'th' ? 'ติดชายหาด' : 'Beachfront';
    return `${Math.round(numeric).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')}m`;
  }
  return text;
}

function projectSearchText(project: ProjectItem, locale: 'en' | 'th', fallbackArea: string): string {
  return [
    project.name,
    project.slug,
    projectArea(project, fallbackArea),
    projectDeveloper(project),
    projectCompletion(project),
    projectStatusLabel(locale, project.status),
    projectSummary(project, locale),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function ProjectsListingClient({ initialProjects, locale, dict, copy }: ProjectsListingClientProps) {
  // UI states
  const [view, setView] = useState<'split' | 'grid' | 'map'>('split');
  const [sort, setSort] = useState<string>('relevance');
  const [searchQuery, setSearchQuery] = useState('');
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
    setSearchQuery('');
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
  const formatCompactPrice = (value: number | null | undefined): string | null => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
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
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (normalizedSearch) {
      result = result.filter((project) =>
        projectSearchText(project, locale, copy.card.areaFallback).includes(normalizedSearch)
      );
    }

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
  }, [initialProjects, filters, sort, searchQuery, locale, copy.card.areaFallback]);

  const mapProjects = useMemo(() => {
    return filteredAndSortedProjects.map((p, idx) => ({
      ...p,
      coords: getProjectCoords(p, idx),
    }));
  }, [filteredAndSortedProjects]);

  return (
    <div className="projects-listing-shell w-full flex flex-col">
      {/* Toolbar / Header Strip */}
      <div className="projects-listing-control-panel w-full border-b border-[var(--public-color-line-soft, #efe6d2)] py-7 px-4 sm:px-6 md:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
          <div className="min-w-0">
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
            <div className="projects-listing-header-actions mt-3 flex flex-wrap gap-3">
              <Link
                href={withLocale(locale, '/buy')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--public-color-teal,#0e3a3a)] hover:text-[var(--public-color-coral,#d96a4e)] transition-colors group"
              >
                <span>{copy.browseListingsLabel || 'Browse shortlist-ready listings'}</span>
                <IconArrowRight size="sm" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={withLocaleQuery(locale, '/contact', { intent: 'project_consultation', source: 'projects_listing_price_list' })}
                prefetch={false}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--public-color-coral,#d96a4e)] hover:text-[var(--public-color-teal,#0e3a3a)] transition-colors group"
              >
                <span>{locale === 'th' ? 'ขอราคาอัปเดต' : 'Request Updated Price List'}</span>
                <IconArrowRight size="sm" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
          
          {/* View Toggler and Sorting */}
          <div className="projects-listing-control-stack flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3.5 sm:items-center lg:items-end xl:items-center">
            <label className="projects-listing-search relative flex items-center gap-2 rounded-full border border-[var(--public-color-line-soft, #efe6d2)] bg-white px-4 py-2.5 shadow-sm">
              <IconSearch size="sm" className="text-[var(--public-color-teal,#0e3a3a)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label={locale === 'th' ? 'ค้นหาโครงการ' : 'Search projects'}
                placeholder={locale === 'th' ? 'ค้นหาโครงการหรือทำเล' : 'Search project or area'}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--public-color-ink,#14201f)] outline-none placeholder:text-[var(--public-color-ink,#14201f)]/45"
              />
            </label>
            <div className="flex items-center gap-3.5 flex-wrap justify-start sm:justify-end">
            {/* Toggle Segment */}
            <div className="inline-flex rounded-full p-1 bg-black/[0.04] dark:bg-white/[0.04] text-xs font-medium border border-black/[0.02]" aria-label={locale === 'th' ? 'เลือกรูปแบบการแสดงผล' : 'Choose project view'}>
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
              aria-label={locale === 'th' ? 'จัดเรียงโครงการ' : 'Sort projects'}
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
        </div>

        {/* Inline filter chips summary */}
        <div className="flex flex-wrap gap-2 items-center text-xs mt-4">
          <span 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold border border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)]"
            style={{ background: 'var(--public-color-sand-soft, #efe6d2)' }}
          >
            <IconFilter size="sm" />
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

      {/* Main Workspace */}
      <div className={`projects-listing-workspace projects-listing-workspace--${view} w-full grid`}>
        {/* Sidebar Filters */}
        <aside 
          className="projects-listing-sidebar p-5 sm:p-6 md:p-8 border-r border-[var(--public-color-line-soft, #efe6d2)] flex flex-col gap-6"
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
            className={`projects-listing-results ${view === 'split' ? 'projects-listing-results--split' : ''} p-4 sm:p-6 md:p-8 flex flex-col gap-6`}
          >
            {filteredAndSortedProjects.length === 0 ? (
              <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center border border-dashed border-[var(--public-color-line-soft, #efe6d2)] rounded-2xl bg-white/50">
                <IconSearch size="xl" className="text-gray-300 mb-4" />
                <p className="font-semibold mb-1 text-[var(--public-color-ink, #14201f)]">
                  {locale === 'th' ? 'ไม่พบโครงการที่ตรงกับตัวกรอง' : 'No projects match your filters'}
                </p>
                <p className="text-xs text-gray-400 max-w-xs px-4">
                  {locale === 'th' ? 'โปรดลองปรับช่วงราคา ย่าน หรือฟิลเตอร์อื่นๆ เพื่อดูโครงการเพิ่มเติม' : 'Try expanding your price range, choosing another location, or resetting filters.'}
                </p>
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-full text-xs font-semibold border border-[var(--public-color-line-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)] bg-white hover:bg-[var(--public-color-sand-soft, #f3ead9)] transition-colors"
                  >
                    {locale === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
                  </button>
                  <Link
                    href={withLocaleQuery(locale, '/contact', { intent: 'project_consultation', source: 'projects_listing_empty' })}
                    prefetch={false}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--public-color-coral, #d96a4e)] text-white hover:bg-[var(--public-color-coral-2, #c95c43)] transition-colors"
                  >
                    {locale === 'th' ? 'ขอราคาอัปเดต' : 'Request Updated Price List'}
                  </Link>
                </div>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${
                  view === 'split' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {filteredAndSortedProjects.map((p, index) => {
                  const area = projectArea(p, copy.card.areaFallback);
                  const localizedStatus = projectStatusLabel(locale, p.status);
                  const shortSummary = projectSummary(p, locale);
                  const yieldPctVal = p.investment_snapshot?.gross_yield ?? p.gross_yield;
                  const yieldPct = percentLabel(yieldPctVal);
                  const quotaVal = p.investment_snapshot?.foreign_quota ?? p.foreign_quota ?? p.quota_pct;
                  const foreignQuota = percentLabel(quotaVal);
                  const beachVal = p.location?.walk_to_beach ?? p.beach_distance ?? p.location?.beach_access;
                  const beachDistance = beachDistanceLabel(locale, beachVal);
                  const developerName = projectDeveloper(p);
                  const completion = projectCompletion(p);
                  const coverImage = p.cover_image_url ?? p.hero_image_url ?? p.images?.[0] ?? '/images/project-overview.png';
                  const startingPriceLabel = formatCompactPrice(p.starting_price);
                  const detailFacts = [
                    yieldPct ? `${yieldPct} ${locale === 'th' ? 'ผลตอบแทน' : 'yield'}` : null,
                    foreignQuota ? (locale === 'th' ? `โควต้าต่างชาติ ${foreignQuota}` : `Foreign quota ${foreignQuota}`) : null,
                    beachDistance,
                  ].filter((item): item is string => Boolean(item));
                  const publicCardHighlights = [
                    shortSummary,
                    ...detailFacts,
                  ].filter((item): item is string => Boolean(item));

                  const isSavedToCompare = compareList.includes(p.id);

                  if (view === 'split') {
                    // Split layout: horizontal list-row item
                    return (
                      <article 
                        key={p.id}
                        onMouseEnter={() => setHoveredProjectId(p.id)}
                        onMouseLeave={() => setHoveredProjectId(null)}
                        className={`projects-listing-result-card flex flex-col sm:flex-row rounded-2xl overflow-hidden border transition-all duration-300 bg-white hover:shadow-lg ${
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
                          <SafeCoverImage
                            src={coverImage}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            fallbackSrc="/images/project-overview.png"
                            loading={index < 2 ? 'eager' : 'lazy'}
                            priority={index < 2}
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 260px, 22vw"
                            ssrStartWithPrimary={index < 2}
                          />
                          {localizedStatus ? (
                            <span
                              className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md"
                            >
                              {localizedStatus}
                            </span>
                          ) : null}
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
                                <IconLocation size="sm" />
                                <span>{area}</span>
                                {developerName && <span>· {developerName}</span>}
                                {completion && <span>· {completion}</span>}
                              </div>
                            </div>
                            {startingPriceLabel ? (
                              <div className="text-right shrink-0">
                                <span className="block text-[9.5px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                  {locale === 'th' ? 'เริ่มต้น' : 'From'}
                                </span>
                                <span className="font-serif text-xl font-normal text-[var(--public-color-teal, #0e3a3a)]">
                                  {startingPriceLabel}
                                </span>
                              </div>
                            ) : (
                              <div className="text-right shrink-0">
                                <span className="block text-[9.5px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                                  {locale === 'th' ? 'ราคา' : 'Price'}
                                </span>
                                <span className="text-xs font-semibold text-[var(--public-color-teal, #0e3a3a)]">
                                  {locale === 'th' ? 'ขอราคาอัปเดต' : 'Price on request'}
                                </span>
                              </div>
                            )}
                          </div>

                          {shortSummary ? (
                            <p className="text-xs text-[var(--public-color-ink, #14201f)]/70 leading-relaxed mb-4">
                              {shortSummary}
                            </p>
                          ) : null}

                          {/* Details line */}
                          {detailFacts.length ? (
                            <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 mt-auto border-t border-[var(--public-color-line-soft, #efe6d2)] pt-3.5">
                              {detailFacts.map((fact, factIndex) => (
                                <span key={fact} className="flex items-center gap-1.5">
                                  {factIndex === 0 ? <IconTrendingUp size="sm" /> : factIndex === 1 ? <IconCheck size="sm" /> : <IconLocation size="sm" />}
                                  <span>{fact}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {/* Quick CTA Actions */}
                          <div className="flex items-center gap-3 mt-4">
                            <Link
                              href={withLocale(locale, `/projects/${encodeURIComponent(p.slug)}`)}
                              className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--public-color-sand-soft, #efe6d2)] text-[var(--public-color-ink, #14201f)] hover:bg-opacity-80 transition-colors"
                            >
                              {locale === 'th' ? 'ดูโครงการ' : 'View Project'}
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
                              {locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  const publicProjectCard = mapProjectToPublicCardData(
                    {
                      id: p.id,
                      slug: p.slug,
                      name: p.name,
                      starting_price: p.starting_price,
                      status: p.status ?? undefined,
                      cover_image_url: p.cover_image_url ?? undefined,
                      hero_image_url: p.hero_image_url ?? undefined,
                      images: p.images ?? undefined,
                      location: String(area),
                      status_label: localizedStatus ?? undefined,
                      completion,
                      highlights: publicCardHighlights,
                    },
                    { locale },
                  );

                  // Grid Layout using the public-system ProjectCard. Split/map views keep their existing rendering.
                  return (
                    <div key={p.id} className="relative group">
                      <PublicProjectCard
                        project={publicProjectCard}
                        ctaLabel={locale === 'th' ? 'ดูโครงการ' : 'View Project'}
                        fallbackImageSrc="/images/project-overview.png"
                        imagePriority={index < 2}
                      />
                      
                      {/* Compare Overlay Button */}
                      <button
                        type="button"
                        onClick={() => toggleCompare(p.id)}
                        className={`absolute right-4 top-4 z-20 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border shadow-sm transition-all duration-300 ${
                          isSavedToCompare
                            ? 'bg-[var(--public-color-ink, #14201f)] text-[var(--public-color-bone, #f8f4ea)] border-[var(--public-color-ink, #14201f)]'
                            : 'bg-white text-[var(--public-color-ink, #14201f)] border-[var(--public-color-line-soft, #efe6d2)] hover:bg-[var(--public-color-sand-soft, #f3ead9)]'
                        }`}
                      >
                        {isSavedToCompare ? (locale === 'th' ? 'เลือกแล้ว' : 'Selected') : (locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects')}
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
            className="projects-listing-map relative border-l border-[var(--public-color-line-soft, #efe6d2)]"
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
                    {formatCompactPrice(p.starting_price) ?? (locale === 'th' ? 'สอบถาม' : 'Ask')}
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
                      {area} · <span className="font-semibold text-[var(--public-color-teal, #0e3a3a)]">{formatCompactPrice(p.starting_price) ?? (locale === 'th' ? 'ขอราคาอัปเดต' : 'Price on request')}</span>
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
                <IconLocation size="sm" />
                <span>Coastline Map</span>
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
                <IconCheck size="sm" />
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
                {locale === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
