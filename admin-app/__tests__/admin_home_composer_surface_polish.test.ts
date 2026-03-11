import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("admin home composer surface polish", () => {
  it("uses shared admin page/layout primitives and page-local admin classes", () => {
    const page = read("app/admin/home-composer/page.tsx");

    expect(page).toContain("AdminPage");
    expect(page).toContain("AdminPageBody");
    expect(page).toContain("home-composer-toolbar");
    expect(page).toContain('className="home-composer-split"');
    expect(page).toContain('className="home-composer-stack"');
    expect(page).toContain('className="home-composer-option-label"');
    expect(page).toContain('className="home-composer-search-results"');
    expect(page).toContain('className={`home-composer-media-status-badge ${mediaBadgeClass(asset)}`}');
    expect(page).toContain("const formatCandidatePropertyTitle =");
    expect(page).toContain("Promise.allSettled([");
  });

  it("creates drafts lazily on save instead of mutating on initial load", () => {
    const page = read("app/admin/home-composer/page.tsx");

    expect(page).toContain("const createDraft = useCallback(async");
    expect(page).toContain("const hasComposerBundle = Boolean(bundle);");
    expect(page).toContain("const saveDisabled = saving || loading || Boolean(heroImageError);");
    expect(page).toContain("const publishDisabled = publishing || loading || saving || !draftId || Boolean(heroImageError);");
    expect(page).toContain("if (!draftId) {");
    expect(page).toContain("savedDraft = await createDraft(locale, payloadConfig);");
    expect(page).not.toContain("if (!nextBundle.draft) {");
  });

  it("defines reusable page-local polish hooks in admin styles", () => {
    const css = read("styles/admin-components.css");

    expect(css).toContain(".home-composer-stack--compact");
    expect(css).toContain(".home-composer-button-group");
    expect(css).toContain(".home-composer-search-results");
    expect(css).toContain(".home-composer-status-list");
    expect(css).toContain(".home-composer-form-field input:focus-visible");
    expect(css).toContain(".home-composer-media-status-badge");
    expect(css).toContain("--home-composer-split-main");
    expect(css).toContain("--home-composer-surface-subtle");
    expect(css).toContain("--home-composer-results-max-height");
  });
});
