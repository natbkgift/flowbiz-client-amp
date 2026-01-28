// AMP Demo Website - Main JS
// Site-wide JavaScript functionality

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
  const langText = document.querySelector('.lang-switch span, #lang-text');
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
    option.addEventListener('click', function() {
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
    chip.addEventListener('click', function() {
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
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
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
    tab.addEventListener('click', function() {
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
    anchor.addEventListener('click', function(e) {
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
  
  searchForm.addEventListener('submit', function(e) {
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
  
  sortBy.addEventListener('change', function() {
    if (typeof applyFilters === 'function') {
      applyFilters();
    }
  });
}

// Area card click handler (home page)
function setupAreaCards() {
  const areaCards = document.querySelectorAll('.area-card');
  areaCards.forEach(card => {
    card.addEventListener('click', function() {
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
  const langText = document.querySelector('.lang-switch span, #lang-text');
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
document.addEventListener('click', function(e) {
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
document.addEventListener('click', function(e) {
  const filterSidebar = document.querySelector('.filter-sidebar');
  const filterToggleBtn = document.getElementById('filter-toggle-btn');
  
  if (filterSidebar && 
      filterSidebar.classList.contains('active') && 
      !filterSidebar.contains(e.target) && 
      (!filterToggleBtn || !filterToggleBtn.contains(e.target))) {
    filterSidebar.classList.remove('active');
  }
});
