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
    expect(page).toContain("/admin/media/integrity-report?orphan_sample_limit=20");
    expect(page).toContain("/admin/media?limit=40");
    expect(page).toContain("/admin/media/upload");
    expect(page).toContain("/archive?block_if_used=false");
    expect(page).toContain("/restore");
    expect(page).toContain("/replace");
    expect(page).toContain("/usage");
    expect(page).toContain("/admin/media/projects/");
    expect(page).toContain("/admin/media/properties/");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
  });

  it("imports workspace uses list + import run endpoints", () => {
    const page = read("app/admin/imports/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain('fetch("/v1/auth/login"');
    expect(page).toContain("/admin/properties/imports?");
    expect(page).toContain("/admin/properties/import?dry_run=");
    expect(page).toContain("/admin/dashboard/health-summary");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
  });

  it("domain workspace uses domain CRUD + publish APIs and dashboard summaries", () => {
    const page = read("app/admin/domain/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain("ADMIN_AUTH_LOGIN_PATH");
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

  it("home composer workspace uses shared admin auth helper", () => {
    const page = read("app/admin/home-composer/page.tsx");
    expect(page).toContain("from '@/app/_lib/admin-auth'");
    expect(page).toContain("from '@/app/_lib/local-media'");
    expect(page).toContain("loginAdmin");
    expect(page).not.toContain("fetch('/v1/auth/login'");
    expect(page).toContain("Hero image media picker");
    expect(page).toContain("Hero image must use local media only.");
    expect(page).toContain("Choose media");
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
});
