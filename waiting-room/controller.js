(function () {
  function createWaitingRoomController({ refs, token, escapeHtml }) {
    let waitingRoomPayload = null;

    function bind() {
      refs.openApp?.addEventListener('click', onOpenAppClick);
    }

    async function boot() {
      if (!token) {
        renderError('No se encontró un enlace válido para acceder a la app.');
        return;
      }

      await loadWaitingRoom(token);
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
      refs.title.textContent = `Hola ${payload.student.name}, tu acceso está listo`;
      refs.copy.textContent =
        'Tu entrenador ya ha confirmado el pago. Este magic link es único, de un solo uso, y te lleva a la sala de espera desde la que activarás tu app en el móvil.';
      refs.panel.classList.remove('is-error');
      refs.panel.classList.remove('is-consumed');
      refs.panel.innerHTML = `
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
      refs.actions.hidden = false;
      refs.openApp.href = '#';
      refs.openApp.textContent = 'Abrir y activar tu app';
    }

    function renderAlreadyOpened(payload) {
      refs.title.textContent = `Hola ${payload.student?.name || 'cliente'}, tu app ya fue activada`;
      refs.copy.textContent =
        'Este enlace ya cumplió su función. Si sigues en el mismo móvil, puedes abrir la app con tu sesión activa o entrar desde el icono que dejaste en pantalla.';
      refs.panel.classList.remove('is-error');
      refs.panel.classList.add('is-consumed');
      refs.panel.innerHTML = `
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
      refs.actions.hidden = false;
      refs.openApp.href = '/app/?section=routines&day=1';
      refs.openApp.textContent = 'Abrir tu app';
    }

    function renderError(message) {
      refs.title.textContent = 'Enlace no disponible';
      refs.copy.textContent =
        'Este acceso ya no está activo o todavía no ha sido preparado por tu entrenador.';
      refs.panel.classList.add('is-error');
      refs.panel.classList.remove('is-consumed');
      refs.panel.innerHTML = `<p class="waiting-status">${escapeHtml(message)}</p>`;
      refs.actions.hidden = true;
    }

    async function onOpenAppClick(event) {
      event.preventDefault();

      if (!token || !waitingRoomPayload) {
        renderError('No se pudo preparar tu acceso en este momento.');
        return;
      }

      if (waitingRoomPayload.state === 'already-opened') {
        window.location.href = refs.openApp.href;
        return;
      }

      refs.openApp.setAttribute('aria-busy', 'true');

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
        refs.openApp.removeAttribute('aria-busy');
      }
    }

    return {
      bind,
      boot,
    };
  }

  window.SauloWaitingRoomController = {
    createWaitingRoomController,
  };
})();
