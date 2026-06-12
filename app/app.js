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
  contextKey: 'day-1',
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

  if (typeof window.chatbase === 'function') {
    try {
      window.chatbase('open');
      return;
    } catch (error) {
      console.warn('No se pudo abrir Chatbase', error);
    }
  }

  window.alert('El chat se está cargando. Prueba de nuevo en unos segundos.');
});

hydrateStateFromUrl();
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
  syncUrlState();
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
    return {
      name,
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
      .map((item) => `${item.name}: ${item.comment}`)
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

function syncChatbaseVisibility() {
  const shouldShowChat = state.section === 'messages';
  const bubbleButton = document.querySelector('#chatbase-bubble-button');
  const bubbleWindow = document.querySelector('#chatbase-bubble-window');

  if (!shouldShowChat && typeof window.chatbase === 'function') {
    try {
      window.chatbase('close');
    } catch (error) {
      console.warn('No se pudo cerrar Chatbase', error);
    }
  }

  [bubbleButton, bubbleWindow].forEach((node) => {
    if (!node) {
      return;
    }

    node.style.display = shouldShowChat ? '' : 'none';
    node.style.visibility = shouldShowChat ? 'visible' : 'hidden';
    node.style.pointerEvents = shouldShowChat ? 'auto' : 'none';
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
    <ellipse cx="110" cy="248" rx="42" ry="10" fill="rgba(17,17,20,0.18)" />
    <circle cx="110" cy="86" r="24" fill="#f1cdb8" />
    <rect x="90" y="110" width="40" height="70" rx="20" fill="#1a1a1f" />
    <rect x="94" y="114" width="32" height="64" rx="16" fill="#5b2cff" />
    <rect x="82" y="118" width="14" height="58" rx="7" fill="#f1cdb8" />
    <rect x="124" y="118" width="14" height="58" rx="7" fill="#f1cdb8" />
    <rect x="96" y="178" width="13" height="58" rx="7" fill="#f1cdb8" />
    <rect x="111" y="178" width="13" height="58" rx="7" fill="#f1cdb8" />
  `;

  if (tone === 'side-left') {
    return `
      <ellipse cx="110" cy="70" rx="18" ry="8" fill="#1b1b1f" opacity="0.35" />
      <circle cx="104" cy="86" r="24" fill="#f1cdb8" />
      <rect x="92" y="110" width="34" height="70" rx="17" fill="#5b2cff" />
      <rect x="122" y="122" width="12" height="52" rx="6" fill="#f1cdb8" />
      <rect x="99" y="178" width="12" height="58" rx="6" fill="#f1cdb8" />
      <rect x="113" y="178" width="12" height="58" rx="6" fill="#f1cdb8" />
      <rect x="88" y="118" width="12" height="54" rx="6" fill="#f1cdb8" />
    `;
  }

  if (tone === 'side-right') {
    return `
      <ellipse cx="110" cy="70" rx="18" ry="8" fill="#1b1b1f" opacity="0.35" />
      <circle cx="116" cy="86" r="24" fill="#f1cdb8" />
      <rect x="94" y="110" width="34" height="70" rx="17" fill="#5b2cff" />
      <rect x="86" y="122" width="12" height="52" rx="6" fill="#f1cdb8" />
      <rect x="97" y="178" width="12" height="58" rx="6" fill="#f1cdb8" />
      <rect x="111" y="178" width="12" height="58" rx="6" fill="#f1cdb8" />
      <rect x="122" y="118" width="12" height="54" rx="6" fill="#f1cdb8" />
    `;
  }

  if (tone === 'back') {
    return `
      <ellipse cx="110" cy="70" rx="18" ry="8" fill="#1b1b1f" opacity="0.35" />
      <circle cx="110" cy="86" r="24" fill="#d8b49e" />
      <rect x="90" y="110" width="40" height="70" rx="20" fill="#4320c7" />
      <rect x="82" y="118" width="14" height="58" rx="7" fill="#d8b49e" />
      <rect x="124" y="118" width="14" height="58" rx="7" fill="#d8b49e" />
      <rect x="96" y="178" width="13" height="58" rx="7" fill="#d8b49e" />
      <rect x="111" y="178" width="13" height="58" rx="7" fill="#d8b49e" />
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
    await navigator.serviceWorker.register('./sw.js?v=saulo-v3', {
      scope: './',
      updateViaCache: 'none',
    });
  } catch (error) {
    console.error('No se pudo registrar el service worker', error);
  }
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get('section');
  const requestedDay = Number(params.get('day'));
  const requestedDemo = params.get('demo');
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
