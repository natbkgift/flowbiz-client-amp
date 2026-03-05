import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AdminFormPrimitiveInput,
  type AdminFormPrimitiveField,
  toPrimitivePayload,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";

describe("Admin form primitives", () => {
  it("validates required and invalid values using a consistent message format", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "status", label: "Status", type: "status", required: true, options: ["draft", "active"] },
      { name: "price", label: "Price", type: "number" },
    ];

    expect(validatePrimitiveValues(fields, { status: "", price: "abc" })).toEqual({
      status: "Status is required.",
      price: "Price is invalid.",
    });

    expect(validatePrimitiveValues(fields, { status: "archived", price: "100" })).toEqual({
      status: "Status is invalid.",
    });
  });

  it("builds payload from relation/media primitives and omits empty optional fields", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "status", label: "Status", type: "status", required: true },
      { name: "project_id", label: "Project ID", type: "relation" },
      { name: "cover_media_id", label: "Cover media", type: "media" },
      { name: "summary.en", label: "Summary (EN)", type: "textarea" },
    ];

    expect(
      toPrimitivePayload(fields, {
        status: "draft",
        project_id: "project-01",
        cover_media_id: "",
        "summary.en": "Summary text",
      })
    ).toEqual({
      status: "draft",
      project_id: "project-01",
      summary: { en: "Summary text" },
    });
  });

  it("keeps label/aria/error association for a11y baseline", () => {
    const field: AdminFormPrimitiveField = { name: "status", label: "Status", type: "status", required: true };
    const handleChange = (_name: string, _value: string) => {};

    render(
      <AdminFormPrimitiveInput
        idPrefix="test-form"
        field={field}
        value=""
        error="Status is required."
        onChange={handleChange}
      />
    );

    const select = screen.getByRole("combobox", { name: /Status/ });
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", "test-form-status-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Status is required.");

    fireEvent.change(select, { target: { value: "draft" } });
  });
});
