/*
  Minimal demo-website helpers used by Jest tests.
  CommonJS exports to keep compatibility with Node test runner.
*/

const DEFAULT_FILTERS = {
  status: 'all',
  type: 'all',
  area: 'all',
  priceRange: 'all',
  sortBy: 'completion-nearest'
};

function getCompletionSortValue(completion) {
  if (typeof completion !== 'string') return Number.MAX_SAFE_INTEGER;
  const m = completion.match(/^(\d{4})-Q([1-4])$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const year = Number(m[1]);
  const quarter = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(quarter)) return Number.MAX_SAFE_INTEGER;
  return year * 10 + quarter;
}

function sortProjects(projects, sortBy) {
  if (!Array.isArray(projects) || projects.length === 0) return [];

  const out = [...projects];

  const safeNumber = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

  if (sortBy === 'price-low') {
    out.sort((a, b) => {
      const av = safeNumber(a?.pricing?.min, Number.POSITIVE_INFINITY);
      const bv = safeNumber(b?.pricing?.min, Number.POSITIVE_INFINITY);
      return av - bv;
    });
    return out;
  }

  if (sortBy === 'price-high') {
    out.sort((a, b) => {
      const av = safeNumber(a?.pricing?.min, Number.NEGATIVE_INFINITY);
      const bv = safeNumber(b?.pricing?.min, Number.NEGATIVE_INFINITY);
      return bv - av;
    });
    return out;
  }

  if (sortBy === 'yield-high') {
    out.sort((a, b) => {
      const av = safeNumber(a?.estimated_yield, Number.NEGATIVE_INFINITY);
      const bv = safeNumber(b?.estimated_yield, Number.NEGATIVE_INFINITY);
      return bv - av;
    });
    return out;
  }

  if (sortBy === 'completion-nearest') {
    out.sort((a, b) => {
      const av = getCompletionSortValue(a?.timeline?.completion);
      const bv = getCompletionSortValue(b?.timeline?.completion);
      return av - bv;
    });
    return out;
  }

  if (sortBy === 'units-available') {
    out.sort((a, b) => {
      const av = safeNumber(a?.units?.available, Number.NEGATIVE_INFINITY);
      const bv = safeNumber(b?.units?.available, Number.NEGATIVE_INFINITY);
      return bv - av;
    });
    return out;
  }

  return out;
}

function getFiltersFromSearch(search) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));

  const status = params.get('status') ?? DEFAULT_FILTERS.status;
  const type = params.get('type') ?? DEFAULT_FILTERS.type;
  const area = params.get('area') ?? DEFAULT_FILTERS.area;
  const priceRange = params.get('price') ?? DEFAULT_FILTERS.priceRange;
  const sortBy = params.get('sort') ?? DEFAULT_FILTERS.sortBy;

  return { status, type, area, priceRange, sortBy };
}

function buildSearchFromFilters(filters) {
  const f = { ...DEFAULT_FILTERS, ...(filters || {}) };
  const parts = [];

  if (f.status !== DEFAULT_FILTERS.status) parts.push(`status=${encodeURIComponent(f.status)}`);
  if (f.type !== DEFAULT_FILTERS.type) parts.push(`type=${encodeURIComponent(f.type)}`);
  if (f.area !== DEFAULT_FILTERS.area) parts.push(`area=${encodeURIComponent(f.area)}`);
  if (f.priceRange !== DEFAULT_FILTERS.priceRange) {
    parts.push(`price=${encodeURIComponent(f.priceRange)}`);
  }
  if (f.sortBy !== DEFAULT_FILTERS.sortBy) parts.push(`sort=${encodeURIComponent(f.sortBy)}`);

  return parts.join('&');
}

function sanitizeCompareList(list) {
  const out = [];
  const seen = new Set();

  for (const raw of Array.isArray(list) ? list : []) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 3) break;
  }

  return out;
}

function toggleCompareProjectId(list, projectId) {
  const current = sanitizeCompareList(list);
  const id = typeof projectId === 'string' ? projectId.trim() : '';

  if (!id) return { list: current, added: false, maxReached: false };

  if (current.includes(id)) {
    return { list: current.filter((x) => x !== id), added: false, maxReached: false };
  }

  if (current.length >= 3) {
    return { list: current, added: false, maxReached: true };
  }

  return { list: [...current, id], added: true, maxReached: false };
}

const COMPARE_KEY = 'compare_projects';

function readCompareList(storage) {
  try {
    const raw = storage?.getItem?.(COMPARE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return sanitizeCompareList(parsed);
  } catch {
    return [];
  }
}

function writeCompareList(list, storage) {
  try {
    const cleaned = sanitizeCompareList(list);
    storage?.setItem?.(COMPARE_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore
  }
}

module.exports = {
  getCompletionSortValue,
  sortProjects,
  getFiltersFromSearch,
  buildSearchFromFilters,
  sanitizeCompareList,
  toggleCompareProjectId,
  readCompareList,
  writeCompareList
};
