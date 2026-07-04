function renderEventsListPage({ events, lang = 'es' }) {
  const copy = getEventsCopy(lang);
  return renderShell({
    title: copy.listTitle,
    description: copy.listDescription,
    lang,
    bodyClassName: 'events-page inner-page',
    body: `
      ${renderPublicHeader({ lang, currentPage: 'events' })}
      <main class="events-shell">
        <div class="events-topbar">
          <p class="events-topbar__eyebrow">${escapeHtml(copy.eventsKicker)}</p>
          <a class="back-link" href="${
            lang === 'pt-br' ? './index-pt-br.html' : './index.html'
          }">${escapeHtml(copy.backHomeLabel)}</a>
        </div>
        <section class="events-hero">
          <div class="events-hero__copy">
            <h1>${escapeHtml(copy.eventsHeading)}</h1>
            <p class="events-lead">
              ${escapeHtml(copy.eventsLead)}
            </p>
          </div>
          <div class="events-hero__actions">
            <a class="primary-link" href="https://wa.me/34622923988" target="_blank" rel="noreferrer">${escapeHtml(
              copy.whatsAppLabel,
            )}</a>
          </div>
        </section>
        <section class="events-list">
          ${events
            .map(
              (event) => `
                <article class="event-card">
                  <div class="event-card__body">
                    <p class="event-card__date">${escapeHtml(
                      formatEventDate(event.startsAt, lang),
                    )}</p>
                    <div class="event-card__content">
                      <p class="event-card__meta">${escapeHtml(
                        event.location,
                      )}</p>
                      <h2>${escapeHtml(event.title)}</h2>
                      <p>${escapeHtml(event.summary)}</p>
                    </div>
                    <div class="event-card__footer">
                      <span>${escapeHtml(event.priceLabel)}</span>
                      <a href="/eventos/${escapeHtml(event.slug)}${
                        lang === 'pt-br' ? '?lang=pt-br' : ''
                      }">${escapeHtml(event.ctaLabel)}</a>
                    </div>
                  </div>
                </article>
              `,
            )
            .join('')}
        </section>
        ${renderPublicFooter(lang)}
      </main>
    `,
  });
}

function renderEventDetailPage({ event, lang = 'es' }) {
  const copy = getEventsCopy(lang);
  return renderShell({
    title: `${event.title} | Saulo Fitness`,
    description: event.summary,
    lang,
    bodyClassName: 'events-page inner-page',
    scripts: ['/events-public.js'],
    body: `
      ${renderPublicHeader({ lang, currentPage: 'events' })}
      <main class="event-detail-shell">
        <div class="event-detail-topbar">
          <p class="events-topbar__eyebrow">${escapeHtml(copy.premiumEventLabel)}</p>
          <a class="back-link" href="/eventos${
            lang === 'pt-br' ? '?lang=pt-br' : ''
          }">← ${escapeHtml(copy.backEventsLabel)}</a>
        </div>
        <section class="event-detail-hero">
          <article class="event-detail-panel event-detail-panel--intro">
            <p class="events-kicker">${escapeHtml(copy.upcomingLabel)}</p>
            <h2>${escapeHtml(formatEventDate(event.startsAt, lang))}</h2>
            <p class="event-detail-meta">${escapeHtml(event.location)}</p>
            <p class="event-detail-price">${escapeHtml(event.priceLabel)}</p>
          </article>
          <div class="event-detail-hero__copy">
            <p class="events-kicker">${escapeHtml(copy.premiumEventLabel)}</p>
            <h1>${escapeHtml(event.title)}</h1>
            <p class="event-detail-meta">${escapeHtml(formatEventDate(event.startsAt, lang))} · ${escapeHtml(
              event.location,
            )}</p>
            <p class="event-detail-price">${escapeHtml(event.priceLabel)}</p>
            <p class="event-detail-summary">${escapeHtml(event.description)}</p>
          </div>
        </section>
        <section class="event-detail-grid">
          <article class="event-detail-panel">
            <h2>${escapeHtml(copy.whatToExpectLabel)}</h2>
            <ul class="event-detail-points">
              <li>${escapeHtml(copy.pointOne)}</li>
              <li>${escapeHtml(copy.pointTwo)}</li>
              <li>${escapeHtml(copy.pointThree)}</li>
            </ul>
          </article>
          <article class="event-detail-panel">
            <h2>${escapeHtml(copy.reserveLabel)}</h2>
            <form class="event-register-form" data-event-registration-form data-event-slug="${escapeAttribute(
              event.slug,
            )}">
              <label class="field">
                <span>${escapeHtml(copy.fullNameLabel)}</span>
                <input name="fullName" type="text" required />
              </label>
              <label class="field">
                <span>${escapeHtml(copy.emailLabel)}</span>
                <input name="email" type="email" />
              </label>
              <label class="field">
                <span>${escapeHtml(copy.phoneLabel)}</span>
                <input name="phone" type="tel" />
              </label>
              <label class="field">
                <span>${escapeHtml(copy.messageLabel)}</span>
                <textarea name="message" rows="4" placeholder="${escapeAttribute(
                  copy.messagePlaceholder,
                )}"></textarea>
              </label>
              <button class="primary-link" type="submit">${escapeHtml(
                event.ctaLabel,
              )}</button>
              <p class="form-status" data-form-status aria-live="polite"></p>
            </form>
          </article>
        </section>
        ${renderPublicFooter(lang)}
      </main>
    `,
  });
}

function renderAdminEventsPage() {
  return renderShell({
    title: 'Admin Eventos | Saulo Fitness',
    description: 'Panel interno de eventos de Saulo Fitness.',
    bodyClassName: 'events-admin-page',
    scripts: ['/events-admin.js'],
    body: `
      <main class="admin-shell">
        <section class="admin-hero">
          <div>
            <p class="events-kicker">Panel interno</p>
            <h1>Eventos y registros</h1>
            <p class="events-lead">Alta rápida, edición y lectura de inscripciones públicas sin tocar la app del alumno.</p>
          </div>
          <a class="secondary-link" href="/" target="_blank" rel="noreferrer">Abrir landing</a>
        </section>

        <section class="admin-auth-card" data-admin-auth-card>
          <h2>Acceso entrenador</h2>
          <form class="admin-auth-form" data-admin-login-form>
            <label class="field">
              <span>Email</span>
              <input name="email" type="email" required />
            </label>
            <label class="field">
              <span>Contraseña</span>
              <input name="password" type="password" required />
            </label>
            <button class="primary-link" type="submit">Entrar al panel</button>
            <p class="form-status" data-auth-status aria-live="polite"></p>
          </form>
        </section>

        <section class="admin-dashboard" data-admin-dashboard hidden>
          <article class="admin-panel admin-panel--form">
            <div class="admin-panel__head">
              <h2>Crear o editar evento</h2>
              <button class="ghost-button" type="button" data-admin-reset>Nuevo evento</button>
            </div>
            <form class="admin-event-form" data-admin-event-form>
              <input name="eventId" type="hidden" />
              <label class="field">
                <span>Título</span>
                <input name="title" type="text" required />
              </label>
              <label class="field">
                <span>Slug</span>
                <input name="slug" type="text" placeholder="girl-power-bootcamp" />
              </label>
              <label class="field">
                <span>Resumen</span>
                <textarea name="summary" rows="3" required></textarea>
              </label>
              <label class="field">
                <span>Descripción</span>
                <textarea name="description" rows="4"></textarea>
              </label>
              <div class="field-row">
                <label class="field">
                  <span>Ubicación</span>
                  <input name="location" type="text" />
                </label>
                <label class="field">
                  <span>Fecha y hora</span>
                  <input name="startsAt" type="datetime-local" required />
                </label>
              </div>
              <div class="field-row">
                <label class="field">
                  <span>Finaliza</span>
                  <input name="endsAt" type="datetime-local" />
                </label>
                <label class="field">
                  <span>Precio / CTA</span>
                  <input name="priceLabel" type="text" placeholder="Plazas limitadas" />
                </label>
              </div>
              <div class="field-row">
                <label class="field">
                  <span>Poster URL</span>
                  <input name="posterUrl" type="text" placeholder="/event-assets/girl-power-hero.png" />
                </label>
                <label class="field">
                  <span>Texto botón</span>
                  <input name="ctaLabel" type="text" placeholder="Reservar plaza" />
                </label>
              </div>
              <label class="field field--checkbox">
                <input name="isPublished" type="checkbox" checked />
                <span>Publicado</span>
              </label>
              <button class="primary-link" type="submit">Guardar evento</button>
              <p class="form-status" data-admin-form-status aria-live="polite"></p>
            </form>
          </article>

          <article class="admin-panel">
            <div class="admin-panel__head">
              <h2>Eventos publicados</h2>
              <p class="admin-soft-note">Selecciona uno para ver registros.</p>
            </div>
            <div class="admin-events-list" data-admin-events-list></div>
          </article>

          <article class="admin-panel">
            <div class="admin-panel__head">
              <h2>Registros</h2>
              <p class="admin-soft-note" data-admin-selected-event>Sin evento seleccionado.</p>
            </div>
            <div class="admin-registrations" data-admin-registrations></div>
          </article>
        </section>
      </main>
    `,
  });
}

function renderShell({
  title,
  description,
  lang = 'es',
  bodyClassName = '',
  scripts = [],
  body,
}) {
  const resolvedScripts = ['/landing.js', ...scripts].filter(
    (script, index, list) => list.indexOf(script) === index,
  );
  const includeCookiesBanner = !String(bodyClassName || '').includes(
    'events-admin-page',
  );

  return `<!doctype html>
<html lang="${escapeAttribute(lang === 'pt-br' ? 'pt-BR' : 'es')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    ${includeCookiesBanner ? '<link rel="stylesheet" href="/core/cookies-banner.css" />' : ''}
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="${escapeAttribute(bodyClassName)}">
    ${body}
    ${includeCookiesBanner ? '<script src="/core/cookies-banner.js" defer></script>' : ''}
    ${resolvedScripts
      .map(
        (script) => `<script src="${escapeAttribute(script)}" defer></script>`,
      )
      .join('')}
  </body>
</html>`;
}

function formatEventDate(value, lang = 'es') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return lang === 'pt-br' ? 'Data a confirmar' : 'Fecha por confirmar';
  }

  return date.toLocaleString(lang === 'pt-br' ? 'pt-BR' : 'es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function escapeAttribute(value) {
  return escapeHtml(value);
}

module.exports = {
  renderAdminEventsPage,
  renderEventDetailPage,
  renderEventsListPage,
};

function renderPublicFooter(lang) {
  const copy = getEventsCopy(lang);

  return `
    <footer class="site-footer-bar">
      <div class="site-footer-bar__legal">
        <a href="${
          lang === 'pt-br'
            ? '/legal-pt-br.html#aviso-legal'
            : '/legal.html#aviso-legal'
        }">${escapeHtml(copy.legalLabel)}</a>
        <a href="${
          lang === 'pt-br'
            ? '/legal-pt-br.html#privacidade'
            : '/legal.html#privacidad'
        }">${escapeHtml(copy.privacyLabel)}</a>
        <a href="${
          lang === 'pt-br' ? '/legal-pt-br.html#cookies' : '/legal.html#cookies'
        }">${escapeHtml(copy.cookiesLabel)}</a>
      </div>
      <p>by <a href="https://webfuengirola.com" target="_blank" rel="noreferrer">Web Fuengirola Studio</a></p>
    </footer>
  `;
}

function renderPublicHeader({ lang, currentPage }) {
  const isPortuguese = lang === 'pt-br';
  const homeHref = isPortuguese ? './index-pt-br.html' : './index.html';
  const casesHref = isPortuguese
    ? './casos-exito-pt-br.html'
    : './casos-exito.html';
  const aboutHref = isPortuguese ? './sobre-mi-pt-br.html' : './sobre-mi.html';
  const eventsHref = isPortuguese ? '/eventos?lang=pt-br' : '/eventos';

  return `
    <header class="site-header">
      <a class="site-logo" href="${homeHref}">Saulo Fitness</a>
      <button
        class="site-header__toggle"
        type="button"
        aria-expanded="false"
        aria-controls="site-nav"
        data-nav-toggle
      >
        ${isPortuguese ? 'Menu' : 'Menú'}
      </button>
      <div class="lang-switch" aria-label="${escapeAttribute(
        isPortuguese ? 'Seletor de idioma' : 'Selector de idioma',
      )}">
        <a class="lang-switch__link ${
          isPortuguese ? '' : 'is-active'
        }" href="${currentPage === 'events' ? '/eventos' : getCurrentPageHref('es', currentPage)}">🇪🇸 ES</a>
        <a class="lang-switch__link ${isPortuguese ? 'is-active' : ''}" href="${
          currentPage === 'events'
            ? '/eventos?lang=pt-br'
            : getCurrentPageHref('pt-br', currentPage)
        }">🇧🇷 PT-BR</a>
      </div>
      <nav class="site-nav" id="site-nav" data-site-nav>
        <a href="${homeHref}"${
          currentPage === 'home' ? ' aria-current="page"' : ''
        }>${isPortuguese ? 'Início' : 'Inicio'}</a>
        <a href="${casesHref}"${
          currentPage === 'cases' ? ' aria-current="page"' : ''
        }>${isPortuguese ? 'Casos de sucesso' : 'Casos de éxito'}</a>
        <a href="${aboutHref}"${
          currentPage === 'about' ? ' aria-current="page"' : ''
        }>${isPortuguese ? 'Sobre mim' : 'Sobre mí'}</a>
        <a href="${eventsHref}"${
          currentPage === 'events' ? ' aria-current="page"' : ''
        }>Eventos</a>
        <a
          class="site-nav__cta"
          href="https://wa.me/34622923988"
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      </nav>
    </header>
  `;
}

function getCurrentPageHref(lang, currentPage) {
  const isPortuguese = lang === 'pt-br';
  if (currentPage === 'cases') {
    return isPortuguese ? './casos-exito-pt-br.html' : './casos-exito.html';
  }
  if (currentPage === 'about') {
    return isPortuguese ? './sobre-mi-pt-br.html' : './sobre-mi.html';
  }
  return isPortuguese ? './index-pt-br.html' : './index.html';
}

function getEventsCopy(lang) {
  if (lang === 'pt-br') {
    return {
      listTitle: 'Eventos | Saulo Fitness',
      listDescription:
        'Lista de eventos presenciais da Saulo Fitness com vagas limitadas e inscrição direta.',
      langLabel: 'Seletor de idioma',
      eventsKicker: 'Eventos Saulo Fitness',
      upcomingLabel: 'Próximos eventos',
      eventsHeading: 'Próximos eventos para treinar ao vivo com direção.',
      eventsLead:
        'Cinco encontros fechados a cada três semanas, com acesso à planilha e inscrição direta.',
      whatsAppLabel: 'Falar pelo WhatsApp',
      backHomeLabel: 'Voltar ao início',
      backEventsLabel: 'Voltar aos eventos',
      premiumEventLabel: 'Evento premium',
      whatToExpectLabel: 'O que você vai viver',
      pointOne: 'Treinamento guiado com correções diretas.',
      pointTwo: 'Motivação, técnica e energia de grupo.',
      pointThree: 'Saída com foco claro para seguir evoluindo.',
      reserveLabel: 'Reserve sua vaga',
      fullNameLabel: 'Nome completo',
      emailLabel: 'E-mail',
      phoneLabel: 'Telefone',
      messageLabel: 'Mensagem',
      messagePlaceholder:
        'Conte se você vem acompanhada, dúvidas ou preferências.',
      legalLabel: 'Aviso legal',
      privacyLabel: 'Privacidade',
      cookiesLabel: 'Cookies',
    };
  }

  return {
    listTitle: 'Eventos | Saulo Fitness',
    listDescription:
      'Listado de eventos presenciales de Saulo Fitness con plazas limitadas y registro directo.',
    langLabel: 'Selector de idioma',
    eventsKicker: 'Eventos Saulo Fitness',
    upcomingLabel: 'Próximos eventos',
    eventsHeading: 'Próximos eventos para entrenar en directo con dirección.',
    eventsLead:
      'Cinco encuentros cerrados cada tres semanas, con acceso a la plantilla y registro directo.',
    whatsAppLabel: 'Escribir por WhatsApp',
    backHomeLabel: 'Volver al inicio',
    backEventsLabel: 'Volver a eventos',
    premiumEventLabel: 'Evento premium',
    whatToExpectLabel: 'Qué vas a vivir',
    pointOne: 'Entrenamiento guiado con correcciones directas.',
    pointTwo: 'Motivación, técnica y energía de grupo.',
    pointThree: 'Salida con foco claro para seguir progresando.',
    reserveLabel: 'Reserva tu plaza',
    fullNameLabel: 'Nombre completo',
    emailLabel: 'Email',
    phoneLabel: 'Teléfono',
    messageLabel: 'Mensaje',
    messagePlaceholder: 'Cuéntame si vienes acompañada, dudas o preferencias.',
    legalLabel: 'Aviso legal',
    privacyLabel: 'Privacidad',
    cookiesLabel: 'Cookies',
  };
}
