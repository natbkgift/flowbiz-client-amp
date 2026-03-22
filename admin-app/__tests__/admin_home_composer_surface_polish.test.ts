import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin home composer surface polish", () => {
  it("uses the task toolkit primitives for the new Landing Builder flow", () => {
    const page = read("app/admin/home-composer/page.tsx");

    expect(page).toContain("AdminPage");
    expect(page).toContain("AdminPageBody");
    expect(page).toContain("AdminAccessGate");
    expect(page).toContain("AdminPrimaryActionBar");
    expect(page).toContain("AdminSectionTabs");
    expect(page).toContain("AdminSearchablePicker");
    expect(page).toContain("AdminRepeaterEditor");
    expect(page).toContain("AdminSelectionDrawer");
    expect(page).toContain("const [activeTab, setActiveTab] = useState<BuilderTabKey>('overview')");
    expect(page).toContain("home-composer-task-layout");
    expect(page).toContain("home-composer-overview-grid");
    expect(page).toContain("home-composer-hero-media-preview");
    expect(page).toContain("const formatCandidatePropertyTitle =");
    expect(page).toContain("Promise.allSettled([");
  });

  it("creates drafts lazily on save instead of mutating on initial load", () => {
    const page = read("app/admin/home-composer/page.tsx");

    expect(page).toContain("const createDraft = useCallback(async");
    expect(page).toContain("const hasComposerBundle = Boolean(bundle);");
    expect(page).toContain("const hasUnsavedChanges = Boolean(draftId)");
    expect(page).toContain("const confirmDiscardChanges = useCallback((): boolean =>");
    expect(page).toContain("const saveDisabled = saving || loading || Boolean(heroImageError);");
    expect(page).toContain("const publishDisabled = publishing || loading || saving || !draftId || Boolean(heroImageError);");
    expect(page).toContain("unsavedLeaveConfirm");
    expect(page).toContain("if (!draftId) {");
    expect(page).toContain("savedDraft = await createDraft(locale, payloadConfig);");
    expect(page).not.toContain("if (!nextBundle.draft) {");
  });

  it("defines reusable builder layout hooks in admin styles", () => {
    const css = read("styles/admin-components.css");

    expect(css).toContain(".home-composer-builder-page");
    expect(css).toContain(".home-composer-tab-panel");
    expect(css).toContain(".home-composer-overview-grid");
    expect(css).toContain(".home-composer-header-actions");
    expect(css).toContain(".home-composer-hero-media-panel");
    expect(css).toContain(".home-composer-record-row");
    expect(css).toContain(".home-composer-button-group");
    expect(css).toContain(".home-composer-status-list");
    expect(css).toContain(".home-composer-media-status-badge");
    expect(css).toContain("--home-composer-split-main");
    expect(css).toContain("--home-composer-surface-subtle");
    expect(css).toContain("--home-composer-results-max-height");
  });
});
