import { describe, expect, it } from "vitest";

import {
  buildInquiryTrendPoints,
  hasTrendData,
  summarizeTrend,
} from "@/components/admin/dashboard/trend-utils";

describe("admin dashboard trend utils", () => {
  it("builds 7d points ending at the generated day", () => {
    const points = buildInquiryTrendPoints(
      [
        { created_at: "2026-03-08T09:00:00Z" },
        { created_at: "2026-03-08T10:00:00Z" },
        { created_at: "2026-03-06T12:00:00Z" },
      ],
      "2026-03-08T12:00:00Z",
      "7d",
      "en",
    );

    expect(points).toHaveLength(7);
    expect(points[6]?.key).toBe("2026-03-08");
    expect(points[6]?.value).toBe(2);
    expect(points[4]?.key).toBe("2026-03-06");
    expect(points[4]?.value).toBe(1);
    expect(hasTrendData(points)).toBe(true);
  });

  it("builds 30d windows and summarizes totals", () => {
    const points = buildInquiryTrendPoints(
      [{ created_at: "2026-02-15T12:00:00Z" }],
      "2026-03-08T12:00:00Z",
      "30d",
      "en",
    );

    expect(points).toHaveLength(30);
    expect(hasTrendData(points)).toBe(true);
    expect(summarizeTrend(points)).toEqual({
      total: 1,
      peak: 1,
      activeDays: 1,
    });
  });

  it("reports no data when every bucket is empty", () => {
    const points = buildInquiryTrendPoints([], "2026-03-08T12:00:00Z", "7d", "en");

    expect(hasTrendData(points)).toBe(false);
    expect(summarizeTrend(points)).toEqual({
      total: 0,
      peak: 0,
      activeDays: 0,
    });
  });
});
