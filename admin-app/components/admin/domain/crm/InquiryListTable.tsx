import { AdminTable, AdminTableToolbar } from "@/components/admin/AdminPrimitives";
import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem, InquiryLocale } from "@/components/admin/domain/crm/inquiries-types";
import { dueClass, getInquiryDisplayLabel, prettyDate, translateFollowUpStatus, translateInquiryStatus } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryListTable({
  t,
  locale,
  items,
  selectedId,
  movingInquiryId,
  onSelect,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  items: InquiryItem[];
  selectedId: string | null;
  movingInquiryId: string | null;
  onSelect: (id: string) => void | Promise<void>;
}) {
  return (
    <AdminTable
      caption={t.list}
      className="crm-table-wrap"
      toolbar={
        <AdminTableToolbar className="crm-table-toolbar" aria-label={t.list}>
          <span className={`crm-chip ${selectedId ? "crm-chip-sla" : "crm-chip-muted"}`}>
            {selectedId ? t.viewingDetails : t.openDetails}
          </span>
          <p className="crm-filter-hint">{t.rowActionHint}</p>
        </AdminTableToolbar>
      }
    >
      <table className="dashboard-table crm-table" aria-label={t.list}>
        <thead>
          <tr>
            <th scope="col">{t.list}</th>
            <th scope="col">{t.status}</th>
            <th scope="col">{t.followUp}</th>
            <th scope="col">{t.followUpDueAt}</th>
            <th scope="col">{t.createdAt}</th>
            <th scope="col">{t.rowActions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const primaryLabel = getInquiryDisplayLabel(item);
            const hasContactActions = Boolean(item.whatsapp_url || item.phone_url || item.email_url);

            return (
              <tr key={item.id} className={selectedId === item.id ? "is-active" : ""}>
                <td>
                  <button
                    type="button"
                    className="crm-table-select"
                    aria-label={`${selectedId === item.id ? t.viewingDetails : t.openDetails}: ${primaryLabel}`}
                    aria-pressed={selectedId === item.id}
                    disabled={movingInquiryId === item.id}
                    onClick={() => void onSelect(item.id)}
                  >
                    <span>{primaryLabel}</span>
                    <small className="crm-table-select-meta">
                      {[item.source_page, item.intent].filter(Boolean).join(" · ") || "-"}
                    </small>
                    <small className="crm-table-select-action">
                      {selectedId === item.id ? t.viewingDetails : t.openDetails}
                    </small>
                  </button>
                </td>
                <td>
                  <span className="crm-chip crm-chip-muted">{translateInquiryStatus(item.status, locale)}</span>
                </td>
                <td>
                  <span className={`crm-chip ${item.follow_up_status ? "crm-chip-sla" : "crm-chip-muted"}`}>
                    {translateFollowUpStatus(item.follow_up_status, locale)}
                  </span>
                </td>
                <td>
                  <span className={`crm-chip ${dueClass(item.follow_up_due_at)}`}>
                    {prettyDate(item.follow_up_due_at, locale)}
                  </span>
                </td>
                <td>{prettyDate(item.created_at, locale)}</td>
                <td>
                  <div className="crm-row-actions">
                    <button
                      type="button"
                      className="btn btn-secondary crm-row-actions__primary"
                      aria-label={`${selectedId === item.id ? t.viewingDetails : t.openDetails}: ${primaryLabel}`}
                      aria-pressed={selectedId === item.id}
                      disabled={movingInquiryId === item.id}
                      onClick={() => void onSelect(item.id)}
                    >
                      {selectedId === item.id ? t.viewingDetails : t.openDetails}
                    </button>
                    <div className="crm-row-actions__quick">
                      {item.whatsapp_url ? (
                        <a className="crm-row-action-link" href={item.whatsapp_url} target="_blank" rel="noreferrer">
                          {t.whatsapp}
                        </a>
                      ) : null}
                      {item.phone_url ? (
                        <a className="crm-row-action-link" href={item.phone_url}>
                          {t.phone}
                        </a>
                      ) : null}
                      {item.email_url ? (
                        <a className="crm-row-action-link" href={item.email_url}>
                          {t.emailAction}
                        </a>
                      ) : null}
                      {!hasContactActions ? <span className="crm-row-actions__empty">{t.noRowActions}</span> : null}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AdminTable>
  );
}
