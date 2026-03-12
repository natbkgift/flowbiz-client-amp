import { AdminTable } from "@/components/admin/AdminPrimitives";
import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem, InquiryLocale } from "@/components/admin/domain/crm/inquiries-types";
import { dueClass, prettyDate, translateFollowUpStatus, translateInquiryStatus } from "@/components/admin/domain/crm/inquiries-utils";

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
    <AdminTable caption={t.list} className="crm-table-wrap">
      <table className="dashboard-table crm-table" aria-label={t.list}>
        <thead>
          <tr>
            <th scope="col">{t.list}</th>
            <th scope="col">{t.status}</th>
            <th scope="col">{t.followUp}</th>
            <th scope="col">{t.followUpDueAt}</th>
            <th scope="col">{t.createdAt}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={selectedId === item.id ? "is-active" : ""}>
              <td>
                <button
                  type="button"
                  className="crm-table-select"
                  aria-pressed={selectedId === item.id}
                  disabled={movingInquiryId === item.id}
                  onClick={() => void onSelect(item.id)}
                >
                  <span>{item.name}</span>
                  <small className="crm-table-select-meta">
                    {[item.source_page, item.intent].filter(Boolean).join(" · ") || "-"}
                  </small>
                </button>
              </td>
              <td>{translateInquiryStatus(item.status, locale)}</td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTable>
  );
}
