import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { InquiryContactActions } from "@/components/admin/domain/crm/InquiryContactActions";
import { InquiryFollowUpPanel } from "@/components/admin/domain/crm/InquiryFollowUpPanel";
import { InquiryTimelinePanel } from "@/components/admin/domain/crm/InquiryTimelinePanel";
import type { InquiryItem, InquiryLocale, TimelineEvent } from "@/components/admin/domain/crm/inquiries-types";
import { prettyDate } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryDetailPanel({
  t,
  locale,
  selected,
  followUpStatus,
  followUpDueAt,
  savingFollowUp,
  followUpError,
  timeline,
  timelineError,
  onFollowUpStatusChange,
  onFollowUpDueAtChange,
  onSaveFollowUp,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  selected: InquiryItem | null;
  followUpStatus: string;
  followUpDueAt: string;
  savingFollowUp: boolean;
  followUpError: string | null;
  timeline: TimelineEvent[];
  timelineError: string | null;
  onFollowUpStatusChange: (value: string) => void;
  onFollowUpDueAtChange: (value: string) => void;
  onSaveFollowUp: () => void | Promise<void>;
}) {
  if (!selected) {
    return <div className="state-empty">{t.noDetails}</div>;
  }

  return (
    <>
      <div className="crm-meta-grid">
        <p>
          <strong>{t.intent}:</strong> {selected.purpose || "-"}
        </p>
        <p>
          <strong>{t.status}:</strong> {selected.status}
        </p>
        <p>
          <strong>{t.followUp}:</strong> {selected.follow_up_status || "-"}
        </p>
        <p>
          <strong>{t.followUpDueAt}:</strong> {prettyDate(selected.follow_up_due_at, locale)}
        </p>
        <p>
          <strong>{t.sourcePage}:</strong> {selected.source_page || "-"}
        </p>
        <p>
          <strong>{t.createdAt}:</strong> {prettyDate(selected.created_at, locale)}
        </p>
      </div>

      <InquiryContactActions t={t} selected={selected} />
      <InquiryFollowUpPanel
        t={t}
        followUpStatus={followUpStatus}
        followUpDueAt={followUpDueAt}
        savingFollowUp={savingFollowUp}
        followUpError={followUpError}
        onFollowUpStatusChange={onFollowUpStatusChange}
        onFollowUpDueAtChange={onFollowUpDueAtChange}
        onSave={onSaveFollowUp}
      />
      <InquiryTimelinePanel t={t} locale={locale} timeline={timeline} timelineError={timelineError} />
    </>
  );
}
