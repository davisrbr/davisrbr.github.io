// Shared navigation data and functionality
const PAPER_FEED_VERSIONS = [
  { id: 'may26', label: 'May \'26', file: 'may26_papers.html' },
  { id: 'april26', label: 'April \'26', file: 'april26_papers.html' },
  { id: 'mar26', label: 'March \'26', file: 'mar26_papers.html' },
  { id: 'oct25', label: 'October \'25', file: 'oct25_papers.html' },
  { id: 'july25', label: 'July \'25', file: 'july25_papers.html' },
  { id: 'june25', label: 'June \'25', file: 'june25_papers.html' },
  { id: 'may25', label: 'May \'25', file: 'may25_papers.html' },
  { id: 'april25', label: 'April \'25', file: 'april25_papers.html' },
  { id: 'mar25', label: 'March \'25', file: 'mar25_papers.html' },
  { id: 'dec24', label: 'December \'24', file: 'dec24_papers.html' }
];

const LATEST_VERSION = PAPER_FEED_VERSIONS.find(version => !version.draft);

function initializeNavigation(currentPageId) {
  // Generate versions navigation
  const versionsContainer = document.querySelector('.versions-nav-links');
  if (versionsContainer) {
    versionsContainer.innerHTML = PAPER_FEED_VERSIONS.map(version => 
      `<a href="${version.file}" class="mono-font ${version.id === currentPageId ? 'active' : ''}">${version.label}</a>`
    ).join('');
  }

  // Update "latest edition" links
  const latestLinks = document.querySelectorAll('.latest-edition-link');
  latestLinks.forEach(link => {
    if (currentPageId !== LATEST_VERSION.id) {
      link.href = LATEST_VERSION.file;
      link.style.display = 'inline';
    } else {
      link.style.display = 'none';
    }
  });

  initializeCategoryJumpLinks();

  // Add smooth page transitions
//   addPageTransitions();
}

function slugifyCategory(label) {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureCategoryJumpStyles() {
  if (document.getElementById('feed-category-jump-styles')) return;

  const style = document.createElement('style');
  style.id = 'feed-category-jump-styles';
  style.textContent = `
    .category-jump-links {
      margin: 0.55rem 80px 1.05rem 0;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: 0.35rem;
      row-gap: 0.2rem;
    }

    .category-jump-links-title {
      margin-bottom: 0;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      color: rgba(25, 25, 112, 0.62);
      white-space: nowrap;
    }

    .category-jump-links-list {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      row-gap: 0.2rem;
    }

    .category-jump-link {
      color: var(--accent-color, #4169e1);
      text-decoration: none;
      display: inline-flex;
      align-items: baseline;
      line-height: 1.3;
      padding-left: 0.55rem;
      margin-left: 0.55rem;
      border-left: 1px solid rgba(25, 25, 112, 0.3);
    }

    .category-jump-link:hover {
      color: var(--primary-color, #191970);
      text-decoration: none;
      border-left-color: rgba(25, 25, 112, 0.46);
    }

    .category-jump-link-label {
      min-width: 0;
    }

    .category-jump-link:first-child {
      margin-left: 0;
      padding-left: 0;
      border-left: 0;
    }

    @media screen and (max-width: 792px) {
      .category-jump-links {
        margin-right: 0;
      }

      .intro-note {
        margin-right: 0 !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function initializeCategoryJumpLinks() {
  const contentRoot = document.querySelector('.w3-left-align');
  if (!contentRoot || contentRoot.querySelector('.category-jump-links')) return;

  const categoryHeadings = Array.from(contentRoot.querySelectorAll('p .highlight'))
    .map(span => ({
      label: span.textContent.trim(),
      container: span.closest('p')
    }))
    .filter(item => item.label && item.container);

  if (categoryHeadings.length < 2) return;

  const usedIds = new Set();
  const categories = categoryHeadings.map((item, index) => {
    let id = item.container.id || slugifyCategory(item.label) || `category-${index + 1}`;
    while (usedIds.has(id) || (document.getElementById(id) && document.getElementById(id) !== item.container)) {
      id = `${slugifyCategory(item.label) || 'category'}-${index + 1}`;
    }

    usedIds.add(id);
    item.container.id = id;
    item.container.style.scrollMarginTop = '24px';

    return { id, label: item.label };
  });

  ensureCategoryJumpStyles();

  const jumpLinks = document.createElement('div');
  jumpLinks.className = 'category-jump-links mono-font';
  jumpLinks.innerHTML = `
    <div class="category-jump-links-title">Sections:</div>
    <div class="category-jump-links-list">
      ${categories.map(category => `
        <a href="#${category.id}" class="category-jump-link">
          <span class="category-jump-link-label">${category.label}</span>
        </a>
      `).join('')}
    </div>
  `;

  const introNote = contentRoot.querySelector('.intro-note');
  const title = contentRoot.querySelector('h3.mono-font');
  const anchorTarget = introNote || title;

  if (anchorTarget && anchorTarget.parentNode) {
    anchorTarget.insertAdjacentElement('afterend', jumpLinks);
  }
}

function addPageTransitions() {
  // Add fade-in effect when page loads
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.2s ease-in-out';
  
  // Fade in after a brief delay to ensure content is loaded
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 10);

  // Add smooth transitions for navigation links
  document.querySelectorAll('.versions-nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
      // Only add transition if it's a different page
      if (!this.classList.contains('active')) {
        e.preventDefault();
        
        // Fade out current page
        document.body.style.opacity = '0';
        
        // Navigate after fade out completes
        setTimeout(() => {
          window.location.href = this.href;
        }, 100);
      }
    });
  });
}

// Auto-redirect functionality for papers.html
function redirectToLatest() {
  window.location.href = LATEST_VERSION.file;
}
