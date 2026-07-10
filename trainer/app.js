(function () {
  const TOKEN_KEY = 'saulo-trainer-token';
  const SESSION_KEY = 'saulo-trainer-session';
  const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7];
  const refs = window.SauloTrainerRefs.createTrainerRefs();
  const {
    buildEmailLink,
    buildMagicLinkMessage,
    buildWhatsAppLink,
    compareNames,
    createFallbackDay,
    escapeHtml,
    formatContact,
    formatDate,
    formatDelivery,
    formatDeliveryHistory,
    formatDeliverySummary,
    formatLatestReport,
    formatMessageDetail,
    formatMessageSummary,
    formatNextAction,
    formatOperationalState,
    formatPhotoDetail,
    formatPhotoSummary,
    formatReportHistory,
    getOperationalPriority,
    getOperationalState,
    matchesStudentStatus,
    parseExerciseLines,
    parseExerciseLinesDetailed,
    readStudentSummary,
    renderInsightList,
    serializeExercisesForEditor,
  } = window.SauloTrainerUtils;

  let trainerSession = getInitialSession();
  let trainerToken = trainerSession?.accessToken || getInitialToken();
  let allStudents = [];
  let studentsRenderVersion = 0;
  hydrateLocalHints();

  refs.authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = refs.emailInput?.value.trim();
    const password = refs.passwordInput?.value.trim();

    if (!email || !password) {
      showStatus('Introduce email y contraseña para continuar.', true);
      return;
    }

    try {
      const payload = await fetch('/api/trainer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await payload.json().catch(() => ({}));

      if (!payload.ok || !result?.session?.accessToken) {
        throw new Error(
          result.message || 'No se pudo iniciar sesión como entrenador.',
        );
      }

      setTrainerSession(result.session);
      await loadStudents(true);
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  refs.logoutButton?.addEventListener('click', () => {
    clearTrainerSession();
    if (refs.passwordInput) {
      refs.passwordInput.value = '';
    }
    showStatus('Sesión cerrada. El panel ha quedado bloqueado.', false);
    renderTrainerIdentity(null);
    resetStudentsState('Inicia sesión para cargar alumnos.');
  });

  refs.createStudentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!trainerToken) {
      showStatus('Inicia sesión antes de crear alumnos.', true);
      return;
    }

    const formData = new FormData(refs.createStudentForm);
    const name = String(formData.get('name') || '').trim();
    const plan = String(formData.get('plan') || '').trim();
    const goal = String(formData.get('goal') || '').trim();
    const contactEmail = String(formData.get('contactEmail') || '').trim();
    const contactPhone = String(formData.get('contactPhone') || '').trim();

    if (!name) {
      showStatus('El nombre del alumno es obligatorio.', true);
      return;
    }

    try {
      await trainerRequest('/api/trainer/students', {
        method: 'POST',
        body: JSON.stringify({
          name,
          plan,
          goal,
          contactEmail,
          contactPhone,
        }),
      });
      refs.createStudentForm.reset();
      showStatus('Alumno creado correctamente.');
      await loadStudents();
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  refs.refreshButton?.addEventListener('click', async () => {
    await loadStudents();
  });

  refs.studentsSearch?.addEventListener('input', () => {
    renderStudents(allStudents);
  });

  refs.studentsStatusFilter?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  refs.studentsPlanFilter?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  refs.studentsSort?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  refs.summaryGroups.forEach((group) => {
    group.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-summary-filter]');
      if (!(chip instanceof HTMLElement)) {
        return;
      }

      applySummaryFilter(chip.dataset.summaryFilter || 'all');
    });

    group.addEventListener('keydown', (event) => {
      const chip = event.target.closest('[data-summary-filter]');
      if (!(chip instanceof HTMLElement)) {
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      applySummaryFilter(chip.dataset.summaryFilter || 'all');
    });
  });

  refs.studentsList?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const card = button.closest('[data-student-id]');
    const studentId = card?.dataset.studentId;
    const waitingRoomLink = card?.dataset.waitingRoomLink;
    const emailLink = card?.dataset.emailLink;
    const whatsappLink = card?.dataset.whatsappLink;

    if (!studentId) {
      return;
    }

    try {
      if (button.dataset.action === 'copy-link') {
        if (!waitingRoomLink) {
          showStatus(
            'Marca primero el pago recibido para generar el magic link único de acceso.',
            true,
          );
          return;
        }

        const shareMessage = buildMagicLinkMessage(
          readStudentSummary(card),
          waitingRoomLink,
        );
        await navigator.clipboard.writeText(shareMessage);
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/delivery`,
          {
            method: 'POST',
            body: JSON.stringify({
              channel: 'copy',
              status: 'shared',
            }),
          },
        );
        showStatus('Mensaje de acceso copiado al portapapeles.');
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'payment-received') {
        const payload = await trainerRequest(
          `/api/trainer/students/${studentId}/payment-received`,
          {
            method: 'POST',
            body: JSON.stringify({ deliver: true }),
          },
        );
        showStatus(
          payload.delivery?.message ||
            'Pago registrado, acceso preparado y sala de espera generada.',
          payload.delivery?.status === 'provider-error',
        );
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'copy-waiting-room' && waitingRoomLink) {
        await navigator.clipboard.writeText(waitingRoomLink);
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/delivery`,
          {
            method: 'POST',
            body: JSON.stringify({
              channel: 'copy',
              status: 'shared',
              note: 'Magic link copiado manualmente.',
            }),
          },
        );
        showStatus('Enlace de sala de espera copiado y registrado.');
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'open-email') {
        if (!emailLink) {
          showStatus(
            'Este alumno no tiene email de contacto registrado.',
            true,
          );
          return;
        }

        window.open(emailLink, '_blank', 'noopener,noreferrer');
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/delivery`,
          {
            method: 'POST',
            body: JSON.stringify({
              channel: 'email',
              status: 'shared',
            }),
          },
        );
        showStatus('Correo preparado para enviar el acceso.');
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'open-whatsapp') {
        if (!whatsappLink) {
          showStatus(
            'Este alumno no tiene WhatsApp de contacto registrado.',
            true,
          );
          return;
        }

        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/delivery`,
          {
            method: 'POST',
            body: JSON.stringify({
              channel: 'whatsapp',
              status: 'shared',
            }),
          },
        );
        showStatus('WhatsApp preparado para enviar el acceso.');
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'rotate-access') {
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/rotate`,
          {
            method: 'POST',
          },
        );
        showStatus('Enlace rotado correctamente.');
        await loadStudents();
        return;
      }

      if (button.dataset.action === 'revoke-access') {
        await trainerRequest(
          `/api/trainer/students/${studentId}/access/revoke`,
          {
            method: 'POST',
          },
        );
        showStatus('Enlace revocado correctamente.');
        await loadStudents();
      }
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  refs.studentsList?.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-message-form]');
    if (form instanceof HTMLFormElement) {
      event.preventDefault();

      const card = form.closest('[data-student-id]');
      const studentId = card?.dataset.studentId;
      const body = String(new FormData(form).get('body') || '').trim();

      if (!studentId || !body) {
        showStatus('Escribe un mensaje antes de enviarlo.', true);
        return;
      }

      try {
        await trainerRequest('/api/trainer/messages', {
          method: 'POST',
          body: JSON.stringify({
            studentId,
            title: 'Coach Saulo',
            body,
          }),
        });
        form.reset();
        showStatus('Mensaje enviado al alumno.');
      } catch (error) {
        showStatus(error.message, true);
      }
      return;
    }

    const routineForm = event.target.closest('[data-routine-form]');
    if (!(routineForm instanceof HTMLFormElement)) {
      return;
    }

    event.preventDefault();

    const card = routineForm.closest('[data-student-id]');
    const studentId = card?.dataset.studentId;
    const validation = validateRoutineDays(routineForm);

    if (!studentId || !validation.days.length) {
      showStatus(
        'Completa al menos un día con su título, meta y un ejercicio válido.',
        true,
      );
      return;
    }

    if (validation.errors.length) {
      showStatus(validation.errors[0], true);
      return;
    }

    try {
      await trainerRequest(`/api/trainer/students/${studentId}/routine`, {
        method: 'PUT',
        body: JSON.stringify({
          routine: {
            title: 'Rutina activa',
            days: validation.days,
          },
        }),
      });
      showStatus('Rutina guardada correctamente.');
      await loadStudents();
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  if (trainerToken) {
    loadSessionAndStudents(true);
  } else {
    renderEmptyState('Inicia sesión para cargar alumnos.');
  }

  async function loadSessionAndStudents(showSuccessMessage = false) {
    if (!trainerToken) {
      resetStudentsState('Inicia sesión para cargar alumnos.');
      return;
    }

    if (trainerSession?.trainer) {
      renderTrainerIdentity(trainerSession.trainer);
    }

    try {
      if (isTrainerSessionExpiring(trainerSession)) {
        const refreshed = await tryRefreshTrainerSession();
        if (!refreshed && !trainerToken) {
          throw new Error(
            'La sesión del entrenador ha caducado. Inicia sesión de nuevo.',
          );
        }
      }

      const payload = await trainerRequest('/api/trainer/session');
      trainerSession = {
        ...(trainerSession || {}),
        trainer: payload.trainer,
        accessToken: trainerToken,
      };
      persistTrainerSession();
      renderTrainerIdentity(payload.trainer);
    } catch (error) {
      renderTrainerIdentity(null);
      resetStudentsState('No se pudo validar la sesión del entrenador.');
      showStatus(error.message, true);
      return;
    }

    await loadStudents(showSuccessMessage);
  }

  async function loadStudents(showSuccessMessage = false) {
    if (!trainerToken) {
      resetStudentsState('Inicia sesión para cargar alumnos.');
      return;
    }

    renderEmptyState('Cargando alumnos...');

    try {
      const payload = await trainerRequest('/api/trainer/students');
      const students = Array.isArray(payload.students) ? payload.students : [];
      allStudents = students;
      syncPlanFilter(students);
      renderStudentsSummary(students);
      await renderStudents(students);
      if (showSuccessMessage) {
        showStatus('Sesión validada. Panel listo para operar.');
      }
    } catch (error) {
      resetStudentsState('No se pudieron cargar los alumnos.');
      showStatus(error.message, true);
    }
  }

  async function renderStudents(students) {
    const renderVersion = ++studentsRenderVersion;
    const filteredStudents = sortStudents(filterStudents(students));

    if (!students.length) {
      if (renderVersion === studentsRenderVersion) {
        renderEmptyState('Todavía no hay alumnos creados.');
      }
      return;
    }

    if (!filteredStudents.length) {
      if (renderVersion === studentsRenderVersion) {
        renderEmptyState(
          'No hay alumnos que coincidan con los filtros actuales.',
        );
      }
      return;
    }

    const cards = await Promise.all(
      filteredStudents.map(async (student) => {
        try {
          const detailPayload = await trainerRequest(
            `/api/trainer/students/${student.id}`,
          );
          const detail = detailPayload.student || student;
          return createStudentCard(detail);
        } catch (error) {
          return createStudentCard(student);
        }
      }),
    );

    if (renderVersion !== studentsRenderVersion) {
      return;
    }

    refs.studentsList.innerHTML = '';
    cards.forEach((card) => refs.studentsList.appendChild(card));
  }

  function createStudentCard(student) {
    const fragment = refs.studentCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.student-card');
    const accessState = student.accessRevokedAt
      ? 'Acceso revocado'
      : 'Acceso activo';

    const waitingRoomLink = buildWaitingRoomUrl(student.waitingRoomToken);
    const emailLink = buildEmailLink(student, waitingRoomLink);
    const whatsappLink = buildWhatsAppLink(student, waitingRoomLink);

    card.dataset.studentId = student.id;
    card.dataset.waitingRoomLink = waitingRoomLink;
    card.dataset.emailLink = emailLink;
    card.dataset.whatsappLink = whatsappLink;
    card.dataset.studentName = student.name || '';
    card.dataset.studentContactEmail = student.contactEmail || '';
    card.dataset.studentContactPhone = student.contactPhone || '';
    card.querySelector('[data-student-plan]').textContent =
      student.plan || 'Plan personalizado';
    card.querySelector('[data-student-name]').textContent = student.name;
    card.querySelector('[data-student-goal]').textContent =
      student.goal || 'Pendiente de definir';
    card.querySelector('[data-student-contact]').textContent =
      formatContact(student);
    card.querySelector('[data-student-routine]').textContent =
      student.routine?.days?.[0]?.title ||
      student.routine?.title ||
      'Rutina pendiente';
    card.querySelector('[data-student-subscription]').textContent =
      student.subscription?.summary || 'Sin resumen de suscripción';
    card.querySelector('[data-student-payment]').textContent =
      student.paymentReceivedAt
        ? `Confirmado · ${formatDate(student.paymentReceivedAt)}`
        : 'Pendiente';
    card.querySelector('[data-student-delivery]').textContent =
      formatDelivery(student);
    card.querySelector('[data-student-operational-state]').textContent =
      formatOperationalState(student);
    card.querySelector('[data-student-next-action]').textContent =
      formatNextAction(student);
    card.querySelector('[data-student-latest-report]').textContent =
      formatLatestReport(student.latestWorkoutReport);
    card.querySelector('[data-student-photos-summary]').textContent =
      formatPhotoSummary(student.photoSummary);
    renderInsightList(
      card.querySelector('[data-student-report-history]'),
      formatReportHistory(student.workoutReportHistory),
    );
    renderInsightList(
      card.querySelector('[data-student-photo-detail]'),
      formatPhotoDetail(student.photoDetail),
    );
    card.querySelector('[data-student-message-summary]').textContent =
      formatMessageSummary(student.messageSummary);
    renderInsightList(
      card.querySelector('[data-student-message-detail]'),
      formatMessageDetail(student.messageDetail),
    );
    card.querySelector('[data-student-delivery-summary]').textContent =
      formatDeliverySummary(student);
    renderInsightList(
      card.querySelector('[data-student-delivery-history]'),
      formatDeliveryHistory(student.deliveryHistory),
    );

    const waitingRoomLinkNode = card.querySelector('[data-waiting-room-link]');
    waitingRoomLinkNode.textContent = waitingRoomLink || 'Pendiente de generar';
    waitingRoomLinkNode.href = waitingRoomLink || '#';

    const emailButton = card.querySelector('[data-action="open-email"]');
    const whatsappButton = card.querySelector('[data-action="open-whatsapp"]');
    if (emailButton) {
      emailButton.hidden = !emailLink;
    }
    if (whatsappButton) {
      whatsappButton.hidden = !whatsappLink;
    }

    fillRoutineForm(card, student);

    const accessPill = card.querySelector('[data-student-access-state]');
    accessPill.textContent = accessState;
    accessPill.classList.toggle('is-revoked', Boolean(student.accessRevokedAt));

    const appSessionNode = card.querySelector('[data-student-app-session]');
    if (student.accessRevokedAt) {
      appSessionNode.textContent = 'Acceso revocado';
    } else if (student.paymentReceivedAt) {
      appSessionNode.textContent =
        'Lista tras abrir el magic link y preparar la PWA';
    } else {
      appSessionNode.textContent =
        'Pendiente de activar desde el magic link único';
    }

    return fragment;
  }

  function fillRoutineForm(card, student) {
    const daysRoot = card.querySelector('[data-routine-days]');
    if (!daysRoot) {
      return;
    }

    const routineDays = Array.isArray(student.routine?.days)
      ? student.routine.days
      : [];

    daysRoot.innerHTML = DAY_NUMBERS.map((dayNumber) => {
      const day =
        routineDays.find((item) => Number(item.day) === dayNumber) ||
        createFallbackDay(dayNumber);

      return `
        <section class="routine-day-card" data-routine-day="${dayNumber}">
          <div class="routine-day-card-head">
            <div>
              <p class="brand-kicker">Día ${dayNumber}</p>
              <h5>${escapeHtml(day.title || `Día ${dayNumber}`)}</h5>
            </div>
            <p class="routine-day-card-copy">Alumno verá solo lo que marques aquí.</p>
          </div>
          <div class="routine-day-fields">
            <label>
              Título
              <input
                type="text"
                value="${escapeHtml(day.title || '')}"
                data-routine-day-title="${dayNumber}"
                placeholder="Pierna + glúteo"
              />
            </label>
            <label>
              Meta
              <input
                type="text"
                value="${escapeHtml(day.meta || 'Plan activo')}"
                data-routine-day-meta="${dayNumber}"
                placeholder="Activa · Ganancia muscular"
              />
            </label>
            <label class="routine-field-wide">
              Ejercicios
              <textarea
                data-routine-day-exercises="${dayNumber}"
                placeholder="Hip thrust | 4 x 10 | 75% | 90 s | https://youtube..."
              >${escapeHtml(serializeExercisesForEditor(day.exercises || []))}</textarea>
            </label>
          </div>
          <div class="routine-preview" data-routine-preview="${dayNumber}">
            <p class="routine-preview-title">Vista previa</p>
            <div class="routine-preview-list"></div>
            <p class="routine-preview-empty" hidden>
              Añade ejercicios para previsualizar cómo quedará este día.
            </p>
          </div>
        </section>
      `;
    }).join('');

    bindRoutinePreview(daysRoot);
    renderRoutinePreview(daysRoot);
  }

  function validateRoutineDays(routineForm) {
    const errors = [];

    const days = DAY_NUMBERS.map((dayNumber) => {
      const title = String(
        routineForm.querySelector(`[data-routine-day-title="${dayNumber}"]`)
          ?.value || '',
      ).trim();
      const meta = String(
        routineForm.querySelector(`[data-routine-day-meta="${dayNumber}"]`)
          ?.value || '',
      ).trim();
      const exerciseLines = String(
        routineForm.querySelector(`[data-routine-day-exercises="${dayNumber}"]`)
          ?.value || '',
      ).trim();

      const parsedExercises = parseExerciseLinesDetailed(exerciseLines);

      if (parsedExercises.errors.length) {
        errors.push(
          ...parsedExercises.errors.map(
            (error) => `Día ${dayNumber}: ${error}`,
          ),
        );
      }

      if (!title || !meta || !parsedExercises.exercises.length) {
        return null;
      }

      return {
        day: dayNumber,
        label: `Día ${dayNumber}`,
        title,
        meta,
        exercises: parsedExercises.exercises,
      };
    }).filter(Boolean);

    return { days, errors };
  }

  function bindRoutinePreview(daysRoot) {
    daysRoot.addEventListener('input', (event) => {
      if (!(event.target instanceof HTMLTextAreaElement)) {
        return;
      }

      if (!event.target.matches('[data-routine-day-exercises]')) {
        return;
      }

      renderRoutinePreview(daysRoot);
    });
  }

  function renderRoutinePreview(daysRoot) {
    DAY_NUMBERS.forEach((dayNumber) => {
      const preview = daysRoot.querySelector(
        `[data-routine-preview="${dayNumber}"]`,
      );
      const list = preview?.querySelector('.routine-preview-list');
      const empty = preview?.querySelector('.routine-preview-empty');
      const textarea = daysRoot.querySelector(
        `[data-routine-day-exercises="${dayNumber}"]`,
      );

      if (!preview || !list || !empty || !textarea) {
        return;
      }

      const exercises = parseExerciseLines(textarea.value);

      preview.hidden = false;

      if (!exercises.length) {
        list.innerHTML = '';
        empty.hidden = false;
        return;
      }

      empty.hidden = true;
      list.innerHTML = exercises
        .map(
          (exercise) => `
            <article class="routine-preview-item">
              <div>
                <div class="routine-preview-name">${escapeHtml(exercise.name)}</div>
                <div class="routine-preview-meta">
                  ${escapeHtml(exercise.reps)} · ${escapeHtml(exercise.load)} · ${escapeHtml(exercise.rest)}
                </div>
              </div>
              ${
                exercise.videoUrl
                  ? `<a class="routine-preview-video" href="${escapeHtml(exercise.videoUrl)}" target="_blank" rel="noreferrer">Vídeo</a>`
                  : ''
              }
            </article>
          `,
        )
        .join('');
    });
  }

  function renderEmptyState(message) {
    if (!refs.studentsList) {
      return;
    }

    refs.studentsList.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  }

  function resetStudentsState(message) {
    allStudents = [];
    syncPlanFilter([]);
    renderStudentsSummary([]);
    renderEmptyState(message);
  }

  function showStatus(message, isError = false) {
    if (!refs.statusBanner) {
      return;
    }

    refs.statusBanner.hidden = false;
    refs.statusBanner.textContent = message;
    refs.statusBanner.classList.toggle('is-error', isError);
    refs.statusBanner.classList.toggle('is-success', !isError);
  }

  function renderTrainerIdentity(trainer) {
    if (!refs.trainerIdentity) {
      return;
    }

    if (!trainer) {
      refs.trainerIdentity.hidden = true;
      refs.trainerIdentity.textContent = '';
      return;
    }

    refs.trainerIdentity.hidden = false;
    refs.trainerIdentity.textContent = `${trainer.name} · ${trainer.email || 'sin email'} · ${trainer.mode}`;
  }

  async function trainerRequest(url, options = {}) {
    if (!trainerToken) {
      throw new Error('Sesión de entrenador no disponible.');
    }

    return requestWithTrainerSession(url, options, true);
  }

  async function requestWithTrainerSession(url, options, allowRefresh) {
    if (allowRefresh && isTrainerSessionExpiring(trainerSession)) {
      const refreshed = await tryRefreshTrainerSession();

      if (!refreshed && !trainerToken) {
        throw new Error('La sesión del entrenador ha caducado.');
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trainerToken}`,
        ...(options.headers || {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok && response.status === 401 && allowRefresh) {
      const refreshed = await tryRefreshTrainerSession();

      if (refreshed) {
        return requestWithTrainerSession(url, options, false);
      }
    }

    if (!response.ok) {
      throw new Error(payload.message || 'No se pudo completar la operación.');
    }

    return payload;
  }

  async function tryRefreshTrainerSession() {
    const refreshToken = String(trainerSession?.refreshToken || '').trim();

    if (!refreshToken) {
      clearTrainerSession();
      return false;
    }

    try {
      const response = await fetch('/api/trainer/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.session?.accessToken) {
        clearTrainerSession();
        return false;
      }

      setTrainerSession(payload.session);
      return true;
    } catch (_error) {
      clearTrainerSession();
      return false;
    }
  }

  function buildWaitingRoomUrl(waitingRoomToken) {
    if (!waitingRoomToken) {
      return '';
    }
    return `${window.location.origin}/acceso/${encodeURIComponent(waitingRoomToken)}`;
  }

  function getInitialToken() {
    return (
      new URLSearchParams(window.location.search).get('token') ||
      localStorage.getItem(TOKEN_KEY) ||
      ''
    );
  }

  function getInitialSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function setTrainerSession(session) {
    trainerSession = {
      accessToken: String(session?.accessToken || '').trim(),
      refreshToken: String(session?.refreshToken || '').trim(),
      expiresAt: String(session?.expiresAt || '').trim(),
      trainer: session?.trainer || null,
    };
    trainerToken = trainerSession.accessToken;
    persistTrainerSession();
    renderTrainerIdentity(trainerSession.trainer);
  }

  function persistTrainerSession() {
    if (!trainerSession?.accessToken) {
      return;
    }

    localStorage.setItem(TOKEN_KEY, trainerSession.accessToken);
    localStorage.setItem(SESSION_KEY, JSON.stringify(trainerSession));
  }

  function clearTrainerSession() {
    trainerSession = null;
    trainerToken = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  function isTrainerSessionExpiring(session, bufferMs = 60_000) {
    const expiresAt = String(session?.expiresAt || '').trim();

    if (!expiresAt) {
      return false;
    }

    const expiresAtMs = Date.parse(expiresAt);

    if (!Number.isFinite(expiresAtMs)) {
      return false;
    }

    return expiresAtMs - Date.now() <= bufferMs;
  }

  function hydrateLocalHints() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    if (refs.emailInput) {
      refs.emailInput.value = email || 'local@saulofitness.app';
    }
  }

  function renderStudentsSummary(students) {
    if (
      !refs.summaryTotal ||
      !refs.summaryPaid ||
      !refs.summaryPending ||
      !refs.summaryActive
    ) {
      return;
    }

    refs.summaryTotal.textContent = String(students.length);
    refs.summaryPaid.textContent = String(
      students.filter((student) => Boolean(student.paymentReceivedAt)).length,
    );
    refs.summaryPending.textContent = String(
      students.filter((student) => !student.paymentReceivedAt).length,
    );
    refs.summaryActive.textContent = String(
      students.filter((student) => !student.accessRevokedAt).length,
    );

    if (
      refs.opsPendingPayment &&
      refs.opsReady &&
      refs.opsSent &&
      refs.opsOpened &&
      refs.opsAttention
    ) {
      refs.opsPendingPayment.textContent = String(
        students.filter(
          (student) => getOperationalState(student) === 'pending-payment',
        ).length,
      );
      refs.opsReady.textContent = String(
        students.filter((student) => getOperationalState(student) === 'ready')
          .length,
      );
      refs.opsSent.textContent = String(
        students.filter((student) => getOperationalState(student) === 'sent')
          .length,
      );
      refs.opsOpened.textContent = String(
        students.filter((student) => getOperationalState(student) === 'opened')
          .length,
      );
      refs.opsAttention.textContent = String(
        students.filter((student) =>
          ['attention', 'revoked'].includes(getOperationalState(student)),
        ).length,
      );
    }

    syncSummaryFilterState();
  }

  function filterStudents(students) {
    const search = String(refs.studentsSearch?.value || '')
      .trim()
      .toLowerCase();
    const status = String(refs.studentsStatusFilter?.value || 'all');
    const plan = String(refs.studentsPlanFilter?.value || 'all');

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        [student.name, student.plan, student.goal]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus = matchesStudentStatus(student, status);
      const matchesPlan = plan === 'all' || (student.plan || '') === plan;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }

  function sortStudents(students) {
    const sort = String(refs.studentsSort?.value || 'operational');
    const sorted = [...students];

    sorted.sort((left, right) => {
      if (sort === 'operational') {
        const operationalOrder =
          getOperationalPriority(left) - getOperationalPriority(right);
        return operationalOrder || compareNames(left, right);
      }

      if (sort === 'name-desc') {
        return compareNames(right, left);
      }

      if (sort === 'paid-first') {
        const paymentOrder =
          Number(Boolean(right.paymentReceivedAt)) -
          Number(Boolean(left.paymentReceivedAt));
        return paymentOrder || compareNames(left, right);
      }

      if (sort === 'pending-first') {
        const paymentOrder =
          Number(Boolean(left.paymentReceivedAt)) -
          Number(Boolean(right.paymentReceivedAt));
        return paymentOrder || compareNames(left, right);
      }

      return compareNames(left, right);
    });

    return sorted;
  }

  function applySummaryFilter(filterValue) {
    if (!refs.studentsStatusFilter) {
      return;
    }

    refs.studentsStatusFilter.value = filterValue || 'all';
    syncSummaryFilterState();
    renderStudents(allStudents);
  }

  function syncSummaryFilterState() {
    const currentFilter = String(refs.studentsStatusFilter?.value || 'all');
    document.querySelectorAll('[data-summary-filter]').forEach((chip) => {
      chip.classList.toggle(
        'is-active',
        chip.getAttribute('data-summary-filter') === currentFilter,
      );
    });
  }

  function syncPlanFilter(students) {
    if (!refs.studentsPlanFilter) {
      return;
    }

    const currentValue = refs.studentsPlanFilter.value || 'all';
    const plans = [
      ...new Set(students.map((student) => student.plan).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right, 'es'));

    refs.studentsPlanFilter.innerHTML = [
      '<option value="all">Todos los planes</option>',
      ...plans.map(
        (plan) =>
          `<option value="${escapeHtml(plan)}">${escapeHtml(plan)}</option>`,
      ),
    ].join('');

    refs.studentsPlanFilter.value = plans.includes(currentValue)
      ? currentValue
      : 'all';
  }
})();
