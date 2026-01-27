// AMP Demo Website - Gallery
// Image lightbox and gallery functionality

class Gallery {
  constructor(images) {
    this.images = images || [];
    this.currentIndex = 0;
    this.lightbox = null;
    this.init();
  }
  
  init() {
    // Create lightbox element if it doesn't exist
    if (!document.getElementById('lightbox')) {
      this.createLightbox();
    }
    this.lightbox = document.getElementById('lightbox');
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;
      
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }
  
  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="gallery.close()" aria-label="Close">×</button>
        <button class="lightbox-nav lightbox-prev" onclick="gallery.prev()" aria-label="Previous">‹</button>
        <img class="lightbox-image" src="" alt="">
        <button class="lightbox-nav lightbox-next" onclick="gallery.next()" aria-label="Next">›</button>
      </div>
    `;
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        this.close();
      }
    });
    
    document.body.appendChild(lightbox);
  }
  
  open(index = 0) {
    if (!this.images || this.images.length === 0) return;
    
    this.currentIndex = index;
    this.render();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  close() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.render();
  }
  
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.render();
  }
  
  render() {
    const img = this.lightbox.querySelector('.lightbox-image');
    if (img && this.images[this.currentIndex]) {
      img.src = this.images[this.currentIndex];
      img.alt = `Property image ${this.currentIndex + 1} of ${this.images.length}`;
    }
  }
  
  setImages(images) {
    this.images = images;
  }
}

// Initialize gallery thumbnails
function initGalleryThumbnails() {
  const mainImage = document.getElementById('gallery-main-image');
  const counter = document.getElementById('gallery-counter');
  const thumbnails = document.querySelectorAll('.gallery-thumbnail');
  
  if (!mainImage || thumbnails.length === 0) return;
  
  let currentIndex = 0;
  
  // Update main image and counter
  function updateGallery(index) {
    currentIndex = index;
    const thumbnail = thumbnails[index];
    if (!thumbnail) return;
    
    const img = thumbnail.querySelector('img');
    if (img) {
      mainImage.src = img.dataset.large || img.src;
    }
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
    
    // Update counter
    if (counter) {
      const totalImages = (window.gallery && Array.isArray(window.gallery.images))
        ? window.gallery.images.length
        : thumbnails.length;
      counter.textContent = `${index + 1} / ${totalImages}`;
    }
  }
  
  // Add click handlers to thumbnails
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      updateGallery(index);
    });
  });
  
  // Open lightbox on main image click
  const galleryMain = document.querySelector('.gallery-main');
  if (galleryMain) {
    galleryMain.addEventListener('click', () => {
      if (window.gallery) {
        window.gallery.open(currentIndex);
      }
    });
  }
  
  // Initialize with first image
  updateGallery(0);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initGalleryThumbnails();
  });
} else {
  initGalleryThumbnails();
}

// Global gallery instance (will be created when needed)
var gallery = null;
