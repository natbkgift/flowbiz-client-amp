import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AdminFormPrimitiveInput,
  type AdminFormPrimitiveField,
  initializePrimitiveValues,
  toPrimitivePayload,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";

describe("Admin form primitives", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("parses json primitive values and rejects invalid json values", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "amenities", label: "Facilities", type: "json" },
      { name: "investment_snapshot", label: "Investment snapshot", type: "json" },
    ];

    expect(
      toPrimitivePayload(fields, {
        amenities: '["pool","gym"]',
        investment_snapshot: '{"source":"Internal Desk","updated_at":"2026-03-01"}',
      })
    ).toEqual({
      amenities: ["pool", "gym"],
      investment_snapshot: { source: "Internal Desk", updated_at: "2026-03-01" },
    });

    expect(validatePrimitiveValues(fields, { amenities: "[", investment_snapshot: "{}" })).toEqual({
      amenities: "Facilities is invalid.",
    });
  });

  it("initializes json primitive fields with formatted object/array defaults", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "amenities", label: "Facilities", type: "json" },
      { name: "investment_snapshot", label: "Investment snapshot", type: "json" },
    ];

    const values = initializePrimitiveValues(
      fields,
      JSON.stringify({
        amenities: ["pool", "gym"],
        investment_snapshot: { source: "Internal Desk", updated_at: "2026-03-01" },
      })
    );

    expect(values.amenities).toBe(JSON.stringify(["pool", "gym"], null, 2));
    expect(values.investment_snapshot).toBe(
      JSON.stringify({ source: "Internal Desk", updated_at: "2026-03-01" }, null, 2)
    );
  });

  it("normalizes local media path payload and rejects invalid media payloads", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "hero_image_url", label: "Hero image", type: "media" },
      { name: "cover_media_id", label: "Cover media", type: "media" },
    ];

    expect(
      toPrimitivePayload(fields, {
        hero_image_url: "media/library/hero.webp",
        cover_media_id: "media-001",
      })
    ).toEqual({
      hero_image_url: "/media/library/hero.webp",
      cover_media_id: "media-001",
    });

    expect(() =>
      toPrimitivePayload(fields, {
        hero_image_url: "https://cdn.example.com/hero.webp",
        cover_media_id: "media-001",
      })
    ).toThrow('Invalid media value for field "hero_image_url".');

    expect(() =>
      toPrimitivePayload(fields, {
        hero_image_url: "/not-local/hero.webp",
        cover_media_id: "media-001",
      })
    ).toThrow('Invalid media value for field "hero_image_url".');
  });

  it("rejects external URL input for media fields", () => {
    const fields: AdminFormPrimitiveField[] = [
      { name: "hero_image_url", label: "Hero image", type: "media", required: true },
    ];
    expect(validatePrimitiveValues(fields, { hero_image_url: "https://cdn.example.com/hero.webp" })).toEqual({
      hero_image_url: "Hero image must use local media only.",
    });
  });

  it("opens media picker and maps selected metadata to media id fields", async () => {
    const handleChange = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "media-001", storage_path: "/media/library/hero.webp" }] }),
    } as Response);

    render(
      <AdminFormPrimitiveInput
        idPrefix="test-form"
        field={{ name: "cover_media_id", label: "Cover media", type: "media" }}
        value=""
        authToken="token-123"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose media" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "/media/library/hero.webp" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "/media/library/hero.webp" }));
    expect(handleChange).toHaveBeenCalledWith("cover_media_id", "media-001");
  });

  it("maps selected metadata to local path fields", async () => {
    const handleChange = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "media-010", storage_path: "media/library/blog.webp" }] }),
    } as Response);

    render(
      <AdminFormPrimitiveInput
        idPrefix="test-form"
        field={{ name: "hero_image_url", label: "Hero image", type: "media" }}
        value=""
        authToken="token-123"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose media" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "media/library/blog.webp" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "media/library/blog.webp" }));
    expect(handleChange).toHaveBeenCalledWith("hero_image_url", "/media/library/blog.webp");
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
