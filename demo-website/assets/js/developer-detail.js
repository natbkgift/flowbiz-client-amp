// AMP Demo Website - Developer Detail Page
// Handles developer profile details and related projects

(function() {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  const developerId = urlParams.get('id');

  let currentDeveloper = null;
  let currentLang = document.documentElement.lang || 'th';

  function init() {
    if (!developerId) {
      showNotFound();
      return;
    }

    loadDeveloper();

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          currentLang = document.documentElement.lang || 'th';
          if (currentDeveloper) {
            renderDeveloper(currentDeveloper);
            renderProjects(currentDeveloper);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  function loadDeveloper() {
    const developers = window.AMP?.developers || [];
    const developer = developers.find(dev => dev.id === developerId);

    if (!developer) {
      showNotFound();
      return;
    }

    currentDeveloper = developer;
    renderDeveloper(developer);
    renderProjects(developer);

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('developer-detail-content').style.display = 'block';
  }

  function showNotFound() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('not-found-state').style.display = 'block';
  }

  function renderDeveloper(developer) {
    const lang = currentLang;
    const description = developer.description?.[lang] || developer.description?.en || '';
    const specialties = developer.specialties?.[lang] || developer.specialties?.en || [];

    const title = `${developer.name} | Asset Management Property`;
    document.getElementById('page-title').textContent = title;
    document.title = title;

    document.getElementById('og-title').setAttribute('content', title);
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('twitter-title').setAttribute('content', title);
    document.getElementById('twitter-description').setAttribute('content', description);
    document.getElementById('meta-description').setAttribute('content', description);

    if (developer.logo) {
      document.getElementById('og-image').setAttribute('content', developer.logo);
      document.getElementById('twitter-image').setAttribute('content', developer.logo);
    }

    const logo = document.getElementById('developer-logo');
    logo.src = developer.logo || '';
    logo.alt = developer.name || '';

    document.getElementById('developer-name').textContent = developer.name || '';
    document.getElementById('developer-rating-value').textContent = developer.rating?.toFixed(1) || '0.0';
    document.getElementById('developer-established').textContent = developer.established_year || '-';
    document.getElementById('developer-reviews').textContent = (developer.reviews_count || 0).toLocaleString();
    document.getElementById('developer-projects-delivered').textContent = developer.projects_delivered || 0;
    document.getElementById('developer-projects-ongoing').textContent = developer.projects_ongoing || 0;

    const descriptionEl = document.getElementById('developer-description');
    descriptionEl.textContent = description;

    const specialtiesContainer = document.getElementById('developer-specialties');
    specialtiesContainer.innerHTML = specialties.map(tag => `<span class="specialty-tag">${tag}</span>`).join('');

    const projectCount = getDeveloperProjects(developer).length;
    document.getElementById('developer-projects-total').textContent = projectCount;

    if (typeof updatePageText === 'function') {
      updatePageText();
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function getDeveloperProjects(developer) {
    const projects = window.AMP?.projects || [];
    return projects.filter(project => {
      if (project.developer_id) {
        return project.developer_id === developer.id;
      }
      return project.developer?.name === developer.name;
    });
  }

  function renderProjects(developer) {
    const grid = document.getElementById('developer-projects-grid');
    const projects = getDeveloperProjects(developer);
    const lang = currentLang;

    if (projects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
          <p style="font-size: 16px; color: var(--color-gray-600);" data-i18n="developer_projects_empty">
            ${lang === 'th' ? 'ยังไม่มีโครงการที่ตรงกับผู้พัฒนานี้' : 'No projects are available for this developer yet'}
          </p>
        </div>
      `;
      if (typeof updatePageText === 'function') {
        updatePageText();
      }
      return;
    }

    grid.innerHTML = projects.map(project => createProjectCard(project, lang)).join('');

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function createProjectCard(project, lang) {
    const name = project.name[lang] || project.name.en;
    const statusText = getStatusText(project.status, lang);
    const statusClass = project.status.replace('_', '-');
    const priceText = formatPrice(project.pricing.min, project.pricing.max, lang);
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
            <a href="../projects/detail.html?id=${project.project_id}" class="btn btn-primary btn-block">
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
