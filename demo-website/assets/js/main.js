// AMP Demo Website - Main JS
// Site-wide JavaScript functionality

const AMP_PLACEHOLDER_ADS_TOKEN = 'XXXXXXXXXX';
const AMP_ANALYTICS_EVENTS = '__AMP_ANALYTICS_EVENTS__';

function getGaMeasurementId() {
  const runtimeValue =
    window.GA_MEASUREMENT_ID ||
    window.AMP_GA_MEASUREMENT_ID ||
    window.TRACKING_CONFIG?.ga4MeasurementId ||
    document.documentElement?.dataset?.gaMeasurementId ||
    '';

  return String(runtimeValue).trim();
}

function recordAnalyticsEvent(eventName, payload) {
  window[AMP_ANALYTICS_EVENTS] = window[AMP_ANALYTICS_EVENTS] || [];
  window[AMP_ANALYTICS_EVENTS].push({
    event_name: eventName,
    payload,
    recorded_at: new Date().toISOString()
  });
}

function ensureGtag() {
  if (typeof window.gtag === 'function') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
}

function ensureGaScript(gaMeasurementId) {
  if (!gaMeasurementId) {
    return false;
  }

  const existingScript = document.querySelector('script[data-amp-ga4="true"]');
  if (existingScript) {
    return true;
  }

  const script = document.createElement('script');
  script.async = true;
  script.dataset.ampGa4 = 'true';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`;
  document.head.appendChild(script);
  return true;
}

function configureGa4() {
  const gaMeasurementId = getGaMeasurementId();
  if (!gaMeasurementId) {
    return false;
  }

  ensureGaScript(gaMeasurementId);
  ensureGtag();

  window.gtag('js', new Date());
  window.gtag('config', gaMeasurementId, { send_page_view: false });

  const adsId = window.TRACKING_CONFIG?.googleAdsId;
  if (adsId && !adsId.includes(AMP_PLACEHOLDER_ADS_TOKEN)) {
    window.gtag('config', adsId);
  }

  return true;
}

function trackPageView() {
  if (typeof window.gtag !== 'function') {
    return;
  }

  const payload = {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    timestamp: new Date().toISOString()
  };

  window.gtag('event', 'page_view', payload);
  recordAnalyticsEvent('page_view', payload);
}

function trackLeadSubmit(leadId) {
  if (!leadId || typeof window.gtag !== 'function') {
    return;
  }

  const payload = {
    lead_id: String(leadId),
    page_location: window.location.href,
    timestamp: new Date().toISOString()
  };

  window.gtag('event', 'lead_submit', payload);
  recordAnalyticsEvent('lead_submit', payload);
}

function isPhase1ScoreRequest(url, options) {
  if (!url || !String(url).includes('/v1/phase1/score')) {
    return false;
  }

  const method = (options?.method || 'GET').toUpperCase();
  return method === 'POST';
}

function installLeadSubmitFetchHook() {
  if (window.__ampLeadSubmitHookInstalled === true || typeof window.fetch !== 'function') {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function patchedFetch(input, init) {
    const requestUrl = typeof input === 'string' ? input : input?.url;
    const isLeadSubmitCall = isPhase1ScoreRequest(requestUrl, init);
    const response = await originalFetch(input, init);

    if (!isLeadSubmitCall || !response.ok) {
      return response;
    }

    try {
      const body = await response.clone().json();
      if (body?.lead_id) {
        trackLeadSubmit(body.lead_id);
      }
    } catch (_error) {
      // Ignore non-JSON responses silently.
    }

    return response;
  };

  window.__ampLeadSubmitHookInstalled = true;
}

function initAnalytics() {
  const gaConfigured = configureGa4();
  installLeadSubmitFetchHook();

  if (!gaConfigured) {
    return;
  }

  trackPageView();
}

window.AMPAnalytics = {
  init: initAnalytics,
  trackLeadSubmit,
  trackPageView
};

// Mobile menu toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburger = document.querySelector('.hamburger');
  if (mobileMenu && hamburger) {
    const isOpen = mobileMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen.toString());
  }
}

// Language switch (visual only - no actual translation in demo)
function switchLanguage(lang) {
  const currentLang = document.documentElement.lang || 'en';
  const newLang = lang || (currentLang === 'th' ? 'en' : 'th');

  // Update HTML lang attribute
  document.documentElement.lang = newLang;

  // Update language switch button text
  const langText = document.querySelector('#lang-text');
  if (langText) {
    langText.textContent = newLang === 'th' ? 'EN' : 'TH';
  }

  // In a real implementation, this would reload content in the new language
  console.log(`Language switched to: ${newLang}`);
}

// Intent toggle handler
function setupIntentToggle() {
  const toggleOptions = document.querySelectorAll('.toggle-option');
  toggleOptions.forEach(option => {
    option.addEventListener('click', function () {
      // Remove active from all
      toggleOptions.forEach(opt => opt.classList.remove('active'));
      // Add active to clicked
      this.classList.add('active');

      // Trigger filter if on listing page
      if (typeof applyFilters === 'function') {
        applyFilters();
      }
    });
  });
}

// Chip selection handler (for beds)
function setupChips() {
  const chips = document.querySelectorAll('.chip[data-beds]');
  chips.forEach(chip => {
    chip.addEventListener('click', function () {
      // Toggle active state
      if (this.classList.contains('active')) {
        this.classList.remove('active');
      } else {
        chips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
      }

      // Trigger filter if on listing page
      if (typeof applyFilters === 'function') {
        applyFilters();
      }
    });
  });
}

// Form validation
function setupFormValidation() {
  const forms = document.querySelectorAll('form:not([data-integration="true"])');
  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Simple validation
      const name = this.querySelector('[name="name"]');
      const phone = this.querySelector('[name="phone"]');

      if (name && !name.value.trim()) {
        alert('Please enter your name');
        name.focus();
        return;
      }

      if (phone && !phone.value.trim()) {
        alert('Please enter your phone number');
        phone.focus();
        return;
      }

      // Thai phone validation pattern: starts with 0 or +66, 9-10 digits
      const phonePattern = /^(\+66|0)[0-9]{8,9}$/;

      if (phone && phone.value.trim()) {
        const cleanPhone = phone.value.replace(/[-\s]/g, '');
        if (!phonePattern.test(cleanPhone)) {
          alert('Please enter a valid Thai phone number (e.g., 0891234567 or +66891234567)');
          phone.focus();
          return;
        }
      }

      // In demo, just show success message
      alert('Thank you! Your inquiry has been received. (Demo mode - not actually sent)');
      this.reset();
    });
  });
}

// Language tab switching
function setupLanguageTabs() {
  const tabs = document.querySelectorAll('.lang-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const targetLang = this.dataset.lang;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Show corresponding content
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => {
        if (content.dataset.lang === targetLang) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}

// Smooth scroll for anchor links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Search form handler (home page)
function setupSearchForm() {
  const searchForm = document.getElementById('search-form');
  if (!searchForm) return;

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form values
    let intent = this.querySelector('[name="intent"]')?.value || '';

    // Fallback: read intent from the active toggle button's data-value
    if (!intent) {
      const activeIntentToggle = this.querySelector('[data-value].active');
      if (activeIntentToggle) {
        intent = activeIntentToggle.getAttribute('data-value') || '';
      }
    }

    const type = this.querySelector('[name="type"]')?.value || '';
    const area = this.querySelector('[name="area"]')?.value || '';

    // Build query params
    const params = new URLSearchParams();
    if (intent) params.set('intent', intent);
    if (type) params.set('type', type);
    if (area) params.set('area', area);

    // Redirect to listing page
    window.location.href = `listing.html?${params.toString()}`;
  });
}

// Sort dropdown handler
function setupSortDropdown() {
  const sortBy = document.getElementById('sort-by');
  if (!sortBy) return;

  sortBy.addEventListener('change', function () {
    if (typeof applyFilters === 'function') {
      applyFilters();
    }
  });
}

// Area card click handler (home page)
function setupAreaCards() {
  const areaCards = document.querySelectorAll('.area-card');
  areaCards.forEach(card => {
    // Skip anchor elements - they should use native navigation
    if (card.tagName.toLowerCase() === 'a') {
      return;
    }
    card.addEventListener('click', function () {
      const area = this.dataset.area;
      if (area) {
        window.location.href = `listing.html?area=${area}`;
      }
    });
  });
}

// Lazy loading images
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// Initialize all functionality
function init() {
  initAnalytics();
  setupIntentToggle();
  setupChips();
  setupFormValidation();
  setupLanguageTabs();
  setupSmoothScroll();
  setupSearchForm();
  setupSortDropdown();
  setupAreaCards();
  setupLazyLoading();

  // Set initial language
  const langText = document.querySelector('#lang-text');
  if (langText) {
    const currentLang = document.documentElement.lang || 'en';
    langText.textContent = currentLang === 'th' ? 'EN' : 'TH';
  }
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Close mobile menu when clicking outside
document.addEventListener('click', function (e) {
  const mobileMenu = document.getElementById('mobile-menu');
  const hamburger = document.querySelector('.hamburger');

  if (mobileMenu &&
    mobileMenu.classList.contains('active') &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)) {
    mobileMenu.classList.remove('active');
  }
});

// Close filter sidebar when clicking outside (mobile)
document.addEventListener('click', function (e) {
  const filterSidebar = document.querySelector('.filter-sidebar');
  const filterToggleBtn = document.getElementById('filter-toggle-btn');

  if (filterSidebar &&
    filterSidebar.classList.contains('active') &&
    !filterSidebar.contains(e.target) &&
    (!filterToggleBtn || !filterToggleBtn.contains(e.target))) {
    filterSidebar.classList.remove('active');
  }
});
