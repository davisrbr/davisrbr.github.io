// Shared navigation data and functionality
const PAPER_FEED_VERSIONS = [
  { id: 'june25', label: 'June \'25', file: 'june25_papers.html' },
  { id: 'may25', label: 'May \'25', file: 'may25_papers.html' },
  { id: 'april25', label: 'April \'25', file: 'april25_papers.html' },
  { id: 'mar25', label: 'March \'25', file: 'mar25_papers.html' },
  { id: 'dec24', label: 'December \'24', file: 'dec24_papers.html' }
];

const LATEST_VERSION = PAPER_FEED_VERSIONS.find(version => !version.label.includes('🚧'));

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

  // Add smooth page transitions
//   addPageTransitions();
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