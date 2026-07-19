const INTRO_SKIP_ONCE_KEY = 'saulo-skip-intro-once';
const pageLanguage = document.documentElement.lang === 'pt-BR' ? 'pt-br' : 'es';
const introScreen = document.querySelector('[data-intro-screen]');
const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('[data-site-nav]');
const eventsGrid = document.querySelector('[data-events-grid]');
const deckStackRoot = document.querySelector('[data-deck-stack]');
const cluesoStage = document.querySelector('[data-clueso-stage]');
const isFilePreview = window.location.protocol === 'file:';

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !siteNav.classList.contains('is-open')) {
      return;
    }

    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
  });
}

document.addEventListener('click', (event) => {
  const homeLink = event.target.closest('[data-site-nav] a');
  if (!homeLink || !isHomeNavigationLink(homeLink)) {
    return;
  }

  markIntroToSkipOnce();
});

if (introScreen) {
  runIntro();
}

if (eventsGrid) {
  loadFeaturedEvents();
}

if (deckStackRoot && typeof window.initDeckStack === 'function') {
  window.initDeckStack(deckStackRoot, {
    mobileBreakpoint: 820,
    desktopCardShift: 44,
    desktopCardScaleLoss: 0.02,
    desktopMediaShift: -22,
    desktopMediaRotate: -4.5,
    desktopMediaScaleGain: 0.03,
    mobileCardShift: 28,
    mobileCardScaleLoss: 0.016,
    mobileMediaShift: -14,
    mobileMediaRotate: -2.4,
    mobileMediaScaleGain: 0.02,
  });
}

if (cluesoStage) {
  initCluesoStage(cluesoStage);
}

function initCluesoStage(stage) {
  let frame = 0;

  const update = () => {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const viewportHeight = Math.max(window.innerHeight, 1);
    const travel = Math.max(rect.height - viewportHeight, 1);
    const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
    const reveal = Math.min(Math.max((progress - 0.08) / 0.18, 0), 1);
    const exit = 1 - Math.min(Math.max((progress - 0.82) / 0.18, 0), 1);
    const opacity = reveal * exit;

    stage.style.setProperty('--clueso-progress', progress.toFixed(4));
    stage.style.setProperty('--clueso-opacity', opacity.toFixed(4));
  };

  const requestUpdate = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

function runIntro() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shouldSkipIntro = consumeIntroSkipOnce();

  if (reduceMotion.matches || shouldSkipIntro) {
    introScreen.classList.add('is-hidden');
    document.body.classList.add('intro-complete');
    return;
  }

  document.body.classList.add('has-intro');

  window.setTimeout(() => {
    introScreen.classList.add('is-animating');
  }, 2180);

  window.setTimeout(() => {
    introScreen.classList.add('is-hidden');
    document.body.classList.add('intro-complete');
  }, 3580);

  window.setTimeout(() => {
    document.body.classList.add('intro-title-reveal');
  }, 3700);
}

function isHomeNavigationLink(link) {
  const href = link.getAttribute('href');
  return href === '/' || href === './index-pt-br.html';
}

function markIntroToSkipOnce() {
  try {
    window.sessionStorage.setItem(INTRO_SKIP_ONCE_KEY, 'true');
  } catch (_error) {
    // Navigation still works if session storage is unavailable.
  }
}

function consumeIntroSkipOnce() {
  try {
    const shouldSkip =
      window.sessionStorage.getItem(INTRO_SKIP_ONCE_KEY) === 'true';
    window.sessionStorage.removeItem(INTRO_SKIP_ONCE_KEY);
    return shouldSkip;
  } catch (_error) {
    return false;
  }
}

async function loadFeaturedEvents() {
  if (isFilePreview) {
    renderEventsFallback(
      pageLanguage === 'pt-br'
        ? 'Eventos disponíveis na versão publicada'
        : 'Eventos disponibles en la versión publicada',
      pageLanguage === 'pt-br'
        ? 'Ao publicar a web, esta área mostrará automaticamente os próximos eventos.'
        : 'Al publicar la web, esta zona mostrará automáticamente los próximos eventos.',
    );
    return;
  }

  try {
    const response = await fetch('./api/public/events?limit=5');
    if (!response.ok) {
      throw new Error('No se pudieron cargar los eventos.');
    }

    const payload = await response.json();
    const events = Array.isArray(payload.events) ? payload.events : [];

    if (!events.length) {
      renderEventsFallback(
        pageLanguage === 'pt-br' ? 'Novos eventos' : 'Nuevos eventos',
        pageLanguage === 'pt-br'
          ? 'Escreva para nós e avisaremos assim que abrirmos novas vagas.'
          : 'Escríbenos y te avisamos en cuanto abramos nuevas plazas.',
      );
      return;
    }

    eventsGrid.innerHTML = events
      .map(
        (event) => `
          <article class="event-preview-card">
            <div class="event-preview-card__body">
              <p class="event-preview-card__date">${formatDate(event.startsAt)}</p>
              <div class="event-preview-card__content">
                <p class="event-preview-card__meta">${escapeHtml(
                  event.location,
                )}</p>
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.summary)}</p>
              </div>
              <div class="event-preview-card__footer">
                <span>${escapeHtml(event.priceLabel)}</span>
                <a href="/eventos/${escapeHtml(event.slug)}${pageLanguage === 'pt-br' ? '?lang=pt-br' : ''}">${escapeHtml(
                  event.ctaLabel,
                )}</a>
              </div>
            </div>
          </article>
        `,
      )
      .join('');
  } catch (_error) {
    renderEventsFallback(
      pageLanguage === 'pt-br'
        ? 'Eventos em preparação'
        : 'Eventos en preparación',
      pageLanguage === 'pt-br'
        ? 'Estamos ativando a agenda. Escreva para nós e te informamos pessoalmente.'
        : 'Estamos activando la agenda. Escríbenos y te informamos personalmente.',
    );
  }
}

function renderEventsFallback(title, description) {
  eventsGrid.innerHTML = `
    <article class="event-preview-card event-preview-card--coming-soon">
      <figure class="event-preview-card__image">
        <img
          src="./event-assets/proximos-eventos-playa.jpg"
          alt="Entrenamiento presencial de Saulo Fitness en la playa"
          loading="lazy"
        />
      </figure>
      <div class="event-preview-card__body">
        <div class="event-preview-card__content">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
      </div>
    </article>
  `;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return pageLanguage === 'pt-br'
      ? 'Data a confirmar'
      : 'Fecha por confirmar';
  }

  return date.toLocaleString(pageLanguage === 'pt-br' ? 'pt-BR' : 'es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
