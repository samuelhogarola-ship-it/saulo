const {
  escapeHtml,
  formatCurrency,
  formatDateLong,
  formatTime,
  serializeForScript,
} = require('../lib/utils');

function renderPublicEventPage(event) {
  return renderDocument({
    title: `${event.title} | Evento Saulo Fitness`,
    bodyClassName: 'event-public-page',
    stylesheets: ['/events/public.css'],
    scripts: ['/events/public-client.js'],
    body: `
      <main class="event-page">
        <section class="event-hero" style="--poster-url: url('${escapeAttribute(event.poster_url)}')">
          <div class="event-hero__backdrop"></div>
          <div class="event-hero__content">
            <p class="event-hero__eyebrow">${escapeHtml(event.subtitle || '')}</p>
            <p class="event-hero__script">${escapeHtml(event.landing.eyebrow)}</p>
            <h1 class="event-hero__title">${escapeHtml(event.title)}</h1>
            <p class="event-hero__actions">${event.landing.heroActions
              .map((item) => escapeHtml(item))
              .join(' · ')}</p>
            <p class="event-hero__headline">${escapeHtml(event.landing.bodyHeadline)}</p>
            <div class="event-hero__teacher-card">
              <span>Profesores</span>
              <strong>${escapeHtml(event.teachers || 'Equipo Saulo Fitness')}</strong>
            </div>
          </div>
        </section>

        <section class="event-grid">
          <article class="event-card event-card--info">
            <div class="section-heading">
              <span>Información del evento</span>
              <h2>Todo listo para tu plaza</h2>
            </div>

            <div class="event-info-grid">
              ${renderInfoItem('Fecha', formatDateLong(event.event_date))}
              ${renderInfoItem('Hora', formatTime(event.event_time))}
              ${renderInfoItem('Lugar', event.location)}
              ${renderInfoItem('Precio', formatCurrency(event.price))}
            </div>

            <div class="event-deadline">
              <span>Inscripción hasta</span>
              <strong>${escapeHtml(formatDateLong(event.registration_deadline))}</strong>
            </div>

            <div class="event-description">
              <p>${escapeHtml(event.description)}</p>
            </div>

            <div class="event-hashtag">#${escapeHtml(
              event.title.replace(/\s+/g, ''),
            )}</div>
          </article>

          <article class="event-card event-card--form">
            <div class="section-heading">
              <span>Inscríbete ahora</span>
              <h2>¡No te quedes sin tu plaza!</h2>
            </div>

            <form id="event-registration-form" class="event-form" novalidate>
              <input type="hidden" name="slug" value="${escapeHtml(event.slug)}" />
              ${renderFormField('Nombre completo *', 'full_name', 'Escribe tu nombre completo')}
              ${renderFormField('Email (opcional)', 'email', 'tu@email.com', 'email')}
              ${renderFormField('Teléfono *', 'phone', 'Tu número de teléfono', 'tel')}
              <label class="form-field">
                <span>Comentarios (opcional)</span>
                <textarea
                  name="comments"
                  rows="4"
                  placeholder="Cuéntanos algo (opcional)"
                ></textarea>
                <small class="field-error" data-error-for="comments"></small>
              </label>
              <button class="primary-cta" type="submit">Inscribirme</button>
            </form>

            <div id="event-form-status" class="form-status" aria-live="polite"></div>

            <p class="event-form-note">
              Tus datos están protegidos. Solo se usarán para la gestión del evento.
            </p>
          </article>
        </section>

        <section class="event-card event-card--includes">
          <div class="section-heading">
            <span>¿Qué incluye?</span>
            <h2>Una experiencia pensada para disfrutar</h2>
          </div>

          <ul class="event-includes-list">
            ${event.landing.includes
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join('')}
          </ul>
        </section>

        <section class="event-benefits">
          ${event.landing.benefits
            .map(
              (item) => `
                <article class="event-benefit">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.copy)}</p>
                </article>
              `,
            )
            .join('')}
        </section>

        <footer class="event-footer">
          <span>¿Dudas? Contáctanos</span>
          ${event.landing.contacts
            .map((item) => `<strong>${escapeHtml(item)}</strong>`)
            .join('')}
        </footer>
      </main>

      <script id="saulo-page-data" type="application/json">${serializeForScript(
        {
          slug: event.slug,
        },
      )}</script>
    `,
  });
}

function renderAdminLoginPage({ modeHint, message, error }) {
  return renderDocument({
    title: 'Acceso eventos | Saulo Fitness',
    bodyClassName: 'admin-events-page',
    stylesheets: ['/events/admin.css'],
    body: `
      <main class="admin-shell admin-shell--login">
        <section class="admin-auth-card">
          <p class="admin-kicker">Eventos · Acceso privado</p>
          <h1>Entra por Magic Link</h1>
          <p class="admin-copy">
            Introduce tu email y te enviaremos un acceso temporal para ver solo los eventos que te correspondan.
          </p>
          ${message ? `<div class="admin-alert admin-alert--success">${escapeHtml(message)}</div>` : ''}
          ${error ? `<div class="admin-alert admin-alert--error">${escapeHtml(error)}</div>` : ''}
          ${modeHint ? `<div class="admin-alert admin-alert--info">${escapeHtml(modeHint)}</div>` : ''}
          <div class="admin-alert admin-alert--info">
            Preview rápido: <strong>owner@saulo.test</strong>, <strong>manager@saulo.test</strong> o <strong>viewer@saulo.test</strong>
          </div>
          <form class="admin-form-stack" action="/auth/magic-link" method="post">
            <label class="admin-field">
              <span>Email</span>
              <input type="email" name="email" required placeholder="tu@email.com" />
            </label>
            <button class="admin-button admin-button--primary" type="submit">
              Enviar acceso
            </button>
          </form>
        </section>
      </main>
    `,
  });
}

function renderAdminEventsPage({ authContext, data }) {
  return renderDocument({
    title: 'Eventos | Panel Saulo',
    bodyClassName: 'admin-events-page',
    stylesheets: ['/events/admin.css'],
    scripts: ['/events/admin-client.js'],
    body: `
      ${renderAdminChrome({
        authContext,
        title: 'Eventos',
        subtitle: 'Gestión centralizada de eventos e inscripciones',
      })}
      <main class="admin-shell">
        <section class="admin-section-grid">
          <article class="admin-panel admin-panel--wide">
            <div class="admin-section-head">
              <div>
                <p class="admin-kicker">Lista</p>
                <h2>Eventos activos</h2>
              </div>
            </div>

            <div class="events-card-grid">
              ${data.events
                .map(
                  (event) => `
                    <article class="event-admin-card">
                      <div class="event-admin-card__poster" style="background-image: url('${escapeAttribute(
                        event.poster_url,
                      )}')"></div>
                      <div class="event-admin-card__body">
                        <div class="event-admin-card__head">
                          <div>
                            <h3>${escapeHtml(event.title)}</h3>
                            <p>${escapeHtml(formatDateLong(event.event_date))}</p>
                          </div>
                          ${
                            event.unreadNotifications
                              ? `<span class="admin-badge">${event.unreadNotifications} nuevas</span>`
                              : ''
                          }
                        </div>
                        <p>${event.registrationsCount} inscritos</p>
                        <a class="admin-button admin-button--ghost" href="/admin/eventos/${escapeHtml(
                          event.id,
                        )}">Ver inscritos</a>
                      </div>
                    </article>
                  `,
                )
                .join('')}
            </div>
          </article>

          ${
            data.canCreateEvents
              ? `
                <article class="admin-panel">
                  <div class="admin-section-head">
                    <div>
                      <p class="admin-kicker">Alta rápida</p>
                      <h2>Nuevo evento</h2>
                    </div>
                  </div>

                  <form id="admin-event-create-form" class="admin-form-stack">
                    ${renderAdminEventFields()}
                    <button class="admin-button admin-button--primary" type="submit">
                      Crear evento
                    </button>
                  </form>
                  <div id="admin-global-status" class="admin-inline-status" aria-live="polite"></div>
                </article>
              `
              : `
                <article class="admin-panel">
                  <div class="admin-section-head">
                    <div>
                      <p class="admin-kicker">Acceso colaborador</p>
                      <h2>Visibilidad limitada</h2>
                    </div>
                  </div>
                  <p class="admin-copy">
                    Tu acceso está limitado a los eventos asignados. Si necesitas crear o editar eventos completos, usa una cuenta owner o admin.
                  </p>
                </article>
              `
          }
        </section>
      </main>
      ${renderPageData({ page: 'events-list' })}
    `,
  });
}

function renderAdminEventDetailPage({ authContext, detail }) {
  const { event, permission, registrations, summary } = detail;

  return renderDocument({
    title: `${event.title} | Panel Saulo`,
    bodyClassName: 'admin-events-page',
    stylesheets: ['/events/admin.css'],
    scripts: ['/events/admin-client.js'],
    body: `
      ${renderAdminChrome({
        authContext,
        title: event.title,
        subtitle: 'Detalle del evento',
      })}
      <main class="admin-shell">
        <section class="admin-summary-grid">
          <article class="admin-panel admin-panel--summary">
            <p class="admin-kicker">Resumen</p>
            <h2>${escapeHtml(event.title)}</h2>
            <p class="admin-copy">${escapeHtml(event.location)}</p>
            <div class="summary-metrics">
              ${renderMetric('Fecha', formatDateLong(event.event_date))}
              ${renderMetric('Precio', formatCurrency(event.price))}
              ${renderMetric('Inscritos', String(summary.totalRegistrations))}
              ${renderMetric('Pagados', String(summary.totalPaid))}
              ${renderMetric('Pendientes', String(summary.totalPending))}
            </div>
          </article>

          <article class="admin-panel">
            <p class="admin-kicker">Enlace público</p>
            <h2>Comparte este formulario</h2>
            <div class="share-box">
              <code>${escapeHtml(`/eventos/${event.slug}`)}</code>
              <a class="admin-button admin-button--ghost" href="/eventos/${escapeHtml(
                event.slug,
              )}" target="_blank" rel="noreferrer">Abrir landing</a>
            </div>
          </article>
        </section>

        <section class="admin-section-grid admin-section-grid--detail">
          <article class="admin-panel admin-panel--wide">
            <div class="admin-section-head">
              <div>
                <p class="admin-kicker">Inscritos</p>
                <h2>Listado completo</h2>
              </div>
              ${
                permission.canManage
                  ? `<span class="admin-soft-note">Recomendado: comparte el enlace público. El alta manual es solo apoyo operativo.</span>`
                  : `<span class="admin-soft-note">Acceso en modo lectura.</span>`
              }
            </div>

            <div class="registrations-table">
              <div class="registrations-row registrations-row--head">
                <span>Nombre</span>
                <span>Email</span>
                <span>Teléfono</span>
                <span>Inscripción</span>
                <span>Pago</span>
                <span>Acciones</span>
              </div>

              ${registrations
                .map(
                  (registration) => `
                    <form class="registrations-row" data-registration-form data-registration-id="${escapeHtml(
                      registration.id,
                    )}">
                      <input name="full_name" value="${escapeAttribute(
                        registration.full_name,
                      )}" ${permission.canManage ? '' : 'readonly'} />
                      <input name="email" value="${escapeAttribute(
                        registration.email || '',
                      )}" ${permission.canManage ? '' : 'readonly'} />
                      <input name="phone" value="${escapeAttribute(
                        registration.phone,
                      )}" ${permission.canManage ? '' : 'readonly'} />
                      <span class="registration-date">${escapeHtml(
                        new Date(registration.registered_at).toLocaleString(
                          'es-ES',
                        ),
                      )}</span>
                      <select name="payment_status" ${permission.canManage ? '' : 'disabled'}>
                        <option value="pending" ${
                          registration.payment_status === 'pending'
                            ? 'selected'
                            : ''
                        }>Pendiente</option>
                        <option value="paid" ${
                          registration.payment_status === 'paid'
                            ? 'selected'
                            : ''
                        }>Pagado</option>
                      </select>
                      <div class="registration-actions">
                        ${
                          permission.canManage
                            ? `
                              <button class="admin-button admin-button--tiny" type="button" data-registration-status="paid">Pagado</button>
                              <button class="admin-button admin-button--tiny" type="button" data-registration-status="pending">Pendiente</button>
                              <button class="admin-button admin-button--tiny" type="submit">Guardar</button>
                              <button class="admin-button admin-button--danger" type="button" data-registration-delete>Eliminar</button>
                            `
                            : '<span class="admin-soft-note">Solo lectura</span>'
                        }
                      </div>
                      <textarea name="comments" class="registration-comments" rows="2" placeholder="Comentarios" ${
                        permission.canManage ? '' : 'readonly'
                      }>${escapeHtml(registration.comments || '')}</textarea>
                    </form>
                  `,
                )
                .join('')}
            </div>
          </article>

          <aside class="admin-panel-stack">
            ${
              permission.canManage
                ? `
                  <article class="admin-panel">
                    <div class="admin-section-head">
                      <div>
                        <p class="admin-kicker">Alta manual</p>
                        <h2>Añadir inscrito</h2>
                      </div>
                    </div>
                    <p class="admin-soft-note">
                      Úsalo solo cuando haga falta. Lo recomendado es compartir el enlace público.
                    </p>
                    <form id="admin-manual-registration-form" class="admin-form-stack" data-event-id="${escapeHtml(
                      event.id,
                    )}">
                      ${renderRegistrationFields()}
                      <label class="admin-field">
                        <span>Estado de pago</span>
                        <select name="payment_status">
                          <option value="pending">Pendiente</option>
                          <option value="paid">Pagado</option>
                        </select>
                      </label>
                      <button class="admin-button admin-button--primary" type="submit">
                        Añadir inscrito
                      </button>
                    </form>
                  </article>

                  <article class="admin-panel">
                    <div class="admin-section-head">
                      <div>
                        <p class="admin-kicker">Evento</p>
                        <h2>Editar datos</h2>
                      </div>
                    </div>
                    <form id="admin-event-edit-form" class="admin-form-stack" data-event-id="${escapeHtml(
                      event.id,
                    )}">
                      ${renderAdminEventFields(event)}
                      <button class="admin-button admin-button--primary" type="submit">
                        Guardar cambios
                      </button>
                    </form>

                    <form id="admin-event-poster-form" class="admin-form-stack" data-event-id="${escapeHtml(
                      event.id,
                    )}">
                      <label class="admin-field">
                        <span>Nuevo cartel</span>
                        <input type="file" name="poster" accept="image/*" />
                      </label>
                      <button class="admin-button admin-button--ghost" type="submit">
                        Subir cartel
                      </button>
                    </form>
                  </article>
                `
                : ''
            }
          </aside>
        </section>
      </main>
      ${renderPageData({ page: 'event-detail', eventId: event.id })}
    `,
  });
}

function renderNotFoundPage(title, copy) {
  return renderDocument({
    title,
    bodyClassName: 'admin-events-page',
    stylesheets: ['/events/admin.css'],
    body: `
      <main class="admin-shell admin-shell--login">
        <section class="admin-auth-card">
          <p class="admin-kicker">Saulo Fitness</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="admin-copy">${escapeHtml(copy)}</p>
          <a class="admin-button admin-button--primary" href="/">Volver a la landing</a>
        </section>
      </main>
    `,
  });
}

function renderDocument({
  title,
  bodyClassName,
  stylesheets = [],
  scripts = [],
  body,
}) {
  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        ${stylesheets
          .map(
            (href) =>
              `<link rel="stylesheet" href="${escapeAttribute(href)}" />`,
          )
          .join('')}
      </head>
      <body class="${escapeHtml(bodyClassName)}">
        ${body}
        ${scripts
          .map((src) => `<script src="${escapeAttribute(src)}" defer></script>`)
          .join('')}
      </body>
    </html>`;
}

function renderAdminChrome({ authContext, title, subtitle }) {
  return `
    <header class="admin-header">
      <div>
        <a class="admin-header__brand" href="/trainer/">Saulo Fitness APP</a>
        <p class="admin-kicker">${escapeHtml(subtitle)}</p>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="admin-header__actions">
        <span class="admin-user-pill">${escapeHtml(authContext.displayLabel || authContext.email)}</span>
        <a class="admin-button admin-button--ghost" href="/admin/eventos">Todos los eventos</a>
        <form action="/auth/logout" method="post">
          <button class="admin-button admin-button--ghost" type="submit">Salir</button>
        </form>
      </div>
    </header>
  `;
}

function renderPageData(data) {
  return `<script id="saulo-page-data" type="application/json">${serializeForScript(
    data,
  )}</script>`;
}

function renderInfoItem(label, value) {
  return `
    <article class="event-info-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || '')}</strong>
    </article>
  `;
}

function renderFormField(label, name, placeholder, type = 'text') {
  return `
    <label class="form-field">
      <span>${escapeHtml(label)}</span>
      <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" placeholder="${escapeAttribute(
        placeholder,
      )}" />
      <small class="field-error" data-error-for="${escapeHtml(name)}"></small>
    </label>
  `;
}

function renderRegistrationFields() {
  return `
    ${renderAdminField('Nombre', 'full_name')}
    ${renderAdminField('Email', 'email', 'email')}
    ${renderAdminField('Teléfono', 'phone', 'tel')}
    <label class="admin-field">
      <span>Comentarios</span>
      <textarea name="comments" rows="3"></textarea>
    </label>
  `;
}

function renderAdminEventFields(event = {}) {
  return `
    ${renderAdminField('Título', 'title', 'text', event.title || '')}
    ${renderAdminField('Slug', 'slug', 'text', event.slug || '')}
    ${renderAdminField('Subtítulo', 'subtitle', 'text', event.subtitle || '')}
    ${renderAdminField('Fecha', 'event_date', 'date', event.event_date || '')}
    ${renderAdminField('Hora', 'event_time', 'time', formatTime(event.event_time || ''))}
    ${renderAdminField('Lugar', 'location', 'text', event.location || '')}
    ${renderAdminField('Precio', 'price', 'text', event.price ?? '')}
    ${renderAdminField(
      'Inscripción hasta',
      'registration_deadline',
      'date',
      event.registration_deadline || '',
    )}
    ${renderAdminField('Profesores', 'teachers', 'text', event.teachers || '')}
    ${renderAdminField(
      'Email organizador',
      'organizer_email',
      'email',
      event.organizer_email || '',
    )}
    <label class="admin-field">
      <span>Descripción</span>
      <textarea name="description" rows="4">${escapeHtml(
        event.description || '',
      )}</textarea>
    </label>
  `;
}

function renderAdminField(label, name, type = 'text', value = '') {
  return `
    <label class="admin-field">
      <span>${escapeHtml(label)}</span>
      <input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeAttribute(
        value,
      )}" />
    </label>
  `;
}

function renderMetric(label, value) {
  return `
    <article class="summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

module.exports = {
  renderAdminEventDetailPage,
  renderAdminEventsPage,
  renderAdminLoginPage,
  renderNotFoundPage,
  renderPublicEventPage,
};
