import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem, InquiryLocale, SalesAutomationItem } from "@/components/admin/domain/crm/inquiries-types";
import { prettyDate } from "@/components/admin/domain/crm/inquiries-utils";

function humanizeToken(locale: InquiryLocale, value: string | null | undefined): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "-";

  const known: Record<string, { en: string; th: string }> = {
    high: { en: "High", th: "สูง" },
    medium: { en: "Medium", th: "กลาง" },
    low: { en: "Low", th: "ต่ำ" },
    senior: { en: "Senior queue", th: "คิว senior" },
    default: { en: "Default queue", th: "คิวปกติ" },
    email_if_connected: { en: "Email when connected", th: "อีเมลเมื่อระบบส่งเชื่อมต่อแล้ว" },
    email_and_whatsapp_if_connected: { en: "Email + WhatsApp available", th: "อีเมลและ WhatsApp พร้อมใช้งาน" },
    phone_priority_if_connected: { en: "Phone / WhatsApp first", th: "โทรหรือ WhatsApp ก่อน" },
    whatsapp_or_line_if_connected: { en: "WhatsApp / LINE when connected", th: "WhatsApp / LINE เมื่อระบบส่งเชื่อมต่อแล้ว" },
    on_page_confirmation: { en: "On-page confirmation", th: "ข้อความยืนยันบนหน้าเว็บ" },
    project_consultation: { en: "Project consultation", th: "คุยต่อจากหน้าโครงการ" },
    project_shortlist: { en: "Project shortlist", th: "ขอ shortlist" },
    project_compare: { en: "Project compare", th: "คุยต่อจาก compare" },
    general_inquiry: { en: "General inquiry", th: "สอบถามทั่วไป" },
  };
  const knownLabel = known[normalized.toLowerCase()];
  if (knownLabel) {
    return locale === "th" ? knownLabel.th : knownLabel.en;
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function decodeProjectName(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function projectSummary(item: SalesAutomationItem): string {
  if (!item.projects.length) return "-";
  return item.projects.map(decodeProjectName).join(", ");
}

export function InquiryAdvisorAssistPanel({
  t,
  locale,
  selected,
}: {
  t: InquiryCopy;
  locale: InquiryLocale;
  selected: InquiryItem;
}) {
  const automation = selected.sales_automation;
  if (!automation) return null;

  return (
    <section aria-label={t.advisorAssist} className="crm-detail-section">
      <div className="crm-detail-summary__head">
        <h3>{t.advisorAssist}</h3>
        <div className="crm-detail-summary__badges">
          <span className={`crm-chip ${automation.priority_label === "high" ? "crm-chip-warn" : automation.priority_label === "medium" ? "crm-chip-sla" : "crm-chip-muted"}`}>
            {t.priorityLabel}: {humanizeToken(locale, automation.priority_label)}
          </span>
          <span className="crm-chip crm-chip-muted">
            {t.responseChannel}: {humanizeToken(locale, automation.response_channel)}
          </span>
        </div>
      </div>
      <p className="crm-section-description">{t.advisorAssistDescription}</p>

      <dl className="crm-meta-grid crm-meta-grid--detail crm-meta-grid--assist">
        <div>
          <dt>{t.intent}</dt>
          <dd>{humanizeToken(locale, automation.intent)}</dd>
        </div>
        <div>
          <dt>{t.projectsInScope}</dt>
          <dd>{projectSummary(automation)}</dd>
        </div>
        <div>
          <dt>{t.buyerFit}</dt>
          <dd>{humanizeToken(locale, automation.buyer_fit)}</dd>
        </div>
        <div>
          <dt>{t.signalLevel}</dt>
          <dd>{humanizeToken(locale, automation.signal_level)}</dd>
        </div>
        <div>
          <dt>{t.routeHint}</dt>
          <dd>{humanizeToken(locale, automation.route_hint)}</dd>
        </div>
        <div>
          <dt>{t.followUpDueAt}</dt>
          <dd>{prettyDate(automation.next_follow_up_at, locale)}</dd>
        </div>
      </dl>

      <div className="crm-assist-stack">
        <div className="crm-assist-card">
          <h4>{t.instantResponse}</h4>
          <p className="crm-assist-copy"><strong>{automation.confirmation_title}</strong></p>
          <p className="crm-assist-copy">{automation.confirmation_body}</p>
          <p className="crm-assist-copy">{automation.auto_response_message}</p>
        </div>

        <div className="crm-assist-card">
          <h4>{t.recommendedApproach}</h4>
          <p className="crm-assist-copy">{automation.recommended_approach}</p>
        </div>

        <div className="crm-assist-card">
          <h4>{t.suggestedFirstReply}</h4>
          <p className="crm-assist-copy">{automation.suggested_first_reply}</p>
        </div>
      </div>

      <div className="crm-assist-card">
        <h4>{t.followUpPlan}</h4>
        <ol className="crm-timeline crm-timeline--compact">
          {automation.follow_up_plan.map((step) => (
            <li key={`${step.stage}-${step.due_at ?? "none"}`}>
              <p>
                <strong>{step.label}</strong>
                {step.due_at ? ` · ${prettyDate(step.due_at, locale)}` : ""}
              </p>
              <p className="locale-safe">{step.message}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="crm-assist-card">
        <h4>{t.stopConditions}</h4>
        <ul className="bullet-list">
          {automation.stop_conditions.map((condition) => (
            <li key={condition}>{humanizeToken(locale, condition)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}