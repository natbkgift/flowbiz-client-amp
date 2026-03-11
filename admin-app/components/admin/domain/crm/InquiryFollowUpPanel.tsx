import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { FOLLOW_UP_STATUSES } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryFollowUpPanel({
  t,
  followUpStatus,
  followUpDueAt,
  savingFollowUp,
  followUpError,
  followUpNotice,
  onFollowUpStatusChange,
  onFollowUpDueAtChange,
  onSave,
}: {
  t: InquiryCopy;
  followUpStatus: string;
  followUpDueAt: string;
  savingFollowUp: boolean;
  followUpError: string | null;
  followUpNotice: string | null;
  onFollowUpStatusChange: (value: string) => void;
  onFollowUpDueAtChange: (value: string) => void;
  onSave: () => void | Promise<void>;
}) {
  return (
    <section aria-label={t.followUp} className="crm-detail-section">
      <h3>{t.followUp}</h3>
      <p className="crm-section-description">{t.followUpDescription}</p>
      <div className="crm-follow-up-grid">
        <label className="field" htmlFor="follow-up-status">
          <span>{t.followUp}</span>
          <select id="follow-up-status" value={followUpStatus} onChange={(event) => onFollowUpStatusChange(event.target.value)}>
            {FOLLOW_UP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="follow-up-due-at">
          <span>{t.followUpDueAt}</span>
          <input id="follow-up-due-at" type="datetime-local" value={followUpDueAt} onChange={(event) => onFollowUpDueAtChange(event.target.value)} />
        </label>
      </div>
      {followUpError ? <p className="state-error">{followUpError}</p> : null}
      {followUpNotice ? <p className="state-success">{followUpNotice}</p> : null}
      <div className="card-actions">
        <button className="btn" type="button" onClick={() => void onSave()} disabled={savingFollowUp}>
          {savingFollowUp ? t.saving : t.saveFollowUp}
        </button>
      </div>
    </section>
  );
}
