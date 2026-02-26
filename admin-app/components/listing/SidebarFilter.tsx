'use client';

import type { Dictionary } from '../../app/_lib/i18n/types';

export type ListingFilters = {
  search: string;
  propertyType: string;
  projectId: string;
  areaId: string;
  developerId: string;
  status: string;
  beds: string;
  baths: string;
  minPrice: string;
  maxPrice: string;
};

export type ListingFilterOptions = {
  propertyTypes: { value: string; label: string }[];
  projects: { value: string; label: string }[];
  areas: { value: string; label: string }[];
  developers: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
  bedOptions: number[];
  bathOptions: number[];
};

export function SidebarFilter({
  isOpen,
  onClose,
  dict,
  filters,
  options,
  onFiltersChange,
  onApply,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  dict: Dictionary;
  filters: ListingFilters;
  options: ListingFilterOptions;
  onFiltersChange: (next: Partial<ListingFilters>) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <aside className={isOpen ? 'filter-sidebar active' : 'filter-sidebar'} aria-label={dict.filters.heading}>
      <h3 className="mb-6">{dict.filters.heading}</h3>

      <div className="filter-section">
        <h3>{dict.listing.results}</h3>
        <input
          className="form-input"
          type="search"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          placeholder={dict.filters.searchPlaceholder}
          aria-label={dict.filters.searchPlaceholder}
        />
      </div>

      <div className="filter-section">
        <h3>{dict.filters.propertyType}</h3>
        <select
          className="form-select"
          value={filters.propertyType}
          onChange={(e) => onFiltersChange({ propertyType: e.target.value })}
          aria-label={dict.filters.propertyType}
        >
          <option value="">{dict.filters.allPropertyTypes}</option>
          {options.propertyTypes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.priceRange}</h3>
        <div className="grid gap-3">
          <label>
            <div className="text-sm text-[var(--color-text-secondary)] mb-1.5">{dict.filters.min}</div>
            <input
              className="form-input"
              inputMode="numeric"
              value={filters.minPrice}
              onChange={(e) => onFiltersChange({ minPrice: e.target.value })}
            />
          </label>
          <label>
            <div className="text-sm text-[var(--color-text-secondary)] mb-1.5">{dict.filters.max}</div>
            <input
              className="form-input"
              inputMode="numeric"
              value={filters.maxPrice}
              onChange={(e) => onFiltersChange({ maxPrice: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.bedrooms}</h3>
        <div className="chips-group">
          {options.bedOptions.map((b) => {
            const active = filters.beds === String(b);
            return (
              <button
                key={b}
                type="button"
                className={active ? 'chip active' : 'chip'}
                onClick={() => onFiltersChange({ beds: active ? '' : String(b) })}
              >
                {b === 0 ? dict.filters.studio : b}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.bathrooms}</h3>
        <div className="chips-group">
          {options.bathOptions.map((b) => {
            const active = filters.baths === String(b);
            return (
              <button
                key={b}
                type="button"
                className={active ? 'chip active' : 'chip'}
                onClick={() => onFiltersChange({ baths: active ? '' : String(b) })}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.area}</h3>
        <select
          className="form-select"
          value={filters.areaId}
          onChange={(e) => onFiltersChange({ areaId: e.target.value })}
          aria-label={dict.filters.area}
        >
          <option value="">{dict.filters.allAreas}</option>
          {options.areas.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.project}</h3>
        <select
          className="form-select"
          value={filters.projectId}
          onChange={(e) => onFiltersChange({ projectId: e.target.value })}
          aria-label={dict.filters.project}
        >
          <option value="">{dict.filters.allProjects}</option>
          {options.projects.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.developer}</h3>
        <select
          className="form-select"
          value={filters.developerId}
          onChange={(e) => onFiltersChange({ developerId: e.target.value })}
          aria-label={dict.filters.developer}
        >
          <option value="">{dict.filters.allDevelopers}</option>
          {options.developers.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h3>{dict.filters.status}</h3>
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => onFiltersChange({ status: e.target.value })}
          aria-label={dict.filters.status}
        >
          <option value="">{dict.filters.allStatuses}</option>
          {options.statuses.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button type="button" className="btn btn-secondary btn-block" onClick={onReset}>
          {dict.filters.clear}
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={onApply}>
          {dict.listing.applyFilters}
        </button>
        <button type="button" className="btn btn-primary btn-block mobile-only" onClick={onClose}>
          {dict.filters.close}
        </button>
      </div>
    </aside>
  );
}
