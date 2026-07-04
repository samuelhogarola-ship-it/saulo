const loginForm = document.querySelector('[data-admin-login-form]');
const authCard = document.querySelector('[data-admin-auth-card]');
const dashboard = document.querySelector('[data-admin-dashboard]');
const authStatus = document.querySelector('[data-auth-status]');
const eventForm = document.querySelector('[data-admin-event-form]');
const formStatus = document.querySelector('[data-admin-form-status]');
const eventsList = document.querySelector('[data-admin-events-list]');
const registrationsList = document.querySelector('[data-admin-registrations]');
const selectedEventCopy = document.querySelector('[data-admin-selected-event]');
const resetButton = document.querySelector('[data-admin-reset]');

const TOKEN_KEY = 'saulo-admin-token';

let authToken = sessionStorage.getItem(TOKEN_KEY) || '';
let selectedEventId = '';

if (authToken) {
  revealDashboard();
  loadEvents();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    authStatus.textContent = 'Entrando...';

    const formData = new FormData(loginForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/trainer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo iniciar sesión.');
      }

      authToken = result.session.accessToken;
      sessionStorage.setItem(TOKEN_KEY, authToken);
      authStatus.textContent = '';
      revealDashboard();
      loadEvents();
    } catch (error) {
      authStatus.textContent =
        error.message || 'No se pudo iniciar sesión en el panel.';
    }
  });
}

if (eventForm) {
  eventForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formStatus.textContent = 'Guardando...';

    const formData = new FormData(eventForm);
    const payload = Object.fromEntries(formData.entries());
    payload.isPublished = formData.get('isPublished') === 'on';

    try {
      const method = payload.eventId ? 'PATCH' : 'POST';
      const target = payload.eventId
        ? `/api/admin/events/${payload.eventId}`
        : '/api/admin/events';

      const response = await fetch(target, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'No se pudo guardar el evento.');
      }

      formStatus.textContent = 'Evento guardado correctamente.';
      selectedEventId = result.event.id;
      fillEventForm(result.event);
      await loadEvents();
      await loadEventDetail(selectedEventId);
    } catch (error) {
      formStatus.textContent = error.message || 'No se pudo guardar el evento.';
    }
  });
}

if (resetButton) {
  resetButton.addEventListener('click', () => {
    eventForm?.reset();
    if (eventForm?.eventId) {
      eventForm.eventId.value = '';
    }
    selectedEventId = '';
    formStatus.textContent = '';
  });
}

async function loadEvents() {
  if (!authToken || !eventsList) {
    return;
  }

  eventsList.innerHTML = '<p class="admin-soft-note">Cargando eventos...</p>';

  try {
    const response = await fetch('/api/admin/events', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'No se pudo cargar el panel.');
    }

    const events = Array.isArray(result.events) ? result.events : [];
    eventsList.innerHTML = events
      .map(
        (item) => `
          <article class="admin-event-item">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(formatDate(item.startsAt))}</p>
            <p>${escapeHtml(item.location)}</p>
            <p>${item.registrationCount} registros · ${
              item.isPublished ? 'Publicado' : 'Borrador'
            }</p>
            <button class="secondary-link" type="button" data-event-id="${escapeHtml(
              item.id,
            )}">Abrir</button>
          </article>
        `,
      )
      .join('');

    eventsList.querySelectorAll('[data-event-id]').forEach((button) => {
      button.addEventListener('click', () => {
        loadEventDetail(button.dataset.eventId);
      });
    });

    if (!selectedEventId && events[0]) {
      selectedEventId = events[0].id;
      await loadEventDetail(selectedEventId);
    }
  } catch (error) {
    eventsList.innerHTML = `<p class="admin-soft-note">${escapeHtml(
      error.message || 'No se pudo cargar el panel.',
    )}</p>`;
  }
}

async function loadEventDetail(eventId) {
  if (!authToken || !eventId) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/events/${eventId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'No se pudo cargar el evento.');
    }

    fillEventForm(result.event);
    selectedEventCopy.textContent = `Viendo ${result.event.title}`;
    registrationsList.innerHTML = result.event.registrations.length
      ? result.event.registrations
          .map(
            (registration) => `
              <article class="admin-registration-item">
                <strong>${escapeHtml(registration.fullName)}</strong>
                <p>${escapeHtml(registration.email || registration.phone || 'Sin contacto')}</p>
                <p>${escapeHtml(registration.message || 'Sin mensaje')}</p>
                <p>${escapeHtml(formatDate(registration.createdAt))}</p>
              </article>
            `,
          )
          .join('')
      : '<p class="admin-soft-note">Todavía no hay registros para este evento.</p>';
  } catch (error) {
    registrationsList.innerHTML = `<p class="admin-soft-note">${escapeHtml(
      error.message || 'No se pudo cargar el evento.',
    )}</p>`;
  }
}

function revealDashboard() {
  authCard.hidden = true;
  dashboard.hidden = false;
}

function fillEventForm(event) {
  if (!eventForm) {
    return;
  }

  eventForm.eventId.value = event.id || '';
  eventForm.title.value = event.title || '';
  eventForm.slug.value = event.slug || '';
  eventForm.summary.value = event.summary || '';
  eventForm.description.value = event.description || '';
  eventForm.location.value = event.location || '';
  eventForm.startsAt.value = toLocalDateTimeValue(event.startsAt);
  eventForm.endsAt.value = toLocalDateTimeValue(event.endsAt);
  eventForm.priceLabel.value = event.priceLabel || '';
  eventForm.posterUrl.value = event.posterUrl || '';
  eventForm.ctaLabel.value = event.ctaLabel || '';
  eventForm.isPublished.checked = Boolean(event.isPublished);
}

function toLocalDateTimeValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );
  return offsetDate.toISOString().slice(0, 16);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha por confirmar';
  }

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
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
