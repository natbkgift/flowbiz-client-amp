import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf-8");
}

describe("B14 admin dashboard page contract", () => {
  it("uses admin login endpoint and session storage auth flow", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('from "@/app/_lib/admin-auth"');
    expect(page).toContain('from "@/app/admin/dashboard/state-utils"');
    expect(page).toContain('from "@/components/admin/dashboard/DashboardSectionPrimitives"');
    expect(page).toContain('from "@/components/admin/dashboard/DashboardKpiWidgets"');
    expect(page).toContain('from "@/components/admin/dashboard/DashboardRecentInquiriesTable"');
    expect(page).toContain('from "@/components/admin/dashboard/DashboardTrendChart"');
    expect(page).toContain('from "@/components/admin/dashboard/trend-utils"');
    expect(page).toContain("loginAdmin");
    expect(page).toContain("transitionDashboardState");
    expect(page).not.toContain('fetch("/v1/auth/login"');
  });

  it("loads B14 backend summary endpoint and includes all required widget keys", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('"/api/admin/dashboard/health-summary"');
    expect(page).toContain('"project_cover_coverage"');
    expect(page).toContain('"broken_media_count"');
    expect(page).toContain('"external_image_leakage_count"');
    expect(page).toContain('"pending_translations_count"');
    expect(page).toContain('"unpublished_drafts_count"');
    expect(page).toContain('"recent_leads_inquiries"');
    expect(page).toContain('"review_video_source_verification_pending"');
    expect(page).toContain('"last_import_mirror_status"');
    expect(page).toContain('"last_deploy_health_status"');
  });

  it("contains accessible structure and runtime states in EN/TH copy", () => {
    const page = read("app/admin/dashboard/page.tsx");

    expect(page).toContain('<main id="main-content"');
    expect(page).toContain('htmlFor="dashboard-login-email"');
    expect(page).toContain('htmlFor="dashboard-login-password"');
    expect(page).toContain('autoComplete="username"');
    expect(page).toContain('autoComplete="current-password"');
    expect(page).toContain("dashboard-shell-grid");
    expect(page).toContain('className="dashboard-section--widgets"');
    expect(page).toContain('className="dashboard-section--table"');
    expect(page).toContain('className="dashboard-section--insights"');
    expect(page).toContain('className="dashboard-section--warnings"');
    expect(page).toContain("DashboardMetricSkeletonRow");
    expect(page).toContain("DashboardKpiWidgets");
    expect(page).toContain("DashboardRecentInquiriesTable");
    expect(page).toContain("DashboardTrendChart");
    expect(page).toContain("DashboardTrendChartSkeleton");
    expect(page).toContain("DashboardWidgetSkeletonGrid");
    expect(page).toContain("DashboardInsightSkeletonList");
    expect(page).toContain("DashboardTableSkeleton");
    expect(page).toContain("rawMetrics={summary?.raw_metrics}");
    expect(page).toContain("buildInquiryTrendPoints");
    expect(page).toContain("hasTrendData");
    expect(page).toContain("state-empty");
    expect(page).toContain("state-error");
    expect(page).toContain("dashboardState === \"loading\"");
    expect(page).toContain("dashboardState === \"idle\"");
    expect(page).toContain("dashboardState === \"error\"");
    expect(page).toContain("dashboardState === \"empty\"");
    expect(page).toContain("retry: \"Retry\"");
    expect(page).toContain("retry: \"ลองใหม่\"");
    expect(page).toContain('title: "Admin Health / QA Dashboard"');
    expect(page).toContain('subtitle: "หน้าเดียวสำหรับดูความสมบูรณ์ของระบบและลิงก์แก้ปัญหาแบบ actionable"');
    expect(page).toContain('trendTitle: "Lead activity trend"');
    expect(page).toContain('trendTitle: "แนวโน้ม activity ของลีด"');
    expect(page).toContain('insightsTitle: "Pipeline insights"');
    expect(page).toContain('insightsTitle: "ข้อมูล pipeline"');
  });
});
