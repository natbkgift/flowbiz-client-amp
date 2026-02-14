// AMP Demo Website - Project Detail Page
// Handles project detail display with full information

(function() {
  'use strict';

  // Get project_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  // State
  let currentProject = null;
  let currentLang = document.documentElement.lang || 'th';

  // Initialize on page load
  function init() {
    if (!projectId) {
      showNotFound();
      return;
    }

    loadProject();
    
    // Listen for language changes
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          currentLang = document.documentElement.lang || 'th';
          if (currentProject) {
            renderProject(currentProject);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  // Load project data
  function loadProject() {
    const projects = window.AMP?.projects || [];
    const project = projects.find(p => p.project_id === projectId);

    if (!project) {
      showNotFound();
      return;
    }

    currentProject = project;
    renderProject(project);
    loadRelatedProjects(project);
    
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('project-detail-content').style.display = 'block';
  }

  // Show not found state
  function showNotFound() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('not-found-state').style.display = 'block';
  }

  // Render project details
  function renderProject(project) {
    const lang = currentLang;
    const name = project.name[lang] || project.name.en;
    const description = project.description[lang] || project.description.en;

    // Update page title and meta tags
    const title = `${name} | Asset Management Property`;
    document.getElementById('page-title').textContent = title;
    document.title = title;
    
    // Update OG tags
    const ogImage = project.images[0] || '';
    document.getElementById('og-title').setAttribute('content', title);
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('og-image').setAttribute('content', ogImage);
    document.getElementById('twitter-title').setAttribute('content', title);
    document.getElementById('twitter-description').setAttribute('content', description);
    document.getElementById('twitter-image').setAttribute('content', ogImage);
    document.getElementById('meta-description').setAttribute('content', description);

    // Hero Gallery
    renderGallery(project.images);

    // Hero Info
    document.getElementById('project-name').textContent = name;
    document.getElementById('project-location').textContent = project.location;
    
    // Status Badge
    const statusBadge = document.getElementById('project-status-badge');
    const statusText = getStatusText(project.status, lang);
    const statusClass = project.status.replace('_', '-');
    statusBadge.textContent = statusText;
    statusBadge.className = `project-status-badge ${statusClass}`;

    // Project Info
    document.getElementById('project-developer').innerHTML = `
      <strong>${project.developer.name}</strong>
      <span style="color: #F59E0B; margin-left: 8px;">
        <i data-lucide="star" style="width: 14px; height: 14px; fill: currentColor;"></i>
        ${project.developer.rating}
      </span>
    `;
    document.getElementById('project-area').textContent = project.location;
    document.getElementById('project-type').textContent = project.type === 'condo' ? 
      (lang === 'th' ? 'คอนโด' : 'Condo') : 
      (lang === 'th' ? 'วิลล่า' : 'Villa');
    document.getElementById('project-completion').textContent = project.timeline.completion;

    // Timeline
    document.getElementById('timeline-launch').textContent = project.timeline.launch;
    document.getElementById('timeline-start').textContent = project.timeline.construction_start;
    document.getElementById('timeline-completion').textContent = project.timeline.completion;

    // Progress bar (for under construction)
    const progressSection = document.getElementById('progress-section');
    if (project.status === 'under-construction') {
      progressSection.style.display = 'block';
      document.getElementById('progress-fill').style.width = `${project.timeline.progress}%`;
      document.getElementById('progress-text').textContent = `${project.timeline.progress}%`;
    } else {
      progressSection.style.display = 'none';
    }

    // Pricing
    document.getElementById('price-min').textContent = formatPrice(project.pricing.min);
    document.getElementById('price-max').textContent = formatPrice(project.pricing.max);
    document.getElementById('price-sqm').textContent = formatPrice(project.pricing.per_sqm);
    document.getElementById('est-yield').textContent = `${project.estimated_yield}%`;

    // Units
    document.getElementById('total-units').textContent = project.units.total.toLocaleString();
    document.getElementById('available-units').textContent = project.units.available.toLocaleString();
    document.getElementById('size-range').textContent = `${project.size.min}-${project.size.max} ${lang === 'th' ? 'ตร.ม.' : 'sqm'}`;

    // Foreign Quota
    const foreignQuotaBadge = document.getElementById('foreign-quota');
    if (project.units.foreign_quota > 0) {
      foreignQuotaBadge.style.display = 'flex';
      foreignQuotaBadge.querySelector('span').setAttribute('data-i18n', 'project_detail_foreign_quota_available');
    } else {
      foreignQuotaBadge.style.display = 'flex';
      foreignQuotaBadge.querySelector('span').setAttribute('data-i18n', 'project_detail_no_foreign_quota');
    }

    // Unit types
    renderUnitTypes(project.unit_types || [], lang);
    renderFloorPlans(project.floor_plans || []);

    // Facilities
    renderFacilities(project.facilities);

    // Promotions
    renderPromotions(project.promotions, lang);

    // Description
    document.getElementById('project-description').textContent = description;

    // Update i18n
    if (typeof updatePageText === 'function') {
      updatePageText();
    }

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Render gallery
  function renderGallery(images) {
    const gallery = document.getElementById('hero-gallery');
    if (!images || images.length === 0) return;

    const mainImage = images[0];
    gallery.innerHTML = `
      <div class="gallery-main-image" style="background-image: url('${mainImage}')">
        <div class="gallery-counter">${images.length} ${currentLang === 'th' ? 'รูป' : 'Photos'}</div>
      </div>
      <div class="gallery-thumbnails">
        ${images.slice(0, 4).map((img, idx) => `
          <div class="gallery-thumb" style="background-image: url('${img}')">
            ${idx === 3 && images.length > 4 ? `<div class="gallery-more">+${images.length - 4}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render unit types table
  function renderUnitTypes(unitTypes, lang) {
    const tableBody = document.getElementById('unit-types-body');
    if (!tableBody) return;

    if (!unitTypes.length) {
      tableBody.innerHTML = '';
      return;
    }

    tableBody.innerHTML = unitTypes.map(unit => {
      const unitType = getUnitTypeLabel(unit.type);
      return `
        <tr>
          <td>${unitType}</td>
          <td>${unit.size_min}-${unit.size_max} ${lang === 'th' ? 'ตร.ม.' : 'sqm'}</td>
          <td>${formatPrice(unit.price_min)} - ${formatPrice(unit.price_max)}</td>
          <td>${unit.available.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  function getUnitTypeLabel(type) {
    const key = `unit_type_${sanitizeTranslationKey(type)}`;
    const translated = typeof t === 'function' ? t(key) : key;
    return translated === key ? type : translated;
  }

  function sanitizeTranslationKey(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function renderFloorPlans(floorPlans) {
    const section = document.getElementById('floor-plans-section');
    const grid = document.getElementById('floor-plans-grid');
    if (!section || !grid) return;

    if (!floorPlans.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    floorPlans.forEach((plan) => {
      const card = document.createElement('div');
      card.className = 'floor-plan-card';

      const imageButton = document.createElement('button');
      imageButton.type = 'button';
      imageButton.className = 'floor-plan-image-btn';
      imageButton.setAttribute('aria-label', `View ${plan.type} floor plan`);

      const image = document.createElement('img');
      image.className = 'floor-plan-image';
      image.src = plan.image;
      image.alt = `${plan.type} floor plan`;
      image.loading = 'lazy';
      imageButton.appendChild(image);

      imageButton.addEventListener('click', () => openFloorPlanLightbox(plan.image, image.alt));

      const meta = document.createElement('div');
      meta.className = 'floor-plan-meta';

      const title = document.createElement('h3');
      title.className = 'floor-plan-type';
      title.textContent = plan.type;

      const size = document.createElement('p');
      size.className = 'floor-plan-size';
      size.textContent = plan.size;

      meta.appendChild(title);
      meta.appendChild(size);

      card.appendChild(imageButton);
      card.appendChild(meta);
      grid.appendChild(card);
    });
  }

  function openFloorPlanLightbox(imageSrc, imageAlt) {
    let lightbox = document.getElementById('floor-plan-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'floor-plan-lightbox';
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close" type="button" aria-label="Close">×</button>
          <img class="lightbox-image" src="" alt="">
        </div>
      `;
      document.body.appendChild(lightbox);

      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
          closeFloorPlanLightbox(lightbox);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
          closeFloorPlanLightbox(lightbox);
        }
      });
    }

    const image = lightbox.querySelector('.lightbox-image');
    image.src = imageSrc;
    image.alt = imageAlt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeFloorPlanLightbox(lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Render facilities
  function renderFacilities(facilities) {
    const facilitiesGrid = document.getElementById('facilities-grid');
    
    const facilitiesIcons = {
      'Swimming Pool': 'waves',
      'Fitness Center': 'dumbbell',
      'Gym': 'dumbbell',
      'Parking': 'car',
      'Security 24/7': 'shield-check',
      'Co-working Space': 'briefcase',
      'Sky Lounge': 'cloud',
      'Private Beach Access': 'umbrella',
      'Kids Club': 'baby',
      'Clubhouse': 'home',
      'Playground': 'circle-play',
      'Garden': 'trees',
      'Sauna': 'flame',
      'Rooftop Bar': 'glass-water',
      'Rooftop Lounge': 'sofa',
      'Restaurant': 'utensils',
      'Beach Club': 'sunset',
      'Private Pool': 'waves',
      'Spa': 'sparkles',
      'Sky Garden': 'leaf',
      'Concierge': 'bell',
      'Infinity Pool': 'waves'
    };

    facilitiesGrid.innerHTML = facilities.map(facility => {
      const icon = facilitiesIcons[facility] || 'check-circle';
      return `
        <div class="facility-item">
          <i data-lucide="${icon}"></i>
          <span>${facility}</span>
        </div>
      `;
    }).join('');
  }

  // Render promotions
  function renderPromotions(promotions, lang) {
    const promotionsSection = document.getElementById('promotions-section');
    const promotionsList = document.getElementById('promotions-list');

    if (!promotions || promotions.length === 0) {
      promotionsSection.style.display = 'none';
      return;
    }

    promotionsSection.style.display = 'block';
    promotionsList.innerHTML = promotions.map(promo => {
      const text = promo[lang] || promo.en;
      return `
        <div class="promotion-item">
          <i data-lucide="tag"></i>
          <span>${text}</span>
        </div>
      `;
    }).join('');
  }

  // Load related projects
  function loadRelatedProjects(project) {
    const projects = window.AMP?.projects || [];
    const related = projects
      .filter(p => 
        p.project_id !== project.project_id && 
        (p.location === project.location || p.type === project.type)
      )
      .slice(0, 3);

    renderRelatedProjects(related);
  }

  // Render related projects
  function renderRelatedProjects(projects) {
    const grid = document.getElementById('related-projects-grid');
    const lang = currentLang;

    if (projects.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--color-gray-600);">No related projects found</p>`;
      return;
    }

    grid.innerHTML = projects.map(project => {
      const name = project.name[lang] || project.name.en;
      const statusText = getStatusText(project.status, lang);
      const statusClass = project.status.replace('_', '-');
      const priceText = formatPriceRange(project.pricing.min, project.pricing.max, lang);
      const yieldText = project.estimated_yield ? `${project.estimated_yield}%` : 'N/A';

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
    }).join('');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Helper: Get status text
  function getStatusText(status, lang) {
    const statusMap = {
      'pre-sale': lang === 'th' ? 'Pre-Sale' : 'Pre-Sale',
      'under-construction': lang === 'th' ? 'กำลังก่อสร้าง' : 'Under Construction',
      'ready-to-move': lang === 'th' ? 'พร้อมอยู่' : 'Ready to Move'
    };
    return statusMap[status] || status;
  }

  // Helper: Format price
  function formatPrice(price) {
    return `฿${price.toLocaleString()}`;
  }

  // Helper: Format price range
  function formatPriceRange(min, max, lang) {
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + (lang === 'th' ? ' ล้าน' : 'M');
      }
      return (num / 1000).toFixed(0) + (lang === 'th' ? ' พัน' : 'K');
    };

    return `฿${formatNumber(min)} - ฿${formatNumber(max)}`;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
