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
  const zoomResetBtn = document.getElementById('zoom-reset-btn');
  
  const navPrev = document.getElementById('nav-prev');
  const navNext = document.getElementById('nav-next');

  // ─── Pinch-to-Zoom Engine ────────────────────────────────────────────────
  let currentScale = 1;
  let panX = 0;
  let panY = 0;
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  // Applies the current scale + pan to the image via CSS transform
  function applyTransform() {
    imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
  }

  // Clamps pan so the image never leaves a dead zone relative to container
  function clampPan() {
    const containerRect = imgEl.parentElement.getBoundingClientRect();
    const imgRect = imgEl.getBoundingClientRect();
    // Scaled image dimensions
    const scaledW = imgEl.naturalWidth  ? imgEl.offsetWidth  * currentScale : containerRect.width  * currentScale;
    const scaledH = imgEl.naturalHeight ? imgEl.offsetHeight * currentScale : containerRect.height * currentScale;
    const maxPanX = Math.max(0, (scaledW  - containerRect.width)  / 2);
    const maxPanY = Math.max(0, (scaledH - containerRect.height) / 2);
    panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
    panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
  }

  function resetZoom() {
    currentScale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
    imgEl.classList.remove('zoomed', 'panning');
    zoomResetBtn && zoomResetBtn.classList.remove('visible');
  }

  function onZoomChanged() {
    if (currentScale > 1.01) {
      imgEl.classList.add('zoomed');
      zoomResetBtn && zoomResetBtn.classList.add('visible');
    } else {
      resetZoom();
    }
  }

  // ── Touch: Pinch & Pan ───────────────────────────────────────────────────
  let lastDist  = null;   // distance between two fingers at last touchmove
  let lastMidX  = null;   // midpoint X at last touchmove
  let lastMidY  = null;   // midpoint Y at last touchmove
  let isPinching = false;

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getTouchMid(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  imgEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      isPinching = true;
      lastDist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);
      lastMidX = mid.x;
      lastMidY = mid.y;
      e.preventDefault(); // prevent native zoom
    }
  }, { passive: false });

  imgEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);

      // Scale delta
      const scaleDelta = newDist / lastDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, currentScale * scaleDelta));

      // Pan delta from midpoint movement
      panX += mid.x - lastMidX;
      panY += mid.y - lastMidY;

      currentScale = newScale;
      clampPan();
      applyTransform();

      lastDist = newDist;
      lastMidX = mid.x;
      lastMidY = mid.y;
    } else if (e.touches.length === 1 && currentScale > 1) {
      // Single-finger pan while zoomed
      e.preventDefault();
    }
  }, { passive: false });

  imgEl.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
      lastDist = null;
      onZoomChanged();
    }
  }, { passive: true });

  // ── Touch: Single-finger pan while zoomed ────────────────────────────────
  let panStartX = 0;
  let panStartY = 0;
  let panStartPanX = 0;
  let panStartPanY = 0;
  let isSinglePanning = false;

  imgEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && currentScale > 1) {
      isSinglePanning = true;
      panStartX = e.touches[0].clientX;
      panStartY = e.touches[0].clientY;
      panStartPanX = panX;
      panStartPanY = panY;
    }
  }, { passive: true });

  imgEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isSinglePanning && currentScale > 1) {
      e.preventDefault();
      panX = panStartPanX + (e.touches[0].clientX - panStartX);
      panY = panStartPanY + (e.touches[0].clientY - panStartY);
      clampPan();
      applyTransform();
    }
  }, { passive: false });

  imgEl.addEventListener('touchend', () => {
    isSinglePanning = false;
  }, { passive: true });

  // ── Mouse: Drag pan when zoomed ──────────────────────────────────────────
  let isMousePanning = false;
  let mousePanStartX = 0;
  let mousePanStartY = 0;
  let mousePanStartPanX = 0;
  let mousePanStartPanY = 0;

  imgEl.addEventListener('mousedown', (e) => {
    if (currentScale > 1) {
      isMousePanning = true;
      imgEl.classList.add('panning');
      mousePanStartX = e.clientX;
      mousePanStartY = e.clientY;
      mousePanStartPanX = panX;
      mousePanStartPanY = panY;
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isMousePanning) {
      panX = mousePanStartPanX + (e.clientX - mousePanStartX);
      panY = mousePanStartPanY + (e.clientY - mousePanStartY);
      clampPan();
      applyTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isMousePanning) {
      isMousePanning = false;
      imgEl.classList.remove('panning');
    }
  });

  // ── Mouse Wheel Zoom ──────────────────────────────────────────────────────
  imgEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    currentScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, currentScale * delta));
    clampPan();
    applyTransform();
    onZoomChanged();
  }, { passive: false });

  // ── Double-tap to zoom / reset ────────────────────────────────────────────
  let lastTapTime = 0;
  imgEl.addEventListener('touchend', (e) => {
    if (isPinching || isSinglePanning) return;
    const now = Date.now();
    if (now - lastTapTime < 300 && e.changedTouches.length === 1) {
      e.preventDefault();
      if (currentScale > 1) {
        resetZoom();
      } else {
        currentScale = 2.5;
        panX = 0;
        panY = 0;
        applyTransform();
        onZoomChanged();
      }
    }
    lastTapTime = now;
  }, { passive: false });

  // ── Zoom Reset Button ─────────────────────────────────────────────────────
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetZoom();
    });
  }

  // Reset zoom when changing pages
  function resetZoomOnPageChange() {
    if (currentScale > 1) resetZoom();
  }
  // ─────────────────────────────────────────────────────────────────────────


  // Page format: apply class and manage rotation hint
  const pageFormat = comic.images.page_format || 'landscape';
  document.body.classList.add(`format-${pageFormat}`);
  if (rotationHint) {
    rotationHint.classList.add(`to-${pageFormat}`);
  }

  let hintTimeout;
  function updateRotationHint() {
    if (!rotationHint) return;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const needsRotation =
      (pageFormat === 'landscape' && !isLandscape) ||
      (pageFormat === 'portrait' && isLandscape);
    
    clearTimeout(hintTimeout);
    
    if (needsRotation) {
      if (!rotationHint.classList.contains('visible')) {
        rotationHint.classList.add('visible');
      }
      hintTimeout = setTimeout(() => {
        rotationHint.classList.remove('visible');
      }, 4000);
    } else {
      rotationHint.classList.remove('visible');
    }
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
    
    resetZoomOnPageChange(); // always reset zoom between pages
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

  // Swipe logic (disabled while zoomed — panning handles the gesture instead)
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_THRESHOLD = 50;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (currentScale <= 1) handleSwipe(); // only swipe when not zoomed
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
    // Don't toggle bars if user just finished a mouse-drag pan
    if (isMousePanning) return;
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
