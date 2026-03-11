import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem } from "@/components/admin/domain/crm/inquiries-types";

export function InquiryContactActions({ t, selected }: { t: InquiryCopy; selected: InquiryItem }) {
  const hasActions = Boolean(selected.whatsapp_url || selected.phone_url || selected.email_url);

  return (
    <section aria-label={t.contactActions} className="crm-detail-section">
      <h3>{t.contactActions}</h3>
      <p className="crm-section-description">{t.contactActionsDescription}</p>
      {hasActions ? (
        <div className="card-actions">
          {selected.whatsapp_url ? (
            <a className="btn btn-secondary" href={selected.whatsapp_url} target="_blank" rel="noreferrer">
              {t.whatsapp}
            </a>
          ) : null}
          {selected.phone_url ? (
            <a className="btn btn-secondary" href={selected.phone_url}>
              {t.phone}
            </a>
          ) : null}
          {selected.email_url ? (
            <a className="btn btn-secondary" href={selected.email_url}>
              {t.emailAction}
            </a>
          ) : null}
        </div>
      ) : (
        <div className="state-empty">{t.contactActionsEmpty}</div>
      )}
    </section>
  );
}
