import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryFilters } from "@/components/admin/domain/crm/inquiries-types";
import { FOLLOW_UP_STATUSES } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryFiltersPanel({
  t,
  isAuthenticated,
  filters,
  loading,
  onFilterChange,
}: {
  t: InquiryCopy;
  isAuthenticated: boolean;
  filters: InquiryFilters;
  loading: boolean;
  onFilterChange: <Key extends keyof InquiryFilters>(key: Key, value: InquiryFilters[Key]) => void;
}) {
  return (
    <fieldset className="crm-filters-fieldset" disabled={!isAuthenticated || loading}>
      <legend>{t.filters}</legend>
      <div className="crm-filters">
        <label className="field" htmlFor="crm-status">
          <span>{t.status}</span>
          <input id="crm-status" value={filters.status} onChange={(event) => onFilterChange("status", event.target.value)} />
        </label>
        <label className="field" htmlFor="crm-source">
          <span>{t.source}</span>
          <input id="crm-source" value={filters.source} onChange={(event) => onFilterChange("source", event.target.value)} />
        </label>
        <label className="field" htmlFor="crm-purpose">
          <span>{t.purpose}</span>
          <input id="crm-purpose" value={filters.purpose} onChange={(event) => onFilterChange("purpose", event.target.value)} />
        </label>
        <label className="field" htmlFor="crm-date-from">
          <span>{t.dateFrom}</span>
          <input id="crm-date-from" type="date" value={filters.date_from} onChange={(event) => onFilterChange("date_from", event.target.value)} />
        </label>
        <label className="field" htmlFor="crm-date-to">
          <span>{t.dateTo}</span>
          <input id="crm-date-to" type="date" value={filters.date_to} onChange={(event) => onFilterChange("date_to", event.target.value)} />
        </label>
        <label className="field" htmlFor="crm-follow-up-filter">
          <span>{t.followUp}</span>
          <select
            id="crm-follow-up-filter"
            value={filters.follow_up_status}
            onChange={(event) => onFilterChange("follow_up_status", event.target.value)}
          >
            <option value=""></option>
            {FOLLOW_UP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field crm-search" htmlFor="crm-search">
          <span>{t.search}</span>
          <input id="crm-search" value={filters.q} onChange={(event) => onFilterChange("q", event.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}
