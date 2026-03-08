import type { AdminLocale } from "@/app/_lib/admin-i18n";

export type TrendPeriod = "7d" | "30d";

export type TrendSeriesBucket = {
  bucket_date: string;
  count: number;
};

export type TrendPoint = {
  key: string;
  label: string;
  shortLabel: string;
  value: number;
  isLatest: boolean;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatBucketKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function buildTrendPoints(
  buckets: TrendSeriesBucket[],
  generatedAt: string | null,
  period: TrendPeriod,
  locale: AdminLocale,
): TrendPoint[] {
  const days = period === "30d" ? 30 : 7;
  const latestBucket = buckets
    .map((bucket) => parseDate(bucket.bucket_date))
    .filter((value): value is Date => value !== null)
    .sort((left, right) => left.getTime() - right.getTime())
    .at(-1);
  const endSource = latestBucket || parseDate(generatedAt) || new Date();
  const endDate = startOfUtcDay(endSource);
  const formatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const shortFormatter = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    weekday: period === "30d" ? undefined : "short",
    day: period === "30d" ? "numeric" : undefined,
    timeZone: "UTC",
  });

  const counts = new Map<string, number>();
  for (const bucket of buckets) {
    const parsed = parseDate(bucket.bucket_date);
    if (!parsed) continue;
    const key = formatBucketKey(startOfUtcDay(parsed));
    counts.set(key, Math.max(0, Number(bucket.count) || 0));
  }

  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - (days - index - 1));
    const key = formatBucketKey(date);
    const value = counts.get(key) || 0;
    return {
      key,
      label: formatter.format(date),
      shortLabel: shortFormatter.format(date),
      value,
      isLatest: index === days - 1,
    };
  });
}

export function hasTrendData(points: TrendPoint[]): boolean {
  return points.some((point) => point.value > 0);
}

export function summarizeTrend(points: TrendPoint[]): {
  total: number;
  peak: number;
  activeDays: number;
} {
  return points.reduce(
    (summary, point) => ({
      total: summary.total + point.value,
      peak: Math.max(summary.peak, point.value),
      activeDays: summary.activeDays + (point.value > 0 ? 1 : 0),
    }),
    { total: 0, peak: 0, activeDays: 0 },
  );
}
