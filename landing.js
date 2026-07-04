const INTRO_KEY = 'saulo-landing-intro-seen';
const pageLanguage = document.documentElement.lang === 'pt-BR' ? 'pt-br' : 'es';
const introScreen = document.querySelector('[data-intro-screen]');
const navToggle = document.querySelector('[data-nav-toggle]');
const siteNav = document.querySelector('[data-site-nav]');
const eventsGrid = document.querySelector('[data-events-grid]');
const deckStackRoot = document.querySelector('[data-deck-stack]');
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
}

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

function runIntro() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasSeenIntro = readIntroFlag();

  if (reduceMotion.matches || hasSeenIntro) {
    introScreen.classList.add('is-hidden');
    document.body.classList.add('intro-complete');
    return;
  }

  document.body.classList.add('has-intro');
  writeIntroFlag();

  window.setTimeout(() => {
    introScreen.classList.add('is-animating');
  }, 1180);

  window.setTimeout(() => {
    introScreen.classList.add('is-hidden');
    document.body.classList.add('intro-complete');
  }, 3180);
}

function readIntroFlag() {
  try {
    return window.localStorage.getItem(INTRO_KEY) === 'true';
  } catch (_error) {
    return false;
  }
}

function writeIntroFlag() {
  try {
    window.localStorage.setItem(INTRO_KEY, 'true');
  } catch (_error) {
    // Ignore storage failures and keep the intro working for this visit.
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
        pageLanguage === 'pt-br'
          ? 'Novos eventos em breve'
          : 'Próximamente nuevos eventos',
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
    <article class="event-preview-card">
      <div class="event-preview-card__body">
        <h3>${title}</h3>
        <p>${description}</p>
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
