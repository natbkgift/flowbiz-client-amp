import { describe, expect, it } from "vitest";

import {
  buildTrendPoints,
  hasTrendData,
  summarizeTrend,
} from "@/components/admin/dashboard/trend-utils";

describe("admin dashboard trend utils", () => {
  it("builds 7d points ending at the generated day", () => {
    const points = buildTrendPoints(
      [
        { bucket_date: "2026-03-08", count: 2 },
        { bucket_date: "2026-03-06", count: 1 },
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
    const points = buildTrendPoints(
      [{ bucket_date: "2026-02-15", count: 1 }],
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
    const points = buildTrendPoints([], "2026-03-08T12:00:00Z", "7d", "en");

    expect(hasTrendData(points)).toBe(false);
    expect(summarizeTrend(points)).toEqual({
      total: 0,
      peak: 0,
      activeDays: 0,
    });
  });

  it("uses backend bucket values instead of re-counting duplicate dates", () => {
    const points = buildTrendPoints(
      [{ bucket_date: "2026-03-08", count: 5 }],
      "2026-03-08T12:00:00Z",
      "7d",
      "en",
    );

    expect(points[6]?.value).toBe(5);
  });
});
