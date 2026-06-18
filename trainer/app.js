const {
  DAY_ORDER,
  assignRoutineToClient,
  createEmptyWeek,
  escapeHtml,
  formatDateIso,
  formatMessageDate,
  getClientById,
  getClientRoutineAssignment,
  getDayLabel,
  getExerciseThumbnailSrc,
  getProgressPhotoSrc,
  getRoutineTemplateById,
  getState,
  getTrainerMessageBuckets,
  resetStore,
  resolveClientId,
  saveRoutineTemplate,
  sendTrainerMessage,
  subscribe,
  updateClientProfile,
} = window.SauloDemoStore;

const state = {
  section: 'exercises',
  activeClientId: null,
  clientDetailId: null,
  builderInitialized: false,
  builderTemplateId: null,
  builderName: '',
  builderClientId: null,
  builderTargetDay: 'monday',
  builderDays: createEmptyWeek(),
  exerciseSearch: '',
  muscleFilter: 'all',
  equipmentFilter: 'all',
  difficultyFilter: 'all',
  routineSearch: '',
  routineFilterClientId: 'all',
  routineFilterType: 'all',
  messageFilterClientId: 'all',
  messageContextKey: 'trainer-messages-inbox',
  isMobileBuilderOpen: false,
  draggingExerciseId: null,
  activeExerciseMenuId: null,
};

const sectionTitleMap = {
  clients: 'Clientes',
  exercises: 'Ejercicios',
  routines: 'Rutinas',
  messages: 'Mensajes',
  settings: 'Ajustes',
};

const navLinks = [...document.querySelectorAll('.trainer-nav-link')];
const sectionPanels = [...document.querySelectorAll('[data-section-panel]')];
const topbarTitle = document.querySelector('#trainer-topbar-title');
const activeClientPill = document.querySelector('#trainer-active-client-pill');
const clientsList = document.querySelector('#clients-list');
const clientDetailName = document.querySelector('#client-detail-name');
const clientDetailPlan = document.querySelector('#client-detail-plan');
const clientWeightInput = document.querySelector('#client-weight-input');
const clientHeightInput = document.querySelector('#client-height-input');
const clientSubscriptionInput = document.querySelector(
  '#client-subscription-input',
);
const clientPlanEndInput = document.querySelector('#client-plan-end-input');
const clientGoalInput = document.querySelector('#client-goal-input');
const clientSummaryInput = document.querySelector('#client-summary-input');
const clientNoteInput = document.querySelector('#client-note-input');
const clientActiveRoutineName = document.querySelector(
  '#client-active-routine-name',
);
const clientActiveRoutineCopy = document.querySelector(
  '#client-active-routine-copy',
);
const clientMessageSummary = document.querySelector('#client-message-summary');
const clientPhotosGrid = document.querySelector('#client-photos-grid');
const exerciseSearchInput = document.querySelector('#exercise-search-input');
const exerciseFilterMuscle = document.querySelector('#exercise-filter-muscle');
const exerciseFilterEquipment = document.querySelector(
  '#exercise-filter-equipment',
);
const exerciseFilterDifficulty = document.querySelector(
  '#exercise-filter-difficulty',
);
const builderDayTabs = document.querySelector('#builder-day-tabs');
const exerciseGrid = document.querySelector('#exercise-grid');
const routineBuilderPanel = document.querySelector('#routine-builder-panel');
const builderRoutineName = document.querySelector('#builder-routine-name');
const builderClientSelect = document.querySelector('#builder-client-select');
const builderTargetTitle = document.querySelector('#builder-target-title');
const builderTargetCopy = document.querySelector('#builder-target-copy');
const routineBuilderDays = document.querySelector('#routine-builder-days');
const newRoutineButton = document.querySelector('#new-routine-button');
const saveRoutineButton = document.querySelector('#save-routine-button');
const sendRoutineButton = document.querySelector('#send-routine-button');
const routineTemplateGrid = document.querySelector('#routine-template-grid');
const routineSearchInput = document.querySelector('#routine-search-input');
const routineFilterClient = document.querySelector('#routine-filter-client');
const routineFilterType = document.querySelector('#routine-filter-type');
const trainerMessageFilter = document.querySelector('#trainer-message-filter');
const trainerMessageContextNav = document.querySelector(
  '#trainer-message-context-nav',
);
const trainerMessageForm = document.querySelector('#trainer-message-form');
const trainerMessageClient = document.querySelector('#trainer-message-client');
const trainerMessageSubject = document.querySelector(
  '#trainer-message-subject',
);
const trainerMessageBody = document.querySelector('#trainer-message-body');
const trainerMessagesInbox = document.querySelector('#trainer-messages-inbox');
const trainerMessagesSent = document.querySelector('#trainer-messages-sent');
const trainerMessagesReminders = document.querySelector(
  '#trainer-messages-reminders',
);
const trainerMessagePanels = [
  ...document.querySelectorAll('[data-trainer-message-panel]'),
];
const trainerNameValue = document.querySelector('#trainer-name-value');
const trainerEmailValue = document.querySelector('#trainer-email-value');
const resetDemoButton = document.querySelector('#reset-demo-button');
const mobileBuilderToggle = document.querySelector('#mobile-builder-toggle');
const mobileBuilderToggleTitle = document.querySelector(
  '#mobile-builder-toggle-title',
);
const mobileBuilderToggleMeta = document.querySelector(
  '#mobile-builder-toggle-meta',
);
const mobileBuilderSheetTitle = document.querySelector(
  '#mobile-builder-sheet-title',
);
const mobileBuilderBackdrop = document.querySelector(
  '#mobile-builder-backdrop',
);

const thumbnailThemeByExerciseId = {
  'ex-goblet-squat': 'goblet',
  'ex-bench': 'bench',
  'ex-rdl': 'romanian',
  'ex-leg-press': 'romanian',
  'ex-bulgarian': 'goblet',
  'ex-step-up': 'goblet',
  'ex-hip-thrust': 'bench',
  'ex-lat-pulldown': 'bench',
  'ex-dumbbell-row': 'romanian',
  'ex-overhead-press': 'goblet',
  'ex-incline-curl': 'bench',
  'ex-plank': 'bench',
  'ex-lateral-raise': 'goblet',
  'ex-triceps-rope': 'romanian',
  'ex-ab-wheel': 'bench',
  'ex-face-pull': 'romanian',
};

const trainerMessageContextOptions = [
  {
    key: 'trainer-messages-inbox',
    label: 'Recibidos',
  },
  {
    key: 'trainer-messages-sent',
    label: 'Enviados',
  },
  {
    key: 'trainer-messages-reminders',
    label: 'Recordatorios',
  },
  {
    key: 'trainer-messages-compose',
    label: 'Enviar mensaje',
  },
];

hydrateStateFromUrl();
registerTrainerServiceWorker();
subscribe(() => {
  renderApp();
});

navLinks.forEach((button) => {
  button.addEventListener('click', () => {
    const nextSection = button.dataset.section;
    if (!nextSection) {
      return;
    }

    state.section = nextSection;
    renderApp();
  });
});

exerciseSearchInput?.addEventListener('input', (event) => {
  state.exerciseSearch = event.target.value;
  renderExerciseLibrary(getState());
});

exerciseFilterMuscle?.addEventListener('change', (event) => {
  state.muscleFilter = event.target.value;
  renderExerciseLibrary(getState());
});

exerciseFilterEquipment?.addEventListener('change', (event) => {
  state.equipmentFilter = event.target.value;
  renderExerciseLibrary(getState());
});

exerciseFilterDifficulty?.addEventListener('change', (event) => {
  state.difficultyFilter = event.target.value;
  renderExerciseLibrary(getState());
});

builderRoutineName?.addEventListener('input', (event) => {
  state.builderName = event.target.value;
});

builderClientSelect?.addEventListener('change', (event) => {
  state.builderClientId = event.target.value;
  renderMobileBuilderSummary(getState());
});

builderDayTabs?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-target-day]');
  if (!target) {
    return;
  }

  state.builderTargetDay = target.dataset.targetDay;
  renderExerciseLibrary(getState());
});

exerciseGrid?.addEventListener('click', (event) => {
  const dayOption = event.target.closest('[data-add-exercise-day]');
  if (dayOption) {
    const sharedState = getState();
    const exercise = sharedState.exerciseLibrary.find(
      (item) => item.id === dayOption.dataset.addExerciseDay,
    );
    if (!exercise) {
      return;
    }

    addExerciseToBuilder(exercise, dayOption.dataset.dayTarget);
    state.activeExerciseMenuId = null;
    renderBuilder(sharedState);
    renderExerciseLibrary(sharedState);
    if (window.innerWidth <= 920) {
      state.isMobileBuilderOpen = true;
      syncMobileBuilderState();
    }
    return;
  }

  const addButton = event.target.closest('[data-add-exercise]');
  if (addButton) {
    const exerciseId = addButton.dataset.addExercise;
    state.activeExerciseMenuId =
      state.activeExerciseMenuId === exerciseId ? null : exerciseId;
    renderExerciseLibrary(getState());
    return;
  }
});

exerciseGrid?.addEventListener('dragstart', (event) => {
  const card = event.target.closest('[data-exercise-card-id]');
  if (!card) {
    return;
  }

  state.draggingExerciseId = card.dataset.exerciseCardId;
  card.classList.add('is-dragging');
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('text/plain', state.draggingExerciseId);
});

exerciseGrid?.addEventListener('dragend', (event) => {
  const card = event.target.closest('[data-exercise-card-id]');
  if (card) {
    card.classList.remove('is-dragging');
  }
  state.draggingExerciseId = null;
  clearBuilderDropTargets();
});

routineBuilderDays?.addEventListener('input', (event) => {
  const field = event.target.closest('[data-builder-field]');
  if (!(field instanceof HTMLInputElement)) {
    return;
  }

  updateBuilderRowField(
    field.dataset.dayKey,
    field.dataset.rowId,
    field.dataset.builderField,
    field.value,
  );
  renderMobileBuilderSummary(getState());
});

routineBuilderDays?.addEventListener('click', (event) => {
  const toggleButton = event.target.closest('[data-toggle-day]');
  if (toggleButton) {
    state.builderTargetDay = toggleButton.dataset.toggleDay;
    renderBuilder(getState());
    return;
  }

  const removeButton = event.target.closest('[data-remove-row]');
  if (!removeButton) {
    return;
  }

  removeBuilderRow(removeButton.dataset.dayKey, removeButton.dataset.removeRow);
  renderBuilder(getState());
  renderMobileBuilderSummary(getState());
});

routineBuilderDays?.addEventListener('dragover', (event) => {
  const dayCard = event.target.closest('[data-day-key]');
  if (!dayCard || !state.draggingExerciseId) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  clearBuilderDropTargets();
  dayCard.classList.add('is-drop-target');
});

routineBuilderDays?.addEventListener('dragleave', (event) => {
  const dayCard = event.target.closest('[data-day-key]');
  if (!dayCard) {
    return;
  }

  if (dayCard.contains(event.relatedTarget)) {
    return;
  }

  dayCard.classList.remove('is-drop-target');
});

routineBuilderDays?.addEventListener('drop', (event) => {
  const dayCard = event.target.closest('[data-day-key]');
  if (!dayCard) {
    return;
  }

  event.preventDefault();
  const exerciseId =
    state.draggingExerciseId || event.dataTransfer.getData('text/plain');
  const sharedState = getState();
  const exercise = sharedState.exerciseLibrary.find(
    (item) => item.id === exerciseId,
  );
  clearBuilderDropTargets();

  if (!exercise) {
    return;
  }

  state.builderTargetDay = dayCard.dataset.dayKey;
  addExerciseToBuilder(exercise, state.builderTargetDay);
  renderBuilder(sharedState);
});

saveRoutineButton?.addEventListener('click', () => {
  const result = saveRoutineTemplate({
    templateId: state.builderTemplateId,
    name: getBuilderName(),
    days: state.builderDays,
    status: 'draft',
  });

  state.builderTemplateId = result.templateId;
  state.builderInitialized = true;
  state.section = 'routines';
  state.isMobileBuilderOpen = false;
  renderApp();
});

newRoutineButton?.addEventListener('click', () => {
  state.builderTemplateId = null;
  state.builderName = 'Nueva rutina semanal';
  state.builderDays = createEmptyWeek();
  state.builderTargetDay = 'monday';
  state.builderInitialized = true;
  state.isMobileBuilderOpen = true;
  renderApp();
});

sendRoutineButton?.addEventListener('click', () => {
  const sharedState = getState();
  const clientId = resolveClientId(sharedState, state.builderClientId);

  const result = assignRoutineToClient({
    templateId: state.builderTemplateId,
    clientId,
    name: getBuilderName(),
    days: state.builderDays,
  });

  state.builderTemplateId = result.templateId;
  state.builderInitialized = true;
  state.activeClientId = clientId;
  state.clientDetailId = clientId;
  state.builderClientId = clientId;
  state.section = 'clients';
  state.isMobileBuilderOpen = false;
  renderApp();
});

clientsList?.addEventListener('click', (event) => {
  const clientButton = event.target.closest('[data-client-id]');
  if (!clientButton) {
    return;
  }

  const clientId = clientButton.dataset.clientId;
  state.activeClientId = clientId;
  state.clientDetailId = clientId;
  if (!state.builderInitialized) {
    state.builderClientId = clientId;
  }
  renderApp();
});

[
  clientWeightInput,
  clientHeightInput,
  clientSubscriptionInput,
  clientPlanEndInput,
  clientGoalInput,
  clientSummaryInput,
  clientNoteInput,
].forEach((field) => {
  field?.addEventListener('change', () => {
    commitClientDetailFields();
  });
});

routineTemplateGrid?.addEventListener('click', (event) => {
  const cloneButton = event.target.closest('[data-clone-template]');
  if (cloneButton) {
    cloneTemplateIntoBuilder(cloneButton.dataset.cloneTemplate);
    return;
  }

  const editButton = event.target.closest('[data-edit-template]');
  if (editButton) {
    openTemplateInBuilder(editButton.dataset.editTemplate);
    return;
  }

  const sendButton = event.target.closest('[data-send-template]');
  if (sendButton) {
    cloneTemplateIntoBuilder(sendButton.dataset.sendTemplate, true);
  }
});

routineSearchInput?.addEventListener('input', (event) => {
  state.routineSearch = event.target.value;
  renderRoutineTemplates(getState());
});

routineFilterClient?.addEventListener('change', (event) => {
  state.routineFilterClientId = event.target.value;
  renderRoutineTemplates(getState());
});

routineFilterType?.addEventListener('change', (event) => {
  state.routineFilterType = event.target.value;
  renderRoutineTemplates(getState());
});

trainerMessageFilter?.addEventListener('change', (event) => {
  state.messageFilterClientId = event.target.value;
  renderApp();
});

trainerMessageForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const clientId = trainerMessageClient.value;
  const title = trainerMessageSubject.value.trim();
  const body = trainerMessageBody.value.trim();

  if (!clientId || !title || !body) {
    return;
  }

  sendTrainerMessage({
    clientId,
    title,
    body,
    source: 'App',
  });

  trainerMessageForm.reset();
  trainerMessageClient.value = clientId;
  state.section = 'messages';
  state.messageFilterClientId = clientId;
  state.messageContextKey = 'trainer-messages-sent';
  renderApp();
});

resetDemoButton?.addEventListener('click', () => {
  const shouldReset = window.confirm(
    'Esto borrará los datos locales de este navegador y cargará de nuevo el estado inicial. ¿Quieres continuar?',
  );
  if (!shouldReset) {
    return;
  }

  resetStore();
  resetLocalBuilder();
  renderApp();
});

mobileBuilderToggle?.addEventListener('click', () => {
  state.isMobileBuilderOpen = !state.isMobileBuilderOpen;
  syncMobileBuilderState();
});

mobileBuilderBackdrop?.addEventListener('click', () => {
  state.isMobileBuilderOpen = false;
  syncMobileBuilderState();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 920 && state.isMobileBuilderOpen) {
    state.isMobileBuilderOpen = false;
  }
  syncMobileBuilderState();
});

document.addEventListener('click', (event) => {
  if (!state.activeExerciseMenuId) {
    return;
  }

  if (event.target.closest('.exercise-add-menu-shell')) {
    return;
  }

  state.activeExerciseMenuId = null;
  renderExerciseLibrary(getState());
});

function renderApp() {
  const sharedState = getState();
  const resolvedClientId = resolveClientId(sharedState, state.activeClientId);

  state.activeClientId = resolvedClientId;
  state.clientDetailId = resolveClientId(sharedState, state.clientDetailId);
  state.builderClientId = resolveClientId(sharedState, state.builderClientId);

  const activeClient = getClientById(sharedState, state.activeClientId);
  if (!activeClient) {
    return;
  }

  if (!state.builderInitialized) {
    seedBuilderFromClient(sharedState, state.builderClientId);
  } else if (
    state.builderTemplateId &&
    !getRoutineTemplateById(sharedState, state.builderTemplateId)
  ) {
    resetLocalBuilder();
    seedBuilderFromClient(sharedState, state.builderClientId);
  }

  topbarTitle.textContent =
    sectionTitleMap[state.section] || 'Panel entrenador';
  activeClientPill.textContent = 'Saulo Coach';
  trainerNameValue.textContent = sharedState.trainer.name;
  trainerEmailValue.textContent = sharedState.trainer.email;

  updateSectionNavigation();
  renderClientSelects(sharedState);
  renderClients(sharedState);
  renderClientDetail(sharedState);
  renderExerciseFilters(sharedState);
  renderExerciseLibrary(sharedState);
  renderBuilder(sharedState);
  renderRoutineTemplates(sharedState);
  renderMessages(sharedState);
  renderBuilderTargetSummary(sharedState);
  renderMobileBuilderSummary(sharedState);
  syncMobileBuilderState();
  syncUrlState();
}

function updateSectionNavigation() {
  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.section === state.section);
  });

  sectionPanels.forEach((panel) => {
    panel.classList.toggle(
      'is-active',
      panel.dataset.sectionPanel === state.section,
    );
  });
}

function renderClientSelects(sharedState) {
  const optionsMarkup = sharedState.clients
    .map(
      (client) => `
        <option value="${escapeHtml(client.id)}">${escapeHtml(client.name)}</option>
      `,
    )
    .join('');

  builderClientSelect.innerHTML = optionsMarkup;
  builderClientSelect.value = state.builderClientId;

  trainerMessageClient.innerHTML = optionsMarkup;
  trainerMessageClient.value = resolveClientId(
    sharedState,
    trainerMessageClient.value || state.activeClientId,
  );

  trainerMessageFilter.innerHTML = `
    <option value="all">Todos</option>
    ${optionsMarkup}
  `;
  trainerMessageFilter.value = state.messageFilterClientId;

  if (routineFilterClient) {
    routineFilterClient.innerHTML = `
      <option value="all">Todos</option>
      ${optionsMarkup}
    `;
    routineFilterClient.value = state.routineFilterClientId;
  }
}

function renderClients(sharedState) {
  clientsList.innerHTML = sharedState.clients
    .map((client) => {
      const assignment = getClientRoutineAssignment(sharedState, client.id);
      return `
        <button
          class="client-card ${client.id === state.clientDetailId ? 'is-active' : ''}"
          data-client-id="${escapeHtml(client.id)}"
        >
          <h4>${escapeHtml(client.name)}</h4>
          <p>${escapeHtml(client.plan)}</p>
          <p>${escapeHtml(
            assignment?.days?.monday?.title || 'Sin rutina activa',
          )}</p>
        </button>
      `;
    })
    .join('');
}

function renderClientDetail(sharedState) {
  const client = getClientById(sharedState, state.clientDetailId);
  if (!client) {
    return;
  }

  const assignment = getClientRoutineAssignment(sharedState, client.id);
  clientDetailName.textContent = client.name;
  clientDetailPlan.textContent = client.plan;
  clientWeightInput.value = client.weight;
  clientHeightInput.value = client.height;
  clientSubscriptionInput.value = client.subscriptionEnd;
  clientPlanEndInput.value = client.planEnd;
  clientGoalInput.value = client.goal;
  clientSummaryInput.value = client.summary;
  clientNoteInput.value = client.profileNote;

  clientActiveRoutineName.textContent =
    getRoutineTemplateById(sharedState, assignment?.routineTemplateId)?.name ||
    'Sin rutina activa';
  clientActiveRoutineCopy.textContent = assignment
    ? `${DAY_ORDER.length} días listos en la vista alumno.`
    : 'El alumno no tiene una asignación activa todavía.';
  clientMessageSummary.textContent = String(
    client.messages.inbox.length +
      client.messages.sent.length +
      client.messages.reminders.length,
  );

  const history = client.photos.history?.[0];
  const pendingEntries = Object.entries(client.photos.pendingUploads);
  clientPhotosGrid.innerHTML = `
    ${pendingEntries
      .map(
        ([label, src]) => `
          <figure class="client-photo-shot">
            <img
              src="${getProgressPhotoSrc(
                label,
                history?.shots?.find((item) => item.label === label)?.tone ||
                  'front',
                src,
              )}"
              alt="Foto ${escapeHtml(label)} de ${escapeHtml(client.name)}"
            />
            <figcaption>${escapeHtml(label)}</figcaption>
          </figure>
        `,
      )
      .join('')}
  `;
}

function renderExerciseFilters(sharedState) {
  renderSelectOptions(
    exerciseFilterMuscle,
    'Grupo muscular',
    sharedState.exerciseLibrary.map((item) => item.muscleGroup),
    state.muscleFilter,
  );
  renderSelectOptions(
    exerciseFilterEquipment,
    'Equipo',
    sharedState.exerciseLibrary.map((item) => item.equipment),
    state.equipmentFilter,
  );
  renderSelectOptions(
    exerciseFilterDifficulty,
    'Dificultad',
    sharedState.exerciseLibrary.map((item) => item.difficulty),
    state.difficultyFilter,
  );
}

function renderSelectOptions(select, placeholder, values, selectedValue) {
  const uniqueValues = [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, 'es'),
  );

  select.innerHTML = `
    <option value="all">${escapeHtml(placeholder)}</option>
    ${uniqueValues
      .map(
        (value) => `
          <option value="${escapeHtml(value)}">${escapeHtml(value)}</option>
        `,
      )
      .join('')}
  `;
  select.value = selectedValue;
}

function renderExerciseLibrary(sharedState) {
  const filteredExercises = sharedState.exerciseLibrary.filter((exercise) => {
    const searchValue = state.exerciseSearch.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      exercise.name.toLowerCase().includes(searchValue) ||
      exercise.muscleGroup.toLowerCase().includes(searchValue);
    const matchesMuscle =
      state.muscleFilter === 'all' ||
      exercise.muscleGroup === state.muscleFilter;
    const matchesEquipment =
      state.equipmentFilter === 'all' ||
      exercise.equipment === state.equipmentFilter;
    const matchesDifficulty =
      state.difficultyFilter === 'all' ||
      exercise.difficulty === state.difficultyFilter;

    return (
      matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty
    );
  });

  exerciseGrid.innerHTML = filteredExercises
    .map(
      (exercise) => `
        <article
          class="exercise-library-card"
          draggable="true"
          data-exercise-card-id="${escapeHtml(exercise.id)}"
        >
          <div
            class="exercise-thumb exercise-thumb-${escapeHtml(getExerciseThumbnailKey(exercise.id))}"
            role="img"
            aria-label="Vista previa de ${escapeHtml(exercise.name)}"
          ></div>
          <div>
            <h4>${escapeHtml(exercise.name)}</h4>
            <div class="exercise-library-meta">
              <span class="exercise-meta-pill">
                ${escapeHtml(exercise.muscleGroup)} ${escapeHtml(exercise.equipment)} ${escapeHtml(exercise.difficulty)}
              </span>
            </div>
          </div>
          <div class="exercise-add-menu-shell">
            <button
              class="exercise-add-button"
              type="button"
              data-add-exercise="${escapeHtml(exercise.id)}"
              aria-expanded="${state.activeExerciseMenuId === exercise.id ? 'true' : 'false'}"
              aria-label="Elegir día para ${escapeHtml(exercise.name)}"
              title="Elegir día"
            >
              +
            </button>
            ${
              state.activeExerciseMenuId === exercise.id
                ? `
                  <div class="exercise-add-menu">
                    ${DAY_ORDER.map(
                      (dayKey) => `
                        <button
                          class="exercise-add-day-option ${dayKey === state.builderTargetDay ? 'is-active' : ''}"
                          type="button"
                          data-add-exercise-day="${escapeHtml(exercise.id)}"
                          data-day-target="${escapeHtml(dayKey)}"
                        >
                          ${escapeHtml(getDayLabel(dayKey))}
                        </button>
                      `,
                    ).join('')}
                  </div>
                `
                : ''
            }
          </div>
        </article>
      `,
    )
    .join('');
}

function renderBuilderDayTabs() {
  if (!builderDayTabs) {
    return;
  }

  builderDayTabs.innerHTML = DAY_ORDER.map(
    (dayKey) => `
      <button
        class="day-target-button ${dayKey === state.builderTargetDay ? 'is-active' : ''}"
        type="button"
        data-target-day="${escapeHtml(dayKey)}"
      >
        ${escapeHtml(getDayLabel(dayKey))}
      </button>
    `,
  ).join('');
}

function renderBuilder(sharedState) {
  builderRoutineName.value = state.builderName;
  builderClientSelect.value = state.builderClientId;

  routineBuilderDays.innerHTML = DAY_ORDER.map((dayKey) => {
    const day = state.builderDays[dayKey] || createEmptyWeek()[dayKey];
    const isOpen = state.builderTargetDay === dayKey;
    const rows = day.exercises
      .map(
        (exercise) => `
          <div class="day-builder-row">
            <div class="day-builder-exercise-cell">
              <div class="day-builder-exercise">
                <div
                  class="exercise-thumb exercise-thumb-${escapeHtml(getExerciseThumbnailKey(exercise.exerciseId || exercise.id))} exercise-thumb-builder"
                  role="img"
                  aria-label="Miniatura de ${escapeHtml(exercise.name)}"
                ></div>
                <div class="day-builder-exercise-copy">
                  <h4>${escapeHtml(exercise.name)}</h4>
                  <p>${escapeHtml(exercise.muscleGroup)}</p>
                </div>
              </div>
            </div>
            <label class="builder-metric-cell">
              <span class="builder-metric-label">Series</span>
              <input
                type="text"
                value="${escapeHtml(exercise.series)}"
                data-day-key="${escapeHtml(dayKey)}"
                data-row-id="${escapeHtml(exercise.id)}"
                data-builder-field="series"
              />
            </label>
            <label class="builder-metric-cell">
              <span class="builder-metric-label">Repeticiones</span>
              <input
                type="text"
                value="${escapeHtml(exercise.reps)}"
                data-day-key="${escapeHtml(dayKey)}"
                data-row-id="${escapeHtml(exercise.id)}"
                data-builder-field="reps"
              />
            </label>
            <label class="builder-metric-cell builder-metric-cell-load">
              <span class="builder-metric-label">Carga / Progreso</span>
              <input
                type="text"
                value="${escapeHtml(exercise.load)}"
                data-day-key="${escapeHtml(dayKey)}"
                data-row-id="${escapeHtml(exercise.id)}"
                data-builder-field="load"
              />
            </label>
            <button
              class="remove-row-button"
              type="button"
              data-day-key="${escapeHtml(dayKey)}"
              data-remove-row="${escapeHtml(exercise.id)}"
            >
              ×
            </button>
          </div>
        `,
      )
      .join('');

    return `
      <article class="day-builder-card ${isOpen ? 'is-open' : ''}" data-day-key="${escapeHtml(dayKey)}">
        <button
          class="day-builder-toggle"
          type="button"
          data-toggle-day="${escapeHtml(dayKey)}"
          aria-expanded="${isOpen ? 'true' : 'false'}"
        >
          <div class="day-builder-top">
            <div>
              <h4>${escapeHtml(getDayLabel(dayKey))}</h4>
              <p class="message-client-line">${escapeHtml(day.title)}</p>
            </div>
            <div class="day-builder-meta">
              <span class="meta-chip">${day.exercises.length} ejercicios</span>
              <span class="day-builder-chevron" aria-hidden="true">${isOpen ? '−' : '+'}</span>
            </div>
          </div>
        </button>
        <div class="day-builder-body" ${isOpen ? '' : 'hidden'}>
          ${
            day.exercises.length
              ? `
                <div class="builder-columns-head" aria-hidden="true">
                  <span>Ejercicio</span>
                  <span>Series</span>
                  <span>Repeticiones</span>
                  <span>Carga / Progreso</span>
                  <span></span>
                </div>
              `
              : ''
          }
          ${
            rows ||
            '<div class="trainer-empty-state">Arrastra un ejercicio aquí o usa el + para este día.</div>'
          }
        </div>
      </article>
    `;
  }).join('');

  renderBuilderTargetSummary(sharedState);
  renderMobileBuilderSummary(sharedState);
}

function renderRoutineTemplates(sharedState) {
  if (routineSearchInput) {
    routineSearchInput.value = state.routineSearch;
  }

  if (routineFilterType) {
    routineFilterType.value = state.routineFilterType;
  }

  const searchValue = state.routineSearch.trim().toLowerCase();
  const templates = sharedState.routineTemplates
    .map((template) => buildRoutineTemplateViewModel(sharedState, template))
    .filter((item) => {
      const matchesClient =
        state.routineFilterClientId === 'all' ||
        item.clientIds.includes(state.routineFilterClientId);

      const matchesType =
        state.routineFilterType === 'all' ||
        (state.routineFilterType === 'model' && item.isModel) ||
        (state.routineFilterType === 'assigned' && !item.isModel) ||
        (state.routineFilterType === 'expiring' && item.isExpiringSoon);

      const matchesSearch =
        !searchValue || item.searchableText.includes(searchValue);

      return matchesClient && matchesType && matchesSearch;
    });

  if (!templates.length) {
    routineTemplateGrid.innerHTML =
      '<div class="trainer-empty-state routine-empty-state">No hay rutinas que coincidan con este filtro.</div>';
    return;
  }

  routineTemplateGrid.innerHTML = templates
    .map((template) => {
      return `
        <article class="routine-row">
          <div class="routine-row-main">
            <strong>${escapeHtml(template.name)}</strong>
            <p>${escapeHtml(template.totalExercisesLabel)}</p>
          </div>
          <div class="routine-row-clients">
            <strong>${escapeHtml(template.clientHeadline)}</strong>
            <p>${escapeHtml(template.clientSubline)}</p>
          </div>
          <div class="routine-row-type">
            <span class="meta-chip">${escapeHtml(template.typeLabel)}</span>
          </div>
          <div class="routine-row-date">
            ${escapeHtml(formatMessageDate(template.updatedAt))}
          </div>
          <div class="routine-row-expiry">
            <strong class="${template.isExpiringSoon ? 'routine-expiry-alert' : ''}">
              ${escapeHtml(template.expiryHeadline)}
            </strong>
            <p>${escapeHtml(template.expirySubline)}</p>
          </div>
          <div class="routine-row-actions">
            <button
              class="template-action"
              type="button"
              data-clone-template="${escapeHtml(template.id)}"
            >
              Trabajar copia
            </button>
            <button
              class="template-action"
              type="button"
              data-edit-template="${escapeHtml(template.id)}"
            >
              Editar
            </button>
            <button
              class="primary-button"
              type="button"
              data-send-template="${escapeHtml(template.id)}"
            >
              Asignar a alumno
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderMessages(sharedState) {
  renderTrainerMessageContextNav();

  const buckets = getTrainerMessageBuckets(
    sharedState,
    state.messageFilterClientId,
  );

  const panelMap = {
    'trainer-messages-inbox': {
      container: trainerMessagesInbox,
      items: buckets.inbox,
    },
    'trainer-messages-sent': {
      container: trainerMessagesSent,
      items: buckets.sent,
    },
    'trainer-messages-reminders': {
      container: trainerMessagesReminders,
      items: buckets.reminders,
    },
    'trainer-messages-compose': {
      container: null,
      items: [],
    },
  };

  const activePanel =
    panelMap[state.messageContextKey] || panelMap['trainer-messages-inbox'];

  trainerMessagePanels.forEach((panel) => {
    panel.hidden =
      panel.dataset.trainerMessagePanel !== state.messageContextKey;
  });

  if (activePanel.container) {
    activePanel.container.innerHTML = renderTrainerMessageBucket(
      activePanel.items,
    );
  }
}

function renderTrainerMessageBucket(items) {
  if (!items.length) {
    return '<div class="trainer-empty-state">No hay mensajes en esta vista.</div>';
  }

  return items
    .map(
      (item) => `
        <article class="trainer-message-item">
          <div class="trainer-message-item-top">
            <span>${escapeHtml(item.title)}</span>
            <time>${escapeHtml(formatMessageDate(item.createdAt))}</time>
          </div>
          <strong>${escapeHtml(item.clientName || 'Cliente')}</strong>
          <p class="message-client-line">${escapeHtml(item.body)}</p>
        </article>
      `,
    )
    .join('');
}

function renderTrainerMessageContextNav() {
  if (!trainerMessageContextNav) {
    return;
  }

  trainerMessageContextNav.innerHTML = trainerMessageContextOptions
    .map(
      (option) => `
        <button
          class="trainer-context-chip ${option.key === state.messageContextKey ? 'is-active' : ''}"
          type="button"
          data-trainer-message-context="${escapeHtml(option.key)}"
        >
          ${escapeHtml(option.label)}
        </button>
      `,
    )
    .join('');

  [
    ...trainerMessageContextNav.querySelectorAll(
      '[data-trainer-message-context]',
    ),
  ].forEach((button) => {
    button.addEventListener('click', () => {
      const nextKey = button.dataset.trainerMessageContext;
      if (
        !trainerMessageContextOptions.find((option) => option.key === nextKey)
      ) {
        return;
      }

      state.messageContextKey = nextKey;
      renderApp();
    });
  });
}

function buildRoutineTemplateViewModel(sharedState, template) {
  const clientIds = template.assignedClientIds || [];
  const clients = clientIds
    .map((clientId) => getClientById(sharedState, clientId))
    .filter(Boolean);
  const totalExercises = DAY_ORDER.reduce(
    (count, dayKey) =>
      count + (template.days?.[dayKey]?.exercises?.length || 0),
    0,
  );
  const muscleGroups = [
    ...new Set(
      DAY_ORDER.flatMap((dayKey) =>
        (template.days?.[dayKey]?.exercises || []).map(
          (exercise) => exercise.muscleGroup,
        ),
      ),
    ),
  ];
  const planDates = clients
    .map((client) => client.planEnd || client.subscriptionEnd)
    .filter(Boolean)
    .sort((left, right) => new Date(left) - new Date(right));
  const nextExpiry = planDates[0] || null;
  const daysUntilExpiry = nextExpiry
    ? Math.ceil((new Date(nextExpiry) - new Date()) / 86400000)
    : null;
  const isModel = !clientIds.length;
  const isExpiringSoon = nextExpiry ? daysUntilExpiry <= 10 : false;

  return {
    ...template,
    clientIds,
    isModel,
    isExpiringSoon,
    typeLabel: isModel
      ? 'Modelo'
      : template.status === 'draft'
        ? 'Borrador'
        : 'Asignada',
    totalExercisesLabel: `${totalExercises} ejercicios · ${muscleGroups.slice(0, 2).join(' · ') || 'Base general'}`,
    clientHeadline: isModel
      ? 'Rutina prototipo'
      : clients.map((client) => client.name).join(', '),
    clientSubline: isModel
      ? 'Lista para copiar y personalizar'
      : clients.map((client) => client.goal).join(' · '),
    expiryHeadline: nextExpiry ? formatDateIso(nextExpiry) : 'Sin caducidad',
    expirySubline: nextExpiry
      ? isExpiringSoon
        ? 'A punto de caducar'
        : 'Plan activo'
      : 'Prototipo reutilizable',
    searchableText: [
      template.name,
      ...clients.map((client) => client.name),
      ...clients.map((client) => client.goal),
      ...muscleGroups,
    ]
      .join(' ')
      .toLowerCase(),
  };
}

function addExerciseToBuilder(exercise, targetDayKey = state.builderTargetDay) {
  const resolvedDayKey = DAY_ORDER.includes(targetDayKey)
    ? targetDayKey
    : DAY_ORDER[0];
  const day = state.builderDays[resolvedDayKey];
  if (!day) {
    return;
  }

  state.builderTargetDay = resolvedDayKey;
  day.exercises.push({
    id: `builder-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    videoUrl: exercise.videoUrl,
    series: '3',
    reps: '10',
    load: 'Peso directo',
  });

  if (!day.title || day.title.endsWith('activo')) {
    day.title = buildDayTitleFromExercise(exercise);
  }

  if (!day.meta || day.meta === 'Rutina activa') {
    day.meta = 'Configurada por entrenador';
  }
}

function updateBuilderRowField(dayKey, rowId, field, value) {
  const row = state.builderDays[dayKey]?.exercises.find(
    (exercise) => exercise.id === rowId,
  );
  if (!row || !field) {
    return;
  }

  row[field] = value;
}

function getExerciseThumbnailKey(exerciseId) {
  return thumbnailThemeByExerciseId[exerciseId] || 'romanian';
}

function renderMobileBuilderSummary(sharedState) {
  if (
    !mobileBuilderToggleTitle ||
    !mobileBuilderToggleMeta ||
    !mobileBuilderSheetTitle
  ) {
    return;
  }

  const clientName =
    getClientById(sharedState, state.builderClientId)?.name || 'Sin cliente';
  const totalExercises = DAY_ORDER.reduce((count, dayKey) => {
    return count + (state.builderDays[dayKey]?.exercises?.length || 0);
  }, 0);

  mobileBuilderToggleTitle.textContent = state.builderName || 'Crear rutina';
  mobileBuilderToggleMeta.textContent = `${clientName} · ${totalExercises} ejercicios`;
  mobileBuilderSheetTitle.textContent = state.builderName || 'Crear rutina';
}

function renderBuilderTargetSummary(sharedState) {
  if (!builderTargetTitle || !builderTargetCopy) {
    return;
  }

  const activeDay = state.builderDays[state.builderTargetDay];
  const exerciseCount = activeDay?.exercises?.length || 0;
  const clientName =
    getClientById(sharedState, state.builderClientId)?.name || 'Sin cliente';

  builderTargetTitle.textContent = `Día activo: ${getDayLabel(state.builderTargetDay)}`;
  builderTargetCopy.textContent =
    exerciseCount > 0
      ? `${clientName} · ${exerciseCount} ejercicios en ${getDayLabel(state.builderTargetDay)}. El + y el drag & drop se envían aquí.`
      : `${clientName} · todavía no hay ejercicios en ${getDayLabel(state.builderTargetDay)}. Usa + o arrastra un vídeo.`;
}

function syncMobileBuilderState() {
  const isMobile = window.innerWidth <= 920;
  const isOpen = isMobile && state.isMobileBuilderOpen;

  document.body.classList.toggle('mobile-builder-open', isOpen);
  mobileBuilderToggle?.setAttribute('aria-expanded', String(isOpen));

  if (mobileBuilderToggle) {
    mobileBuilderToggle.hidden = !isMobile;
  }

  if (mobileBuilderBackdrop) {
    mobileBuilderBackdrop.hidden = !isOpen;
  }

  if (routineBuilderPanel) {
    routineBuilderPanel.classList.toggle('is-mobile-open', isOpen);
  }
}

function removeBuilderRow(dayKey, rowId) {
  const day = state.builderDays[dayKey];
  if (!day) {
    return;
  }

  day.exercises = day.exercises.filter((exercise) => exercise.id !== rowId);
  if (!day.exercises.length) {
    day.title = `${getDayLabel(dayKey)} activo`;
    day.meta = 'Rutina activa';
  }
}

function commitClientDetailFields() {
  if (!state.clientDetailId) {
    return;
  }

  updateClientProfile(state.clientDetailId, {
    weight: clientWeightInput.value.trim(),
    height: clientHeightInput.value.trim(),
    subscriptionEnd: clientSubscriptionInput.value,
    planEnd: clientPlanEndInput.value,
    goal: clientGoalInput.value.trim(),
    summary: clientSummaryInput.value.trim(),
    profileNote: clientNoteInput.value.trim(),
  });
}

function openTemplateInBuilder(templateId, preferSendMode) {
  const sharedState = getState();
  const template = getRoutineTemplateById(sharedState, templateId);
  if (!template) {
    return;
  }

  const preferredClientId =
    template.assignedClientIds?.[0] ||
    resolveClientId(sharedState, state.activeClientId);

  state.builderTemplateId = template.id;
  state.builderName = template.name;
  state.builderClientId = preferredClientId;
  state.builderDays = normalizeBuilderWeek(template.days);
  state.builderInitialized = true;
  state.section = 'exercises';
  if (preferSendMode) {
    state.activeClientId = preferredClientId;
    state.clientDetailId = preferredClientId;
  }
  renderApp();
}

function cloneTemplateIntoBuilder(templateId, preferStudentFlow = false) {
  const sharedState = getState();
  const template = getRoutineTemplateById(sharedState, templateId);
  if (!template) {
    return;
  }

  const preferredClientId =
    template.assignedClientIds?.[0] ||
    resolveClientId(sharedState, state.activeClientId);

  state.builderTemplateId = null;
  state.builderName = `${template.name} · copia`;
  state.builderClientId = preferredClientId;
  state.builderDays = normalizeBuilderWeek(template.days);
  state.builderInitialized = true;
  state.section = 'exercises';
  state.builderTargetDay = 'monday';
  if (preferStudentFlow) {
    state.activeClientId = preferredClientId;
    state.clientDetailId = preferredClientId;
  }
  renderApp();
}

function seedBuilderFromClient(sharedState, clientId) {
  const resolvedClientId = resolveClientId(sharedState, clientId);
  const assignment = getClientRoutineAssignment(sharedState, resolvedClientId);
  const template = getRoutineTemplateById(
    sharedState,
    assignment?.routineTemplateId,
  );

  if (template) {
    state.builderTemplateId = template.id;
    state.builderName = template.name;
    state.builderDays = normalizeBuilderWeek(template.days);
  } else {
    state.builderTemplateId = null;
    state.builderName = 'Nueva rutina semanal';
    state.builderDays = createEmptyWeek();
  }

  state.builderClientId = resolvedClientId;
  state.builderTargetDay = 'monday';
  state.builderInitialized = true;
}

function resetLocalBuilder() {
  state.builderInitialized = false;
  state.builderTemplateId = null;
  state.builderName = '';
  state.builderClientId = null;
  state.builderTargetDay = 'monday';
  state.builderDays = createEmptyWeek();
  state.messageFilterClientId = 'all';
  state.messageContextKey = 'trainer-messages-inbox';
}

function normalizeBuilderWeek(days) {
  return {
    ...createEmptyWeek(),
    ...(days ? deepClone(days) : {}),
  };
}

function buildDayTitleFromExercise(exercise) {
  const muscleGroup = exercise.muscleGroup.toLowerCase();

  if (muscleGroup.includes('pierna') || muscleGroup.includes('glúteo')) {
    return 'Pierna + glúteo';
  }

  if (muscleGroup.includes('espalda')) {
    return 'Espalda + bíceps';
  }

  if (muscleGroup.includes('pecho') || muscleGroup.includes('hombro')) {
    return 'Push + hombro';
  }

  if (muscleGroup.includes('core')) {
    return 'Core + control';
  }

  return `${exercise.muscleGroup} principal`;
}

function getBuilderName() {
  return state.builderName.trim() || 'Nueva rutina semanal';
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set('section', state.section);
  params.set('client', state.activeClientId);
  if (state.section === 'messages') {
    params.set('messageClient', state.messageFilterClientId);
    params.set('messageView', state.messageContextKey);
  } else {
    params.delete('messageClient');
    params.delete('messageView');
  }
  if (state.builderTemplateId) {
    params.set('template', state.builderTemplateId);
  } else {
    params.delete('template');
  }

  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}?${params.toString()}`,
  );
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const nextSection = params.get('section');
  const nextClient = params.get('client');
  const nextMessageClient = params.get('messageClient');
  const nextMessageView = params.get('messageView');
  if (nextSection && sectionTitleMap[nextSection]) {
    state.section = nextSection;
  }

  if (nextClient) {
    state.activeClientId = nextClient;
    state.clientDetailId = nextClient;
    state.builderClientId = nextClient;
  }

  if (nextMessageClient) {
    state.messageFilterClientId = nextMessageClient;
  }

  if (
    nextMessageView &&
    trainerMessageContextOptions.find(
      (option) => option.key === nextMessageView,
    )
  ) {
    state.messageContextKey = nextMessageView;
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function registerTrainerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register(
      '/trainer/sw.js?v=saulo-trainer-v1',
      {
        scope: '/trainer/',
      },
    );
  } catch (_error) {
    // Keep the trainer demo working even if the install layer fails.
  }
}

function clearBuilderDropTargets() {
  routineBuilderDays
    ?.querySelectorAll('.is-drop-target')
    .forEach((item) => item.classList.remove('is-drop-target'));
}

renderApp();
