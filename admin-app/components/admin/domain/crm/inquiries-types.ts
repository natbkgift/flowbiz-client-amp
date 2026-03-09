import { type AdminLocale } from "@/app/_lib/admin-i18n";

export type InquiryLocale = AdminLocale;

export type InquiryItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source_page: string | null;
  intent: string | null;
  purpose: string | null;
  follow_up_status: string | null;
  follow_up_due_at: string | null;
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
