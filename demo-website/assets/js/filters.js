// AMP Demo Website - Filters
// Client-side filter logic for listing page

// Current filter state
let currentFilters = {
  intent: '',
  types: [],
  areas: [],
  beds: null,
  priceMin: 0,
  priceMax: 100000000
};

// Initialize filters from URL params
function initFilters() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('intent')) {
    currentFilters.intent = params.get('intent');
    setIntentToggle(currentFilters.intent);
  }

  if (params.get('type')) {
    currentFilters.types = params.get('type').split(',');
    setTypeCheckboxes(currentFilters.types);
  }

  if (params.get('area')) {
    currentFilters.areas = params.get('area').split(',');
    setAreaCheckboxes(currentFilters.areas);
  }

  if (params.get('beds')) {
    currentFilters.beds = parseInt(params.get('beds'));
    setBedChips(currentFilters.beds);
  }

  if (params.get('priceMin')) {
    currentFilters.priceMin = parseInt(params.get('priceMin'));
  }

  if (params.get('priceMax')) {
    currentFilters.priceMax = parseInt(params.get('priceMax'));
  }

  applyFilters();
}

// Get selected intent
function getSelectedIntent() {
  const activeToggle = document.querySelector('.toggle-option.active');
  return activeToggle ? activeToggle.dataset.value : '';
}

// Get selected types
function getSelectedTypes() {
  const checkboxes = document.querySelectorAll('input[name="type"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Get selected areas
function getSelectedAreas() {
  const checkboxes = document.querySelectorAll('input[name="area"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Get selected beds
function getSelectedBeds() {
  const activeChip = document.querySelector('.chip.active[data-beds]');
  if (!activeChip) return null;
  const beds = activeChip.dataset.beds;
  return beds === 'studio' ? 0 : parseInt(beds);
}

// Get price range
function getPriceRange() {
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');

  return {
    min: minInput ? parseInt(minInput.value) || 0 : 0,
    max: maxInput ? parseInt(maxInput.value) || 100000000 : 100000000
  };
}

// Apply filters
function applyFilters() {
  // Update filter state
  currentFilters.intent = getSelectedIntent();
  currentFilters.types = getSelectedTypes();
  currentFilters.areas = getSelectedAreas();
  currentFilters.beds = getSelectedBeds();
  const priceRange = getPriceRange();
  currentFilters.priceMin = priceRange.min;
  currentFilters.priceMax = priceRange.max;

  // Filter properties
  let filtered = ALL_PROPERTIES.filter(property => {
    // Intent filter
    if (currentFilters.intent && property.intent !== currentFilters.intent) {
      return false;
    }

    // Type filter
    if (currentFilters.types.length > 0 && !currentFilters.types.includes(property.type)) {
      return false;
    }

    // Area filter
    if (currentFilters.areas.length > 0 && !currentFilters.areas.includes(property.area)) {
      return false;
    }

    // Beds filter
    if (currentFilters.beds !== null) {
      // For 4+ selection, treat as "at least" this many beds
      if (currentFilters.beds >= 4) {
        if (property.beds < currentFilters.beds) {
          return false;
        }
      } else if (property.beds !== currentFilters.beds) {
        // For studio, 1, 2, 3, require exact match
        return false;
      }
    }

    // Price filter
    if (property.price < currentFilters.priceMin || property.price > currentFilters.priceMax) {
      return false;
    }

    return true;
  });

  // Apply sorting
  const sortBy = document.getElementById('sort-by')?.value || 'updated';
  filtered = sortProperties(filtered, sortBy);

  // Render results
  renderPropertyGrid(filtered);
  updateResultsCount(filtered.length);
  updateURL();

  // Close mobile filter
  const filterSidebar = document.querySelector('.filter-sidebar');
  if (filterSidebar) {
    filterSidebar.classList.remove('active');
  }

  // Update OG image based on selected area when possible
  const ogImage = document.querySelector('meta[property="og:image"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (ogImage || twitterImage) {
    let selectedAreaKey = null;
    if (currentFilters.areas.length === 1) {
      selectedAreaKey = currentFilters.areas[0].toLowerCase().replace(/ /g, '-');
    } else if (currentFilters.areas.length === 0) {
      const params = new URLSearchParams(window.location.search);
      const areaParam = params.get('area');
      if (areaParam) {
        const normalized = areaParam.split(',')[0].trim();
        if (normalized) {
          selectedAreaKey = normalized.toLowerCase().replace(/ /g, '-');
        }
      }
    }
    const areaSource = window.AMP?.areaGuideData || window.AMP?.areaData;
    const areaOgImage = selectedAreaKey && areaSource?.[selectedAreaKey]?.og_image;
    if (areaOgImage) {
      if (ogImage) ogImage.setAttribute('content', areaOgImage);
      if (twitterImage) twitterImage.setAttribute('content', areaOgImage);
    }
  }
}

// Sort properties
function sortProperties(properties, sortBy) {
  const sorted = [...properties];

  switch (sortBy) {
    case 'updated':
      sorted.sort((a, b) => new Date(b.updated) - new Date(a.updated));
      break;
    case 'newest':
      sorted.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'price-low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }

  return sorted;
}

// Render property grid
function renderPropertyGrid(properties) {
  const grid = document.getElementById('property-grid');
  if (!grid) return;

  // Show loading state briefly for better UX
  grid.classList.add('loading');

  if (properties.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 0;">
        <h3 data-i18n="no_results">ไม่พบทรัพย์สินที่ตรงกับเงื่อนไข</h3>
        <p style="color: var(--color-gray-600); margin-top: 16px;" data-i18n="no_results_hint">
          ลองปรับเปลี่ยนตัวกรองเพื่อค้นหาทรัพย์สินอื่นๆ
        </p>
        <button class="btn btn-primary" onclick="resetFilters()" style="margin-top: 24px;" data-i18n="filter_reset">
          รีเซ็ตตัวกรอง
        </button>
      </div>
    `;
    grid.classList.remove('loading');
    return;
  }

  grid.innerHTML = properties.map(property => createPropertyCard(property)).join('');
  grid.classList.remove('loading');

  // Reinitialize Lucide icons for dynamically added content
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Create property card HTML
function createPropertyCard(property) {
  const currentLang = document.documentElement.lang || 'en';
  const title = currentLang === 'th' ? property.title_th : property.title_en;

  // Localized Labels
  const priceLabel = property.intent === 'rent' ? (currentLang === 'th' ? '/เดือน' : '/month') : '';
  const bedUnit = currentLang === 'th' ? 'ห้องนอน' : (property.beds === 1 ? 'Bed' : 'Beds');
  const bedsLabel = property.beds === 0 ? 'Studio' : `${property.beds} ${bedUnit}`;
  const bathUnit = currentLang === 'th' ? 'ห้องน้ำ' : (property.baths === 1 ? 'Bath' : 'Baths');
  const bathsLabel = `${property.baths} ${bathUnit}`;

  const badges = property.badges.map(badge => {
    const badgeClass = badge === 'Featured' ? 'badge-featured' :
      badge === 'Available Now' ? 'badge-available' : 'badge-updated';
    const badgeI18n = badge === 'Featured' ? 'prop_featured' :
      badge === 'Available Now' ? 'prop_available' : '';
    // If no i18n key, display badge text as is (or map if needed)
    const displayText = badgeI18n ? '' : badge;
    return `<span class="badge ${badgeClass}" ${badgeI18n ? `data-i18n="${badgeI18n}"` : ''}>${displayText}</span>`;
  }).join('');

  return `
    <div class="property-card">
      <div class="card-image">
        <img src="${property.image}" alt="${title}" loading="lazy">
        ${badges ? `<div class="card-badges">${badges}</div>` : ''}
      </div>
      <div class="card-content">
        <div class="card-price">฿${property.price.toLocaleString()}<span>${priceLabel}</span></div>
        <h3 class="card-title">${title}</h3>
        <div class="card-facts">
          ${property.beds !== null ? `<span><i data-lucide="bed-double"></i> ${bedsLabel}</span>` : ''}
          ${property.baths !== null ? `<span><i data-lucide="bath"></i> ${bathsLabel}</span>` : ''}
          <span><i data-lucide="square"></i> ${property.sqm} <span data-i18n="prop_sqm">m²</span></span>
        </div>
        <div class="card-location"><i data-lucide="map-pin"></i> ${property.area}</div>
        <div class="card-actions">
          <a href="detail.html?id=${property.id}" class="btn btn-primary btn-sm" data-i18n="prop_view_detail">View Details</a>
          <button class="btn btn-secondary btn-icon" title="LINE" aria-label="Contact via LINE">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button class="btn btn-secondary btn-icon" title="Call" aria-label="Call">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Update results count
function updateResultsCount(count) {
  const countElement = document.getElementById('results-count');
  if (countElement) {
    const currentLang = document.documentElement.lang || 'en';
    countElement.textContent = currentLang === 'th'
      ? `พบ ${count} ทรัพย์สิน`
      : `${count} Properties Found`;
  }
}

// Update URL with filter params
function updateURL() {
  const params = new URLSearchParams();

  if (currentFilters.intent) {
    params.set('intent', currentFilters.intent);
  }

  if (currentFilters.types.length > 0) {
    params.set('type', currentFilters.types.join(','));
  }

  if (currentFilters.areas.length > 0) {
    params.set('area', currentFilters.areas.join(','));
  }

  if (currentFilters.beds !== null) {
    params.set('beds', currentFilters.beds.toString());
  }

  if (currentFilters.priceMin > 0) {
    params.set('priceMin', currentFilters.priceMin.toString());
  }

  if (currentFilters.priceMax < 100000000) {
    params.set('priceMax', currentFilters.priceMax.toString());
  }

  const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', newURL);
}

// Reset filters
function resetFilters() {
  currentFilters = {
    intent: '',
    types: [],
    areas: [],
    beds: null,
    priceMin: 0,
    priceMax: 100000000
  };

  // Reset UI
  document.querySelectorAll('.toggle-option').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));

  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  if (minInput) minInput.value = '';
  if (maxInput) maxInput.value = '';

  applyFilters();
}

// Set intent toggle from URL
function setIntentToggle(intent) {
  document.querySelectorAll('.toggle-option').forEach(btn => {
    if (btn.dataset.value === intent) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Set type checkboxes from URL
function setTypeCheckboxes(types) {
  document.querySelectorAll('input[name="type"]').forEach(cb => {
    cb.checked = types.includes(cb.value);
  });
}

// Set area checkboxes from URL
function setAreaCheckboxes(areas) {
  document.querySelectorAll('input[name="area"]').forEach(cb => {
    cb.checked = areas.includes(cb.value);
  });
}

// Set bed chips from URL
function setBedChips(beds) {
  document.querySelectorAll('.chip[data-beds]').forEach(chip => {
    const chipBeds = chip.dataset.beds === 'studio' ? 0 : parseInt(chip.dataset.beds);
    if (chipBeds === beds) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// Toggle mobile filter sidebar
function toggleFilterSidebar() {
  const filterSidebar = document.querySelector('.filter-sidebar');
  if (filterSidebar) {
    filterSidebar.classList.toggle('active');
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFilters);
} else {
  initFilters();
}
