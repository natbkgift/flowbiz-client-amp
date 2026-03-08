import type { AdminLocale } from "@/app/_lib/admin-i18n";

import {
  summarizeTrend,
  type TrendPeriod,
  type TrendPoint,
} from "@/components/admin/dashboard/trend-utils";

const copy = {
  en: {
    total: "Total",
    peak: "Peak day",
    activeDays: "Active days",
    ariaLabel: "Lead activity trend chart",
  },
  th: {
    total: "รวม",
    peak: "วันที่สูงสุด",
    activeDays: "วันที่มี activity",
    ariaLabel: "กราฟแนวโน้ม activity ของลีด",
  },
} as const;

function formatCount(value: number, locale: AdminLocale): string {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US").format(value);
}

function buildChartGeometry(points: TrendPoint[]) {
  const width = 320;
  const height = 180;
  const left = 14;
  const right = 14;
  const top = 18;
  const bottom = 140;
  const usableWidth = width - left - right;
  const usableHeight = bottom - top;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? usableWidth / (points.length - 1) : usableWidth;

  const coordinates = points.map((point, index) => {
    const x = left + step * index;
    const y = bottom - (point.value / maxValue) * usableHeight;
    return { ...point, x, y };
  });

  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = coordinates.length
    ? `M ${coordinates[0].x} ${bottom} L ${coordinates
        .map((point) => `${point.x} ${point.y}`)
        .join(" L ")} L ${coordinates[coordinates.length - 1].x} ${bottom} Z`
    : "";

  return { coordinates, linePoints, areaPath, width, height, top, bottom };
}

export function DashboardTrendChart({
  points,
  locale,
  period,
}: {
  points: TrendPoint[];
  locale: AdminLocale;
  period: TrendPeriod;
}) {
  const ui = copy[locale];
  const summary = summarizeTrend(points);
  const geometry = buildChartGeometry(points);
  const axisPoints =
    period === "30d"
      ? [points[0], points[9], points[19], points[29]].filter(Boolean)
      : points;

  return (
    <div className="dashboard-chart">
      <div className="dashboard-chart-stats">
        <article className="dashboard-chart-stat">
          <span>{ui.total}</span>
          <strong>{formatCount(summary.total, locale)}</strong>
        </article>
        <article className="dashboard-chart-stat">
          <span>{ui.peak}</span>
          <strong>{formatCount(summary.peak, locale)}</strong>
        </article>
        <article className="dashboard-chart-stat">
          <span>{ui.activeDays}</span>
          <strong>{formatCount(summary.activeDays, locale)}</strong>
        </article>
      </div>

      <div className="dashboard-chart-surface">
        <svg
          className="dashboard-chart-svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          role="img"
          aria-label={ui.ariaLabel}
        >
          {[0, 1, 2, 3].map((step) => {
            const y = geometry.top + ((geometry.bottom - geometry.top) / 3) * step;
            return <line key={step} x1="12" y1={y} x2="308" y2={y} className="dashboard-chart-grid" />;
          })}
          <path d={geometry.areaPath} className="dashboard-chart-area" />
          <polyline points={geometry.linePoints} className="dashboard-chart-line" />
          {geometry.coordinates.map((point) => (
            <circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r={point.isLatest ? 4.5 : 3.5}
              className={point.isLatest ? "dashboard-chart-dot is-latest" : "dashboard-chart-dot"}
            />
          ))}
        </svg>
      </div>

      <div className="dashboard-chart-axis" aria-hidden="true">
        {axisPoints.map((point) => (
          <span key={point.key}>{point.shortLabel}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardTrendChartSkeleton() {
  return (
    <div className="dashboard-chart dashboard-chart--skeleton" aria-hidden="true">
      <div className="dashboard-chart-stats">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="dashboard-chart-stat">
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--title" />
          </article>
        ))}
      </div>
      <div className="dashboard-chart-surface">
        <div className="dashboard-chart-placeholder">
          <div className="skeleton skeleton--image" />
        </div>
      </div>
      <div className="dashboard-chart-axis">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton skeleton--text" />
        ))}
      </div>
    </div>
  );
}
