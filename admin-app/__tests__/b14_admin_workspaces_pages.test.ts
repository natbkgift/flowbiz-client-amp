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
    expect(page).toContain("AdminAccessGate");
    expect(page).toContain("AdminPrimaryActionBar");
    expect(page).toContain("AdminResponsiveList");
    expect(page).toContain("AdminSectionTabs");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--actions");
    expect(page).toContain("admin-workspace-panel admin-workspace-panel--records");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain("state-success");
    expect(page).toContain("admin-mobile-record-list");
    expect(page).toContain("parseJsonObject(");
    expect(page).toContain("invalidPatchJson");
    expect(page).toContain("invalidGalleryPayload");
    expect(page).toContain("operationResultHint");
    expect(page).toContain("selectionHint");
    expect(page).toContain('patchJson: "ข้อมูลอัปเดตแบบ JSON"');
    expect(page).toContain("archiveConfirm");
    expect(page).toContain("window.confirm");
    expect(page).toContain("emptyHint");
    expect(page).toContain('primaryAction={{ ...stickyPrimaryAction, disabled: !isAuthenticated || opBusy || loading');
    expect(page).toContain('className="state-empty admin-workspace-empty-state"');
    expect(page).toContain("listEmptyTitle");
    expect(page).toContain("openDashboard");
    expect(page).toContain("openSeo");
    expect(page).toContain('href={withAdminLocale("/admin/dashboard", locale)}');
    expect(page).toContain("operationSuccessTitle");
    expect(page).toContain('className="admin-workspace-success-handoff"');
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
    expect(page).toContain("AdminResponsiveList");
    expect(page).toContain("admin-mobile-record-list");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
    expect(page).toContain("state-success");
    expect(page).toContain("setImportNotice");
    expect(page).toContain("importResultHint");
    expect(page).toContain("importSelectionHint");
    expect(page).toContain("selectedFile");
    expect(page).toContain("selectedMode");
    expect(page).toContain('title: "Import Monitor"');
    expect(page).toContain('title: "ติดตามการนำเข้า"');
    expect(page).toContain('filterDryRun: "โหมดการรัน"');
    expect(page).toContain("emptyHint");
    expect(page).toContain("disabled={loading || importBusy}");
    expect(page).toContain('className="state-empty admin-workspace-empty-state"');
    expect(page).toContain("historyEmptyTitle");
    expect(page).toContain("openDashboard");
    expect(page).toContain("openMedia");
    expect(page).toContain('href={withAdminLocale("/admin/dashboard", locale)}');
    expect(page).toContain("importSuccessTitle");
    expect(page).toContain('className="admin-workspace-success-handoff"');
  });

  it("domain route is a read-only legacy hub that hands work off to the focused workspaces", () => {
    const page = read("app/admin/domain/page.tsx");
    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain('from "@/app/_lib/admin-auth-hooks"');
    expect(page).toContain("admin-overflow-guard");
    expect(page).toContain("AdminAccessGate");
    expect(page).toContain("AdminPrimaryActionBar");
    expect(page).toContain("AdminResponsiveList");
    expect(page).toContain("AdminSectionTabs");
    expect(page).toContain("formatWorkspaceErrorMessage");
    expect(page).toContain('"/api/admin/areas?limit=5"');
    expect(page).toContain('"/api/admin/developers?limit=5"');
    expect(page).toContain('"/api/admin/projects?limit=5"');
    expect(page).toContain('"/api/admin/dashboard/health-summary"');
    expect(page).toContain("pending_translations");
    expect(page).toContain("unpublished_drafts");
    expect(page).not.toContain("/statistics");
    expect(page).not.toContain("/publish");
    expect(page).not.toContain("/unpublish");
    expect(page).not.toContain("JSON editor");
    expect(page).toContain('href: "/admin/areas"');
    expect(page).toContain('href: "/admin/developers"');
    expect(page).toContain('href: "/admin/projects"');
    expect(page).toContain('href: withAdminLocale("/admin/dashboard", locale)');
    expect(page).toContain("state-loading");
    expect(page).toContain("state-error");
  });

  it("areas and developers workspaces use form-first localized editors with readiness checks", () => {
    const areasPage = read("app/admin/areas/page.tsx");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");
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
    expect(panels).toContain('const baseFieldsTitle = localizeCrudPanelsText("Base fields", "ข้อมูลหลัก")');
    expect(panels).toContain('const localizedFieldsTitle = localizeCrudPanelsText("Localized content", "เนื้อหาตามภาษา")');
    expect(panels).toContain('className="admin-workspace-form-section"');
    expect(panels).toContain('className="admin-workspace-form-intro state-empty"');
  });

  it("shared CRUD records and patch forms guide the next step when records are not loaded or selected yet", () => {
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");
    const styles = read("styles/admin-components.css");

    expect(panels).toContain('const patchIntroTitle = localizeCrudPanelsText("Update flow", "ลำดับการแก้ไขรายการ")');
    expect(panels).toContain('Load one record ID from the list first, then update grouped fields with a safer patch flow.');
    expect(panels).toContain('className="state-empty admin-workspace-empty-state"');
    expect(panels).toContain('Start from the list query panel, then load records before using record actions, patch, or bulk updates.');
    expect(styles).toContain('.admin-workspace-form-section {');
    expect(styles).toContain('.admin-workspace-empty-state,');
  });

  it("review queue workspace targets in_review items awaiting approval", () => {
    const page = read("app/admin/review-queue/page.tsx");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");
    const nav = read("app/_lib/admin-nav.ts");

    expect(page).toContain("Editorial Review Queue");
    expect(page).toContain("defaultListQuery: \"status=in_review&limit=40\"");
    expect(page).toContain("options: [\"approved\"]");
    expect(page).toContain("/admin/content/articles");
    expect(page).toContain('href: "/admin/blog"');
    expect(page).toContain('href: "/admin/seo"');
    expect(page).toContain('href: "/admin/dashboard"');
    expect(panels).toContain("function CrudWorkspaceFollowUpLinks(");
    expect(panels).toContain('className="admin-workspace-next-steps"');
    expect(nav).toContain("/admin/review-queue");
  });

  it("blog workspace wires revision history, diff, and restore endpoints", () => {
    const page = read("app/admin/blog/page.tsx");
    expect(page).toContain("/admin/content/articles/{id}/revisions");
    expect(page).toContain("/admin/content/articles/{id}/revisions/{revisionId}/diff");
    expect(page).toContain("/admin/content/articles/{id}/revisions/{revisionId}/restore");
    expect(page).toContain('href: "/admin/review-queue"');
    expect(page).toContain('href: "/admin/seo"');
    expect(page).toContain('href: "/admin/dashboard"');
  });

  it("shared CRUD workspaces expose follow-up links for downstream publish handoffs", () => {
    const types = read("components/admin/domain/crud-workspace/workspace-types.ts");
    const panels = read("components/admin/domain/crud-workspace/AdminCrudWorkspacePanels.tsx");
    const propertiesPage = read("app/admin/properties/page.tsx");
    const projectsPage = read("app/admin/projects/page.tsx");
    const taxonomyPage = read("app/admin/taxonomy/page.tsx");
    const videosPage = read("app/admin/videos/page.tsx");
    const companyPage = read("app/admin/company/page.tsx");
    const testimonialsPage = read("app/admin/testimonials/page.tsx");
    const usersPage = read("app/admin/users/page.tsx");

    expect(types).toContain("followUpLinks?: ReadonlyArray");
    expect(types).toContain("prerequisiteHints?: {");
    expect(types).toContain('| "restore-revision";');
    expect(panels).toContain("copy.nextStepsTitle");
    expect(panels).toContain("copy.nextStepsIdleBody");
    expect(panels).toContain("copy.nextStepsRecordsBody");
    expect(panels).toContain("copy.nextStepsRevisionsBody");
    expect(panels).toContain("copy.resultNextStepsTitle");
    expect(panels).toContain("function CrudWorkspacePrerequisiteHint(");
    expect(panels).toContain("function resultGuidanceBody(actionKey: CrudWorkspaceActionKey | null)");
    expect(panels).toContain('className="admin-workspace-result-guidance"');
    expect(panels).toContain("config.prerequisiteHints?.authSignedOut");
    expect(panels).toContain("config.prerequisiteHints?.query");
    expect(propertiesPage).toContain('href: "/admin/projects"');
    expect(propertiesPage).toContain('href: "/admin/media"');
    expect(projectsPage).toContain('href: "/admin/properties"');
    expect(projectsPage).toContain('href: "/admin/dashboard"');
    expect(taxonomyPage).toContain('href: "/admin/blog"');
    expect(taxonomyPage).toContain('href: "/admin/videos"');
    expect(videosPage).toContain('href: "/admin/media"');
    expect(videosPage).toContain('href: "/admin/taxonomy"');
    expect(companyPage).toContain('href: "/admin/layout"');
    expect(companyPage).toContain('href: "/admin/home-composer"');
    expect(testimonialsPage).toContain('href: "/admin/properties"');
    expect(testimonialsPage).toContain('href: "/admin/media"');
    expect(usersPage).toContain('href: "/admin/inquiries"');
    expect(usersPage).toContain('href: "/admin/imports"');
    expect(companyPage).toContain("prerequisiteHints");
    expect(taxonomyPage).toContain("prerequisiteHints");
    expect(testimonialsPage).toContain("prerequisiteHints");
    expect(usersPage).toContain("listHint");
    expect(usersPage).toContain("detailHint");
    expect(usersPage).toContain("reviewHint");
    expect(videosPage).toContain("prerequisiteHints");
  });

  it("users workspace avoids default credentials and masks password fields", () => {
    const page = read("app/admin/users/page.tsx");
    const entityWorkspace = read("components/admin/domain/entity-workspace/AdminEntityWorkspace.tsx");
    expect(page).toContain("People & Roles");
    expect(page).toContain("/admin/users");
    expect(page).not.toContain("new-admin@example.com");
    expect(page).not.toContain("initial-password-123");
    expect(page).toContain('type: "password"');
    expect(page).toContain('type: "chips"');
    expect(page).toContain("Additional access IDs");
    expect(page).not.toContain("/admin/roles");
    expect(entityWorkspace).toContain("withCurrentSelectOptions");
  });

  it("page-specific entity workspace supports review readiness, localized preview, and queue-wide actions", () => {
    const entityWorkspace = read("components/admin/domain/entity-workspace/AdminEntityWorkspace.tsx");
    const projectsPage = read("app/admin/projects/page.tsx");
    const propertiesPage = read("app/admin/properties/page.tsx");

    expect(entityWorkspace).toContain("publishChecklistConfig");
    expect(entityWorkspace).toContain("previewConfig");
    expect(entityWorkspace).toContain("handleBulkAction");
    expect(entityWorkspace).toContain("parseIdentifierList");
    expect(entityWorkspace).toContain("withCurrentSelectOptions");
    expect(entityWorkspace).toContain("resolveEntityApiPath");
    expect(entityWorkspace).toContain('trimmedPath.startsWith("/admin/")');
    expect(entityWorkspace).toContain('return `/api${trimmedPath}`;');
    expect(propertiesPage).toContain("/admin/properties/bulk/status");
    expect(propertiesPage).toContain("/admin/properties/bulk/tags");
    expect(propertiesPage).toContain("/admin/properties/bulk/update");
    expect(projectsPage).toContain("investment_snapshot.source");
    expect(projectsPage).toContain("investment_snapshot.updated_at");
    expect(projectsPage).not.toContain("Investment snapshot (JSON)");
  });

  it("shared CRUD workspace uses task tabs instead of stacking every tool in one scroll path", () => {
    const workspace = read("components/admin/AdminJsonCrudWorkspace.tsx");
    const copy = read("components/admin/domain/crud-workspace/crud-workspace-copy.ts");
    expect(workspace).toContain("AdminSectionTabs");
    expect(workspace).toContain('setActiveWorkspaceTab("update")');
    expect(workspace).toContain('activeWorkspaceTab === "browse"');
    expect(workspace).toContain('activeWorkspaceTab === "create"');
    expect(workspace).toContain('activeWorkspaceTab === "update"');
    expect(workspace).toContain('activeWorkspaceTab === "review"');
    expect(copy).toContain('tabBrowse: "Browse"');
    expect(copy).toContain('tabCreate: "Create"');
    expect(copy).toContain('tabUpdate: "Update"');
    expect(copy).toContain('tabReview: "Review"');
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
    expect(page).toContain("unsavedLeaveConfirm");
    expect(page).toContain("successTitle");
    expect(page).toContain("draftSuccessBody");
    expect(page).toContain('className="admin-workspace-success-handoff"');
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
      expect(page).toMatch(/\[(loginEmail|email),\s*set[A-Za-z]+\]\s*=\s*useState\((["'])\2\);/);
      expect(page).toMatch(/\[(loginPassword|password),\s*set[A-Za-z]+\]\s*=\s*useState\((["'])\2\);/);
      expect(page).not.toMatch(/setLoginEmail\([^)]*\.email[^)]*\)/);
      expect(formSource).toContain('name="email"');
      expect(formSource).toContain('name="password"');
      expect(formSource).toContain('autoComplete="username"');
      expect(formSource).toContain('autoComplete="current-password"');
    }
  });
});
