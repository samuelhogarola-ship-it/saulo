(function () {
  const title = document.querySelector('#waiting-title');
  const copy = document.querySelector('#waiting-copy');
  const panel = document.querySelector('#waiting-panel');
  const actions = document.querySelector('#waiting-actions');
  const openApp = document.querySelector('#waiting-open-app');
  let waitingRoomPayload = null;

  const token = getWaitingRoomToken();

  if (!token) {
    renderError('No se encontró un enlace válido para acceder a la app.');
  } else {
    loadWaitingRoom(token);
  }

  async function loadWaitingRoom(waitingRoomToken) {
    try {
      const response = await fetch(
        `/api/waiting-room/${encodeURIComponent(waitingRoomToken)}`,
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message || 'No se pudo preparar tu acceso en este momento.',
        );
      }

      waitingRoomPayload = payload;
      renderReady(payload);
    } catch (error) {
      renderError(error.message);
    }
  }

  function renderReady(payload) {
    title.textContent = `Hola ${payload.student.name}, tu acceso está listo`;
    copy.textContent =
      'Tu entrenador ya ha confirmado el pago. Este magic link es único, de un solo uso, y te lleva a la sala de espera desde la que activarás tu app en el móvil.';
    panel.classList.remove('is-error');
    panel.innerHTML = `
      <strong>${escapeHtml(payload.student.plan || 'Saulo Fitness APP')}</strong>
      <p class="waiting-status">
        En cuanto abras la app, tu sesión quedará iniciada y podrás dejarla instalada como PWA en tu pantalla de inicio.
      </p>
      <ol class="install-steps">
        <li>Abre la app desde el botón inferior.</li>
        <li>Comprueba que tu sesión ha quedado activa dentro de la app.</li>
        <li>En iPhone usa Compartir &gt; "Añadir a pantalla de inicio".</li>
        <li>En Android usa el menú del navegador &gt; "Instalar app".</li>
      </ol>
    `;
    actions.hidden = false;
    openApp.href = '#';
  }

  function renderError(message) {
    title.textContent = 'Enlace no disponible';
    copy.textContent =
      'Este acceso ya no está activo o todavía no ha sido preparado por tu entrenador.';
    panel.classList.add('is-error');
    panel.innerHTML = `<p class="waiting-status">${escapeHtml(message)}</p>`;
    actions.hidden = true;
  }

  openApp?.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!token || !waitingRoomPayload) {
      renderError('No se pudo preparar tu acceso en este momento.');
      return;
    }

    openApp.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(
        `/api/waiting-room/${encodeURIComponent(token)}/consume`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.appPath) {
        throw new Error(payload.message || 'No se pudo activar tu acceso.');
      }

      window.location.href = payload.appPath;
    } catch (error) {
      renderError(error.message);
    } finally {
      openApp.removeAttribute('aria-busy');
    }
  });

  function getWaitingRoomToken() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    return pathParts[0] === 'sala' ? pathParts[1] || '' : '';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
