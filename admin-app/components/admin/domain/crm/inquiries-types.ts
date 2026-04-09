import { type AdminLocale } from "@/app/_lib/admin-i18n";

export type InquiryLocale = AdminLocale;

export type SalesAutomationFollowUpStep = {
  stage: string;
  label: string;
  message: string;
  due_at: string | null;
};

export type SalesAutomationItem = {
  locale: string;
  intent: string;
  source: string | null;
  buyer_fit: string | null;
  signal_level: string | null;
  projects: string[];
  primary_project: string | null;
  response_channel: string;
  response_sla_seconds: number;
  auto_response_message: string;
  confirmation_title: string;
  confirmation_body: string;
  recommended_approach: string;
  suggested_first_reply: string;
  priority_label: string;
  priority_score: number;
  route_hint: string;
  next_follow_up_at: string | null;
  follow_up_status: string;
  follow_up_stage: string;
  follow_up_plan: SalesAutomationFollowUpStep[];
  stop_conditions: string[];
};

export type InquiryItem = {
  id: string;
  property_id?: string | null;
  project_id?: string | null;
  area_id?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message?: string | null;
  nationality?: string | null;
  status: string;
  source_page: string | null;
  session_id?: string | null;
  last_action?: string | null;
  last_event_id?: string | null;
  referrer?: string | null;
  device?: string | null;
  intent: string | null;
  purpose: string | null;
  budget_band?: string | null;
  budget_range?: string | null;
  follow_up_status: string | null;
  follow_up_due_at: string | null;
  tags?: string[] | null;
  sales_automation?: SalesAutomationItem | null;
  created_at: string;
  whatsapp_url: string | null;
  phone_url: string | null;
  email_url: string | null;
  is_spam_hint: boolean;
  is_duplicate_hint: boolean;
};

export type TimelineEvent = {
  id: string;
  action: string;
  note: string | null;
  created_at: string;
  actor_user_id: string | null;
  note_id?: string | null;
};

export type InquiryFilters = {
  status: string;
  source: string;
  purpose: string;
  date_from: string;
  date_to: string;
  follow_up_status: string;
  q: string;
};

export type SavedFilter = {
  id: string;
  role: string;
  name: string;
  filters: InquiryFilters;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export type InquiryViewMode = "table" | "kanban";

export type InquiryWorkspaceState = {
  draftFilters: InquiryFilters;
  appliedFilters: InquiryFilters;
  viewMode: InquiryViewMode;
  activeSavedFilterId: string;
};
