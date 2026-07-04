(function () {
  const { escapeHtml, formatDateIso } = window.SauloUtils;

  function renderMessages({
    state,
    messagePanels,
    messagesInbox,
    messagesSent,
    messagesReminders,
    contextOptionsBySection,
  }) {
    const panelMap = {
      'messages-inbox': {
        panel: document.querySelector('#messages-inbox-panel'),
        container: messagesInbox,
        items: state.messages.inbox,
      },
      'messages-sent': {
        panel: document.querySelector('#messages-sent-panel'),
        container: messagesSent,
        items: state.messages.sent,
      },
      'messages-reminders': {
        panel: document.querySelector('#messages-reminders-panel'),
        container: messagesReminders,
        items: state.messages.reminders,
      },
      'messages-compose': {
        panel: document.querySelector('#messages-compose-panel'),
        container: null,
        items: [],
      },
    };

    const activeKey =
      state.section === 'messages' && contextOptionsBySection.messages
        ? state.contextKey
        : 'messages-inbox';

    messagePanels.forEach((panel) => {
      const key = panel.dataset.messagePanel;
      panel.hidden = key !== activeKey;
    });

    const activePanel = panelMap[activeKey] ?? panelMap['messages-inbox'];
    if (activePanel && activePanel.container) {
      renderMessageList(activePanel.container, activePanel.items);
    }
  }

  function renderSubscription({
    state,
    subscriptionStartCard,
    subscriptionPlanCard,
    subscriptionEndCard,
  }) {
    if (!state.subscription || !subscriptionStartCard) {
      return;
    }

    subscriptionStartCard.innerHTML = `
      <span>Estado actual</span>
      <strong>${escapeHtml(state.subscription.status)}</strong>
      <p>${escapeHtml(state.subscription.summary)}</p>
    `;
    subscriptionPlanCard.innerHTML = `
      <span>${escapeHtml(state.subscription.planLabel || 'Plan activo')}</span>
      <strong>${escapeHtml(formatDateIso(state.subscription.validUntil))}</strong>
      <p>Renovación prevista antes de la fecha de corte.</p>
    `;
    subscriptionEndCard.innerHTML = `
      <span>Fin del plan</span>
      <strong>${escapeHtml(formatDateIso(state.subscription.planEnd))}</strong>
      <p>Última semana activa del bloque de entrenamiento actual.</p>
    `;
  }

  function renderProfile({
    studentProfile,
    profileAgeCard,
    profileWeightCard,
    profileGoalCard,
    profileNotesCard,
  }) {
    if (!profileAgeCard || !profileWeightCard || !profileGoalCard) {
      return;
    }

    profileAgeCard.innerHTML = `
      <span>Edad</span>
      <strong>${escapeHtml(studentProfile.age)}</strong>
    `;
    profileWeightCard.innerHTML = `
      <span>Peso</span>
      <strong>${escapeHtml(studentProfile.weight)}</strong>
    `;
    profileGoalCard.innerHTML = `
      <span>Objetivo</span>
      <strong>${escapeHtml(studentProfile.goal)}</strong>
    `;

    if (profileNotesCard) {
      profileNotesCard.innerHTML = `
        <span>Notas de perfil</span>
        <strong>${escapeHtml(studentProfile.profileNoteTitle || 'Notas de perfil')}</strong>
        <p>${escapeHtml(studentProfile.profileNote || '')}</p>
      `;
    }
  }

  function renderProfilePhotos({
    state,
    studentProfile,
    profilePhotosGallery,
  }) {
    if (!profilePhotosGallery) {
      return;
    }

    const monthlyPhotos = [
      { label: 'Izquierda', tone: 'side-left' },
      { label: 'Derecha', tone: 'side-right' },
      { label: 'Frente', tone: 'front' },
      { label: 'Espalda', tone: 'back' },
    ];

    const photos = state.photos || {
      nextDueDate: '2026-07-30',
      pendingUploads: {},
      history: [],
    };
    const history = photos.history?.[0];

    profilePhotosGallery.innerHTML = `
      <article class="photo-history-card">
        <div class="photo-history-top">
          <div>
            <p class="brand-kicker">Próximo registro</p>
            <h4>${escapeHtml(formatDateIso(photos.nextDueDate))}</h4>
          </div>
          <span class="section-badge">4 fotos requeridas</span>
        </div>
        <p class="photo-history-copy">
          Sube izquierda, derecha, frente y espalda para dejar preparado el siguiente check-in.
        </p>
        <div class="photo-grid photo-grid-upload">
          ${monthlyPhotos
            .map(
              (photo) => `
                <label class="photo-upload-slot">
                  <input
                    class="photo-upload-input"
                    type="file"
                    accept="image/*"
                    data-photo-upload="${escapeHtml(photo.label)}"
                  />
                  ${
                    getUploadedPhotoSrc(state, photo.label)
                      ? `
                        <img
                          class="photo-upload-preview"
                          src="${getUploadedPhotoSrc(state, photo.label)}"
                          alt="Foto subida de ${escapeHtml(photo.label)}"
                        />
                      `
                      : `
                        <div class="photo-upload-placeholder" aria-hidden="true"></div>
                      `
                  }
                  <div class="photo-upload-overlay">
                    <span class="photo-upload-button">Subir foto</span>
                  </div>
                  <span class="photo-upload-caption">${escapeHtml(photo.label)}</span>
                </label>
              `,
            )
            .join('')}
        </div>
      </article>

      ${
        history
          ? `
            <article class="photo-history-card">
              <div class="photo-history-top">
                <div>
                  <p class="brand-kicker">${escapeHtml(history.month || 'Registro mensual')}</p>
                  <h4>${escapeHtml(history.title || `${studentProfile.name} · Seguimiento mensual`)}</h4>
                </div>
                <span class="section-badge">4 fotos subidas</span>
              </div>
              <p class="photo-history-copy">
                ${escapeHtml(history.copy || 'Registro mensual para comparar evolución, definición y postura.')}
              </p>
              <div class="photo-grid">
                ${(history.shots || monthlyPhotos)
                  .map(
                    (photo) => `
                      <figure class="photo-shot">
                        <img
                          src="${photo.url || getProgressPhotoSrc(photo.label, photo.tone)}"
                          alt="Foto de progreso ${escapeHtml(photo.label)} de ${escapeHtml(studentProfile.name)}"
                        />
                        <figcaption>${escapeHtml(photo.label)}</figcaption>
                      </figure>
                    `,
                  )
                  .join('')}
              </div>
            </article>
          `
          : ''
      }
    `;
  }

  function bindProfilePhotoUploads({
    profilePhotosGallery,
    state,
    uploadProgressPhoto,
    renderApp,
  }) {
    profilePhotosGallery?.addEventListener('change', (event) => {
      const input = event.target;

      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      const slot = input.dataset.photoUpload;
      const file = input.files?.[0];

      if (!slot || !file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result !== 'string') {
          return;
        }

        try {
          const result = await uploadProgressPhoto({
            slot,
            dataUrl: reader.result,
            filename: file.name,
            contentType: file.type || 'image/png',
          });
          state.profileUploads[slot] = result.photo?.url || reader.result;
          if (state.photos?.pendingUploads) {
            state.photos.pendingUploads[slot] = result.photo;
          }
          state.appError = null;
        } catch (error) {
          state.appError = error.message;
        }
        renderApp();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderMessageList(container, items) {
    container.innerHTML = items
      .map(
        (item) => `
          <article class="message-item ${getMessageVariantClass(item)}">
            <div class="message-item-top">
              <span>${escapeHtml(item.title)}</span>
              <time>${escapeHtml(item.date)}</time>
            </div>
            <strong>${escapeHtml(item.tag)}</strong>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `,
      )
      .join('');
  }

  function getMessageVariantClass(item) {
    const tag = item.tag.toLowerCase();

    if (tag.includes('enviado')) {
      return 'message-item-sent';
    }

    if (tag.includes('recordatorio')) {
      return 'message-item-reminder';
    }

    return 'message-item-received';
  }

  function getUploadedPhotoSrc(state, label) {
    return (
      state.profileUploads[label] ||
      state.photos?.pendingUploads?.[label]?.url ||
      ''
    );
  }

  function getProgressPhotoSrc(label, tone) {
    const scene = getProgressPhotoScene(tone);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 300" role="img" aria-label="${escapeHtml(label)}">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f7f4ff" />
            <stop offset="100%" stop-color="#ece7ff" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#111114" />
            <stop offset="100%" stop-color="#1f1f25" />
          </linearGradient>
        </defs>
        <rect width="220" height="300" rx="24" fill="url(#wall)" />
        <rect y="228" width="220" height="72" fill="url(#floor)" />
        <rect x="22" y="24" width="176" height="242" rx="18" fill="rgba(255,255,255,0.44)" stroke="rgba(111,44,255,0.18)" />
        ${scene}
        <rect x="18" y="18" width="52" height="18" rx="9" fill="rgba(17,17,20,0.08)" />
        <text x="28" y="31" fill="#111114" font-size="11" font-family="Arial, sans-serif" font-weight="700">${escapeHtml(label)}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getProgressPhotoScene(tone) {
    const base = `
      <ellipse cx="110" cy="248" rx="40" ry="10" fill="rgba(17,17,20,0.18)" />
      <ellipse cx="110" cy="68" rx="22" ry="10" fill="#1a1a1f" opacity="0.38" />
      <circle cx="110" cy="88" r="22" fill="#efc8b0" />
      <path d="M88 112c5-10 19-16 22-16s17 6 22 16l4 20c3 14-7 28-22 28h-8c-15 0-25-14-22-28z" fill="#17171b" />
      <path d="M93 116c6-7 14-12 17-12s11 5 17 12l3 19c2 10-5 19-16 19h-8c-11 0-18-9-16-19z" fill="#7c3aed" />
      <rect x="80" y="118" width="12" height="56" rx="6" fill="#efc8b0" />
      <rect x="128" y="118" width="12" height="56" rx="6" fill="#efc8b0" />
      <path d="M96 160h11l4 43c1 12-6 28-17 33l-6 2 2-34z" fill="#efc8b0" />
      <path d="M124 160h-11l-4 43c-1 12 6 28 17 33l6 2-2-34z" fill="#efc8b0" />
      <rect x="89" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
      <rect x="118" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
    `;

    if (tone === 'side-left') {
      return `
        <ellipse cx="106" cy="248" rx="35" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="104" cy="68" rx="20" ry="10" fill="#1a1a1f" opacity="0.38" />
        <path d="M101 66c-11 2-18 11-18 22 0 13 8 22 20 22 7 0 13-2 17-8-7-1-11-5-11-12 0-9 5-17 13-19-4-4-12-7-21-5z" fill="#efc8b0" />
        <path d="M96 106c8-2 19 2 26 10l6 18c4 14-6 29-22 31l-6 1c-12 1-21-8-21-20 0-20 4-33 17-40z" fill="#17171b" />
        <path d="M98 111c7-2 16 2 21 8l4 15c3 10-4 21-16 23l-6 1c-9 1-15-6-15-15 0-15 3-25 12-32z" fill="#7c3aed" />
        <path d="M121 119c7 7 11 19 8 32l-3 17h-10l-1-20c0-11-2-18-8-24z" fill="#efc8b0" />
        <path d="M94 121c-4 12-5 26 0 42l4 10H88c-5-9-8-23-6-35 1-8 4-15 12-17z" fill="#efc8b0" />
        <path d="M100 166h11l2 36c1 15-5 29-16 35l-4 2 1-33z" fill="#efc8b0" />
        <path d="M112 166h8l1 37c1 14 4 27 12 34l-9 2c-9-7-14-20-14-34z" fill="#efc8b0" />
        <rect x="91" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="121" y="234" width="13" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    if (tone === 'side-right') {
      return `
        <ellipse cx="114" cy="248" rx="35" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="116" cy="68" rx="20" ry="10" fill="#1a1a1f" opacity="0.38" />
        <path d="M119 66c11 2 18 11 18 22 0 13-8 22-20 22-7 0-13-2-17-8 7-1 11-5 11-12 0-9-5-17-13-19 4-4 12-7 21-5z" fill="#efc8b0" />
        <path d="M124 106c-8-2-19 2-26 10l-6 18c-4 14 6 29 22 31l6 1c12 1 21-8 21-20 0-20-4-33-17-40z" fill="#17171b" />
        <path d="M122 111c-7-2-16 2-21 8l-4 15c-3 10 4 21 16 23l6 1c9 1 15-6 15-15 0-15-3-25-12-32z" fill="#7c3aed" />
        <path d="M99 119c-7 7-11 19-8 32l3 17h10l1-20c0-11 2-18 8-24z" fill="#efc8b0" />
        <path d="M126 121c4 12 5 26 0 42l-4 10h10c5-9 8-23 6-35-1-8-4-15-12-17z" fill="#efc8b0" />
        <path d="M120 166h-11l-2 36c-1 15 5 29 16 35l4 2-1-33z" fill="#efc8b0" />
        <path d="M108 166h-8l-1 37c-1 14-4 27-12 34l9 2c9-7 14-20 14-34z" fill="#efc8b0" />
        <rect x="115" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="86" y="234" width="13" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    if (tone === 'back') {
      return `
        <ellipse cx="110" cy="248" rx="40" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="110" cy="68" rx="22" ry="10" fill="#1a1a1f" opacity="0.38" />
        <circle cx="110" cy="88" r="22" fill="#d8b49e" />
        <path d="M88 112c5-10 19-16 22-16s17 6 22 16l4 20c3 14-7 28-22 28h-8c-15 0-25-14-22-28z" fill="#17171b" />
        <path d="M93 116c6-7 14-12 17-12s11 5 17 12l3 19c2 10-5 19-16 19h-8c-11 0-18-9-16-19z" fill="#6f38eb" />
        <rect x="80" y="118" width="12" height="56" rx="6" fill="#d8b49e" />
        <rect x="128" y="118" width="12" height="56" rx="6" fill="#d8b49e" />
        <path d="M96 160h11l4 43c1 12-6 28-17 33l-6 2 2-34z" fill="#d8b49e" />
        <path d="M124 160h-11l-4 43c-1 12 6 28 17 33l6 2-2-34z" fill="#d8b49e" />
        <rect x="89" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="118" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    return base;
  }

  window.SauloSections = {
    bindProfilePhotoUploads,
    renderMessages,
    renderProfile,
    renderProfilePhotos,
    renderSubscription,
  };
})();
