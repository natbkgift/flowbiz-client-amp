import { describe, expect, it } from "vitest";

import {
  deriveDashboardStateFromSummary,
  transitionDashboardState,
  type DashboardSummaryShape,
} from "@/app/admin/dashboard/state-utils";

describe("dashboard state utils", () => {
  it("returns empty when summary has no actionable content", () => {
    const summary: DashboardSummaryShape = {
      generated_at: null,
      data_freshness: {},
      raw_metrics: {},
      widgets: [],
      recent_inquiries: [],
      warnings: [],
      incomplete_widget_count: 0,
    };

    expect(deriveDashboardStateFromSummary(summary)).toBe("empty");
  });

  it("returns success when summary contains widgets", () => {
    const summary: DashboardSummaryShape = {
      widgets: [{ key: "project_cover_coverage" }],
      recent_inquiries: [],
      warnings: [],
    };

    expect(deriveDashboardStateFromSummary(summary)).toBe("success");
  });

  it("supports fail -> retry -> success transition flow", () => {
    let current = transitionDashboardState("idle", "fetch_start");
    expect(current).toBe("loading");

    current = transitionDashboardState(current, "fetch_error");
    expect(current).toBe("error");

    current = transitionDashboardState(current, "fetch_start");
    expect(current).toBe("loading");

    current = transitionDashboardState(current, "fetch_success", {
      widgets: [{ key: "broken_media_count" }],
    });
    expect(current).toBe("success");
  });
});
