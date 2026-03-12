import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem, InquiryLocale } from "@/components/admin/domain/crm/inquiries-types";
import { CRM_STATUSES, dueClass, prettyDate, statusIndex, translateFollowUpStatus, translateInquiryStatus } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryKanbanBoard({
  t,
  locale,
  items,
  selectedId,
  movingInquiryId,
  onSelect,
  onMoveStatus,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  items: InquiryItem[];
  selectedId: string | null;
  movingInquiryId: string | null;
  onSelect: (id: string) => void | Promise<void>;
  onMoveStatus: (inquiryId: string, nextStatus: string) => void | Promise<void>;
}) {
  const kanbanColumns = CRM_STATUSES.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  }));

  return (
    <div className="crm-kanban" aria-label={t.kanbanView}>
      {kanbanColumns.map((column) => (
        <section
          key={column.status}
          className="crm-kanban-column"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedId = event.dataTransfer.getData("text/plain");
            if (droppedId) {
              void onMoveStatus(droppedId, column.status);
            }
          }}
        >
          <header className="crm-kanban-head">
            <h3>{translateInquiryStatus(column.status, locale)}</h3>
            <span>{column.items.length}</span>
          </header>
          <ul className="crm-items">
            {column.items.map((item) => (
              <li key={item.id} className={`crm-row-card ${selectedId === item.id ? "is-active" : ""}`}>
                <button
                  type="button"
                  draggable
                  className={`crm-row-button ${selectedId === item.id ? "is-active" : ""}`}
                  disabled={movingInquiryId === item.id}
                  onClick={() => void onSelect(item.id)}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", item.id);
                  }}
                  onKeyDown={(event) => {
                    const eventTarget = event.target as HTMLElement | null;
                    if (eventTarget?.closest("select, input, textarea, button, a")) {
                      return;
                    }
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    const currentIndex = statusIndex(item.status);
                    if (currentIndex < 0) return;
                    const nextIndex = event.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;
                    const nextStatus = CRM_STATUSES[nextIndex];
                    if (!nextStatus) return;
                    event.preventDefault();
                    void onMoveStatus(item.id, nextStatus);
                  }}
                >
                  <span className="crm-row-title">{item.name}</span>
                  <span className="crm-row-meta">{item.purpose || "-"}</span>
                  <span className="crm-row-meta">
                    <span className={`crm-chip ${item.follow_up_status ? "crm-chip-sla" : "crm-chip-muted"}`}>
                      {translateFollowUpStatus(item.follow_up_status, locale)}
                    </span>
                  </span>
                  <span className="crm-row-meta">
                    <span className={`crm-chip ${dueClass(item.follow_up_due_at)}`}>
                      {prettyDate(item.follow_up_due_at, locale)}
                    </span>
                  </span>
                  <span className="crm-row-hints">
                    {item.is_spam_hint ? <span className="crm-chip crm-chip-warn">{t.spam}</span> : null}
                    {item.is_duplicate_hint ? <span className="crm-chip crm-chip-muted">{t.duplicate}</span> : null}
                  </span>
                </button>
                <label className="field crm-row-status-field">
                  <span className="sr-only">{t.status}</span>
                  <select
                    aria-label={t.status}
                    value={item.status}
                    disabled={movingInquiryId === item.id}
                    onChange={(event) => {
                      void onMoveStatus(item.id, event.target.value);
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {CRM_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {translateInquiryStatus(value, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
