// Area charts helpers for area index and detail pages
(function () {
  const chartStore = {};
  const defaultKeys = window.AMP?.areaGuideChartKeys || [];

  const chartPalettes = {
    index: {
      price: {
        background: 'rgba(59, 130, 246, 0.6)',
        border: 'rgba(59, 130, 246, 1)'
      },
      trend: {
        border: 'rgba(16, 185, 129, 1)',
        background: 'rgba(16, 185, 129, 0.2)',
        point: 'rgba(16, 185, 129, 1)'
      }
    },
    detail: {
      price: {
        background: 'rgba(99, 102, 241, 0.6)',
        border: 'rgba(99, 102, 241, 1)'
      },
      trend: {
        border: 'rgba(14, 116, 144, 1)',
        background: 'rgba(14, 116, 144, 0.2)',
        point: 'rgba(14, 116, 144, 1)'
      }
    }
  };

  function getTranslation(key, fallback) {
    if (typeof t === 'function') {
      const value = t(key);
      return value && value !== key ? value : (fallback || key);
    }
    return fallback || key;
  }

  function getAreaChartData(chartKeys, lang) {
    if (!Array.isArray(chartKeys)) return [];
    return chartKeys
      .map(key => ({ key, data: AREA_GUIDES?.[key] }))
      .filter(item => item.data)
      .map(item => ({
        key: item.key,
        name: item.data.name?.[lang] || item.data.name?.en || item.key,
        // Mock data uses snake_case; convert into camelCase chart values.
        avgPrice: Number(item.data.avg_price_sqm),
        trend: Number(item.data.price_trend_yoy)
      }))
      .filter(item => Number.isFinite(item.avgPrice) && Number.isFinite(item.trend));
  }

  function buildBarChart(canvas, labels, data, colors) {
    if (typeof Chart === 'undefined') return null;
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: getTranslation('area_chart_legend_price', 'Avg Price/sqm (฿)'),
          data,
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `฿${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => `฿${Number(value).toLocaleString()}`
            }
          }
        }
      }
    });
  }

  function buildLineChart(canvas, labels, data, colors) {
    if (typeof Chart === 'undefined') return null;
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: getTranslation('area_chart_legend_trend', 'YoY Trend (%)'),
          data,
          borderColor: colors.border,
          backgroundColor: colors.background,
          pointBackgroundColor: colors.point,
          pointRadius: 4,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => `${context.parsed.y}%`
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => `${value}%`
            }
          }
        }
      }
    });
  }

  function updateHighlights(areaData, ids) {
    if (!areaData.length) return;
    const baseItem = areaData[0];

    let priceHigh = baseItem;
    let priceLow = baseItem;
    let trendHigh = baseItem;
    let trendLow = baseItem;
    areaData.forEach(item => {
      if (item.avgPrice > priceHigh.avgPrice) priceHigh = item;
      if (item.avgPrice < priceLow.avgPrice) priceLow = item;
      if (item.trend > trendHigh.trend) trendHigh = item;
      if (item.trend < trendLow.trend) trendLow = item;
    });

    const priceHighEl = document.getElementById(ids.priceHighId);
    const priceLowEl = document.getElementById(ids.priceLowId);
    const trendHighEl = document.getElementById(ids.trendHighId);
    const trendLowEl = document.getElementById(ids.trendLowId);

    const highLabel = getTranslation('area_chart_high_label', 'Highest');
    const lowLabel = getTranslation('area_chart_low_label', 'Lowest');
    const formatTrend = value => `${value >= 0 ? '+' : ''}${value}%`;

    if (priceHighEl) priceHighEl.textContent = `${highLabel}: ${priceHigh.name} (฿${priceHigh.avgPrice.toLocaleString()})`;
    if (priceLowEl) priceLowEl.textContent = `${lowLabel}: ${priceLow.name} (฿${priceLow.avgPrice.toLocaleString()})`;
    if (trendHighEl) trendHighEl.textContent = `${highLabel}: ${trendHigh.name} (${formatTrend(trendHigh.trend)})`;
    if (trendLowEl) trendLowEl.textContent = `${lowLabel}: ${trendLow.name} (${formatTrend(trendLow.trend)})`;
  }

  function renderAreaCharts(options) {
    const {
      chartKey,
      chartKeys,
      lang,
      priceCanvasId,
      trendCanvasId,
      priceHighId,
      priceLowId,
      trendHighId,
      trendLowId,
      palette
    } = options;

    const priceCanvas = document.getElementById(priceCanvasId);
    const trendCanvas = document.getElementById(trendCanvasId);
    if (!priceCanvas || !trendCanvas || typeof Chart === 'undefined') return;

    const areaData = getAreaChartData(chartKeys, lang);
    if (!areaData.length) return;

    const labels = areaData.map(item => item.name);
    const prices = areaData.map(item => item.avgPrice);
    const trends = areaData.map(item => item.trend);

    if (chartStore[chartKey]?.price) chartStore[chartKey].price.destroy();
    if (chartStore[chartKey]?.trend) chartStore[chartKey].trend.destroy();

    chartStore[chartKey] = {
      price: buildBarChart(priceCanvas, labels, prices, palette.price),
      trend: buildLineChart(trendCanvas, labels, trends, palette.trend)
    };

    updateHighlights(areaData, { priceHighId, priceLowId, trendHighId, trendLowId });
  }

  function initAreaIndexCharts({ chartKeys = defaultKeys, lang = 'en' } = {}) {
    renderAreaCharts({
      chartKey: 'area-index',
      chartKeys,
      lang,
      priceCanvasId: 'area-index-price-chart',
      trendCanvasId: 'area-index-trend-chart',
      priceHighId: 'area-index-price-high',
      priceLowId: 'area-index-price-low',
      trendHighId: 'area-index-trend-high',
      trendLowId: 'area-index-trend-low',
      palette: chartPalettes.index
    });
  }

  function initAreaDetailCharts({ chartKeys = defaultKeys, lang = 'en', areaKey = 'area-detail' } = {}) {
    renderAreaCharts({
      chartKey: `area-detail-${areaKey}`,
      chartKeys,
      lang,
      priceCanvasId: 'area-detail-price-chart',
      trendCanvasId: 'area-detail-trend-chart',
      priceHighId: 'area-detail-price-high',
      priceLowId: 'area-detail-price-low',
      trendHighId: 'area-detail-trend-high',
      trendLowId: 'area-detail-trend-low',
      palette: chartPalettes.detail
    });
  }

  window.AMP = window.AMP || {};
  window.AMP.initAreaIndexCharts = initAreaIndexCharts;
  window.AMP.initAreaDetailCharts = initAreaDetailCharts;
})();
