import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryLocale, TimelineEvent } from "@/components/admin/domain/crm/inquiries-types";
import { prettyDate } from "@/components/admin/domain/crm/inquiries-utils";

export function InquiryTimelinePanel({
  t,
  locale,
  timeline,
  timelineError,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  timeline: TimelineEvent[];
  timelineError: string | null;
}) {
  return (
    <section aria-label={t.timeline}>
      <h3>{t.timeline}</h3>
      {timelineError ? <div className="state-error">{timelineError}</div> : null}
      {timeline.length === 0 ? (
        <div className="state-empty">-</div>
      ) : (
        <ol className="crm-timeline">
          {timeline.map((event) => (
            <li key={event.id}>
              <p>
                <strong>{event.action}</strong> · {prettyDate(event.created_at, locale)}
              </p>
              {event.note ? <p className="locale-safe">{event.note}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
