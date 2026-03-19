/**
 * Data-driven feed manager.
 *
 * Loads version metadata from feed-config.json, renders the edition
 * navigation, and wires up page-transition animations.  Falls back to
 * the legacy shared-nav.js helpers when the config fetch fails.
 */
class FeedManager {
  constructor() {
    this.config = null;
    this.currentPageId = null;
  }

  /* -- Lifecycle ------------------------------------------------------ */

  async init(pageId = null) {
    try {
      const response = await fetch('./data/feed-config.json');
      this.config = await response.json();
      this.currentPageId = pageId;

      this.initializeNavigation();
      this.setupEventHandlers();
    } catch (error) {
      console.warn('Could not load feed configuration, falling back to legacy mode');
      this.fallbackToLegacy();
    }
  }

  /* -- Navigation ----------------------------------------------------- */

  initializeNavigation() {
    if (!this.config) return;

    const versionsContainer = document.querySelector('.versions-nav-links');
    if (versionsContainer) {
      versionsContainer.innerHTML = this.config.versions
        .map(version =>
          `<a href="${version.file}" class="mono-font ${version.id === this.currentPageId ? 'active' : ''}">${version.label}</a>`
        )
        .join('');
    }

    const latestVersion = this.getLatestVersion();
    document.querySelectorAll('.latest-edition-link').forEach(link => {
      if (this.currentPageId !== latestVersion.id) {
        link.href = latestVersion.file;
        link.style.display = 'inline';
      } else {
        link.style.display = 'none';
      }
    });
  }

  getLatestVersion() {
    return (
      this.config.versions.find(v => v.status === 'published' && !v.label.includes('🚧')) ||
      this.config.versions[0]
    );
  }

  /* -- Page transitions ----------------------------------------------- */

  setupEventHandlers() {
    document.querySelectorAll('.versions-nav-links a').forEach(link => {
      link.addEventListener('click', this.handlePageTransition.bind(this));
    });
  }

  handlePageTransition(e) {
    const link = e.target;
    if (link.classList.contains('active')) return;

    e.preventDefault();
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.15s ease-out';

    setTimeout(() => {
      window.location.href = link.href;
    }, 75);
  }

  /* -- Fallback / redirect -------------------------------------------- */

  fallbackToLegacy() {
    if (typeof initializeNavigation === 'function') {
      initializeNavigation(this.currentPageId);
    }
  }

  redirectToLatest() {
    if (this.config) {
      window.location.href = this.getLatestVersion().file;
    } else if (typeof redirectToLatest === 'function') {
      redirectToLatest();
    }
  }
}

const feedManager = new FeedManager();