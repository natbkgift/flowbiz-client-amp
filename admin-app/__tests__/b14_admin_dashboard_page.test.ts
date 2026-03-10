import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B14 admin dashboard page contract", () => {
  it("uses admin login endpoint and a thin page container with domain screen composition", () => {
    const page = read("app/admin/dashboard/page.tsx");
    const screen = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");

    expect(page).toContain('from "@/app/_lib/admin-auth-hooks"');
    expect(page).toContain('from "@/app/admin/dashboard/state-utils"');
    expect(page).toContain('from "@/components/admin/domain/dashboard/AdminDashboardScreen"');
    expect(page).toContain('from "@/components/admin/domain/dashboard/dashboard-copy"');
    expect(page).toContain("useAdminAuthController");
    expect(page).toContain("loginWithAdminSession");
    expect(page).toContain("transitionDashboardState");
    expect(page).toContain("<AdminDashboardScreen");
    expect(screen).toContain('from "@/components/admin/dashboard/DashboardSectionPrimitives"');
    expect(screen).toContain('from "@/components/admin/dashboard/DashboardKpiWidgets"');
    expect(screen).toContain('from "@/components/admin/dashboard/DashboardRecentInquiriesTable"');
    expect(screen).toContain('from "@/components/admin/dashboard/DashboardTrendChart"');
    expect(screen).toContain('from "@/components/admin/dashboard/trend-utils"');
    expect(page).not.toContain('fetch("/v1/auth/login"');
  });

  it("loads B14 backend summary endpoint and includes all required widget keys", () => {
    const page = read("app/admin/dashboard/page.tsx");
    const screen = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");
    const types = read("components/admin/domain/dashboard/dashboard-types.ts");

    expect(page).toContain('"/api/admin/dashboard/health-summary"');
    expect(screen).toContain("totalRecentInquiryCount");
    expect(screen).toContain("raw_metrics?.recent_inquiries?.count");
    expect(screen).toContain("authToken={authToken}");
    expect(screen).toContain("totalCount={totalRecentInquiryCount}");
    expect(types).toContain('"project_cover_coverage"');
    expect(types).toContain('"broken_media_count"');
    expect(types).toContain('"external_image_leakage_count"');
    expect(types).toContain('"pending_translations_count"');
    expect(types).toContain('"unpublished_drafts_count"');
    expect(types).toContain('"recent_leads_inquiries"');
    expect(types).toContain('"review_video_source_verification_pending"');
    expect(types).toContain('"last_import_mirror_status"');
    expect(types).toContain('"last_deploy_health_status"');
  });

  it("contains accessible structure and runtime states in EN/TH copy", () => {
    const page = read("app/admin/dashboard/page.tsx");
    const screen = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");
    const copy = read("components/admin/domain/dashboard/dashboard-copy.ts");

    expect(screen).toContain('<AdminPage busy={loading}>');
    expect(screen).toContain('htmlFor="dashboard-login-email"');
    expect(screen).toContain('htmlFor="dashboard-login-password"');
    expect(screen).toContain('autoComplete="username"');
    expect(screen).toContain('autoComplete="current-password"');
    expect(screen).toContain("dashboard-shell-grid");
    expect(screen).toContain("dashboard-zone dashboard-zone--primary");
    expect(screen).toContain("dashboard-zone dashboard-zone--secondary");
    expect(screen).toContain("dashboard-zone dashboard-zone--tertiary");
    expect(screen).toContain('className="dashboard-section--widgets dashboard-section--primary"');
    expect(screen).toContain('className="dashboard-section--table"');
    expect(screen).toContain('className="dashboard-section--insights"');
    expect(screen).toContain('className="dashboard-log-card dashboard-section--warnings"');
    expect(screen).toContain('className="dashboard-action-card dashboard-section--tasks"');
    expect(screen).toContain("DashboardMetricSkeletonRow");
    expect(screen).toContain("DashboardKpiWidgets");
    expect(screen).toContain("DashboardRecentInquiriesTable");
    expect(screen).toContain("DashboardTrendChart");
    expect(screen).toContain("DashboardTrendChartSkeleton");
    expect(screen).toContain("DashboardWidgetSkeletonGrid");
    expect(screen).toContain("DashboardInsightSkeletonList");
    expect(screen).toContain("DashboardTableSkeleton");
    expect(screen).toContain("rawMetrics={summary?.raw_metrics}");
    expect(screen).toContain("buildTrendPoints");
    expect(screen).toContain("summary?.trend_series?.[chartPeriod]");
    expect(screen).toContain("hasTrendData");
    expect(screen).toContain('ariaLabel={t.trendTitle}');
    expect(screen).toContain('role="alert">{authError}</div>');
    expect(screen).toContain("DashboardSectionState");
    expect(screen).toContain("renderOperationalIdleCard");
    expect(screen).toContain("dashboard-operational-card");
    expect(screen).toContain("dashboard-hero-toolbar");
    expect(screen).toContain("dashboard-insight-item__status");
    expect(screen).toContain("workspaceLockedTitle");
    expect(screen).toContain("dashboardState === \"loading\"");
    expect(screen).toContain("dashboardState === \"idle\"");
    expect(screen).toContain("dashboardState === \"error\"");
    expect(screen).toContain("dashboardState === \"empty\"");
    expect(copy).toContain("retry: \"Retry\"");
    expect(copy).toContain("retry: \"ลองใหม่\"");
    expect(copy).toContain('title: "Admin Health / QA Dashboard"');
    expect(copy).toContain('title: "แดชบอร์ดสุขภาพระบบ / QA"');
    expect(copy).toContain('subtitle: "ศูนย์ควบคุมสุขภาพระบบ ภาพรวมคิวงาน รายการเฝ้าระวัง และกิจกรรมล่าสุดของทีมแอดมิน"');
    expect(copy).toContain('trendTitle: "แนวโน้มกิจกรรมของลีด"');
    expect(copy).toContain('trendHint: "Lead activity trend backed by backend-provided daily inquiry buckets."');
    expect(copy).toContain('insightsTitle: "Pipeline summary"');
    expect(copy).toContain('insightsTitle: "สรุปคิวงาน"');
    expect(copy).toContain('watchlistTitle: "รายการเฝ้าระวัง"');
    expect(copy).toContain('backgroundTasksTitle: "Background tasks"');
    expect(copy).toContain('lastUpdated: "Last updated"');
    expect(copy).toContain('quickActions: "Quick actions"');
    expect(copy).toContain('refreshRequired: "Refresh required"');
    expect(copy).toContain('errorStatus: "Error"');
    expect(copy).toContain('sourcePage: "หน้าต้นทาง"');
    expect(copy).toContain('intent: "เป้าหมาย"');
    expect(copy).toContain('lastUpdated: "อัปเดตล่าสุด"');
    expect(copy).toContain('quickActions: "การดำเนินการด่วน"');
    expect(page).toContain("dashboardCopy[locale]");
  });

  it("only renders background tasks when the backend provides task payloads", () => {
    const screen = read("components/admin/domain/dashboard/AdminDashboardScreen.tsx");

    expect(screen).toContain("const tasks: BackgroundTask[] = [];");
    expect(screen).toContain("if (raw?.last_import_status)");
    expect(screen).toContain("if (raw?.last_mirror_status)");
    expect(screen).toContain("if (raw?.last_deploy_health_status)");
    expect(screen).toContain("return tasks;");
    expect(screen).toContain("if (backgroundTasks.length === 0)");
    expect(screen).toContain("backgroundTasksEmptyTitle");
  });
});
