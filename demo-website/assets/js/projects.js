// AMP Demo Website - Projects Filtering and Display
// Filter and display project listings

const defaultFilters = {
  status: 'all',
  type: 'all',
  area: 'all',
  priceRange: 'all',
  sortBy: 'completion-nearest'
};

let currentFilters = { ...defaultFilters };
const COMPARE_STORAGE_KEY = 'amp_compare_projects';
const COMPARE_MAX_ITEMS = 3;
const COMPARE_MIN_ITEMS = 2;

function getCompareLabel(lang, key) {
  const fallbackMap = {
    compare_add: lang === 'th' ? 'เพิ่มเพื่อเปรียบเทียบ' : 'Add to Compare',
    compare_remove: lang === 'th' ? 'ลบออกจากการเปรียบเทียบ' : 'Remove from Compare',
    compare_view: lang === 'th' ? 'ดูการเปรียบเทียบ' : 'View Comparison',
    compare_projects_title: lang === 'th' ? 'เปรียบเทียบโครงการ' : 'Compare Projects',
    compare_max_3: lang === 'th' ? 'เลือกเปรียบเทียบได้สูงสุด 3 โครงการ' : 'You can compare up to 3 projects'
  };
  if (typeof window !== 'undefined' && typeof window.t === 'function') {
    const translated = window.t(key);
    if (translated && translated !== key) return translated;
  }
  return fallbackMap[key] || key;
}

function sanitizeCompareList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(Boolean).map(String))].slice(0, COMPARE_MAX_ITEMS);
}

function toggleCompareProjectId(list, projectId) {
  const nextList = sanitizeCompareList(list);
  const normalizedProjectId = String(projectId || '');
  if (!normalizedProjectId) {
    return { list: nextList, added: false, maxReached: false };
  }
  const existingIndex = nextList.indexOf(normalizedProjectId);
  if (existingIndex >= 0) {
    nextList.splice(existingIndex, 1);
    return { list: nextList, added: false, maxReached: false };
  }
  if (nextList.length >= COMPARE_MAX_ITEMS) {
    return { list: nextList, added: false, maxReached: true };
  }
  nextList.push(normalizedProjectId);
  return { list: nextList, added: true, maxReached: false };
}

function readCompareList(storage) {
  try {
    const storageRef = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!storageRef) return [];
    const storedValue = storageRef.getItem(COMPARE_STORAGE_KEY);
    return sanitizeCompareList(storedValue ? JSON.parse(storedValue) : []);
  } catch (error) {
    return [];
  }
}

function writeCompareList(list, storage) {
  const sanitized = sanitizeCompareList(list);
  const storageRef = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (storageRef) {
    storageRef.setItem(COMPARE_STORAGE_KEY, JSON.stringify(sanitized));
  }
  return sanitized;
}

function getFiltersFromSearch(search = '') {
  const params = new URLSearchParams(search);
  return {
    status: params.get('status') || defaultFilters.status,
    type: params.get('type') || defaultFilters.type,
    area: params.get('area') || defaultFilters.area,
    priceRange: params.get('price') || defaultFilters.priceRange,
    sortBy: params.get('sort') || defaultFilters.sortBy
  };
}

function buildSearchFromFilters(filters) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== defaultFilters.status) params.set('status', filters.status);
  if (filters.type && filters.type !== defaultFilters.type) params.set('type', filters.type);
  if (filters.area && filters.area !== defaultFilters.area) params.set('area', filters.area);
  if (filters.priceRange && filters.priceRange !== defaultFilters.priceRange) params.set('price', filters.priceRange);
  if (filters.sortBy && filters.sortBy !== defaultFilters.sortBy) params.set('sort', filters.sortBy);
  return params.toString();
}

function setActiveButton(selector, value) {
  const buttons = document.querySelectorAll(selector);
  if (!buttons.length) return value;
  buttons.forEach(btn => btn.classList.remove('active'));
  const selectorMatch = selector.match(/data-(\w+)/);
  const key = selectorMatch && selectorMatch[1];
  if (!key) return value;
  const normalized = String(value || '').toLowerCase();
  const target = Array.from(buttons).find(btn => String(btn.dataset[key] || '').toLowerCase() === normalized);
  const fallback = Array.from(buttons).find(btn => String(btn.dataset[key] || '') === 'all');
  const activeButton = target || fallback || buttons[0];
  activeButton.classList.add('active');
  return activeButton.dataset[key];
}

function syncFilterControls() {
  currentFilters.status = setActiveButton('.filter-btn[data-status]', currentFilters.status);
  currentFilters.type = setActiveButton('.filter-btn[data-type]', currentFilters.type);
  currentFilters.area = setActiveButton('.filter-btn[data-area]', currentFilters.area);
  currentFilters.priceRange = setActiveButton('.filter-btn[data-price]', currentFilters.priceRange);

  const sortSelect = document.getElementById('project-sort');
  if (sortSelect) {
    const hasOption = Array.from(sortSelect.options).some(option => option.value === currentFilters.sortBy);
    currentFilters.sortBy = hasOption ? currentFilters.sortBy : defaultFilters.sortBy;
    sortSelect.value = currentFilters.sortBy;
  }
}

function applyFiltersFromURL() {
  if (typeof window === 'undefined') return;
  currentFilters = {
    ...currentFilters,
    ...getFiltersFromSearch(window.location.search)
  };
  syncFilterControls();
}

function updateURLFromFilters(replace = false) {
  if (typeof window === 'undefined' || typeof history === 'undefined') return;
  const query = buildSearchFromFilters(currentFilters);
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (newUrl === currentUrl) return;
  if (replace) {
    history.replaceState(null, '', newUrl);
  } else {
    history.pushState(null, '', newUrl);
  }
}

function getCompletionSortValue(completion) {
  const match = String(completion || '').match(/^(\d{4})-Q([1-4])$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return (parseInt(match[1], 10) * 10) + parseInt(match[2], 10);
}

function sortProjects(projects, sortBy) {
  const sortedProjects = [...projects];
  switch (sortBy) {
    case 'price-low':
      return sortedProjects.sort((a, b) => (a.pricing?.min || 0) - (b.pricing?.min || 0));
    case 'price-high':
      return sortedProjects.sort((a, b) => (b.pricing?.min || 0) - (a.pricing?.min || 0));
    case 'yield-high':
      return sortedProjects.sort((a, b) => (b.estimated_yield || 0) - (a.estimated_yield || 0));
    case 'units-available':
      return sortedProjects.sort((a, b) => (b.units?.available || 0) - (a.units?.available || 0));
    case 'completion-nearest':
    default:
      return sortedProjects.sort((a, b) => {
        const aCompletion = getCompletionSortValue(a.timeline?.completion);
        const bCompletion = getCompletionSortValue(b.timeline?.completion);
        return aCompletion - bCompletion;
      });
  }
}

function applyProjectFilters() {
  const projectsData = window.AMP?.projects || [];
  if (!projectsData.length) {
    console.error('AMP projects data not loaded');
    return;
  }

  const lang = document.documentElement.lang || 'th';

  // Filter projects
  let filteredProjects = projectsData.filter(project => {
    // Status filter
    if (currentFilters.status !== 'all' && project.status !== currentFilters.status) {
      return false;
    }

    // Type filter
    if (currentFilters.type !== 'all' && project.type !== currentFilters.type) {
      return false;
    }

    // Area filter
    if (currentFilters.area !== 'all' && project.location.toLowerCase() !== currentFilters.area.toLowerCase()) {
      return false;
    }

    // Price range filter
    if (currentFilters.priceRange !== 'all') {
      const minPrice = project.pricing.min;
      switch (currentFilters.priceRange) {
        case 'under2':
          if (minPrice >= 2000000) return false;
          break;
        case '2to5':
          if (minPrice < 2000000 || minPrice >= 5000000) return false;
          break;
        case '5to10':
          if (minPrice < 5000000 || minPrice >= 10000000) return false;
          break;
        case 'over10':
          if (minPrice < 10000000) return false;
          break;
      }
    }

    return true;
  });

  const sortedProjects = sortProjects(filteredProjects, currentFilters.sortBy);

  // Display projects
  displayProjects(sortedProjects, lang);

  // Update count
  updateProjectCount(sortedProjects.length);
}

function displayProjects(projects, lang) {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <p style="font-size: 18px; color: var(--color-gray-600);">
          ${lang === 'th' ? 'ไม่พบโครงการที่ตรงกับเงื่อนไข' : 'No projects found matching your criteria'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(project => createProjectCard(project, lang)).join('');
  updateCompareUI(lang);
}

function createProjectCard(project, lang) {
  const name = project.name[lang] || project.name.en;
  const statusText = getStatusText(project.status, lang);
  const statusClass = project.status.replace('_', '-');
  const isCompared = isProjectCompared(project.project_id);

  const priceText = formatPrice(project.pricing.min, project.pricing.max, lang);
  const yieldText = project.estimated_yield ? `${project.estimated_yield}%` : 'N/A';

  const progressBar = project.status === 'under-construction'
    ? `
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${project.timeline.progress}%"></div>
      </div>
      <div class="progress-label">
        <span>${lang === 'th' ? 'ความคืบหน้า' : 'Progress'}</span>
        <span>${project.timeline.progress}%</span>
      </div>
    `
    : '';

  return `
    <div class="project-card">
      <div class="project-card-image">
        <img src="${project.images[0]}" alt="${name}" loading="lazy">
        <div class="project-status-badge ${statusClass}">${statusText}</div>
      </div>
      <div class="project-card-content">
        <h3 class="project-card-title">${name}</h3>
        <div class="project-card-location">
          <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
          <span>${project.location}</span>
        </div>
        
        <div class="project-card-developer" style="font-size: 13px; color: var(--color-gray-500); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
           <i data-lucide="hard-hat" style="width: 14px; height: 14px;"></i>
           <span>${project.developer.name}</span>
           <span style="color: #F59E0B; display: flex; align-items: center; gap: 2px;">
             <i data-lucide="star" style="width: 12px; height: 12px; fill: currentColor;"></i>
             ${project.developer.rating}
           </span>
        </div>
        
        ${progressBar}
        
        <div class="project-card-meta">
          <div class="project-card-meta-item">
            <span class="project-card-meta-label">${lang === 'th' ? 'ยูนิตว่าง' : 'Available'}</span>
            <span class="project-card-meta-value">${project.units.available}/${project.units.total}</span>
          </div>
          <div class="project-card-meta-item">
            <span class="project-card-meta-label">${lang === 'th' ? 'ผลตอบแทน' : 'Yield'}</span>
            <span class="project-card-meta-value">${yieldText}</span>
          </div>
        </div>
        
        <div class="project-card-price">${priceText}</div>
        <div class="project-card-price-range">
          ${project.size.min}-${project.size.max} ${lang === 'th' ? 'ตร.ม.' : 'sqm'}
        </div>
        
        <div class="project-card-actions">
          <button class="btn btn-secondary btn-block project-compare-btn ${isCompared ? 'active' : ''}" data-project-id="${project.project_id}" type="button">
            ${isCompared ? getCompareLabel(lang, 'compare_remove') : getCompareLabel(lang, 'compare_add')}
          </button>
          <a href="/projects/detail.html?id=${project.project_id}" class="btn btn-primary btn-block">
            ${lang === 'th' ? 'ดูข้อมูล' : 'View Info'}
          </a>
        </div>
      </div>
    </div>
  `;
}

function isProjectCompared(projectId) {
  return readCompareList().includes(String(projectId || ''));
}

function updateCompareUI(lang) {
  if (typeof document === 'undefined') return;
  const compareList = readCompareList();
  document.querySelectorAll('.project-compare-btn').forEach(button => {
    const isSelected = compareList.includes(button.dataset.projectId);
    button.classList.toggle('active', isSelected);
    button.textContent = isSelected ? getCompareLabel(lang, 'compare_remove') : getCompareLabel(lang, 'compare_add');
  });
  updateCompareBar(compareList.length, lang);
}

function updateCompareBar(count, lang) {
  const compareBar = document.getElementById('compare-bar');
  if (!compareBar) return;
  const compareCount = document.getElementById('compare-count');
  const compareViewButton = document.getElementById('compare-view-btn');
  const compareText = getCompareLabel(lang, 'compare_projects_title');
  if (compareCount) compareCount.textContent = `${compareText} (${count})`;
  if (compareViewButton) {
    compareViewButton.textContent = getCompareLabel(lang, 'compare_view');
    compareViewButton.disabled = count < COMPARE_MIN_ITEMS;
  }
  compareBar.classList.toggle('active', count > 0);
}

function setupCompareButtons() {
  const projectsGrid = document.getElementById('projects-grid');
  if (projectsGrid) {
    projectsGrid.addEventListener('click', event => {
      const compareButton = event.target.closest('.project-compare-btn');
      if (!compareButton) return;
      const result = toggleCompareProjectId(readCompareList(), compareButton.dataset.projectId);
      if (result.maxReached) {
        const lang = document.documentElement.lang || 'th';
        window.alert(getCompareLabel(lang, 'compare_max_3'));
        return;
      }
      writeCompareList(result.list);
      updateCompareUI(document.documentElement.lang || 'th');
    });
  }

  const compareViewButton = document.getElementById('compare-view-btn');
  if (compareViewButton) {
    compareViewButton.addEventListener('click', () => {
      if (readCompareList().length >= COMPARE_MIN_ITEMS) {
        window.location.href = '/projects/compare.html';
      }
    });
  }
}

function getProjectById(projectId) {
  const projectsData = window.AMP?.projects || [];
  return projectsData.find(project => project.project_id === projectId);
}

function initComparePage() {
  const tableContainer = document.getElementById('compare-table-container');
  if (!tableContainer) return;
  const lang = document.documentElement.lang || 'th';
  const compareIds = readCompareList();
  const projects = compareIds.map(getProjectById).filter(Boolean);
  const emptyMessage = document.getElementById('compare-empty-message');
  if (projects.length < COMPARE_MIN_ITEMS) {
    if (emptyMessage) emptyMessage.style.display = 'block';
    tableContainer.innerHTML = '';
    return;
  }
  if (emptyMessage) emptyMessage.style.display = 'none';

  const labels = {
    price: lang === 'th' ? 'ราคา' : 'Price',
    size: lang === 'th' ? 'ขนาด' : 'Size',
    yield: lang === 'th' ? 'ผลตอบแทน' : 'Yield',
    units: lang === 'th' ? 'ยูนิตว่าง' : 'Units available',
    foreignQuota: lang === 'th' ? 'โควต้าต่างชาติ' : 'Foreign quota',
    facilities: lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Facilities',
    completionDate: lang === 'th' ? 'วันที่แล้วเสร็จ' : 'Completion date',
    notAvailable: lang === 'th' ? 'ไม่มีข้อมูล' : 'N/A'
  };

  tableContainer.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>${lang === 'th' ? 'รายการ' : 'Item'}</th>
          ${projects.map(project => `<th>${project.name[lang] || project.name.en}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${labels.price}</td>
          ${projects.map(project => `<td>${formatPrice(project.pricing?.min || 0, project.pricing?.max || 0, lang)}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.size}</td>
          ${projects.map(project => `<td>${project.size?.min || 0}-${project.size?.max || 0} ${lang === 'th' ? 'ตร.ม.' : 'sqm'}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.yield}</td>
          ${projects.map(project => `<td>${Number.isFinite(project.estimated_yield) ? `${project.estimated_yield}` + '%' : labels.notAvailable}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.units}</td>
          ${projects.map(project => `<td>${project.units?.available || 0}/${project.units?.total || 0}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.foreignQuota}</td>
          ${projects.map(project => `<td>${project.units?.foreign_quota !== undefined && project.units?.foreign_quota !== null ? project.units.foreign_quota : labels.notAvailable}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.facilities}</td>
          ${projects.map(project => `<td>${(project.facilities || []).join(', ') || labels.notAvailable}</td>`).join('')}
        </tr>
        <tr>
          <td>${labels.completionDate}</td>
          ${projects.map(project => `<td>${project.timeline?.completion || labels.notAvailable}</td>`).join('')}
        </tr>
      </tbody>
    </table>
  `;
}

function getStatusText(status, lang) {
  const statusMap = {
    'pre-sale': lang === 'th' ? 'Pre-Sale' : 'Pre-Sale',
    'under-construction': lang === 'th' ? 'กำลังก่อสร้าง' : 'Under Construction',
    'ready-to-move': lang === 'th' ? 'พร้อมอยู่' : 'Ready to Move'
  };
  return statusMap[status] || status;
}

function formatPrice(min, max, lang) {
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + (lang === 'th' ? ' ล้าน' : 'M');
    }
    return (num / 1000).toFixed(0) + (lang === 'th' ? ' พัน' : 'K');
  };

  return `฿${formatNumber(min)} - ฿${formatNumber(max)}`;
}

function updateProjectCount(count) {
  const countEl = document.getElementById('project-count');
  if (countEl) {
    const lang = document.documentElement.lang || 'th';
    countEl.textContent = lang === 'th'
      ? `${count} โครงการ`
      : `${count} Projects`;
  }
}

function setupProjectFilters() {
  // Status filters
  document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
    btn.addEventListener('click', function () {
      // Remove active from siblings
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      // Add active to clicked
      this.classList.add('active');
      // Update filter
      currentFilters.status = this.dataset.status;
      updateURLFromFilters();
      applyProjectFilters();
    });
  });

  // Type filters
  document.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.type = this.dataset.type;
      updateURLFromFilters();
      applyProjectFilters();
    });
  });

  // Area filters
  document.querySelectorAll('.filter-btn[data-area]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.area = this.dataset.area;
      updateURLFromFilters();
      applyProjectFilters();
    });
  });

  // Price range filters
  document.querySelectorAll('.filter-btn[data-price]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.priceRange = this.dataset.price;
      updateURLFromFilters();
      applyProjectFilters();
    });
  });

  const sortSelect = document.getElementById('project-sort');
  if (sortSelect) {
    sortSelect.value = currentFilters.sortBy;
    sortSelect.addEventListener('change', function () {
      currentFilters.sortBy = this.value;
      updateURLFromFilters();
      applyProjectFilters();
    });
  }
}

function initProjects() {
  initComparePage();
  applyFiltersFromURL();
  updateURLFromFilters(true);

  // Set up filters
  setupProjectFilters();
  setupCompareButtons();

  // Initial display
  applyProjectFilters();

  window.addEventListener('popstate', () => {
    applyFiltersFromURL();
    applyProjectFilters();
  });

  // Re-apply on language change
  const observer = new MutationObserver(() => {
    applyProjectFilters();
    initComparePage();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
}

// Run on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProjects);
  } else {
    initProjects();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCompletionSortValue,
    sortProjects,
    getFiltersFromSearch,
    buildSearchFromFilters,
    updateURLFromFilters,
    sanitizeCompareList,
    toggleCompareProjectId,
    readCompareList,
    writeCompareList
  };
}
