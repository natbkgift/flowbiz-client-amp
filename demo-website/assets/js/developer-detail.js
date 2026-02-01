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
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.searchParams.set('id', developer.id);
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl.toString());
    }
    document.getElementById('og-url').setAttribute('content', canonicalUrl.toString());

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
    specialtiesContainer.innerHTML = '';
    specialties.forEach(function(tag) {
      const span = document.createElement('span');
      span.className = 'specialty-tag';
      span.textContent = tag;
      specialtiesContainer.appendChild(span);
    });

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
    return projects.filter(project => project.developer_id === developer.id);
  }

  function renderProjects(developer) {
    const grid = document.getElementById('developer-projects-grid');
    const projects = getDeveloperProjects(developer);
    const lang = currentLang;

    if (projects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
          <p style="font-size: 16px; color: var(--color-gray-600);" data-i18n="developer_projects_empty"></p>
        </div>
      `;
      if (typeof updatePageText === 'function') {
        updatePageText();
      }
      return;
    }

    grid.innerHTML = '';
    projects.forEach(project => {
      grid.appendChild(createProjectCard(project, lang, developer));
    });

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  function createProjectCard(project, lang, developer) {
    const name = project.name[lang] || project.name.en;
    const developerName = developer?.name || '';
    const statusText = getStatusText(project.status, lang);
    const statusClass = project.status.replace('_', '-');
    const priceText = formatPrice(project.pricing.min, project.pricing.max, lang);
    const yieldText = project.estimated_yield ? `${project.estimated_yield}%` : 'N/A';
    const developerRating = developer && typeof developer.rating === 'number'
      ? (Number.isInteger(developer.rating) ? developer.rating.toString() : developer.rating.toFixed(1))
      : '';
    const rawImage = project.images?.[0] || '';
    const safeImage = getSafeImageUrl(rawImage);

    const card = document.createElement('div');
    card.className = 'project-card';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'project-card-image';

    const image = document.createElement('img');
    image.src = safeImage;
    image.alt = name;
    image.loading = 'lazy';

    const statusBadge = document.createElement('div');
    statusBadge.className = `project-status-badge ${statusClass}`;
    statusBadge.textContent = statusText;

    imageWrap.appendChild(image);
    imageWrap.appendChild(statusBadge);

    const content = document.createElement('div');
    content.className = 'project-card-content';

    const title = document.createElement('h3');
    title.className = 'project-card-title';
    title.textContent = name;

    const location = document.createElement('div');
    location.className = 'project-card-location';
    const locationIcon = document.createElement('i');
    locationIcon.setAttribute('data-lucide', 'map-pin');
    locationIcon.style.width = '16px';
    locationIcon.style.height = '16px';
    const locationText = document.createElement('span');
    locationText.textContent = project.location;
    location.appendChild(locationIcon);
    location.appendChild(locationText);

    const developerInfo = document.createElement('div');
    developerInfo.className = 'project-card-developer';
    const developerIcon = document.createElement('i');
    developerIcon.setAttribute('data-lucide', 'hard-hat');
    developerIcon.style.width = '14px';
    developerIcon.style.height = '14px';
    const developerText = document.createElement('span');
    developerText.textContent = developerName;
    developerInfo.appendChild(developerIcon);
    developerInfo.appendChild(developerText);

    if (developerRating) {
      const rating = document.createElement('span');
      rating.className = 'project-card-developer-rating';
      const ratingIcon = document.createElement('i');
      ratingIcon.setAttribute('data-lucide', 'star');
      ratingIcon.style.width = '12px';
      ratingIcon.style.height = '12px';
      ratingIcon.style.fill = 'currentColor';
      rating.appendChild(ratingIcon);
      rating.appendChild(document.createTextNode(developerRating));
      developerInfo.appendChild(rating);
    }

    const meta = document.createElement('div');
    meta.className = 'project-card-meta';

    const availableItem = document.createElement('div');
    availableItem.className = 'project-card-meta-item';
    const availableLabel = document.createElement('span');
    availableLabel.className = 'project-card-meta-label';
    availableLabel.textContent = lang === 'th' ? 'ยูนิตว่าง' : 'Available';
    const availableValue = document.createElement('span');
    availableValue.className = 'project-card-meta-value';
    availableValue.textContent = `${project.units.available}/${project.units.total}`;
    availableItem.appendChild(availableLabel);
    availableItem.appendChild(availableValue);

    const yieldItem = document.createElement('div');
    yieldItem.className = 'project-card-meta-item';
    const yieldLabel = document.createElement('span');
    yieldLabel.className = 'project-card-meta-label';
    yieldLabel.textContent = lang === 'th' ? 'ผลตอบแทน' : 'Yield';
    const yieldValue = document.createElement('span');
    yieldValue.className = 'project-card-meta-value';
    yieldValue.textContent = yieldText;
    yieldItem.appendChild(yieldLabel);
    yieldItem.appendChild(yieldValue);

    meta.appendChild(availableItem);
    meta.appendChild(yieldItem);

    const price = document.createElement('div');
    price.className = 'project-card-price';
    price.textContent = priceText;

    const sizeRange = document.createElement('div');
    sizeRange.className = 'project-card-price-range';
    sizeRange.textContent = `${project.size.min}-${project.size.max} ${lang === 'th' ? 'ตร.ม.' : 'sqm'}`;

    const actions = document.createElement('div');
    actions.className = 'project-card-actions';
    const link = document.createElement('a');
    link.href = `../projects/detail.html?id=${encodeURIComponent(project.project_id)}`;
    link.className = 'btn btn-primary btn-block';
    link.textContent = lang === 'th' ? 'ดูข้อมูล' : 'View Info';
    actions.appendChild(link);

    content.appendChild(title);
    content.appendChild(location);
    content.appendChild(developerInfo);
    content.appendChild(meta);
    content.appendChild(price);
    content.appendChild(sizeRange);
    content.appendChild(actions);

    card.appendChild(imageWrap);
    card.appendChild(content);

    return card;
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

  function getSafeImageUrl(url) {
    if (!url) {
      return '';
    }
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
