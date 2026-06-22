const {
  DAY_ORDER,
  escapeHtml,
  formatDateIso,
  formatMessageDate,
  getClientById,
  getClientRoutineAssignment,
  getDayLabel,
  getExerciseThumbnailSrc,
  getProgressPhotoSrc,
  getState,
  recordWorkoutReport,
  resolveClientId,
  resolveDayKey,
  sendClientMessage,
  subscribe,
  updateClientPendingPhoto,
} = window.SauloDemoStore;

const state = {
  section: 'routines',
  contextKey: 'monday',
  dayKey: 'monday',
  clientId: null,
  demoToken: null,
  claimRequested: false,
  exerciseChecks: {},
  exerciseNotes: {},
};

const demoBanner = document.querySelector('#demo-banner');
const topbarTitle = document.querySelector('#topbar-title');
const studentClientChip = document.querySelector('#student-client-chip');
const contextNav = document.querySelector('#context-nav');
const studentName = document.querySelector('#student-name');
const studentPlan = document.querySelector('#student-plan');
const studentSummary = document.querySelector('#student-summary');
const sideLinks = [...document.querySelectorAll('.side-link')];
const sectionPanels = [...document.querySelectorAll('[data-section-panel]')];
const routineDayLabel = document.querySelector('#routine-day-label');
const routineDayTitle = document.querySelector('#routine-day-title');
const routineDayMeta = document.querySelector('#routine-day-meta');
const exerciseList = document.querySelector('#exercise-list');
const completeWorkoutButton = document.querySelector(
  '#complete-workout-button',
);
const workoutModalRoot = document.querySelector('#workout-modal-root');
const messagesInbox = document.querySelector('#messages-inbox');
const messagesSent = document.querySelector('#messages-sent');
const messagesReminders = document.querySelector('#messages-reminders');
const messagePanels = [...document.querySelectorAll('[data-message-panel]')];
const messageComposeForm = document.querySelector('#message-compose-form');
const messageComposeSubject = document.querySelector(
  '#message-compose-subject',
);
const messageComposeBody = document.querySelector('#message-compose-body');
const supportChatTrigger = document.querySelector('#support-chat-trigger');
const profilePhotosGallery = document.querySelector('#profile-photos-gallery');
const subscriptionStatusValue = document.querySelector(
  '#subscription-status-value',
);
const subscriptionStatusCopy = document.querySelector(
  '#subscription-status-copy',
);
const subscriptionEndValue = document.querySelector('#subscription-end-value');
const planEndValue = document.querySelector('#plan-end-value');
const profileAgeValue = document.querySelector('#profile-age-value');
const profileWeightValue = document.querySelector('#profile-weight-value');
const profileGoalValue = document.querySelector('#profile-goal-value');
const profileNoteTitle = document.querySelector('#profile-note-title');
const profileNoteCopy = document.querySelector('#profile-note-copy');

const contextOptionsBySection = {
  routines: DAY_ORDER.map((dayKey) => ({
    key: dayKey,
    label: getDayLabel(dayKey),
    type: 'day',
    dayKey,
  })),
  messages: [
    {
      key: 'messages-inbox',
      label: 'Buzón de entrada',
      type: 'panel',
    },
    {
      key: 'messages-sent',
      label: 'Enviados',
      type: 'panel',
    },
    {
      key: 'messages-reminders',
      label: 'Recordatorios',
      type: 'panel',
    },
    {
      key: 'messages-compose',
      label: 'Enviar mensaje',
      type: 'panel',
    },
  ],
  subscription: [
    { key: 'subscription-start', label: 'Estado', type: 'panel' },
    { key: 'subscription-plan', label: 'Válida hasta', type: 'panel' },
    { key: 'subscription-end', label: 'Fin del plan', type: 'panel' },
  ],
  profile: [
    { key: 'profile-age', label: 'Edad', type: 'panel' },
    { key: 'profile-weight', label: 'Peso', type: 'panel' },
    { key: 'profile-goal', label: 'Objetivo', type: 'panel' },
    { key: 'profile-photos', label: 'Fotos', type: 'panel' },
  ],
};

hydrateStateFromUrl();
registerServiceWorker();
subscribe(() => {
  renderApp();
});
renderApp();

sideLinks.forEach((button) => {
  button.addEventListener('click', () => {
    const nextSection = button.dataset.section;
    if (!nextSection) {
      return;
    }

    state.section = nextSection;
    state.contextKey = getDefaultContextKey(nextSection);
    renderApp();
  });
});

completeWorkoutButton?.addEventListener('click', () => {
  renderWorkoutModal();
});

messageComposeForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const subject = messageComposeSubject?.value.trim();
  const body = messageComposeBody?.value.trim();
  const sharedState = getState();
  const clientId = resolveClientId(sharedState, state.clientId);

  if (!subject || !body || !clientId) {
    return;
  }

  sendClientMessage({
    clientId,
    title: subject,
    body,
    source: 'App',
  });

  if (messageComposeForm instanceof HTMLFormElement) {
    messageComposeForm.reset();
  }

  state.section = 'messages';
  state.contextKey = 'messages-sent';
  renderApp();
});

supportChatTrigger?.addEventListener('click', (event) => {
  event.preventDefault();
  window.alert(
    'El chat personalizado se abre desde Mensajes > Enviar mensaje para resolver dudas entre revisiones.',
  );
});

exerciseList?.addEventListener('click', (event) => {
  const videoButton = event.target?.closest?.('[data-video-url]');
  if (!videoButton) {
    return;
  }

  const videoUrl = videoButton.dataset.videoUrl;
  const videoTitle = videoButton.dataset.videoTitle || 'Vídeo del ejercicio';

  if (!videoUrl) {
    return;
  }

  renderVideoModal(videoTitle, videoUrl);
});

exerciseList?.addEventListener('change', (event) => {
  const checkInput = event.target?.closest?.('[data-exercise-check]');
  if (checkInput instanceof HTMLInputElement) {
    const key = buildExerciseDraftKey(
      checkInput.dataset.exerciseCheck,
      state.dayKey,
      state.clientId,
    );
    state.exerciseChecks[key] = checkInput.checked;
    return;
  }

  const noteInput = event.target?.closest?.('[data-exercise-note]');
  if (noteInput instanceof HTMLTextAreaElement) {
    const key = buildExerciseDraftKey(
      noteInput.dataset.exerciseNote,
      state.dayKey,
      state.clientId,
    );
    state.exerciseNotes[key] = noteInput.value;
  }
});

exerciseList?.addEventListener('input', (event) => {
  const noteInput = event.target?.closest?.('[data-exercise-note]');
  if (!(noteInput instanceof HTMLTextAreaElement)) {
    return;
  }

  const key = buildExerciseDraftKey(
    noteInput.dataset.exerciseNote,
    state.dayKey,
    state.clientId,
  );
  state.exerciseNotes[key] = noteInput.value;
});

profilePhotosGallery?.addEventListener('change', (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const slot = input.dataset.photoUpload;
  const file = input.files?.[0];
  if (!slot || !file || !state.clientId) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      return;
    }

    updateClientPendingPhoto(state.clientId, slot, reader.result);
  };
  reader.readAsDataURL(file);
});

workoutModalRoot?.addEventListener('click', (event) => {
  const feedbackButton = event.target?.closest?.('[data-workout-feedback]');
  if (feedbackButton) {
    const feedback = feedbackButton.dataset.workoutFeedback;
    closeWorkoutModal();
    if (feedback) {
      buildWorkoutReport(feedback);
    }
    return;
  }

  if (event.target?.matches?.('[data-close-workout-modal]')) {
    closeWorkoutModal();
    return;
  }

  if (event.target === workoutModalRoot) {
    closeWorkoutModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !workoutModalRoot?.hidden) {
    closeWorkoutModal();
  }
});

function renderApp() {
  const sharedState = getState();
  state.clientId = resolveClientId(sharedState, state.clientId);

  const client = getClientById(sharedState, state.clientId);
  if (!client) {
    return;
  }

  const assignment = getClientRoutineAssignment(sharedState, state.clientId);
  if (!DAY_ORDER.includes(state.dayKey)) {
    state.dayKey = DAY_ORDER[0];
  }

  if (state.section === 'routines') {
    state.contextKey = state.dayKey;
  } else if (!getContextOption(state.section, state.contextKey)) {
    state.contextKey = getDefaultContextKey(state.section);
  }

  studentName.textContent = client.name;
  studentPlan.textContent = client.plan;
  studentSummary.textContent = client.summary;
  studentClientChip.textContent = client.name;

  renderDemoBanner();
  updateSectionNavigation();
  updateTopCopy();
  renderContextNav();
  renderRoutine(client, assignment);
  renderMessages(client);
  renderSubscription(client);
  renderProfile(client);
  renderProfilePhotos(client);
  syncUrlState();
}

function updateSectionNavigation() {
  sideLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.section === state.section);
  });

  sectionPanels.forEach((panel) => {
    panel.classList.toggle(
      'is-active',
      panel.dataset.sectionPanel === state.section,
    );
  });
}

function updateTopCopy() {
  const titles = {
    routines: 'Rutinas del alumno',
    messages: 'Mensajes',
    subscription: 'Suscripción',
    profile: 'Perfil',
  };

  topbarTitle.textContent = titles[state.section] || 'Saulo Fitness APP';
}

function renderContextNav() {
  const options = contextOptionsBySection[state.section] ?? [];
  if (!contextNav || !options.length) {
    return;
  }

  contextNav.innerHTML = options
    .map(
      (option) => `
        <button
          class="context-chip ${option.key === state.contextKey ? 'is-active' : ''}"
          data-context-key="${escapeHtml(option.key)}"
        >
          ${escapeHtml(option.label)}
        </button>
      `,
    )
    .join('');

  [...contextNav.querySelectorAll('[data-context-key]')].forEach((button) => {
    button.addEventListener('click', () => {
      const nextKey = button.dataset.contextKey;
      const nextOption = options.find((option) => option.key === nextKey);

      if (!nextOption) {
        return;
      }

      if (nextOption.type === 'day') {
        state.section = 'routines';
        state.dayKey = nextOption.dayKey;
        state.contextKey = nextOption.key;
        renderApp();
        return;
      }

      state.contextKey = nextOption.key;
      renderApp();
    });
  });
}

function renderRoutine(client, assignment) {
  const emptyDay = {
    title: 'Sin rutina asignada',
    meta: 'Pendiente de entrenador',
    exercises: [],
  };
  const currentDay =
    assignment?.days?.[state.dayKey] ||
    assignment?.days?.[DAY_ORDER[0]] ||
    emptyDay;

  routineDayLabel.textContent = getDayLabel(state.dayKey);
  routineDayTitle.textContent = currentDay.title || client.plan;
  routineDayMeta.textContent = currentDay.meta || 'Rutina activa';

  if (!currentDay.exercises.length) {
    exerciseList.innerHTML = `
      <article class="exercise-card">
        <div class="exercise-top">
          <div>
            <p class="brand-kicker">Pendiente</p>
            <h5>Sin ejercicios asignados</h5>
            <p class="exercise-video-note">El entrenador todavía no ha enviado una rutina para este día.</p>
          </div>
        </div>
      </article>
    `;
    completeWorkoutButton.disabled = true;
    return;
  }

  completeWorkoutButton.disabled = false;

  exerciseList.innerHTML = currentDay.exercises
    .map(
      (exercise, index) => `
        <article class="exercise-card" data-exercise-name="${escapeHtml(exercise.name)}">
          <div class="exercise-top">
            <div>
              <p class="brand-kicker">Ejercicio ${index + 1}</p>
              <h5>${escapeHtml(exercise.name)}</h5>
              ${
                exercise.videoUrl
                  ? '<p class="exercise-video-note">Video disponible en este ejercicio</p>'
                  : ''
              }
            </div>
            <button
              class="exercise-video ${exercise.videoUrl ? 'is-clickable' : ''}"
              type="button"
              ${exercise.videoUrl ? `data-video-url="${escapeHtml(exercise.videoUrl)}" data-video-title="${escapeHtml(exercise.name)}"` : 'disabled aria-disabled="true"'}
            >
              <img
                class="exercise-video-image"
                src="${getExerciseThumbnailSrc(exercise.name, currentDay.title)}"
                alt="Vista previa del ejercicio ${escapeHtml(exercise.name)}"
              />
              <div class="exercise-video-overlay" aria-hidden="true">
                ${
                  exercise.videoUrl
                    ? '<span class="exercise-video-status">Video disponible</span>'
                    : ''
                }
                <span class="exercise-video-play"></span>
                <span class="exercise-video-label">Ver vídeo</span>
              </div>
            </button>
          </div>

          <div class="exercise-spec-grid">
            <div class="exercise-spec">
              Series
              <strong>${escapeHtml(exercise.series)}</strong>
            </div>
            <div class="exercise-spec">
              Repeticiones
              <strong>${escapeHtml(exercise.reps)}</strong>
            </div>
            <div class="exercise-spec">
              Carga / progreso
              <strong>${escapeHtml(exercise.load)}</strong>
            </div>
          </div>

          <label class="exercise-check">
            <input
              class="exercise-check-input"
              type="checkbox"
              data-exercise-check="${escapeHtml(exercise.name)}"
              ${isExerciseChecked(exercise.name) ? 'checked' : ''}
            />
            <span class="exercise-check-box" aria-hidden="true"></span>
            <span class="exercise-check-label">Hecho</span>
          </label>

          <textarea
            class="exercise-comment"
            data-exercise-note="${escapeHtml(exercise.name)}"
            placeholder="Comentario de este ejercicio para guardarlo al finalizar..."
          >${escapeHtml(getExistingComment(exercise.name))}</textarea>
        </article>
      `,
    )
    .join('');
}

function renderMessages(client) {
  const panelMap = {
    'messages-inbox': {
      container: messagesInbox,
      items: client.messages.inbox,
    },
    'messages-sent': {
      container: messagesSent,
      items: client.messages.sent,
    },
    'messages-reminders': {
      container: messagesReminders,
      items: client.messages.reminders,
    },
    'messages-compose': {
      container: null,
      items: [],
    },
  };

  const activeKey =
    state.section === 'messages' ? state.contextKey : 'messages-inbox';

  messagePanels.forEach((panel) => {
    panel.hidden = panel.dataset.messagePanel !== activeKey;
  });

  const activePanel = panelMap[activeKey] ?? panelMap['messages-inbox'];
  if (activePanel?.container) {
    renderMessageList(activePanel.container, activePanel.items);
  }
}

function renderMessageList(container, items) {
  container.innerHTML = items
    .map(
      (item) => `
        <article class="message-item ${getMessageVariantClass(item.direction)}">
          <div class="message-item-top">
            <span>${escapeHtml(item.title)}</span>
            <time>${escapeHtml(formatMessageDate(item.createdAt))}</time>
          </div>
          <strong>${escapeHtml(getMessageBadge(item.direction))}</strong>
          <p>${escapeHtml(item.body)}</p>
        </article>
      `,
    )
    .join('');
}

function renderSubscription(client) {
  subscriptionStatusValue.textContent = 'Membresía activa';
  subscriptionStatusCopy.textContent =
    'Acceso completo a rutina, mensajes y seguimiento.';
  subscriptionEndValue.textContent = formatDateIso(client.subscriptionEnd);
  planEndValue.textContent = formatDateIso(client.planEnd);
}

function renderProfile(client) {
  profileAgeValue.textContent = client.age;
  profileWeightValue.textContent = client.weight;
  profileGoalValue.textContent = client.goal;
  profileNoteTitle.textContent = 'Adherencia alta con feedback rápido';
  profileNoteCopy.textContent = client.profileNote;
}

function renderProfilePhotos(client) {
  const uploads = client.photos.pendingUploads;
  const history = client.photos.history?.[0];

  profilePhotosGallery.innerHTML = `
    <article class="photo-history-card">
      <div class="photo-history-top">
        <div>
          <p class="brand-kicker">Próximo registro</p>
          <h4>${escapeHtml(formatDateIso(client.photos.nextDueDate))}</h4>
        </div>
        <span class="section-badge">4 fotos requeridas</span>
      </div>
      <p class="photo-history-copy">
        Sube izquierda, derecha, frente y espalda. El entrenador verá estas fotos en tu ficha.
      </p>
      <div class="photo-grid photo-grid-upload">
        ${['Izquierda', 'Derecha', 'Frente', 'Espalda']
          .map(
            (label) => `
              <label class="photo-upload-slot">
                <input
                  class="photo-upload-input"
                  type="file"
                  accept="image/*"
                  data-photo-upload="${escapeHtml(label)}"
                />
                ${
                  uploads[label]
                    ? `
                      <img
                        class="photo-upload-preview"
                        src="${uploads[label]}"
                        alt="Foto subida de ${escapeHtml(label)}"
                      />
                    `
                    : `
                      <div class="photo-upload-placeholder" aria-hidden="true"></div>
                    `
                }
                <div class="photo-upload-overlay">
                  <span class="photo-upload-button">Subir foto</span>
                </div>
                <span class="photo-upload-caption">${escapeHtml(label)}</span>
              </label>
            `,
          )
          .join('')}
      </div>
    </article>
    <article class="photo-history-card">
      <div class="photo-history-top">
        <div>
          <p class="brand-kicker">${escapeHtml(history?.monthLabel || 'Junio 2026')}</p>
          <h4>${escapeHtml(history?.title || `${client.name} · Seguimiento mensual`)}</h4>
        </div>
        <span class="section-badge">4 fotos subidas</span>
      </div>
      <p class="photo-history-copy">
        ${escapeHtml(
          history?.description ||
            'Histórico mensual sincronizado con el panel del entrenador.',
        )}
      </p>
      <div class="photo-grid">
        ${(history?.shots || [])
          .map(
            (photo) => `
              <figure class="photo-shot">
                <img
                  src="${getProgressPhotoSrc(photo.label, photo.tone, photo.src)}"
                  alt="Foto de progreso ${escapeHtml(photo.label)} de ${escapeHtml(client.name)}"
                />
                <figcaption>${escapeHtml(photo.label)}</figcaption>
              </figure>
            `,
          )
          .join('')}
      </div>
    </article>
  `;
}

function renderWorkoutModal() {
  workoutModalRoot.hidden = false;
  workoutModalRoot.innerHTML = `
    <div class="workout-modal" role="dialog" aria-modal="true" aria-labelledby="workout-modal-title">
      <button class="workout-modal-close" type="button" data-close-workout-modal aria-label="Cerrar">
        ×
      </button>
      <p class="brand-kicker">Rutina completada</p>
      <h3 id="workout-modal-title">¿Qué tal fue la rutina?</h3>
      <p>Elige cómo te ha ido para enviarlo al entrenador y guardarlo en tus mensajes enviados.</p>
      <div class="workout-modal-actions">
        <button class="complete-button" type="button" data-workout-feedback="Bien">
          Bien
        </button>
        <button class="complete-button" type="button" data-workout-feedback="Regular">
          Regular
        </button>
        <button class="complete-button" type="button" data-workout-feedback="Intensa">
          Intensa
        </button>
      </div>
    </div>
  `;
}

function renderVideoModal(title, videoUrl) {
  const embedUrl = getYoutubeEmbedUrl(videoUrl);
  if (!embedUrl) {
    window.alert('No se pudo abrir este vídeo.');
    return;
  }

  workoutModalRoot.hidden = false;
  workoutModalRoot.innerHTML = `
    <div class="workout-modal workout-modal-video" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
      <button class="workout-modal-close" type="button" data-close-workout-modal aria-label="Cerrar">
        ×
      </button>
      <p class="brand-kicker">Vídeo del ejercicio</p>
      <h3 id="video-modal-title">${escapeHtml(title)}</h3>
      <div class="video-frame">
        <iframe
          src="${escapeHtml(embedUrl)}"
          title="${escapeHtml(title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
    </div>
  `;
}

function closeWorkoutModal() {
  workoutModalRoot.hidden = true;
  workoutModalRoot.innerHTML = '';
}

function buildWorkoutReport(feedback) {
  const sharedState = getState();
  const client = getClientById(sharedState, state.clientId);
  const assignment = getClientRoutineAssignment(sharedState, state.clientId);
  const currentDay = assignment?.days?.[state.dayKey] ||
    assignment?.days?.[DAY_ORDER[0]] || { title: client?.plan || 'Rutina' };

  const exerciseCards = [
    ...exerciseList.querySelectorAll('[data-exercise-name]'),
  ];
  const notes = exerciseCards.map((card) => {
    const name = card.dataset.exerciseName;
    const textarea = card.querySelector('textarea');
    const comment = textarea ? textarea.value.trim() : '';
    const done = isExerciseChecked(name);
    return {
      name,
      done,
      comment: comment || 'Sin comentario',
    };
  });

  if (!client) {
    return;
  }

  recordWorkoutReport({
    clientId: client.id,
    body: `${getDayLabel(state.dayKey)} · ${currentDay.title} · ${feedback}. ${notes
      .map(
        (item) =>
          `${item.name} (${item.done ? 'hecho' : 'pendiente'}): ${item.comment}`,
      )
      .join(' | ')}`,
  });

  state.section = 'messages';
  state.contextKey = 'messages-sent';
  renderApp();
}

function renderDemoBanner() {
  if (state.demoToken !== '101') {
    demoBanner.hidden = true;
    demoBanner.textContent = '';
    return;
  }

  demoBanner.hidden = false;
  demoBanner.innerHTML = `
    <strong>Hola Saulo, listo para revisar tu app?</strong>
    <p>1. Revisa rutinas, mensajes, suscripción y perfil. 2. Comprueba la experiencia completa del alumno. 3. Valida el seguimiento desde el panel del entrenador.</p>
  `;
}

function buildExerciseDraftKey(exerciseName, dayKey, clientId) {
  return `${clientId || 'client'}:${dayKey}:${exerciseName}`;
}

function getExistingComment(exerciseName) {
  return (
    state.exerciseNotes[
      buildExerciseDraftKey(exerciseName, state.dayKey, state.clientId)
    ] || ''
  );
}

function isExerciseChecked(exerciseName) {
  return (
    state.exerciseChecks[
      buildExerciseDraftKey(exerciseName, state.dayKey, state.clientId)
    ] === true
  );
}

function getMessageVariantClass(direction) {
  if (direction === 'sent') {
    return 'message-item-sent';
  }

  if (direction === 'reminder') {
    return 'message-item-reminder';
  }

  return 'message-item-received';
}

function getMessageBadge(direction) {
  if (direction === 'sent') {
    return 'Enviado';
  }

  if (direction === 'reminder') {
    return 'Recordatorio';
  }

  return 'Recibido';
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get('section');
  const requestedDay = params.get('day');
  const requestedDemo = params.get('demo');
  const requestedClaim = params.get('claim');
  const requestedFocus = params.get('focus');
  const requestedClient = params.get('client');
  const validSections = new Set([
    'routines',
    'messages',
    'subscription',
    'profile',
  ]);

  if (requestedSection && validSections.has(requestedSection)) {
    state.section = requestedSection;
  }

  state.dayKey = resolveDayKey(requestedDay);
  state.contextKey =
    state.section === 'routines' ? state.dayKey : 'messages-inbox';

  if (requestedDemo) {
    state.demoToken = requestedDemo;
  }

  if (requestedClaim === '1') {
    state.claimRequested = true;
  }

  if (requestedFocus) {
    state.contextKey = requestedFocus;
  }

  if (requestedClient) {
    state.clientId = requestedClient;
  }
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set('section', state.section);
  params.set('client', state.clientId);

  if (state.section === 'routines') {
    params.set('day', state.dayKey);
  } else {
    params.delete('day');
  }

  if (state.contextKey) {
    params.set('focus', state.contextKey);
  } else {
    params.delete('focus');
  }

  if (state.demoToken) {
    params.set('demo', state.demoToken);
  } else {
    params.delete('demo');
  }

  if (state.claimRequested) {
    params.set('claim', '1');
  } else {
    params.delete('claim');
  }

  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}?${params.toString()}`,
  );
}

function getDefaultContextKey(section) {
  return contextOptionsBySection[section]?.[0]?.key || null;
}

function getContextOption(section, key) {
  return contextOptionsBySection[section]?.find((option) => option.key === key);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/app/sw.js?v=saulo-v6', {
      scope: './',
      updateViaCache: 'none',
    });
  } catch (error) {
    console.error('No se pudo registrar el service worker', error);
  }
}

function getYoutubeEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      const shortsMatch = parsedUrl.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }

      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch (error) {
    console.warn('No se pudo obtener el vídeo de YouTube', error);
  }

  return null;
}
