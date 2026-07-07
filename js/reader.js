document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const comicId = urlParams.get('id');

  if (!comicId) {
    alert("No se especificó ningún cómic.");
    window.location.href = 'index.html';
    return;
  }

  // Load all comics and find the matching one
  const comics = await ComicsLoader.loadComics();
  const comic = comics.find(c => c.id === comicId);

  if (!comic) {
    alert("Cómic no encontrado.");
    window.location.href = 'index.html';
    return;
  }

  // UI Elements
  const titleEl = document.getElementById('comic-title');
  const officialUrlEl = document.getElementById('official-url');
  const currentEl = document.getElementById('current-page');
  const totalEl = document.getElementById('total-pages');
  const imgEl = document.getElementById('comic-img');
  const spinnerEl = document.getElementById('spinner');
  const errorEl = document.getElementById('error-msg');
  const preloadContainer = document.getElementById('preload-container');
  const topbar = document.getElementById('topbar');
  const bottombar = document.getElementById('bottombar');
  const slider = document.getElementById('page-slider');
  const rotationHint = document.getElementById('rotation-hint');
  
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');

  // Page format: apply class and manage rotation hint
  const pageFormat = comic.images.page_format || 'landscape';
  document.body.classList.add(`format-${pageFormat}`);

  function updateRotationHint() {
    if (!rotationHint) return;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const needsRotation =
      (pageFormat === 'landscape' && !isLandscape) ||
      (pageFormat === 'portrait' && isLandscape);
    rotationHint.classList.toggle('visible', needsRotation);
  }

  updateRotationHint();
  window.addEventListener('orientationchange', updateRotationHint);
  window.addEventListener('resize', updateRotationHint);

  // Comic State
  let currentPage = comic.images.page_min;
  const maxPage = comic.images.page_max;
  const minPage = comic.images.page_min;
  const padding = comic.images.page_padding || 3;
  const template = comic.images.url_template;

  // Initialize UI
  titleEl.textContent = comic.title;
  totalEl.textContent = (maxPage - minPage + 1);
  if (comic.official_url) {
    officialUrlEl.href = comic.official_url;
  } else {
    officialUrlEl.style.display = 'none';
  }
  
  slider.min = minPage;
  slider.max = maxPage;
  slider.value = currentPage;

  // Load a specific page
  function loadPage(pageNumber) {
    if (pageNumber < minPage || pageNumber > maxPage) return;
    
    currentPage = pageNumber;
    currentEl.textContent = (currentPage - minPage + 1);
    slider.value = currentPage;
    
    const url = ComicsLoader.getComicUrl(template, currentPage, padding);
    
    // UI state
    imgEl.classList.add('loading-img');
    spinnerEl.classList.add('active');
    errorEl.classList.remove('active');
    
    imgEl.src = url;

    // Preload next page
    if (currentPage < maxPage) {
      const nextUrl = ComicsLoader.getComicUrl(template, currentPage + 1, padding);
      preloadContainer.innerHTML = `<img src="${nextUrl}" />`;
    }

    // Update nav visibility
    navPrev.style.display = currentPage > minPage ? 'flex' : 'none';
    navNext.style.display = currentPage < maxPage ? 'flex' : 'none';
  }

  // Event Listeners
  imgEl.addEventListener('load', () => {
    imgEl.classList.remove('loading-img');
    spinnerEl.classList.remove('active');
  });

  imgEl.addEventListener('error', () => {
    imgEl.classList.remove('loading-img');
    spinnerEl.classList.remove('active');
    errorEl.classList.add('active');
  });

  navPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPage > minPage) loadPage(currentPage - 1);
  });

  navNext.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPage < maxPage) loadPage(currentPage + 1);
  });

  slider.addEventListener('input', (e) => {
    const page = parseInt(e.target.value);
    if(page !== currentPage) loadPage(page);
    resetBars();
  });

  // Swipe logic
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
      if (currentPage < maxPage) loadPage(currentPage + 1);
    }
    if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
      if (currentPage > minPage) loadPage(currentPage - 1);
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      if (currentPage > minPage) loadPage(currentPage - 1);
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      if (currentPage < maxPage) {
        loadPage(currentPage + 1);
        e.preventDefault(); // prevent scroll on space
      }
    }
  });

  // Auto-hide UI logic
  let hideTimeout;
  let barsVisible = true;

  function resetBars() {
    topbar.classList.remove('hidden');
    bottombar.classList.remove('hidden');
    barsVisible = true;
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      topbar.classList.add('hidden');
      bottombar.classList.add('hidden');
      barsVisible = false;
    }, 3000);
  }

  function toggleBars() {
    if (barsVisible) {
      topbar.classList.add('hidden');
      bottombar.classList.add('hidden');
      barsVisible = false;
      clearTimeout(hideTimeout);
    } else {
      resetBars();
    }
  }

  imgEl.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const width = window.innerWidth;
    if (clickX > width * 0.2 && clickX < width * 0.8) {
      toggleBars();
    }
  });

  document.addEventListener('mousemove', () => {
    if (window.scrollY < 50 && barsVisible) resetBars(); 
  });
  
  // Initial load
  loadPage(currentPage);
  resetBars();
});
