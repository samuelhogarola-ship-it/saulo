const menuButton = document.querySelector('.nav-menu');
const mobileMenu = document.querySelector('#mobile-menu');

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

    menuButton.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.hidden = isOpen;
  });
}

function initDeckStack(root) {
  if (!root) {
    return;
  }

  const cards = Array.from(root.querySelectorAll('[data-deck-stack-card]'));

  if (cards.length < 2) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;

  const clearTransforms = () => {
    cards.forEach((card) => {
      card.style.transform = '';
      const media = card.querySelector('[data-deck-stack-media]');

      if (media) {
        media.style.transform = '';
      }
    });
  };

  const updateCards = () => {
    if (reduceMotion.matches) {
      clearTransforms();
      return;
    }

    const viewportHeight = window.innerHeight;
    const isMobile = window.innerWidth <= 820;
    const mode = isMobile
      ? {
          cardShift: 24,
          cardScaleLoss: 0.014,
          mediaShift: -12,
          mediaRotate: -2.2,
          mediaScaleGain: 0.018,
        }
      : {
          cardShift: 44,
          cardScaleLoss: 0.02,
          mediaShift: -22,
          mediaRotate: -4.5,
          mediaScaleGain: 0.03,
        };

    clearTransforms();

    cards.forEach((card, index) => {
      if (index === 0) {
        return;
      }

      const previousCard = cards[index - 1];
      const previousMedia = previousCard.querySelector(
        '[data-deck-stack-media]',
      );
      const rect = card.getBoundingClientRect();
      const progress = Math.min(
        Math.max((viewportHeight - rect.top) / viewportHeight, 0),
        1,
      );

      previousCard.style.transform =
        `translate3d(0, ${progress * mode.cardShift}px, 0) ` +
        `scale(${1 - progress * mode.cardScaleLoss})`;

      if (previousMedia) {
        previousMedia.style.transform =
          `translate3d(0, ${progress * mode.mediaShift}px, 0) ` +
          `rotate(${progress * mode.mediaRotate}deg) ` +
          `scale(${1 + progress * mode.mediaScaleGain})`;
      }
    });
  };

  const requestUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;

    window.requestAnimationFrame(() => {
      updateCards();
      ticking = false;
    });
  };

  updateCards();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  reduceMotion.addEventListener('change', requestUpdate);
}

document.querySelectorAll('[data-deck-stack]').forEach(initDeckStack);

const lightbox = document.querySelector('#cases-lightbox');
const lightboxImage = document.querySelector('#cases-lightbox-image');
const lightboxTitle = document.querySelector('#cases-lightbox-title');
const lightboxClose = document.querySelector('.cases-lightbox__close');

if (lightbox && lightboxImage && lightboxTitle && lightboxClose) {
  document.querySelectorAll('.case-card__media img').forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Ampliar imagen del proceso');

    const openLightbox = () => {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      lightboxTitle.textContent = image.alt;
      lightbox.showModal();
    };

    image.addEventListener('click', openLightbox);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox();
      }
    });
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.close();
    }
  });

  lightboxClose.addEventListener('click', () => lightbox.close());
}

const allCasesGrid = document.querySelector('#all-cases-grid');

const successCasesGrid = document.querySelector('#success-cases-grid');

const uniqueAdditionalCaseImages = [
  'caso-real-07.jpeg',
  'caso-real-09.jpeg',
  'caso-real-10.jpeg',
  'caso-real-11.jpeg',
  'caso-real-12.jpeg',
  'caso-real-13.jpeg',
  'caso-real-15.jpeg',
  'caso-real-16.jpeg',
  'caso-real-17.jpeg',
  'caso-real-18.jpeg',
  'caso-real-19.jpeg',
  'caso-real-20.jpeg',
  'caso-real-21.jpeg',
  'caso-real-23.jpeg',
  'caso-real-24.jpeg',
  'caso-real-25.jpeg',
  'caso-real-26.jpeg',
  'caso-real-27.jpeg',
  'caso-real-29.jpeg',
  'caso-real-30.jpeg',
];

if (successCasesGrid) {
  const orientationGroups = [
    {
      label: 'De frente',
      images: ['caso-02-frontal-mujer.jpeg', 'caso-06-hombre-competicion.jpeg'],
    },
    {
      label: 'De perfil',
      images: ['caso-03-perfil-hombre.jpeg', 'caso-04-perfil-mujer.jpeg'],
    },
    {
      label: 'De espalda',
      images: ['caso-01-espalda-hombre.jpeg', 'caso-05-espalda-mujer.jpeg'],
    },
  ];

  const renderCard = (image, folder = '') => `
    <article class="success-page-card">
      <img src="./assets/casos-reales/${folder}${image}" alt="Proceso de evolución física de Saulo Fitness" loading="lazy">
      <span>SAULO FITNESS</span>
      <h2>Proceso de evolución</h2>
      <p>Entrenamiento, seguimiento y ajustes adaptados al objetivo de cada persona.</p>
    </article>
  `;

  const groupedMarkup = orientationGroups
    .map(
      (group) => `
        <h2 class="success-case-group-title">${group.label}</h2>
        ${group.images.map((image) => renderCard(image)).join('')}
      `,
    )
    .join('');

  successCasesGrid.innerHTML = `
    ${groupedMarkup}
    <h2 class="success-case-group-title">Más procesos</h2>
    ${uniqueAdditionalCaseImages.map((image) => renderCard(image, 'todos/')).join('')}
  `;
}

if (allCasesGrid) {
  const featuredCases = [
    { image: 'caso-01-espalda-hombre.jpeg', label: 'De espalda' },
    { image: 'caso-02-frontal-mujer.jpeg', label: 'De frente' },
    { image: 'caso-03-perfil-hombre.jpeg', label: 'De perfil' },
    { image: 'caso-04-perfil-mujer.jpeg', label: 'De perfil' },
    { image: 'caso-05-espalda-mujer.jpeg', label: 'De espalda' },
    { image: 'caso-06-hombre-competicion.jpeg', label: 'De frente' },
  ];

  featuredCases.forEach((featuredCase, caseIndex) => {
    const extraStart = Math.floor(
      (caseIndex * uniqueAdditionalCaseImages.length) / featuredCases.length,
    );
    const extraEnd = Math.floor(
      ((caseIndex + 1) * uniqueAdditionalCaseImages.length) /
        featuredCases.length,
    );
    const extraImages = uniqueAdditionalCaseImages.slice(extraStart, extraEnd);
    const card = document.createElement('article');
    card.className = 'all-case-card';
    card.innerHTML = `
      <div class="all-case-card__main">
        <figure class="all-case-card__image">
          <img src="./assets/casos-reales/${featuredCase.image}" alt="Proceso de evolución física de Saulo Fitness">
        </figure>
        <div class="all-case-card__content">
          <span>SAULO FITNESS</span>
          <h2>Proceso de evolución</h2>
          <p>Seguimiento, entrenamiento y ajustes adaptados al objetivo de cada persona.</p>
        </div>
      </div>
      <button class="all-case-card__toggle" type="button" aria-expanded="false">
        <span>SE MUESTRA</span>
        <b aria-hidden="true">+</b>
      </button>
      <div class="all-case-card__more" hidden>
        <div class="all-case-card__gallery">
          ${extraImages
            .map(
              (image, imageIndex) => `
            <img src="./assets/casos-reales/todos/${image}" alt="Imagen ${imageIndex + 1} del proceso ${caseIndex + 1}">
          `,
            )
            .join('')}
        </div>
        <p class="all-case-card__more-note">Más imágenes del proceso. El vídeo se añadirá aquí cuando esté disponible.</p>
      </div>
    `;

    const toggle = card.querySelector('.all-case-card__toggle');
    const more = card.querySelector('.all-case-card__more');
    const icon = toggle.querySelector('b');

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      more.hidden = isOpen;
      card.classList.toggle('is-open', !isOpen);
      icon.textContent = isOpen ? '+' : '−';
    });

    allCasesGrid.append(card);
  });
}

if (!document.querySelector('.whatsapp-sticky')) {
  const whatsappSticky = document.createElement('a');
  whatsappSticky.className = 'whatsapp-sticky';
  whatsappSticky.href = 'https://wa.me/34695578960';
  whatsappSticky.target = '_blank';
  whatsappSticky.rel = 'noreferrer';
  whatsappSticky.setAttribute('aria-label', 'Contactar por WhatsApp');
  whatsappSticky.innerHTML =
    '<span class="whatsapp-mark" aria-hidden="true"><img src="./assets/icons/whatsapp.svg" alt=""></span>';
  document.body.append(whatsappSticky);
}
