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

  function getCurrencySymbol() {
    return getTranslation('area_chart_currency_symbol', '฿');
  }

  function formatPrice(value) {
    const numeric = Number(value);
    const formatted = Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
    return `${getCurrencySymbol()}${formatted}`;
  }

  function getAreaChartData(chartKeys, lang) {
    const guideData = typeof AREA_GUIDES === 'undefined' ? window.AMP?.areaData : AREA_GUIDES;
    if (!Array.isArray(chartKeys) || !guideData) return [];
    return chartKeys
      .map(key => ({ key, data: guideData?.[key] }))
      .filter(item => item.data)
      .map(item => ({
        key: item.key,
        name: item.data.name?.[lang] || item.data.name?.en || item.key,
        // Area guide data uses snake_case fields (avg_price_sqm, price_trend_yoy); map into camelCase values.
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
          label: getTranslation('area_chart_legend_price', `Avg Price/sqm (${getCurrencySymbol()})`),
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
              label: context => formatPrice(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => formatPrice(value)
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

  function updateHighlights(areaData, elements) {
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

    const {
      priceHighEl,
      priceLowEl,
      trendHighEl,
      trendLowEl
    } = elements;

    const highLabel = getTranslation('area_chart_high_label', 'Highest');
    const lowLabel = getTranslation('area_chart_low_label', 'Lowest');
    const formatTrend = value => `${value >= 0 ? '+' : ''}${value}%`;

    if (priceHighEl) priceHighEl.textContent = `${highLabel}: ${priceHigh.name} (${formatPrice(priceHigh.avgPrice)})`;
    if (priceLowEl) priceLowEl.textContent = `${lowLabel}: ${priceLow.name} (${formatPrice(priceLow.avgPrice)})`;
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

    if (typeof Chart === 'undefined') {
      console.warn('Area charts: Chart.js is not available.');
      return;
    }

    const priceCanvas = document.getElementById(priceCanvasId);
    const trendCanvas = document.getElementById(trendCanvasId);
    const priceHighEl = document.getElementById(priceHighId);
    const priceLowEl = document.getElementById(priceLowId);
    const trendHighEl = document.getElementById(trendHighId);
    const trendLowEl = document.getElementById(trendLowId);
    const missingElements = [];
    if (!priceCanvas) missingElements.push(priceCanvasId);
    if (!trendCanvas) missingElements.push(trendCanvasId);
    if (!priceHighEl) missingElements.push(priceHighId);
    if (!priceLowEl) missingElements.push(priceLowId);
    if (!trendHighEl) missingElements.push(trendHighId);
    if (!trendLowEl) missingElements.push(trendLowId);
    if (missingElements.length) {
      console.warn(`Area charts: missing required elements (${missingElements.join(', ')})`);
      return;
    }

    const areaData = getAreaChartData(chartKeys, lang);
    if (!areaData.length) return;

    const labels = areaData.map(item => item.name);
    const prices = areaData.map(item => item.avgPrice);
    const trends = areaData.map(item => item.trend);

    if (chartStore[chartKey]?.price?.destroy) chartStore[chartKey].price.destroy();
    if (chartStore[chartKey]?.trend?.destroy) chartStore[chartKey].trend.destroy();
    delete chartStore[chartKey];

    const nextCharts = {};
    try {
      const priceChart = buildBarChart(priceCanvas, labels, prices, palette.price);
      const trendChart = buildLineChart(trendCanvas, labels, trends, palette.trend);
      if (priceChart) nextCharts.price = priceChart;
      if (trendChart) nextCharts.trend = trendChart;
    } catch (error) {
      console.warn('Area charts: failed to render charts.', error);
      return;
    }

    if (Object.keys(nextCharts).length) {
      chartStore[chartKey] = nextCharts;
    }

    updateHighlights(areaData, { priceHighEl, priceLowEl, trendHighEl, trendLowEl });
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
