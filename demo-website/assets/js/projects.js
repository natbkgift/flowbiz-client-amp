// AMP Demo Website - Projects Filtering and Display
// Filter and display project listings

let currentFilters = {
  status: 'all',
  type: 'all',
  area: 'all',
  priceRange: 'all'
};

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

  // Display projects
  displayProjects(filteredProjects, lang);

  // Update count
  updateProjectCount(filteredProjects.length);
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
}

function createProjectCard(project, lang) {
  const name = project.name[lang] || project.name.en;
  const statusText = getStatusText(project.status, lang);
  const statusClass = project.status.replace('_', '-');

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
          <a href="/projects/detail.html?id=${project.project_id}" class="btn btn-primary btn-block">
            ${lang === 'th' ? 'ดูข้อมูล' : 'View Info'}
          </a>
        </div>
      </div>
    </div>
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
      applyProjectFilters();
    });
  });

  // Type filters
  document.querySelectorAll('.filter-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.type = this.dataset.type;
      applyProjectFilters();
    });
  });

  // Area filters
  document.querySelectorAll('.filter-btn[data-area]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.area = this.dataset.area;
      applyProjectFilters();
    });
  });

  // Price range filters
  document.querySelectorAll('.filter-btn[data-price]').forEach(btn => {
    btn.addEventListener('click', function () {
      this.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilters.priceRange = this.dataset.price;
      applyProjectFilters();
    });
  });
}

function initProjects() {
  // Set up filters
  setupProjectFilters();

  // Initial display
  applyProjectFilters();

  // Re-apply on language change
  const observer = new MutationObserver(() => {
    applyProjectFilters();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjects);
} else {
  initProjects();
}
