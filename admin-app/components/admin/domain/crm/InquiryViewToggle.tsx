import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryViewMode } from "@/components/admin/domain/crm/inquiries-types";

export function InquiryViewToggle({
  t,
  viewMode,
  onViewModeChange,
}: {
  t: InquiryCopy;
  viewMode: InquiryViewMode;
  onViewModeChange: (value: InquiryViewMode) => void;
}) {
  return (
    <div className="card-actions">
      <button
        className={`btn btn-secondary ${viewMode === "table" ? "is-active" : ""}`}
        type="button"
        onClick={() => onViewModeChange("table")}
        aria-pressed={viewMode === "table"}
      >
        {t.tableView}
      </button>
      <button
        className={`btn btn-secondary ${viewMode === "kanban" ? "is-active" : ""}`}
        type="button"
        onClick={() => onViewModeChange("kanban")}
        aria-pressed={viewMode === "kanban"}
      >
        {t.kanbanView}
      </button>
    </div>
  );
}
