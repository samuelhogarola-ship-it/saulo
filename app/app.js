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
        video: 'Sin vídeo',
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
        body: 'Mantén el tempo en hip thrust y sube comentario al terminar.',
      },
      {
        title: 'Coach Saulo',
        tag: 'Recibido',
        date: 'Ayer · 19:10',
        source: 'Email',
        body: 'Muy bien la adherencia. Esta semana buscamos más control técnico.',
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
const heroTitle = document.querySelector('#hero-title');
const heroCopy = document.querySelector('#hero-copy');
const heroStatGrid = document.querySelector('#hero-stat-grid');
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
const summaryEmpty = document.querySelector('#summary-empty');
const summaryReport = document.querySelector('#summary-report');
const workoutModalRoot = document.querySelector('#workout-modal-root');
const messagesInbox = document.querySelector('#messages-inbox');
const messagesSent = document.querySelector('#messages-sent');
const messagesReminders = document.querySelector('#messages-reminders');

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
  renderSummaryReport();
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

  const heroTitles = {
    routines: 'Toca un día y revisa lo que verá tu cliente.',
    messages: 'Mensajes limpios, directos y sin ruido.',
    subscription: 'Estado claro y fechas visibles sin ruido.',
    profile: 'Mide tu progreso.',
  };

  const heroCopies = {
    routines:
      'La demo enseña solo lo que marcas: rutina activa, recuperación y seguimiento básico.',
    messages:
      'Los mensajes se revisan martes y viernes de cada semana. Mientras tanto, resuelve dudas con nuestro chat.',
    subscription: 'Membresía y plan quedan claros de un vistazo.',
    profile: 'Edad, peso y objetivo visibles en limpio.',
  };

  topbarTitle.textContent = titles[state.section];
  heroTitle.textContent = heroTitles[state.section];
  if (heroCopy) {
    heroCopy.hidden = state.section === 'profile';
    heroCopy.textContent = heroCopies[state.section];
  }
  if (heroStatGrid) {
    if (state.section === 'profile') {
      heroStatGrid.hidden = false;
      heroStatGrid.innerHTML = `
        <article class="profile-calendar" id="profile-calendar">
          <div class="profile-calendar-head">
            <span>Calendario</span>
            <strong>Junio 2026</strong>
          </div>
          <div class="profile-calendar-grid" aria-label="Calendario de progreso">
            <span class="calendar-day">L</span>
            <span class="calendar-day">M</span>
            <span class="calendar-day">X</span>
            <span class="calendar-day">J</span>
            <span class="calendar-day">V</span>
            <span class="calendar-day">S</span>
            <span class="calendar-day">D</span>
            <span class="calendar-day">1</span>
            <span class="calendar-day">2</span>
            <span class="calendar-day is-complete">3</span>
            <span class="calendar-day">4</span>
            <span class="calendar-day is-complete">5</span>
            <span class="calendar-day is-complete">6</span>
            <span class="calendar-day">7</span>
            <span class="calendar-day is-today">8</span>
            <span class="calendar-day">9</span>
            <span class="calendar-day is-missed">10 ×</span>
            <span class="calendar-day">11</span>
            <span class="calendar-day">12</span>
            <span class="calendar-day">13</span>
            <span class="calendar-day">14</span>
          </div>
          <p>Hoy en verde. El día marcado en rojo es el que toca recuperar.</p>
        </article>
      `;
      return;
    }

    heroStatGrid.hidden = false;
    heroStatGrid.innerHTML = `
      <article class="hero-stat">
        <span>Entrenos semana</span>
        <strong>4/5</strong>
      </article>
      <article class="hero-stat">
        <span>Próximo check-in</span>
        <strong>Mañana</strong>
      </article>
      <article class="hero-stat">
        <span>Membresía activa</span>
        <strong>Hasta 30 Jun</strong>
      </article>
    `;
  }
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
            </div>
            <div class="exercise-video">${escapeHtml(exercise.video)}</div>
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

function renderSummaryReport() {
  if (!state.report) {
    summaryEmpty.hidden = false;
    summaryReport.hidden = true;
    summaryReport.innerHTML = '';
    return;
  }

  summaryEmpty.hidden = true;
  summaryReport.hidden = false;
  summaryReport.innerHTML = `
    <h5>${escapeHtml(state.report.title)}</h5>
    <p>${escapeHtml(state.report.meta)}</p>
    <ul>
      ${state.report.notes
        .map(
          (note) =>
            `<li><strong>${escapeHtml(note.name)}:</strong> ${escapeHtml(note.comment)}</li>`,
        )
        .join('')}
    </ul>
  `;
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
    title: `${activeRoutine.label} finalizado`,
    meta: `${activeRoutine.title} · ${feedback.toLowerCase()}`,
    notes,
  };

  state.messages.sent.unshift({
    title: `Informe ${activeRoutine.label}`,
    meta: 'Enviado ahora',
    body: notes.map((item) => `${item.name}: ${item.comment}`).join(' | '),
  });

  state.section = 'routines';
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
  }
});

function renderMessages() {
  renderMessageList(messagesInbox, state.messages.inbox);
  renderMessageList(messagesSent, state.messages.sent);
  renderMessageList(messagesReminders, state.messages.reminders);
}

function renderMessageList(container, items) {
  container.innerHTML = items
    .map(
      (item) => `
        <article class="message-item">
          <div class="message-item-top">
            <span>${escapeHtml(item.tag)}</span>
            <time>${escapeHtml(item.date)}</time>
          </div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.body)}</p>
          <div class="message-item-bottom">${escapeHtml(item.source)}</div>
        </article>
      `,
    )
    .join('');
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
