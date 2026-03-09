import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { SavedFilter } from "@/components/admin/domain/crm/inquiries-types";

export function InquirySavedFiltersPanel({
  t,
  isAuthenticated,
  savedFilterName,
  savedFilters,
  activeSavedFilterId,
  role,
  onSavedFilterNameChange,
  onActiveSavedFilterIdChange,
  onSaveFilter,
  onLoadFilter,
}: {
  t: InquiryCopy;
  isAuthenticated: boolean;
  savedFilterName: string;
  savedFilters: SavedFilter[];
  activeSavedFilterId: string;
  role: string;
  onSavedFilterNameChange: (value: string) => void;
  onActiveSavedFilterIdChange: (value: string) => void;
  onSaveFilter: () => void;
  onLoadFilter: () => void;
}) {
  return (
    <fieldset className="crm-filters-fieldset" disabled={!isAuthenticated}>
      <legend>{t.savedFilters}</legend>
      <div className="crm-saved-filters">
        <label className="field" htmlFor="crm-save-filter-name">
          <span>{t.saveAs}</span>
          <input id="crm-save-filter-name" value={savedFilterName} onChange={(event) => onSavedFilterNameChange(event.target.value)} />
        </label>
        <button className="btn btn-secondary" type="button" onClick={onSaveFilter} disabled={!savedFilterName.trim()}>
          {t.saveFilter}
        </button>
        <label className="field" htmlFor="crm-saved-filter-select">
          <span>{t.savedFilters}</span>
          <select id="crm-saved-filter-select" value={activeSavedFilterId} onChange={(event) => onActiveSavedFilterIdChange(event.target.value)}>
            <option value=""></option>
            {savedFilters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-secondary" type="button" onClick={onLoadFilter} disabled={!activeSavedFilterId}>
          {t.loadFilter}
        </button>
        <p className="crm-row-meta" role="status" aria-live="polite">
          {t.roleScope}: <strong>{role}</strong>
        </p>
      </div>
    </fieldset>
  );
}
