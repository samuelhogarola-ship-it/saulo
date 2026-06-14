const studentProfile = {
  name: 'Lucía Ortega',
  plan: 'Definición',
  age: '31 años',
  weight: '63,4 kg',
  goal: 'Bajar grasa y mantener fuerza',
};

const batteryByDay = {
  1: { level: 84, label: 'Alta', note: 'Solo tú marcas tus límites.' },
  2: { level: 42, label: 'Media', note: 'Recupera para volver más fuerte.' },
  3: { level: 88, label: 'Alta', note: 'Hoy vas un paso más allá.' },
  4: { level: 36, label: 'Media', note: 'Sigue sumando con calma.' },
  5: { level: 92, label: 'Muy alta', note: 'Hoy toca apretar de verdad.' },
  6: { level: 32, label: 'Media', note: 'Mueve el cuerpo y respira.' },
  7: { level: 24, label: 'Baja', note: 'Descansa y vuelve con hambre.' },
};

const routinesByDay = {
  1: {
    label: 'Día 1',
    title: 'Pierna + glúteo',
    meta: 'Activa · Ganancia muscular',
    exercises: [
      {
        name: 'Hip thrust',
        video: 'Ver vídeo',
        videoUrl: 'https://www.youtube.com/shorts/rVMsqygXtG4',
        reps: '4 x 10',
        load: '75%',
        rest: '90 s',
      },
      {
        name: 'Sentadilla búlgara',
        video: 'Sin vídeo',
        reps: '3 x 12',
        load: '14 kg',
        rest: '75 s',
      },
      {
        name: 'Peso muerto rumano',
        video: 'Sin vídeo',
        reps: '4 x 8',
        load: '70%',
        rest: '90 s',
      },
    ],
  },
  2: {
    label: 'Día 2',
    title: 'Descanso activo',
    meta: 'Recuperación · Cardio ligero',
    exercises: [
      {
        name: 'Caminata rápida',
        video: 'Sin vídeo',
        reps: '25 min',
        load: 'Z2',
        rest: 'Continuo',
      },
      {
        name: 'Movilidad de cadera',
        video: 'Sin vídeo',
        reps: '8 min',
        load: 'Suave',
        rest: 'Continuo',
      },
    ],
  },
  3: {
    label: 'Día 3',
    title: 'Espalda + bíceps',
    meta: 'Activa · Ganancia muscular',
    exercises: [
      {
        name: 'Jalón al pecho',
        video: 'Sin vídeo',
        reps: '4 x 10',
        load: '68%',
        rest: '90 s',
      },
      {
        name: 'Remo con mancuerna',
        video: 'Sin vídeo',
        reps: '3 x 12',
        load: '22 kg',
        rest: '75 s',
      },
      {
        name: 'Curl inclinado',
        video: 'Sin vídeo',
        reps: '3 x 15',
        load: '10 kg',
        rest: '60 s',
      },
    ],
  },
  4: {
    label: 'Día 4',
    title: 'Descanso activo',
    meta: 'Recuperación · Cardio ligero',
    exercises: [
      {
        name: 'Bicicleta ligera',
        video: 'Sin vídeo',
        reps: '20 min',
        load: 'Suave',
        rest: 'Continuo',
      },
      {
        name: 'Movilidad torácica',
        video: 'Sin vídeo',
        reps: '6 min',
        load: 'Suave',
        rest: 'Continuo',
      },
    ],
  },
  5: {
    label: 'Día 5',
    title: 'Push + core',
    meta: 'Activa · Ganancia muscular',
    exercises: [
      {
        name: 'Press inclinado',
        video: 'Sin vídeo',
        reps: '4 x 8',
        load: '72%',
        rest: '120 s',
      },
      {
        name: 'Press militar',
        video: 'Sin vídeo',
        reps: '3 x 10',
        load: '24 kg',
        rest: '90 s',
      },
    ],
  },
  6: {
    label: 'Día 6',
    title: 'Descanso activo',
    meta: 'Recuperación · Cardio ligero',
    exercises: [
      {
        name: 'Paseo suave',
        video: 'Sin vídeo',
        reps: '30 min',
        load: 'Muy suave',
        rest: 'Continuo',
      },
      {
        name: 'Movilidad de hombro',
        video: 'Sin vídeo',
        reps: '8 min',
        load: 'Suave',
        rest: 'Continuo',
      },
    ],
  },
  7: {
    label: 'Día 7',
    title: 'Descanso activo',
    meta: 'Recuperación · Cardio ligero',
    exercises: [
      {
        name: 'Cardio suave',
        video: 'Sin vídeo',
        reps: '20 min',
        load: 'Suave',
        rest: 'Continuo',
      },
      {
        name: 'Respiración',
        video: 'Sin vídeo',
        reps: '5 min',
        load: 'Control',
        rest: 'Continuo',
      },
    ],
  },
};

const state = {
  section: 'routines',
  day: 1,
  report: null,
  demoToken: null,
  claimRequested: false,
  contextKey: 'day-1',
  exerciseChecks: {},
  profileUploads: {},
  activation: null,
  messages: {
    inbox: [
      {
        title: 'Coach Saulo',
        tag: 'Recibido',
        date: 'Hoy · 08:45',
        source: 'Email',
        body: 'Esta semana treinaste muito duro. Lembra-te de descansar e hidratar-te bem nos dias de descanso ativo.',
      },
      {
        title: 'Coach Saulo',
        tag: 'Recibido',
        date: 'Ayer · 19:10',
        source: 'Email',
        body: 'Esta semana vamos procurar mais controlo técnico. Mantém o foco, dorme bem e aproveita os dias leves para recuperar sem perder ritmo.',
      },
    ],
    sent: [
      {
        title: 'Consulta nutrición',
        tag: 'Enviado',
        date: 'Ayer · 20:15',
        source: 'Email',
        body: 'Pregunté si mover carbohidratos al pre-entreno.',
      },
    ],
    reminders: [
      {
        title: 'Check-in semanal',
        tag: 'Recordatorio',
        date: 'Martes · 09:00',
        source: 'App',
        body: 'Sube peso, sensaciones y 4 fotos de progreso.',
      },
      {
        title: 'Renovación próxima',
        tag: 'Recordatorio',
        date: 'Viernes · 18:00',
        source: 'App',
        body: 'Tu plan actual finaliza el 30 de junio de 2026.',
      },
    ],
  },
};

const demoBanner = document.querySelector('#demo-banner');
const topbarTitle = document.querySelector('#topbar-title');
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
const CHATBASE_SCRIPT_ID = 'h_f0xkPpXu0hX4aU1cNkQ';
const ACTIVATION_STORAGE_PREFIX = 'saulo-activation:';
const ACTIVATION_UNLOCK_PREFIX = 'saulo-activation-unlocked:';
let chatbaseLoaderPromise = null;
let supportChatRequested = false;
const profilePhotosGallery = document.querySelector('#profile-photos-gallery');

const contextOptionsBySection = {
  routines: [
    { key: 'day-1', label: 'Día 1', type: 'day', day: 1 },
    { key: 'day-3', label: 'Día 3', type: 'day', day: 3 },
    { key: 'day-5', label: 'Día 5', type: 'day', day: 5 },
    { key: 'day-2', label: 'Día 2', type: 'day', day: 2 },
    { key: 'day-4', label: 'Día 4', type: 'day', day: 4 },
    { key: 'day-6', label: 'Día 6', type: 'day', day: 6 },
    { key: 'day-7', label: 'Día 7', type: 'day', day: 7 },
  ],
  messages: [
    {
      key: 'messages-inbox',
      label: 'Buzón de entrada',
      type: 'anchor',
      target: '#messages-inbox-panel',
    },
    {
      key: 'messages-sent',
      label: 'Enviados',
      type: 'anchor',
      target: '#messages-sent-panel',
    },
    {
      key: 'messages-reminders',
      label: 'Recordatorios',
      type: 'anchor',
      target: '#messages-reminders-panel',
    },
    {
      key: 'messages-compose',
      label: 'Enviar mensaje',
      type: 'anchor',
      target: '#messages-compose-panel',
    },
  ],
  subscription: [
    {
      key: 'subscription-start',
      label: 'Inicio',
      type: 'anchor',
      target: '#subscription-start-card',
    },
    {
      key: 'subscription-plan',
      label: 'Plan 30 días',
      type: 'anchor',
      target: '#subscription-plan-card',
    },
    {
      key: 'subscription-end',
      label: 'Fin',
      type: 'anchor',
      target: '#subscription-end-card',
    },
  ],
  profile: [
    {
      key: 'profile-age',
      label: 'Edad',
      type: 'anchor',
      target: '#profile-age-card',
    },
    {
      key: 'profile-weight',
      label: 'Peso',
      type: 'anchor',
      target: '#profile-weight-card',
    },
    {
      key: 'profile-goal',
      label: 'Objetivo',
      type: 'anchor',
      target: '#profile-goal-card',
    },
    {
      key: 'profile-photos',
      label: 'Fotos',
      type: 'anchor',
      target: '#profile-photos-card',
    },
  ],
};

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

  if (!subject || !body) {
    return;
  }

  state.messages.sent.unshift({
    title: subject,
    tag: 'Enviado',
    date: 'Ahora',
    source: 'App',
    body,
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
  supportChatRequested = true;
  openSupportChat();
});

hydrateStateFromUrl();
initializeActivationState();
registerServiceWorker();
renderApp();

function renderApp() {
  studentName.textContent = studentProfile.name;
  studentPlan.textContent = studentProfile.plan;
  renderStudentBattery();

  renderDemoBanner();
  updateSectionNavigation();
  updateTopCopy();
  renderContextNav();
  renderRoutine();
  renderMessages();
  renderProfilePhotos();
  syncChatbaseVisibility();
  renderActivationGate();
  syncUrlState();
}

function initializeActivationState() {
  if (!state.demoToken) {
    state.demoToken = getStoredActivationToken();
  }

  if (!state.demoToken) {
    state.activation = null;
    return;
  }

  const storedActivation = loadStoredActivation(state.demoToken);

  if (state.claimRequested && !storedActivation) {
    state.activation = {
      mode: 'claim',
      token: state.demoToken,
      error: '',
      busy: false,
    };
    return;
  }

  if (storedActivation && !isActivationUnlocked(state.demoToken)) {
    state.activation = {
      mode: 'unlock',
      token: state.demoToken,
      error: '',
      busy: false,
      claimedAt: storedActivation.claimedAt,
    };
    state.claimRequested = false;
    return;
  }

  state.activation = null;
  state.claimRequested = false;
}

function renderActivationGate() {
  if (!workoutModalRoot) {
    return;
  }

  if (!state.activation) {
    if (workoutModalRoot.dataset.modalType === 'activation') {
      workoutModalRoot.hidden = true;
      workoutModalRoot.innerHTML = '';
      delete workoutModalRoot.dataset.modalType;
    }
    return;
  }

  const isClaimMode = state.activation.mode === 'claim';
  const title = isClaimMode
    ? 'Activa tu acceso en este dispositivo'
    : 'Introduce tu PIN para continuar';
  const copy = isClaimMode
    ? 'Este enlace solo puede usarse una vez. Crea un PIN de 4 dígitos para dejar la app lista en tu teléfono.'
    : 'La app ya está activada en este dispositivo. Introduce tu PIN de 4 dígitos para acceder.';
  const buttonLabel = state.activation.busy
    ? isClaimMode
      ? 'Activando...'
      : 'Comprobando...'
    : isClaimMode
      ? 'Activar app'
      : 'Entrar con PIN';

  workoutModalRoot.hidden = false;
  workoutModalRoot.dataset.modalType = 'activation';
  workoutModalRoot.innerHTML = `
    <div class="workout-modal activation-modal" role="dialog" aria-modal="true" aria-labelledby="activation-modal-title">
      <p class="brand-kicker">Saulo Fitness APP</p>
      <h3 id="activation-modal-title">${title}</h3>
      <p>${copy}</p>
      ${
        state.activation.claimedAt
          ? `<p class="activation-status">Activada el ${escapeHtml(formatActivationDate(state.activation.claimedAt))}</p>`
          : ''
      }
      ${
        state.activation.error
          ? `<p class="activation-status activation-status-error">${escapeHtml(state.activation.error)}</p>`
          : ''
      }
      <form class="activation-form" data-activation-form>
        <label class="activation-label" for="activation-pin-input">
          PIN de 4 dígitos
        </label>
        <input
          id="activation-pin-input"
          class="activation-pin-input"
          name="pin"
          type="password"
          inputmode="numeric"
          pattern="[0-9]{4}"
          maxlength="4"
          autocomplete="one-time-code"
          placeholder="1234"
          ${state.activation.busy ? 'disabled' : ''}
          required
        />
        <button class="complete-button" type="submit" ${state.activation.busy ? 'disabled' : ''}>
          ${buttonLabel}
        </button>
      </form>
    </div>
  `;
}

workoutModalRoot?.addEventListener('submit', async (event) => {
  const activationForm = event.target?.closest?.('[data-activation-form]');

  if (!(activationForm instanceof HTMLFormElement)) {
    return;
  }

  event.preventDefault();

  const formData = new FormData(activationForm);
  const pin = String(formData.get('pin') || '').trim();

  await submitActivationPin(pin);
});

async function submitActivationPin(pin) {
  if (!state.activation || !state.demoToken) {
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    state.activation.error = 'El PIN debe tener exactamente 4 dígitos.';
    renderActivationGate();
    return;
  }

  state.activation.busy = true;
  state.activation.error = '';
  renderActivationGate();

  const endpoint =
    state.activation.mode === 'claim'
      ? `/api/demo-links/${encodeURIComponent(state.demoToken)}/claim`
      : `/api/demo-links/${encodeURIComponent(state.demoToken)}/unlock`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'No se pudo completar la operación.');
    }

    saveStoredActivation(state.demoToken, {
      token: state.demoToken,
      claimedAt: payload.claimedAt,
    });
    markActivationUnlocked(state.demoToken);
    state.activation = null;
    state.claimRequested = false;
    renderApp();
  } catch (error) {
    state.activation.busy = false;
    state.activation.error =
      error instanceof Error ? error.message : 'No se pudo validar el PIN.';
    renderActivationGate();
  }
}

async function openSupportChat() {
  try {
    await ensureChatbaseLoaded();
    window.chatbase('open');
  } catch (error) {
    console.warn('No se pudo abrir Chatbase', error);
    window.alert('El chat se está cargando. Prueba de nuevo en unos segundos.');
  }
}

function renderStudentBattery() {
  const battery = batteryByDay[state.day] ?? batteryByDay[1];

  studentSummary.textContent = battery.note;
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

  topbarTitle.textContent = titles[state.section];
}

function renderContextNav() {
  const options = contextOptionsBySection[state.section] ?? [];

  if (!contextNav || !options.length) {
    return;
  }

  if (state.section === 'routines') {
    state.contextKey = `day-${state.day}`;
  } else if (!options.some((option) => option.key === state.contextKey)) {
    state.contextKey = options[0].key;
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
        state.day = nextOption.day;
        state.contextKey = nextOption.key;
        renderApp();
        return;
      }

      state.contextKey = nextOption.key;
      renderApp();

      if (nextOption.target) {
        window.requestAnimationFrame(() => {
          document.querySelector(nextOption.target)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      }
    });
  });
}

function renderRoutine() {
  const routine = routinesByDay[state.day];

  routineDayLabel.textContent = routine.label;
  routineDayTitle.textContent = routine.title;
  routineDayMeta.textContent = routine.meta;

  exerciseList.innerHTML = routine.exercises
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
                src="${getExerciseThumbnailSrc(exercise.name, routine.title)}"
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
              Repeticiones
              <strong>${escapeHtml(exercise.reps)}</strong>
            </div>
            <div class="exercise-spec">
              Peso / %
              <strong>${escapeHtml(exercise.load)}</strong>
            </div>
            <div class="exercise-spec">
              Descanso
              <strong>${escapeHtml(exercise.rest)}</strong>
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
            placeholder="Comentario de este ejercicio para guardarlo al finalizar..."
          >${getExistingComment(exercise.name)}</textarea>
        </article>
      `,
    )
    .join('');
}

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

  if (!(checkInput instanceof HTMLInputElement)) {
    return;
  }

  setExerciseChecked(checkInput.dataset.exerciseCheck, checkInput.checked);
});

function getExerciseThumbnailSrc(exerciseName, routineTitle) {
  const theme = getExerciseThumbnailTheme(exerciseName);
  const safeExerciseName = escapeHtml(exerciseName);
  const safeRoutineTitle = escapeHtml(routineTitle);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img" aria-label="${safeExerciseName}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111114" />
          <stop offset="55%" stop-color="#1a1a20" />
          <stop offset="100%" stop-color="#060608" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="${theme.glowSecondary}" stop-opacity="0.15" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="24" fill="url(#bg)" />
      <circle cx="74" cy="54" r="58" fill="url(#glow)" opacity="0.55" />
      <circle cx="262" cy="34" r="40" fill="${theme.glowSecondary}" opacity="0.16" />
      <rect x="0" y="138" width="320" height="42" fill="#0c0c0f" />
      <rect x="22" y="138" width="276" height="2" fill="rgba(255,255,255,0.08)" />
      ${theme.scene}
      <rect x="18" y="18" width="112" height="24" rx="12" fill="rgba(255,255,255,0.08)" />
      <text x="32" y="34" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeRoutineTitle}</text>
      <rect x="18" y="146" width="158" height="20" rx="10" fill="rgba(255,255,255,0.08)" />
      <text x="30" y="160" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeExerciseName}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getExerciseThumbnailTheme(exerciseName) {
  const name = exerciseName.toLowerCase();

  if (
    name.includes('sentadilla') ||
    name.includes('hip thrust') ||
    name.includes('peso muerto')
  ) {
    return {
      glow: '#7c4dff',
      glowSecondary: '#ffffff',
      scene: `
        <rect x="198" y="64" width="6" height="70" rx="3" fill="#2b2b31" />
        <rect x="118" y="102" width="104" height="6" rx="3" fill="#d8d8de" />
        <rect x="104" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
        <rect x="224" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
        <circle cx="152" cy="74" r="12" fill="#f3d7c4" />
        <rect x="144" y="86" width="20" height="28" rx="10" fill="#1d4ed8" />
        <rect x="133" y="92" width="16" height="10" rx="5" fill="#f3d7c4" />
        <rect x="159" y="92" width="26" height="8" rx="4" fill="#f3d7c4" />
        <rect x="146" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
        <rect x="157" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
      `,
    };
  }

  if (
    name.includes('jalón') ||
    name.includes('remo') ||
    name.includes('curl')
  ) {
    return {
      glow: '#8b5cf6',
      glowSecondary: '#60a5fa',
      scene: `
        <rect x="214" y="34" width="8" height="102" rx="4" fill="#2d2d34" />
        <rect x="196" y="46" width="44" height="6" rx="3" fill="#4a4a53" />
        <rect x="214" y="52" width="2" height="24" fill="#b9b9c5" />
        <rect x="206" y="76" width="18" height="4" rx="2" fill="#d9d9e0" />
        <circle cx="140" cy="72" r="12" fill="#f3d7c4" />
        <rect x="132" y="84" width="20" height="30" rx="10" fill="#2563eb" />
        <rect x="144" y="114" width="8" height="24" rx="4" fill="#f3d7c4" />
        <rect x="156" y="90" width="36" height="8" rx="4" fill="#f3d7c4" />
        <rect x="131" y="95" width="18" height="8" rx="4" fill="#f3d7c4" />
      `,
    };
  }

  if (name.includes('press')) {
    return {
      glow: '#6d28d9',
      glowSecondary: '#93c5fd',
      scene: `
        <rect x="92" y="112" width="120" height="8" rx="4" fill="#3c3c45" />
        <rect x="110" y="96" width="48" height="12" rx="6" fill="#4f4f58" />
        <rect x="126" y="90" width="84" height="6" rx="3" fill="#dadbe1" />
        <rect x="116" y="84" width="12" height="18" rx="4" fill="#61616c" />
        <rect x="210" y="84" width="12" height="18" rx="4" fill="#61616c" />
        <circle cx="150" cy="74" r="11" fill="#f3d7c4" />
        <rect x="142" y="84" width="20" height="22" rx="10" fill="#2563eb" />
        <rect x="135" y="93" width="16" height="8" rx="4" fill="#f3d7c4" />
        <rect x="160" y="93" width="18" height="8" rx="4" fill="#f3d7c4" />
      `,
    };
  }

  return {
    glow: '#7c3aed',
    glowSecondary: '#34d399',
    scene: `
      <circle cx="148" cy="74" r="12" fill="#f3d7c4" />
      <rect x="140" y="86" width="20" height="32" rx="10" fill="#2563eb" />
      <rect x="129" y="92" width="16" height="8" rx="4" fill="#f3d7c4" />
      <rect x="156" y="92" width="18" height="8" rx="4" fill="#f3d7c4" />
      <rect x="144" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
      <rect x="154" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
      <rect x="196" y="92" width="44" height="8" rx="4" fill="#3f3f47" />
      <rect x="84" y="104" width="50" height="8" rx="4" fill="#3f3f47" />
    `,
  };
}

function renderWorkoutModal() {
  if (state.activation) {
    return;
  }

  if (!workoutModalRoot) {
    return;
  }

  workoutModalRoot.hidden = false;
  workoutModalRoot.innerHTML = `
    <div class="workout-modal" role="dialog" aria-modal="true" aria-labelledby="workout-modal-title">
      <button class="workout-modal-close" type="button" data-close-workout-modal aria-label="Cerrar">
        ×
      </button>
      <p class="brand-kicker">Rutina completada</p>
      <h3 id="workout-modal-title">¿Qué tal fue la rutina?</h3>
      <p>Elige cómo te ha ido para dejarlo registrado en el informe de la demo.</p>
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
  if (state.activation) {
    return;
  }

  if (!workoutModalRoot) {
    return;
  }

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
  if (!workoutModalRoot) {
    return;
  }

  if (state.activation) {
    renderActivationGate();
    return;
  }

  workoutModalRoot.hidden = true;
  workoutModalRoot.innerHTML = '';
}

function buildWorkoutReport(feedback) {
  const activeRoutine = routinesByDay[state.day];
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

  state.report = {
    title: 'Resumen de entrenamiento',
    meta: `${activeRoutine.title} · ${feedback.toLowerCase()}`,
    notes,
  };

  state.messages.sent.unshift({
    title: 'Resumen de entrenamiento',
    tag: 'Enviado',
    date: getSentMessageDate(),
    source: 'App',
    body: `${activeRoutine.label} · ${activeRoutine.title} · ${feedback}. ${notes
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
  if (!demoBanner) {
    return;
  }

  if (state.demoToken !== '101') {
    demoBanner.hidden = true;
    demoBanner.textContent = '';
    return;
  }

  demoBanner.hidden = false;
  demoBanner.innerHTML = `
    <strong>Hola Saulo, listo para comprobar la primera demo?</strong>
    <p>1. Mira las opciones disponibles. 2. Revisa Rutinas, Suscripcion y Perfil. 3. Comprueba el funcionamiento como lo veria tu cliente.</p>
  `;
}

workoutModalRoot?.addEventListener('click', (event) => {
  if (state.activation) {
    return;
  }

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
  if (state.activation) {
    return;
  }

  if (event.key === 'Escape' && !workoutModalRoot?.hidden) {
    closeWorkoutModal();
  }
});

function renderMessages() {
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

function renderProfilePhotos() {
  if (!profilePhotosGallery) {
    return;
  }

  const monthlyPhotos = [
    { label: 'Izquierda', tone: 'side-left' },
    { label: 'Derecha', tone: 'side-right' },
    { label: 'Frente', tone: 'front' },
    { label: 'Espalda', tone: 'back' },
  ];

  profilePhotosGallery.innerHTML = `
    <article class="photo-history-card">
      <div class="photo-history-top">
        <div>
          <p class="brand-kicker">Próximo registro</p>
          <h4>30 de julio de 2026</h4>
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
                  getUploadedPhotoSrc(photo.label)
                    ? `
                      <img
                        class="photo-upload-preview"
                        src="${getUploadedPhotoSrc(photo.label)}"
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

    <article class="photo-history-card">
      <div class="photo-history-top">
        <div>
          <p class="brand-kicker">Junio 2026</p>
          <h4>Lucía Ortega · Seguimiento mensual</h4>
        </div>
        <span class="section-badge">4 fotos subidas</span>
      </div>
      <p class="photo-history-copy">
        Registro ficticio del 30 de junio de 2026 para comparar definición y postura.
      </p>
      <div class="photo-grid">
        ${monthlyPhotos
          .map(
            (photo) => `
              <figure class="photo-shot">
                <img
                  src="${getProgressPhotoSrc(photo.label, photo.tone)}"
                  alt="Foto de progreso ${escapeHtml(photo.label)} de Lucía Ortega"
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
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      return;
    }

    state.profileUploads[slot] = reader.result;
    renderProfilePhotos();
  };
  reader.readAsDataURL(file);
});

function syncChatbaseVisibility() {
  const shouldShowChat =
    state.section === 'messages' &&
    state.contextKey === 'messages-compose' &&
    supportChatRequested;

  if (!shouldShowChat) {
    supportChatRequested = false;
  }

  if (!shouldShowChat && typeof window.chatbase === 'function') {
    try {
      window.chatbase('close');
    } catch (error) {
      console.warn('No se pudo cerrar Chatbase', error);
    }
  }

  getChatbaseNodes().forEach((node) => {
    if (!node) {
      return;
    }

    node.style.display = shouldShowChat ? '' : 'none';
    node.style.visibility = shouldShowChat ? 'visible' : 'hidden';
    node.style.pointerEvents = shouldShowChat ? 'auto' : 'none';
  });
}

function getChatbaseNodes() {
  return [
    ...document.querySelectorAll(
      [
        '#chatbase-bubble-button',
        '#chatbase-bubble-window',
        '#chatbase-message-bubbles',
        '[data-chatbase-bubble-button]',
        '[data-chatbase-bubble-window]',
        'iframe[src*="chatbase"]',
        '[id^="chatbase-"]',
      ].join(', '),
    ),
  ];
}

function ensureChatbaseLoaded() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Chatbase no está disponible.'));
  }

  if (typeof window.chatbase === 'function') {
    try {
      if (window.chatbase('getState') === 'initialized') {
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('Estado de Chatbase no disponible todavía', error);
    }
  }

  if (chatbaseLoaderPromise) {
    return chatbaseLoaderPromise;
  }

  if (
    !window.chatbase ||
    (typeof window.chatbase === 'function' &&
      window.chatbase('getState') !== 'initialized')
  ) {
    window.chatbase = (...arguments) => {
      if (!window.chatbase.q) {
        window.chatbase.q = [];
      }
      window.chatbase.q.push(arguments);
    };
    window.chatbase = new Proxy(window.chatbase, {
      get(target, prop) {
        if (prop === 'q') {
          return target.q;
        }
        return (...args) => target(prop, ...args);
      },
    });
  }

  chatbaseLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(CHATBASE_SCRIPT_ID);

    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.id = CHATBASE_SCRIPT_ID;
    script.domain = 'www.chatbase.co';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Chatbase.'));
    document.body.appendChild(script);
  });

  return chatbaseLoaderPromise;
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

function getUploadedPhotoSrc(label) {
  return state.profileUploads[label] ?? '';
}

function getStoredActivationToken() {
  try {
    const key = Object.keys(window.localStorage).find((entry) =>
      entry.startsWith(ACTIVATION_STORAGE_PREFIX),
    );

    return key ? key.replace(ACTIVATION_STORAGE_PREFIX, '') : null;
  } catch (error) {
    console.warn('No se pudo leer la activación guardada', error);
    return null;
  }
}

function loadStoredActivation(token) {
  try {
    const raw = window.localStorage.getItem(
      `${ACTIVATION_STORAGE_PREFIX}${token}`,
    );

    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('No se pudo cargar la activación guardada', error);
    return null;
  }
}

function saveStoredActivation(token, payload) {
  try {
    window.localStorage.setItem(
      `${ACTIVATION_STORAGE_PREFIX}${token}`,
      JSON.stringify(payload),
    );
  } catch (error) {
    console.warn('No se pudo guardar la activación', error);
  }
}

function markActivationUnlocked(token) {
  try {
    window.sessionStorage.setItem(`${ACTIVATION_UNLOCK_PREFIX}${token}`, '1');
  } catch (error) {
    console.warn('No se pudo guardar la sesión activa', error);
  }
}

function isActivationUnlocked(token) {
  try {
    return (
      window.sessionStorage.getItem(`${ACTIVATION_UNLOCK_PREFIX}${token}`) ===
      '1'
    );
  } catch (error) {
    console.warn('No se pudo leer la sesión activa', error);
    return false;
  }
}

function formatActivationDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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

function getExistingComment(exerciseName) {
  if (!state.report) {
    return '';
  }

  const previousNote = state.report.notes.find(
    (note) => note.name === exerciseName,
  );
  return previousNote ? previousNote.comment : '';
}

function getExerciseCheckKey(exerciseName) {
  return `${state.day}:${exerciseName}`;
}

function isExerciseChecked(exerciseName) {
  return state.exerciseChecks[getExerciseCheckKey(exerciseName)] === true;
}

function setExerciseChecked(exerciseName, checked) {
  if (!exerciseName) {
    return;
  }

  state.exerciseChecks[getExerciseCheckKey(exerciseName)] = checked;
}

function getSentMessageDate() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `Hoy · ${hours}:${minutes}`;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => registration.scope.includes('/app/'))
        .map((registration) => registration.unregister()),
    );

    if ('caches' in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith('saulo-fitness-demo-'))
          .map((key) => window.caches.delete(key)),
      );
    }
  } catch (error) {
    console.error('No se pudo limpiar el service worker', error);
  }
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get('section');
  const requestedDay = Number(params.get('day'));
  const requestedDemo = params.get('demo');
  const requestedClaim = params.get('claim');
  const requestedFocus = params.get('focus');
  const validSections = new Set([
    'routines',
    'messages',
    'subscription',
    'profile',
  ]);

  if (requestedSection && validSections.has(requestedSection)) {
    state.section = requestedSection;
  }

  if (Number.isInteger(requestedDay) && routinesByDay[requestedDay]) {
    state.day = requestedDay;
  }

  if (requestedDemo) {
    state.demoToken = requestedDemo;
  }

  if (requestedClaim === '1') {
    state.claimRequested = true;
  }

  if (requestedFocus) {
    state.contextKey = requestedFocus;
  }

  if (state.section === 'routines') {
    state.contextKey = `day-${state.day}`;
  } else if (!getContextOption(state.section, state.contextKey)) {
    state.contextKey = getDefaultContextKey(state.section);
  }
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set('section', state.section);
  if (state.section === 'routines') {
    params.set('day', String(state.day));
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
  return contextOptionsBySection[section]?.[0]?.key ?? null;
}

function getContextOption(section, key) {
  return contextOptionsBySection[section]?.find((option) => option.key === key);
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

    return null;
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
