(function () {
  const TOKEN_KEY = 'saulo-trainer-token';
  const SESSION_KEY = 'saulo-trainer-session';
  const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

  const authForm = document.querySelector('#trainer-auth-form');
  const emailInput = document.querySelector('#trainer-email');
  const passwordInput = document.querySelector('#trainer-password');
  const logoutButton = document.querySelector('#trainer-logout');
  const statusBanner = document.querySelector('#trainer-status');
  const trainerIdentity = document.querySelector('#trainer-identity');
  const createStudentForm = document.querySelector('#student-create-form');
  const refreshButton = document.querySelector('#students-refresh-button');
  const studentsList = document.querySelector('#students-list');
  const summaryGroups = document.querySelectorAll('.students-summary');
  const studentsSearch = document.querySelector('#students-search');
  const studentsStatusFilter = document.querySelector(
    '#students-status-filter',
  );
  const studentsPlanFilter = document.querySelector('#students-plan-filter');
  const studentsSort = document.querySelector('#students-sort');
  const summaryTotal = document.querySelector('#summary-total');
  const summaryPaid = document.querySelector('#summary-paid');
  const summaryPending = document.querySelector('#summary-pending');
  const summaryActive = document.querySelector('#summary-active');
  const opsPendingPayment = document.querySelector('#ops-pending-payment');
  const opsReady = document.querySelector('#ops-ready');
  const opsSent = document.querySelector('#ops-sent');
  const opsOpened = document.querySelector('#ops-opened');
  const opsAttention = document.querySelector('#ops-attention');
  const studentCardTemplate = document.querySelector('#student-card-template');

  let trainerSession = getInitialSession();
  let trainerToken = trainerSession?.accessToken || getInitialToken();
  let allStudents = [];
  hydrateLocalHints();

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

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

  logoutButton?.addEventListener('click', () => {
    clearTrainerSession();
    if (passwordInput) {
      passwordInput.value = '';
    }
    showStatus('Sesión cerrada. El panel ha quedado bloqueado.', false);
    renderTrainerIdentity(null);
    renderEmptyState('Inicia sesión para cargar alumnos.');
  });

  createStudentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!trainerToken) {
      showStatus('Inicia sesión antes de crear alumnos.', true);
      return;
    }

    const formData = new FormData(createStudentForm);
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
      createStudentForm.reset();
      showStatus('Alumno creado correctamente.');
      await loadStudents();
    } catch (error) {
      showStatus(error.message, true);
    }
  });

  refreshButton?.addEventListener('click', async () => {
    await loadStudents();
  });

  studentsSearch?.addEventListener('input', () => {
    renderStudents(allStudents);
  });

  studentsStatusFilter?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  studentsPlanFilter?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  studentsSort?.addEventListener('change', () => {
    renderStudents(allStudents);
  });

  summaryGroups.forEach((group) => {
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

  studentsList?.addEventListener('click', async (event) => {
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

  studentsList?.addEventListener('submit', async (event) => {
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
      renderEmptyState('Inicia sesión para cargar alumnos.');
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
      renderEmptyState('No se pudo validar la sesión del entrenador.');
      showStatus(error.message, true);
      return;
    }

    await loadStudents(showSuccessMessage);
  }

  async function loadStudents(showSuccessMessage = false) {
    if (!trainerToken) {
      renderEmptyState('Inicia sesión para cargar alumnos.');
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
      renderEmptyState('No se pudieron cargar los alumnos.');
      showStatus(error.message, true);
    }
  }

  async function renderStudents(students) {
    const filteredStudents = sortStudents(filterStudents(students));

    if (!students.length) {
      renderEmptyState('Todavía no hay alumnos creados.');
      return;
    }

    if (!filteredStudents.length) {
      renderEmptyState(
        'No hay alumnos que coincidan con los filtros actuales.',
      );
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

    studentsList.innerHTML = '';
    cards.forEach((card) => studentsList.appendChild(card));
  }

  function createStudentCard(student) {
    const fragment = studentCardTemplate.content.cloneNode(true);
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

  function parseExerciseLinesDetailed(rawValue) {
    const errors = [];

    const exercises = String(rawValue || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, reps, load, rest, videoUrl] = line
          .split('|')
          .map((part) => part.trim());

        if (!name || !reps || !load || !rest) {
          errors.push(
            `la línea ${index + 1} debe usar "Nombre | reps | carga | descanso | video opcional"`,
          );
          return null;
        }

        if (videoUrl && !isSupportedVideoUrl(videoUrl)) {
          errors.push(
            `la línea ${index + 1} tiene un vídeo no compatible; usa YouTube o youtu.be`,
          );
          return null;
        }

        return {
          name,
          reps,
          load,
          rest,
          ...(videoUrl ? { videoUrl } : {}),
        };
      })
      .filter(Boolean);

    return { exercises, errors };
  }

  function parseExerciseLines(rawValue) {
    return parseExerciseLinesDetailed(rawValue).exercises;
  }

  function serializeExercisesForEditor(exercises) {
    return exercises
      .map((exercise) =>
        [
          exercise.name || '',
          exercise.reps || '',
          exercise.load || '',
          exercise.rest || '',
          exercise.videoUrl || exercise.video_url || '',
        ]
          .filter((value, index) => index < 4 || value)
          .join(' | '),
      )
      .join('\n');
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

  function isSupportedVideoUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      return (
        url.hostname.includes('youtube.com') ||
        url.hostname.includes('youtu.be')
      );
    } catch (_error) {
      return false;
    }
  }

  function createFallbackDay(dayNumber) {
    const isRecovery = ![1, 3, 5].includes(dayNumber);

    if (isRecovery) {
      return {
        day: dayNumber,
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Cardio suave',
            reps: '20 min',
            load: 'Suave',
            rest: 'Continuo',
          },
        ],
      };
    }

    return {
      day: dayNumber,
      title: `Día ${dayNumber} · Fuerza`,
      meta: 'Activa · Ganancia muscular',
      exercises: [
        {
          name: 'Ejercicio base',
          reps: '4 x 10',
          load: '75%',
          rest: '90 s',
        },
      ],
    };
  }

  function renderEmptyState(message) {
    if (!studentsList) {
      return;
    }

    studentsList.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
  }

  function showStatus(message, isError = false) {
    if (!statusBanner) {
      return;
    }

    statusBanner.hidden = false;
    statusBanner.textContent = message;
    statusBanner.classList.toggle('is-error', isError);
    statusBanner.classList.toggle('is-success', !isError);
  }

  function renderTrainerIdentity(trainer) {
    if (!trainerIdentity) {
      return;
    }

    if (!trainer) {
      trainerIdentity.hidden = true;
      trainerIdentity.textContent = '';
      return;
    }

    trainerIdentity.hidden = false;
    trainerIdentity.textContent = `${trainer.name} · ${trainer.email || 'sin email'} · ${trainer.mode}`;
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

    if (emailInput) {
      emailInput.value = email || 'local@saulofitness.app';
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

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'pendiente';
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatLatestReport(report) {
    if (!report) {
      return 'Todavía no hay informes de entrenamiento enviados.';
    }

    const dayLabel = report.day ? `Día ${report.day}` : 'Entrenamiento';
    const feedback = report.feedback ? ` · ${report.feedback}` : '';
    const createdAt = report.createdAt
      ? ` · ${formatDate(report.createdAt)}`
      : '';
    return `${dayLabel}${feedback}${createdAt}`;
  }

  function formatPhotoSummary(summary) {
    if (!summary) {
      return 'Sin fotos de progreso registradas todavía.';
    }

    const parts = [
      `Pendientes: ${summary.pendingCount || 0}`,
      `Histórico: ${summary.historyCount || 0}`,
    ];

    if (summary.nextDueDate) {
      parts.push(`Próximo registro: ${formatDate(summary.nextDueDate)}`);
    }

    return parts.join(' · ');
  }

  function formatReportHistory(history) {
    if (!Array.isArray(history) || !history.length) {
      return [
        {
          title: 'Sin histórico reciente',
          meta: 'Cuando el alumno finalice entrenamientos, aparecerán aquí.',
        },
      ];
    }

    return history.map((report) => ({
      title: `Día ${report.day || '—'} · ${report.feedback || 'Sin feedback'}`,
      meta: report.createdAt
        ? `Enviado el ${formatDate(report.createdAt)}`
        : 'Sin fecha registrada',
    }));
  }

  function formatPhotoDetail(detail) {
    const items = [];

    if (detail?.pendingSlots?.length) {
      items.push({
        title: 'Pendientes de revisión',
        meta: detail.pendingSlots.join(', '),
      });
    }

    if (Array.isArray(detail?.historyItems) && detail.historyItems.length) {
      detail.historyItems.forEach((item) => {
        items.push({
          title: item.label || 'Registro',
          meta: item.meta || 'Seguimiento disponible',
        });
      });
    }

    return items.length
      ? items
      : [
          {
            title: 'Sin detalle todavía',
            meta: 'Cuando el alumno suba fotos aparecerán aquí.',
          },
        ];
  }

  function formatMessageSummary(summary) {
    if (!summary) {
      return 'Sin actividad de mensajes todavía.';
    }

    const parts = [
      `Recibidos: ${summary.inboxCount || 0}`,
      `Enviados: ${summary.sentCount || 0}`,
      `Recordatorios: ${summary.remindersCount || 0}`,
    ];

    if (summary.latestTitle) {
      parts.push(`Último: ${summary.latestTitle}`);
    }

    return parts.join(' · ');
  }

  function formatMessageDetail(detail) {
    if (!Array.isArray(detail) || !detail.length) {
      return [
        {
          title: 'Sin conversación reciente',
          meta: 'Cuando haya intercambio de mensajes aparecerá aquí.',
        },
      ];
    }

    return detail;
  }

  function formatContact(student) {
    const parts = [student.contactEmail, student.contactPhone].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Pendiente de registrar';
  }

  function formatDelivery(student) {
    if (!student.deliveryStatus) {
      return 'Pendiente de activar';
    }

    const statusLabels = {
      pending: 'Pendiente de envío',
      ready: 'Listo para compartir',
      'ready-to-share': 'Listo para compartir',
      shared: 'Compartido manualmente',
      sent: 'Enviado automáticamente',
      delivered: 'Enviado automáticamente',
      opened: 'Acceso abierto',
      failed: 'Fallo de envío',
      'missing-contact': 'Falta contacto',
    };

    const parts = [
      statusLabels[student.deliveryStatus] || student.deliveryStatus,
    ];

    if (student.deliveryChannel) {
      parts.push(student.deliveryChannel);
    }

    if (student.deliverySentAt) {
      parts.push(formatDate(student.deliverySentAt));
    }

    if (student.deliveryError) {
      parts.push(student.deliveryError);
    }

    return parts.join(' · ');
  }

  function formatDeliverySummary(student) {
    if (student.waitingRoomConsumedAt) {
      return `Último estado: acceso abierto · ${formatDate(student.waitingRoomConsumedAt)}`;
    }

    if (
      !Array.isArray(student.deliveryHistory) ||
      !student.deliveryHistory.length
    ) {
      return 'Sin entregas registradas todavía.';
    }

    return `Último estado: ${formatDelivery(student)}`;
  }

  function formatDeliveryHistory(history) {
    if (!Array.isArray(history) || !history.length) {
      return [
        {
          title: 'Sin historial todavía',
          meta: 'Cuando se comparta o envíe el acceso aparecerá aquí.',
        },
      ];
    }

    return history;
  }

  function renderInsightList(container, items) {
    if (!container) {
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
          <article class="insight-item">
            <strong>${escapeHtml(item.title || '')}</strong>
            <span>${escapeHtml(item.meta || '')}</span>
          </article>
        `,
      )
      .join('');
  }

  function readStudentSummary(card) {
    return {
      name: String(card?.dataset.studentName || '').trim(),
      contactEmail: String(card?.dataset.studentContactEmail || '').trim(),
      contactPhone: String(card?.dataset.studentContactPhone || '').trim(),
    };
  }

  function buildMagicLinkMessage(student, waitingRoomLink) {
    return [
      `Hola ${student.name || 'cliente'}, tu acceso a Saulo Fitness APP ya está listo.`,
      `Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: ${waitingRoomLink}`,
      'Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.',
    ].join(' ');
  }

  function buildEmailLink(student, waitingRoomLink) {
    const email = String(student.contactEmail || '').trim();
    if (!email || !waitingRoomLink) {
      return '';
    }

    const subject = 'Saulo Fitness APP · Tu acceso está listo';
    const body = buildMagicLinkMessage(student, waitingRoomLink);
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function buildWhatsAppLink(student, waitingRoomLink) {
    const phone = String(student.contactPhone || '').trim();
    if (!phone || !waitingRoomLink) {
      return '';
    }

    const body = buildMagicLinkMessage(student, waitingRoomLink);
    return `https://wa.me/${String(phone).replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
  }

  function renderStudentsSummary(students) {
    if (!summaryTotal || !summaryPaid || !summaryPending || !summaryActive) {
      return;
    }

    summaryTotal.textContent = String(students.length);
    summaryPaid.textContent = String(
      students.filter((student) => Boolean(student.paymentReceivedAt)).length,
    );
    summaryPending.textContent = String(
      students.filter((student) => !student.paymentReceivedAt).length,
    );
    summaryActive.textContent = String(
      students.filter((student) => !student.accessRevokedAt).length,
    );

    if (opsPendingPayment && opsReady && opsSent && opsOpened && opsAttention) {
      opsPendingPayment.textContent = String(
        students.filter(
          (student) => getOperationalState(student) === 'pending-payment',
        ).length,
      );
      opsReady.textContent = String(
        students.filter((student) => getOperationalState(student) === 'ready')
          .length,
      );
      opsSent.textContent = String(
        students.filter((student) => getOperationalState(student) === 'sent')
          .length,
      );
      opsOpened.textContent = String(
        students.filter((student) => getOperationalState(student) === 'opened')
          .length,
      );
      opsAttention.textContent = String(
        students.filter((student) =>
          ['attention', 'revoked'].includes(getOperationalState(student)),
        ).length,
      );
    }

    syncSummaryFilterState();
  }

  function filterStudents(students) {
    const search = String(studentsSearch?.value || '')
      .trim()
      .toLowerCase();
    const status = String(studentsStatusFilter?.value || 'all');
    const plan = String(studentsPlanFilter?.value || 'all');

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
    const sort = String(studentsSort?.value || 'operational');
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
    if (!studentsStatusFilter) {
      return;
    }

    studentsStatusFilter.value = filterValue || 'all';
    syncSummaryFilterState();
    renderStudents(allStudents);
  }

  function syncSummaryFilterState() {
    const currentFilter = String(studentsStatusFilter?.value || 'all');
    document.querySelectorAll('[data-summary-filter]').forEach((chip) => {
      chip.classList.toggle(
        'is-active',
        chip.getAttribute('data-summary-filter') === currentFilter,
      );
    });
  }

  function compareNames(left, right) {
    return String(left?.name || '').localeCompare(
      String(right?.name || ''),
      'es',
    );
  }

  function matchesStudentStatus(student, status) {
    if (status === 'all') {
      return true;
    }

    if (status === 'active') {
      return !student.accessRevokedAt;
    }

    if (status === 'revoked') {
      return Boolean(student.accessRevokedAt);
    }

    if (status === 'paid') {
      return Boolean(student.paymentReceivedAt);
    }

    if (status === 'pending') {
      return !student.paymentReceivedAt;
    }

    if (status === 'ready') {
      return getOperationalState(student) === 'ready';
    }

    if (status === 'opened') {
      return getOperationalState(student) === 'opened';
    }

    if (status === 'sent') {
      return getOperationalState(student) === 'sent';
    }

    if (status === 'attention') {
      return ['attention', 'revoked'].includes(getOperationalState(student));
    }

    return true;
  }

  function getOperationalState(student) {
    if (student.accessRevokedAt) {
      return 'revoked';
    }

    if (!student.paymentReceivedAt) {
      return 'pending-payment';
    }

    if (student.deliveryStatus === 'failed') {
      return 'attention';
    }

    if (student.deliveryStatus === 'missing-contact') {
      return 'attention';
    }

    if (student.waitingRoomConsumedAt) {
      return 'opened';
    }

    if (['ready', 'pending'].includes(student.deliveryStatus)) {
      return 'ready';
    }

    if (['shared', 'sent'].includes(student.deliveryStatus)) {
      return student.waitingRoomConsumedAt ? 'opened' : 'sent';
    }

    return 'attention';
  }

  function getOperationalPriority(student) {
    const priorities = {
      'pending-payment': 0,
      ready: 1,
      attention: 2,
      sent: 3,
      opened: 4,
      revoked: 5,
    };

    return priorities[getOperationalState(student)] ?? 99;
  }

  function formatOperationalState(student) {
    const labels = {
      'pending-payment': 'Pago pendiente',
      ready: 'Listo para enviar',
      sent: 'Ya enviado',
      opened: 'Acceso abierto',
      attention: 'Revisar entrega',
      revoked: 'Acceso revocado',
    };

    return labels[getOperationalState(student)] || 'Revisar entrega';
  }

  function formatNextAction(student) {
    const state = getOperationalState(student);
    const nextActions = {
      'pending-payment': 'Confirmar pago para generar el acceso',
      ready: 'Compartir el magic link único con el alumno',
      sent: 'Esperar a que el alumno abra la sala de espera',
      opened: 'Comprobar instalación y uso de la app',
      attention: 'Revisar contacto o reintentar entrega',
      revoked: 'Rotar o reactivar acceso si procede',
    };

    return nextActions[state] || 'Revisar caso';
  }

  function syncPlanFilter(students) {
    if (!studentsPlanFilter) {
      return;
    }

    const currentValue = studentsPlanFilter.value || 'all';
    const plans = [
      ...new Set(students.map((student) => student.plan).filter(Boolean)),
    ].sort((left, right) => left.localeCompare(right, 'es'));

    studentsPlanFilter.innerHTML = [
      '<option value="all">Todos los planes</option>',
      ...plans.map(
        (plan) =>
          `<option value="${escapeHtml(plan)}">${escapeHtml(plan)}</option>`,
      ),
    ].join('');

    studentsPlanFilter.value = plans.includes(currentValue)
      ? currentValue
      : 'all';
  }
})();
