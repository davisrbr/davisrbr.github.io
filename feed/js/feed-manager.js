// Enhanced feed management with data-driven approach
class FeedManager {
  constructor() {
    this.config = null;
    this.currentPageId = null;
  }

  async init(pageId = null) {
    try {
      // Load configuration
      const response = await fetch('./data/feed-config.json');
      this.config = await response.json();
      this.currentPageId = pageId;
      
      // Initialize navigation
      this.initializeNavigation();
      this.setupEventHandlers();
      
    } catch (error) {
      console.warn('Could not load feed configuration, falling back to legacy mode');
      this.fallbackToLegacy();
    }
  }

  initializeNavigation() {
    if (!this.config) return;

    // Generate versions navigation
    const versionsContainer = document.querySelector('.versions-nav-links');
    if (versionsContainer) {
      versionsContainer.innerHTML = this.config.versions.map(version => 
        `<a href="${version.file}" class="mono-font ${version.id === this.currentPageId ? 'active' : ''}">${version.label}</a>`
      ).join('');
    }

    // Update "latest edition" links
    const latestVersion = this.getLatestVersion();
    const latestLinks = document.querySelectorAll('.latest-edition-link');
    latestLinks.forEach(link => {
      if (this.currentPageId !== latestVersion.id) {
        link.href = latestVersion.file;
        link.style.display = 'inline';
      } else {
        link.style.display = 'none';
      }
    });
  }

  getLatestVersion() {
    return this.config.versions.find(version => version.status === 'published' && !version.label.includes('🚧')) || 
           this.config.versions[0];
  }

  setupEventHandlers() {
    // Add smooth page transitions
    document.querySelectorAll('.versions-nav-links a').forEach(link => {
      link.addEventListener('click', this.handlePageTransition.bind(this));
    });
  }

  handlePageTransition(e) {
    const link = e.target;
    
    // Only add transition if it's a different page
    if (!link.classList.contains('active')) {
      e.preventDefault();
      
      // Fade out current page
      document.body.style.opacity = '0.8';
      document.body.style.transition = 'opacity 0.15s ease-out';
      
      // Navigate after brief fade
      setTimeout(() => {
        window.location.href = link.href;
      }, 75);
    }
  }

  fallbackToLegacy() {
    // Use the existing shared-nav.js functionality as fallback
    if (typeof initializeNavigation === 'function') {
      initializeNavigation(this.currentPageId);
    }
  }

  // Auto-redirect functionality for main feed page
  redirectToLatest() {
    if (this.config) {
      const latest = this.getLatestVersion();
      window.location.href = latest.file;
    } else {
      // Fallback to legacy redirect
      if (typeof redirectToLatest === 'function') {
        redirectToLatest();
      }
    }
  }
}

// Global instance
const feedManager = new FeedManager();