import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InquiryKanbanBoard } from "@/components/admin/domain/crm/InquiryKanbanBoard";
import { InquiryListTable } from "@/components/admin/domain/crm/InquiryListTable";
import { inquiriesCopy } from "@/components/admin/domain/crm/inquiries-copy";
import type { InquiryItem } from "@/components/admin/domain/crm/inquiries-types";

const inquiryItem: InquiryItem = {
  id: "inq-1",
  name: "",
  email: "jane@example.com",
  phone: null,
  status: "new",
  source_page: "/condo",
  intent: "invest",
  purpose: "investment lead",
  follow_up_status: "pending",
  follow_up_due_at: "2026-03-21T10:00:00.000Z",
  created_at: "2026-03-21T08:00:00.000Z",
  whatsapp_url: null,
  phone_url: null,
  email_url: null,
  is_spam_hint: false,
  is_duplicate_hint: false,
};

describe("admin inquiries disabled state", () => {
  it("disables the moving inquiry row in table view", () => {
    render(
      <InquiryListTable
        t={inquiriesCopy.en}
        locale="en"
        items={[inquiryItem]}
        selectedId={inquiryItem.id}
        movingInquiryId={inquiryItem.id}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /jane@example\.com/i })).toBeDisabled();
  });

  it("disables the moving inquiry card and status select in kanban view", () => {
    render(
      <InquiryKanbanBoard
        t={inquiriesCopy.en}
        locale="en"
        items={[inquiryItem]}
        selectedId={inquiryItem.id}
        movingInquiryId={inquiryItem.id}
        onSelect={vi.fn()}
        onMoveStatus={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /jane@example\.com \/condo · invest investment lead pending/i })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /status/i })).toBeDisabled();
    expect(screen.getByText("/condo · invest")).toBeInTheDocument();
    expect(screen.getByText("Updating inquiry status")).toBeInTheDocument();
  });
});
