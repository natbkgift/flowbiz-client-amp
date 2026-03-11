import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B14 admin workspace pages contract", () => {
  it("media workspace uses auth/session flow and full media CRUD endpoints", () => {
    const page = read("app/admin/media/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("ADMIN_AUTH_LOGIN_PATH");
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).toContain("AUTH_SESSION_STORAGE_KEY");
    expect(page).toContain("LEGACY_TOKEN_STORAGE_KEY");
    expect(page).toContain('fetch(`/api${path}`');
    expect(page).toContain("AdminWorkspaceErrorState");
    expect(page).toContain("formatWorkspaceErrorMessage");
    expect(page).toContain("/admin/media/integrity-report?orphan_sample_limit=20");
    expect(page).toContain("/admin/media?limit=40");
    expect(page).toContain("/admin/media/upload");
    expect(page).toContain("/archive?block_if_used=false");
    expect(page).toContain("/restore");
    expect(page).toContain("/replace");
    expect(page).toContain("/usage");
    expect(page).toContain("/admin/media/projects/");
    expect(page).toContain("/admin/media/properties/");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--actions");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--records");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain("state-success");
    expect(page).toContain("parseJsonObject(");
    expect(page).toContain("invalidPatchJson");
    expect(page).toContain("invalidGalleryPayload");
    expect(page).toContain("archiveConfirm");
    expect(page).toContain("window.confirm");
  });

  it("imports workspace uses list + import run endpoints", () => {
    const page = read("app/admin/imports/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).toContain('fetch(`/api${path}`');
    expect(page).toContain("AdminWorkspaceErrorState");
    expect(page).toContain("formatWorkspaceErrorMessage");
    expect(page).toContain("/admin/properties/imports?");
    expect(page).toContain("/admin/properties/import?dry_run=");
    expect(page).toContain("/admin/dashboard/health-summary");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--actions");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--records");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain("state-success");
    expect(page).toContain("setImportNotice");
    expect(page).toContain("importResultHint");
  });

  it("domain workspace uses domain CRUD + publish APIs and dashboard summaries", () => {
    const page = read("app/admin/domain/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("ADMIN_AUTH_LOGIN_PATH");
    expect(page).toContain("admin-overflow-guard");
    expect(page).toContain("domain-editor-card");
    expect(page).toContain("AdminWorkspaceErrorState");
    expect(page).toContain("formatWorkspaceErrorMessage");
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).toContain("/admin/areas?limit=40");
    expect(page).toContain("/admin/developers?limit=40");
    expect(page).toContain("/admin/projects?limit=40");
    expect(page).toContain("/admin/dashboard/health-summary");
    expect(page).toContain("pending_translations");
    expect(page).toContain("unpublished_drafts");
    expect(page).toContain("/publish");
    expect(page).toContain("/unpublish");
    expect(page).toContain("/statistics");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
  });

  it("areas and developers workspaces use form-first localized editors with readiness checks", () => {
    const areasPage = read("app/admin/areas/page.tsx");
    expect(areasPage).toContain("createFormFields");
    expect(areasPage).toContain("patchFormFields");
    expect(areasPage).toContain("content.en.why_live_invest");
    expect(areasPage).toContain("content.th.why_live_invest");
    expect(areasPage).toContain("/admin/areas/{id}/publish-readiness");
    expect(areasPage).toContain("/admin/areas/{id}/publish");
    expect(areasPage).toContain("/admin/areas/{id}/unpublish");

    const developersPage = read("app/admin/developers/page.tsx");
    expect(developersPage).toContain("createFormFields");
    expect(developersPage).toContain("patchFormFields");
    expect(developersPage).toContain("profile.en");
    expect(developersPage).toContain("profile.th");
    expect(developersPage).toContain("trust_proof");
    expect(developersPage).toContain("/admin/developers/{id}/publish-readiness");
    expect(developersPage).toContain("/admin/developers/{id}/publish");
    expect(developersPage).toContain("/admin/developers/{id}/unpublish");
  });

  it("review queue workspace targets in_review items awaiting approval", () => {
    const page = read("app/admin/review-queue/page.tsx");
    const nav = read("app/_lib/admin-nav.ts");

    expect(page).toContain("Editorial Review Queue");
    expect(page).toContain("defaultListQuery: \"status=in_review&limit=40\"");
    expect(page).toContain("options: [\"approved\"]");
    expect(page).toContain("/admin/content/articles");
    expect(nav).toContain("/admin/review-queue");
  });

  it("blog workspace wires revision history, diff, and restore endpoints", () => {
    const page = read("app/admin/blog/page.tsx");
    expect(page).toContain("/admin/content/articles/{id}/revisions");
    expect(page).toContain("/admin/content/articles/{id}/revisions/{revisionId}/diff");
    expect(page).toContain("/admin/content/articles/{id}/revisions/{revisionId}/restore");
  });

  it("users workspace avoids default credentials and masks password fields", () => {
    const page = read("app/admin/users/page.tsx");
    expect(page).toContain("User & Role Management");
    expect(page).toContain("/admin/users");
    expect(page).not.toContain("new-admin@example.com");
    expect(page).not.toContain("initial-password-123");
    expect(page).toContain('type: "password"');
  });

  it("home composer workspace uses shared admin auth helper", () => {
    const page = read("app/admin/home-composer/page.tsx");
    expect(page).toContain("from '@/app/_lib/admin-auth'");
    expect(page).toContain("from '@/app/_lib/local-media'");
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain("fetch('/v1/auth/login'");
    expect(page).toContain("Hero image media picker");
    expect(page).toContain("Hero image must use local media only.");
    expect(page).toContain("Choose media");
    expect(page).toContain("publishConfirm");
    expect(page).toContain("window.confirm");
  });

  it("login page uses canonical shared admin auth contract", () => {
    const page = read("app/login/page.tsx");
    expect(page).toContain("from '@/app/_lib/admin-auth'");
    expect(page).toContain("loginAdmin");
    expect(page).toContain("ADMIN_AUTH_LOGIN_PATH");
    expect(page).toContain("persistAuthSession");
    expect(page).not.toContain("'/v1/auth/login'");
    expect(page).not.toContain('"/v1/auth/login"');
  });

  it("admin login forms do not prefill credentials from stored sessions", () => {
    const loginPages = [
      {
        stateFile: "app/admin/dashboard/page.tsx",
        formFile: "components/admin/domain/dashboard/AdminDashboardScreen.tsx",
      },
      { stateFile: "app/admin/domain/page.tsx" },
      { stateFile: "app/admin/seo/page.tsx" },
      { stateFile: "app/admin/layout/page.tsx" },
      { stateFile: "app/admin/media/page.tsx" },
      {
        stateFile: "app/admin/inquiries/page.tsx",
        formFile: "components/admin/domain/crm/InquiryControlCenter.tsx",
      },
      { stateFile: "app/admin/imports/page.tsx" },
      { stateFile: "app/admin/home-composer/page.tsx" },
    ];

    for (const { stateFile, formFile } of loginPages) {
      const page = read(stateFile);
      const formSource = read(formFile || stateFile);
      expect(page).toMatch(/\[loginEmail,\s*setLoginEmail\]\s*=\s*useState\((["'])\1\);/);
      expect(page).toMatch(/\[loginPassword,\s*setLoginPassword\]\s*=\s*useState\((["'])\1\);/);
      expect(page).not.toMatch(/setLoginEmail\([^)]*\.email[^)]*\)/);
      expect(formSource).toContain('name="email"');
      expect(formSource).toContain('name="password"');
      expect(formSource).toContain('autoComplete="username"');
      expect(formSource).toContain('autoComplete="current-password"');
    }
  });
});
