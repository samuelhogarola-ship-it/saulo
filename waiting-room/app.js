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

      if (response.status === 409 && payload?.state === 'already-opened') {
        waitingRoomPayload = payload;
        renderAlreadyOpened(payload);
        return;
      }

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
    panel.classList.remove('is-consumed');
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
    openApp.textContent = 'Abrir y activar tu app';
  }

  function renderAlreadyOpened(payload) {
    title.textContent = `Hola ${payload.student?.name || 'cliente'}, tu app ya fue activada`;
    copy.textContent =
      'Este enlace ya cumplió su función. Si sigues en el mismo móvil, puedes abrir la app con tu sesión activa o entrar desde el icono que dejaste en pantalla.';
    panel.classList.remove('is-error');
    panel.classList.add('is-consumed');
    panel.innerHTML = `
      <strong>${escapeHtml(payload.student?.plan || 'Saulo Fitness APP')}</strong>
      <p class="waiting-status">
        ${escapeHtml(
          payload.message ||
            'La activación ya se completó anteriormente en este mismo acceso.',
        )}
      </p>
      <p class="waiting-status">
        Si este no es tu móvil actual, pide a tu entrenador que rote el acceso y te envíe un magic link nuevo.
      </p>
    `;
    actions.hidden = false;
    openApp.href = '/app/?section=routines&day=1';
    openApp.textContent = 'Abrir tu app';
  }

  function renderError(message) {
    title.textContent = 'Enlace no disponible';
    copy.textContent =
      'Este acceso ya no está activo o todavía no ha sido preparado por tu entrenador.';
    panel.classList.add('is-error');
    panel.classList.remove('is-consumed');
    panel.innerHTML = `<p class="waiting-status">${escapeHtml(message)}</p>`;
    actions.hidden = true;
  }

  openApp?.addEventListener('click', async (event) => {
    event.preventDefault();

    if (!token || !waitingRoomPayload) {
      renderError('No se pudo preparar tu acceso en este momento.');
      return;
    }

    if (waitingRoomPayload.state === 'already-opened') {
      window.location.href = openApp.href;
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
