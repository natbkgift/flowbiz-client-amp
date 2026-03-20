import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { InquiryAdvisorAssistPanel } from "@/components/admin/domain/crm/InquiryAdvisorAssistPanel";
import { InquiryContactActions } from "@/components/admin/domain/crm/InquiryContactActions";
import { InquiryFollowUpPanel } from "@/components/admin/domain/crm/InquiryFollowUpPanel";
import { InquiryTimelinePanel } from "@/components/admin/domain/crm/InquiryTimelinePanel";
import type { InquiryItem, InquiryLocale, TimelineEvent } from "@/components/admin/domain/crm/inquiries-types";
import { prettyDate, translateFollowUpStatus, translateInquiryStatus } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryDetailPanel({
  t,
  locale,
  selected,
  detailLoading,
  followUpStatus,
  followUpDueAt,
  savingFollowUp,
  followUpError,
  followUpNotice,
  timeline,
  timelineError,
  onFollowUpStatusChange,
  onFollowUpDueAtChange,
  onSaveFollowUp,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  selected: InquiryItem | null;
  detailLoading: boolean;
  followUpStatus: string;
  followUpDueAt: string;
  savingFollowUp: boolean;
  followUpError: string | null;
  followUpNotice: string | null;
  timeline: TimelineEvent[];
  timelineError: string | null;
  onFollowUpStatusChange: (value: string) => void;
  onFollowUpDueAtChange: (value: string) => void;
  onSaveFollowUp: () => void | Promise<void>;
}) {
  if (!selected) {
    return detailLoading ? <div className="state-loading">{t.loadingDetails}</div> : <div className="state-empty">{t.noDetails}</div>;
  }

  return (
    <>
      <div className="crm-detail-section crm-detail-summary">
        <div className="crm-detail-summary__head">
          <h3>{selected.name || t.details}</h3>
          <div className="crm-detail-summary__badges">
            <span className="crm-chip crm-chip-muted">{translateInquiryStatus(selected.status, locale)}</span>
            <span className="crm-chip crm-chip-sla">{translateFollowUpStatus(selected.follow_up_status, locale)}</span>
          </div>
        </div>
        <p className="crm-section-description">{t.detailsDescription}</p>
      </div>

      <dl className="crm-meta-grid crm-meta-grid--detail">
        <div>
          <dt>{t.intent}</dt>
          <dd>{selected.purpose || selected.intent || "-"}</dd>
        </div>
        <div>
          <dt>{t.sourcePage}</dt>
          <dd>{selected.source_page || "-"}</dd>
        </div>
        <div>
          <dt>{t.createdAt}</dt>
          <dd>{prettyDate(selected.created_at, locale)}</dd>
        </div>
        <div>
          <dt>{t.followUpDueAt}</dt>
          <dd>{prettyDate(selected.follow_up_due_at, locale)}</dd>
        </div>
        <div>
          <dt>{t.emailAction}</dt>
          <dd>{selected.email || "-"}</dd>
        </div>
        <div>
          <dt>{t.phone}</dt>
          <dd>{selected.phone || "-"}</dd>
        </div>
      </dl>

      <InquiryAdvisorAssistPanel t={t} locale={locale} selected={selected} />
      <InquiryContactActions t={t} selected={selected} />
      <InquiryFollowUpPanel
        t={t}
        locale={locale}
        followUpStatus={followUpStatus}
        followUpDueAt={followUpDueAt}
        savingFollowUp={savingFollowUp}
        detailLoading={detailLoading}
        followUpError={followUpError}
        followUpNotice={followUpNotice}
        onFollowUpStatusChange={onFollowUpStatusChange}
        onFollowUpDueAtChange={onFollowUpDueAtChange}
        onSave={onSaveFollowUp}
      />
      <InquiryTimelinePanel t={t} locale={locale} timeline={timeline} timelineError={timelineError} />
    </>
  );
}
