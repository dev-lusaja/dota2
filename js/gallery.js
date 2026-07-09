document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const galleryEl = document.getElementById('gallery');
  const filterSection = document.getElementById('comics-filters');
  
  const filterText = document.getElementById('filter-text');
  const filterLang = document.getElementById('filter-lang');
  const filterSort = document.getElementById('filter-sort');

  let allComics = await ComicsLoader.loadComics();

  if (!allComics || allComics.length === 0) {
    loadingEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No se encontraron cómics o hubo un error al cargar.';
    return;
  }

  // --- Filtering Logic ---
  function applyFilters() {
    const textStr = filterText.value.toLowerCase().trim();
    const langStr = filterLang.value;
    const sortStr = filterSort.value;

    let filtered = allComics.filter(comic => {
      // 1. Text filter (Title or Description)
      const title = comic.title ? comic.title.toLowerCase() : '';
      const desc = comic.description ? comic.description.toLowerCase() : '';
      if (textStr && !title.includes(textStr) && !desc.includes(textStr)) {
        return false;
      }
      
      // 2. Language filter
      if (langStr !== 'all') {
        const tags = (comic.tags || []).map(t => t.toLowerCase());
        // For 'Español' we look for 'español', for 'Ingles' we look for 'ingles'
        if (!tags.includes(langStr.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });

    // 3. Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.release_date || 0);
      const dateB = new Date(b.release_date || 0);
      if (sortStr === 'desc') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    renderComics(filtered);
  }

  // --- Render Function ---
  function renderComics(comicsList) {
    galleryEl.innerHTML = '';
    
    if (comicsList.length === 0) {
      galleryEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron cómics con estos filtros.</div>';
      return;
    }

    comicsList.forEach(comic => {
      let coverUrl = comic.cover_url;
      if (!coverUrl) {
        const coverPage = comic.cover_page || comic.images.page_min;
        const padding = comic.images.page_padding || 3;
        coverUrl = ComicsLoader.getComicUrl(comic.images.url_template, coverPage, padding);
      }

      const card = document.createElement('div');
      card.className = 'comic-card';

      const tagsHtml = (comic.tags || []).map(tag => `<span class="comic-tag">${tag}</span>`).join('');

      let dateDisplay = '';
      if (comic.release_date) {
        const dateObj = new Date(comic.release_date);
        if (!isNaN(dateObj.getTime())) {
          dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
          dateDisplay = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
          dateDisplay = comic.release_date;
        }
      }

      const progress = typeof ReadProgress !== 'undefined' ? ReadProgress.getProgress(comic.id) : null;
      let badgeHtml = '';
      if (progress) {
        if (progress.completed) {
          badgeHtml = `<div class="comic-badge badge-read"><i class="fas fa-check"></i> LEÍDO</div>`;
        } else if (progress.page > comic.images.page_min) {
          badgeHtml = `<div class="comic-badge badge-progress">EN PROGRESO &bull; Pág. ${progress.page - comic.images.page_min + 1}</div>`;
        }
      }
      
      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <div class="comic-cover-container">
              ${badgeHtml}
              <div class="comic-cover-blur" style="background-image: url('${coverUrl}')"></div>
              <img class="comic-cover-img" src="${coverUrl}" alt="Portada de ${comic.title}" loading="lazy">
            </div>
            <div class="comic-info">
              <h2 class="comic-title">${comic.title}</h2>
              <div class="comic-meta">
                ${dateDisplay ? `<span><i class="far fa-calendar-alt"></i> ${dateDisplay}</span>` : ''}
                <span><i class="far fa-file-image"></i> ${comic.images.page_max - comic.images.page_min + 1} Págs</span>
              </div>
              ${tagsHtml ? `<div class="comic-meta" style="margin-bottom: 1rem;">${tagsHtml}</div>` : ''}
              <div class="comic-actions">
                <a href="reader.html?id=${comic.id}" class="btn btn-primary"><i class="fas fa-book-open"></i> Leer</a>
                ${comic.official_url ? `<a href="${comic.official_url}" target="_blank" class="btn btn-secondary" title="Sitio Oficial"><i class="fas fa-external-link-alt"></i></a>` : ''}
                <button class="btn btn-secondary flip-btn" title="Más Detalles"><i class="fas fa-info-circle"></i></button>
              </div>
            </div>
          </div>
          
          <div class="card-back">
            <div class="comic-info">
              <div class="back-header">
                <h2 class="comic-title">${comic.title}</h2>
                <button class="btn btn-secondary flip-back-btn" title="Volver"><i class="fas fa-times"></i></button>
              </div>
              <div class="comic-desc-container">
                <p class="comic-desc">${comic.description || 'Sin descripción disponible.'}</p>
              </div>
              <div class="comic-actions" style="margin-top: auto;">
                <a href="reader.html?id=${comic.id}" class="btn btn-primary"><i class="fas fa-book-open"></i> Leer</a>
              </div>
            </div>
          </div>
        </div>
      `;

      const flipBtn = card.querySelector('.flip-btn');
      const flipBackBtn = card.querySelector('.flip-back-btn');
      
      flipBtn.addEventListener('click', () => card.classList.add('is-flipped'));
      flipBackBtn.addEventListener('click', () => card.classList.remove('is-flipped'));

      galleryEl.appendChild(card);
    });
  }

  // --- Attach Event Listeners ---
  filterText.addEventListener('input', applyFilters);
  filterLang.addEventListener('change', applyFilters);
  filterSort.addEventListener('change', applyFilters);

  // --- Initial Render ---
  loadingEl.style.display = 'none';
  if (filterSection) filterSection.style.display = 'flex';
  galleryEl.style.display = 'grid';
  
  // Apply initial sort (desc) and render
  applyFilters();
});
