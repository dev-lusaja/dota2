document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loading');
  const galleryEl = document.getElementById('gallery');

  const comics = await ComicsLoader.loadComics();

  if (!comics || comics.length === 0) {
    loadingEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No se encontraron cómics o hubo un error al cargar.';
    return;
  }

  // Sort comics by release_date ascending (oldest first)
  comics.sort((a, b) => {
    if (!a.release_date) return 1;
    if (!b.release_date) return -1;
    return new Date(b.release_date) - new Date(a.release_date);
  });

  // Render cards
  galleryEl.innerHTML = '';

  comics.forEach(comic => {
    let coverUrl = comic.cover_url;
    if (!coverUrl) {
      const coverPage = comic.cover_page || comic.images.page_min;
      const padding = comic.images.page_padding || 3;
      coverUrl = ComicsLoader.getComicUrl(comic.images.url_template, coverPage, padding);
    }

    const card = document.createElement('div');
    card.className = 'comic-card';

    // Create tags HTML
    const tagsHtml = (comic.tags || []).map(tag => `<span class="comic-tag">${tag}</span>`).join('');

    // Format date if exists
    let dateDisplay = '';
    if (comic.release_date) {
      const dateObj = new Date(comic.release_date);
      if (!isNaN(dateObj.getTime())) {
        // Ensure we don't get off-by-one errors from timezones
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        dateDisplay = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } else {
        dateDisplay = comic.release_date;
      }
    }

    // Read Progress
    const progress = typeof ReadProgress !== 'undefined' ? ReadProgress.getProgress(comic.id) : null;
    let badgeHtml = '';
    if (progress) {
      if (progress.completed) {
        badgeHtml = `<div class="comic-badge badge-read"><i class="fas fa-check"></i> LEÍDO</div>`;
      } else if (progress.page > comic.images.page_min) {
        // Only show "In Progress" if they actually advanced past the first page
        badgeHtml = `<div class="comic-badge badge-progress">EN PROGRESO &bull; Pág. ${progress.page - comic.images.page_min + 1}</div>`;
      }
    }
    
    card.innerHTML = `
      <div class="card-inner">
        <!-- FRENTE -->
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
        
        <!-- REVERSO -->
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

    // Add event listeners for flip
    const flipBtn = card.querySelector('.flip-btn');
    const flipBackBtn = card.querySelector('.flip-back-btn');
    
    flipBtn.addEventListener('click', () => {
      card.classList.add('is-flipped');
    });
    
    flipBackBtn.addEventListener('click', () => {
      card.classList.remove('is-flipped');
    });

    galleryEl.appendChild(card);
  });

  loadingEl.style.display = 'none';
  galleryEl.style.display = 'grid';
});
