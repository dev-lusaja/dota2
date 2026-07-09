document.addEventListener('DOMContentLoaded', () => {
  // --- Data ---
  const tarotCards = [
    { id: '00', name: '00_the_fool', title: 'The Fool' },
    { id: '01', name: '01_the_magician', title: 'The Magician' },
    { id: '02', name: '02_the_high_priestess', title: 'The High Priestess' },
    { id: '03', name: '03_the_empress', title: 'The Empress' },
    { id: '04', name: '04_the_emperor', title: 'The Emperor' },
    { id: '06', name: '06_the_lovers', title: 'The Lovers' },
    { id: '08', name: '08_strength', title: 'Strength' },
    { id: '09', name: '09_the_hermit', title: 'The Hermit' },
    { id: '10', name: '10_wheel_of_fortune', title: 'Wheel of Fortune' },
    { id: '13', name: '13_death', title: 'Death' },
    { id: '15', name: '15_the_devil', title: 'The Devil' },
    { id: '17', name: '17_the_star', title: 'The Star' }
  ];

  const basePath = 'public/tarot/';
  const suffixColor = '_psd.png';
  const suffixLines = '_lines_psd.png';

  // --- Elements ---
  const navTabs = document.querySelectorAll('.nav-tab');
  const contentSections = document.querySelectorAll('.content-section');
  const tarotGallery = document.getElementById('tarot-gallery');
  const styleToggle = document.getElementById('tarot-style-toggle');
  const statusLabel = document.getElementById('tarot-status-label');

  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  const modalClose = document.getElementById('modal-close');
  const modalToggleBtn = document.getElementById('modal-toggle-style');
  const modalToggleText = document.getElementById('modal-toggle-text');

  let isGlobalLinesMode = false;
  let currentModalCard = null;
  let isModalLinesMode = false;

  // --- Tab Navigation ---
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      navTabs.forEach(t => t.classList.remove('active'));
      contentSections.forEach(c => c.classList.remove('active'));

      // Add active to clicked
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // --- Render Gallery ---
  function renderTarotGallery() {
    tarotGallery.innerHTML = '';
    tarotCards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'tarot-card';
      
      const img = document.createElement('img');
      img.src = `${basePath}${card.name}${isGlobalLinesMode ? suffixLines : suffixColor}`;
      img.alt = card.title;
      img.loading = 'lazy';
      
      cardEl.appendChild(img);
      
      cardEl.addEventListener('click', () => {
        openModal(card);
      });

      tarotGallery.appendChild(cardEl);
    });
  }

  // --- Global Style Toggle ---
  styleToggle.addEventListener('change', (e) => {
    isGlobalLinesMode = e.target.checked;
    statusLabel.textContent = isGlobalLinesMode ? 'Alterno' : 'Color';
    
    // Update all images in gallery
    const images = tarotGallery.querySelectorAll('img');
    images.forEach((img, index) => {
      img.style.opacity = '0.5';
      setTimeout(() => {
        img.src = `${basePath}${tarotCards[index].name}${isGlobalLinesMode ? suffixLines : suffixColor}`;
        img.style.opacity = '1';
      }, 150);
    });
  });

  // --- Modal Logic ---
  function openModal(card) {
    currentModalCard = card;
    isModalLinesMode = isGlobalLinesMode; // Inherit global state when opening
    updateModalImage();
    modal.showModal();
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeModal() {
    modal.close();
    document.body.style.overflow = '';
  }

  function updateModalImage() {
    if (!currentModalCard) return;
    
    // Fade effect
    modalImg.style.opacity = '0';
    setTimeout(() => {
      modalImg.src = `${basePath}${currentModalCard.name}${isModalLinesMode ? suffixLines : suffixColor}`;
      modalImg.style.opacity = '1';
    }, 150);

    // Update button text
    if (isModalLinesMode) {
      modalToggleText.textContent = 'Ver a Color';
    } else {
      modalToggleText.textContent = 'Ver alterno';
    }
  }

  modalClose.addEventListener('click', closeModal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    const dialogDimensions = modal.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      closeModal();
    }
  });

  // Toggle in modal
  modalToggleBtn.addEventListener('click', () => {
    isModalLinesMode = !isModalLinesMode;
    updateModalImage();
  });

  // Initialize
  renderTarotGallery();
});
