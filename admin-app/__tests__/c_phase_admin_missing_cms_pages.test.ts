import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("Phase C missing CMS pages", () => {
  it("registers all new CMS routes in admin navigation", () => {
    const nav = read("app/_lib/admin-nav.ts");
    expect(nav).toContain("/admin/projects");
    expect(nav).toContain("/admin/properties");
    expect(nav).toContain("/admin/areas");
    expect(nav).toContain("/admin/developers");
    expect(nav).toContain("/admin/company");
    expect(nav).toContain("/admin/testimonials");
  });

  it("provides projects/properties/areas/developers/company/testimonials pages under /admin", () => {
    const routeChecks: Array<{ file: string; expected: string[] }> = [
      {
        file: "app/admin/projects/page.tsx",
        expected: ["/admin/projects", "/admin/projects/{id}", "/admin/projects/{id}/publish"],
      },
      {
        file: "app/admin/properties/page.tsx",
        expected: [
          "/admin/properties",
          "/admin/properties/{id}",
          "/admin/properties/{id}/publish",
          "/admin/properties/{id}/unpublish",
        ],
      },
      {
        file: "app/admin/areas/page.tsx",
        expected: ["/admin/areas", "/admin/areas/{id}", "/admin/areas/{id}/publish"],
      },
      {
        file: "app/admin/developers/page.tsx",
        expected: ["/admin/developers", "/admin/developers/{id}", "/admin/developers/{id}/publish"],
      },
      {
        file: "app/admin/company/page.tsx",
        expected: ["/admin/company", "/admin/company/{id}"],
      },
      {
        file: "app/admin/testimonials/page.tsx",
        expected: ["/admin/testimonials", "/admin/testimonials/{id}", "/admin/testimonials/{id}/publish"],
      },
    ];

    for (const check of routeChecks) {
      const page = read(check.file);
      expect(page).toContain("AdminJsonCrudWorkspace");
      for (const endpoint of check.expected) {
        expect(page).toContain(endpoint);
      }
    }
  });

  it("migrates selected admin pages to shared form primitives instead of direct JSON editing", () => {
    const projects = read("app/admin/projects/page.tsx");
    const properties = read("app/admin/properties/page.tsx");
    const testimonials = read("app/admin/testimonials/page.tsx");
    const workspace = read("components/admin/AdminJsonCrudWorkspace.tsx");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");

    expect(panels).toContain("AdminFormPrimitiveInput");
    expect(workspace).toContain("validatePrimitiveValues");
    expect(workspace).toContain("toPrimitivePayload");

    expect(projects).toContain("createFormFields");
    expect(projects).toContain("type: \"status\"");
    expect(projects).toContain("type: \"relation\"");
    expect(projects).toContain("type: \"media\"");

    expect(properties).toContain("createFormFields");
    expect(properties).toContain("type: \"status\"");
    expect(properties).toContain("type: \"relation\"");
    expect(properties).toContain("type: \"media\"");

    expect(testimonials).toContain("createFormFields");
    expect(testimonials).toContain("type: \"status\"");
    expect(testimonials).toContain("type: \"relation\"");
    expect(testimonials).toContain("type: \"media\"");
  });

  it("configures blog workspace as form-first with preview and publish checklist", () => {
    const blog = read("app/admin/blog/page.tsx");
    const workspace = read("components/admin/AdminJsonCrudWorkspace.tsx");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");

    expect(blog).toContain("createFormFields");
    expect(blog).toContain("patchFormFields");
    expect(blog).toContain("previewConfig");
    expect(blog).toContain("publishChecklistConfig");
    expect(blog).toContain("warningLocales: [\"th\"]");
    expect(blog).toContain("options: [\"blog\", \"guide\"]");
    expect(workspace).toContain("Publish blocked by checklist requirements.");
    expect(panels).toContain("Create locale tabs");
    expect(panels).toContain("Update locale tabs");
    expect(panels).toContain("Translation completeness");
    expect(panels).toContain("<LogCard");
    expect(panels).toContain('title="Preview"');
  });

  it("wires taxonomy registry usage into article and property/project forms", () => {
    const blog = read("app/admin/blog/page.tsx");
    const projects = read("app/admin/projects/page.tsx");
    const properties = read("app/admin/properties/page.tsx");

    expect(blog).toContain("/admin/content/taxonomies");
    expect(blog).toContain("kind=tag");
    expect(blog).toContain("kind=topic");

    expect(projects).toContain("/admin/content/taxonomies");
    expect(projects).toContain("kind=property_type");
    expect(projects).toMatch(/name:\s*"property_type"[\s\S]*?type:\s*"text"/);

    expect(properties).toContain("/admin/content/taxonomies");
    expect(properties).toContain("kind=property_type");
    expect(properties).toMatch(/name:\s*"property_type"[\s\S]*?type:\s*"text"/);
  });

  it("enables property listing publish quality gate and bulk action endpoints in UI config", () => {
    const properties = read("app/admin/properties/page.tsx");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");

    expect(properties).toContain("publishChecklistConfig");
    expect(properties).toContain("requiredNumericGreaterThanZeroPaths");
    expect(properties).toContain("requiredLocalMediaAnyOfPaths");
    expect(properties).toContain("requiredAnyOfPaths");

    expect(properties).toContain("/admin/properties/bulk/status");
    expect(properties).toContain("/admin/properties/bulk/tags");
    expect(properties).toContain("/admin/properties/bulk/update");
    expect(panels).toContain("Bulk actions");
  });
});
