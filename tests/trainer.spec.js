const { test, expect } = require('@playwright/test');

test('trainer panel loads students and can create waiting room access, update routine and revoke access', async ({
  page,
  request,
}) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  const studentName = `Alumno Trainer ${Date.now()}`;

  await page.goto('/trainer');

  await expect(
    page.getByRole('heading', { name: 'Panel de entrenador' }),
  ).toBeVisible();
  await page.locator('#trainer-email').fill('local@saulofitness.app');
  await page.locator('#trainer-password').fill('saulo1234');
  await page
    .locator('#trainer-auth-form')
    .getByRole('button', { name: 'Iniciar sesión' })
    .click();
  await expect(page.locator('#trainer-identity')).toContainText(
    'Saulo Trainer',
  );
  await expect(page.getByText('Lucía Ortega')).toBeVisible();
  await expect(page.getByText('Hugo Martín')).toBeVisible();
  const initialTotal = Number(
    (await page.locator('#summary-total').textContent()) || '0',
  );
  const initialPaid = Number(
    (await page.locator('#summary-paid').textContent()) || '0',
  );
  const initialPending = Number(
    (await page.locator('#summary-pending').textContent()) || '0',
  );

  await page.locator('#student-name').fill(studentName);
  await page.locator('#student-plan').fill('Plan producto');
  await page.locator('#student-goal').fill('Subir fuerza y adherencia');
  await page.locator('#student-contact-email').fill('nuevo@saulofitness.app');
  await page.locator('#student-contact-phone').fill('+34622222222');
  await page
    .locator('#student-create-form')
    .getByRole('button', { name: 'Crear alumno' })
    .click();

  await expect(page.locator('#trainer-status')).toContainText(
    'Alumno creado correctamente.',
  );
  await expect
    .poll(async () =>
      Number((await page.locator('#summary-total').textContent()) || '0'),
    )
    .toBeGreaterThan(initialTotal);
  await expect
    .poll(async () =>
      Number((await page.locator('#summary-pending').textContent()) || '0'),
    )
    .toBeGreaterThanOrEqual(initialPending);

  const studentCard = page.locator('.student-card', { hasText: studentName });
  await expect(studentCard).toBeVisible();
  await expect(studentCard.getByText('Acceso activo')).toBeVisible();
  await expect(studentCard.locator('[data-student-contact]')).toContainText(
    'nuevo@saulofitness.app',
  );
  await expect(studentCard.locator('[data-student-app-session]')).toContainText(
    'Pendiente de activar desde el magic link único',
  );

  const studentsResponse = await request.get('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
  });
  expect(studentsResponse.ok()).toBeTruthy();
  const studentsPayload = await studentsResponse.json();
  const createdStudent = studentsPayload.students.find(
    (student) => student.name === studentName,
  );
  expect(createdStudent).toBeTruthy();
  expect(createdStudent.accessToken).toBeTruthy();

  await studentCard
    .getByRole('button', { name: 'Marcar pago recibido' })
    .click();

  await expect(page.locator('#trainer-status')).toContainText(
    'Pago registrado. Magic link listo para compartir desde email o WhatsApp.',
  );
  await expect
    .poll(async () =>
      Number((await page.locator('#summary-paid').textContent()) || '0'),
    )
    .toBeGreaterThan(initialPaid);
  await expect(studentCard.locator('[data-waiting-room-link]')).toContainText(
    '/acceso/',
  );
  await expect(studentCard.locator('[data-student-delivery]')).toContainText(
    'Listo para compartir',
  );
  await expect(studentCard.locator('[data-student-next-action]')).toContainText(
    'Compartir el magic link único',
  );
  await expect(
    studentCard.locator('[data-student-delivery-history]'),
  ).toContainText('ready');
  await expect(
    studentCard.getByRole('button', { name: 'Abrir email' }),
  ).toBeVisible();
  await expect(
    studentCard.getByRole('button', { name: 'Abrir WhatsApp' }),
  ).toBeVisible();
  await expect(studentCard.locator('[data-student-app-session]')).toContainText(
    'Lista tras abrir el magic link y preparar la PWA',
  );
  await expect(studentCard.getByText('Confirmado ·')).toBeVisible();

  await studentCard.getByRole('button', { name: 'Copiar magic link' }).click();
  await expect(page.locator('#trainer-status')).toContainText(
    'Enlace de sala de espera copiado y registrado.',
  );
  await expect(studentCard.locator('[data-student-delivery]')).toContainText(
    'Compartido manualmente',
  );
  await expect(studentCard.locator('[data-student-delivery]')).toContainText(
    'copy',
  );
  await expect(studentCard.locator('[data-student-next-action]')).toContainText(
    'Esperar a que el alumno abra la sala de espera',
  );
  await expect(
    studentCard.locator('[data-student-delivery-history]'),
  ).toContainText('Magic link copiado manualmente.');

  const waitingRoomHref = await studentCard
    .locator('[data-waiting-room-link]')
    .getAttribute('href');
  const waitingRoomPage = await request.get(new URL(waitingRoomHref).pathname);
  expect(waitingRoomPage.ok()).toBeTruthy();

  const waitingBrowserPage = await page.context().newPage();
  await waitingBrowserPage.goto(waitingRoomHref);
  await expect(waitingBrowserPage.locator('#waiting-title')).toContainText(
    studentName,
  );
  await expect(waitingBrowserPage.locator('#waiting-copy')).toContainText(
    'de un solo uso',
  );
  await expect(
    waitingBrowserPage.getByRole('link', { name: 'Abrir y activar tu app' }),
  ).toBeVisible();

  await waitingBrowserPage
    .getByRole('link', { name: 'Abrir y activar tu app' })
    .click();
  await expect(waitingBrowserPage).toHaveURL(/\/app\/\?section=routines&day=1/);
  await waitingBrowserPage.close();

  await page.getByRole('button', { name: 'Actualizar' }).click();
  await expect(
    studentCard.locator('[data-student-operational-state]'),
  ).toContainText('Acceso abierto');
  await expect(studentCard.locator('[data-student-delivery]')).toContainText(
    'Acceso abierto',
  );
  await expect(studentCard.locator('[data-student-delivery]')).toContainText(
    'app',
  );
  await expect(studentCard.locator('[data-student-next-action]')).toContainText(
    'Comprobar instalación y uso de la app',
  );
  await expect(
    studentCard.locator('[data-student-delivery-summary]'),
  ).toContainText('Último estado: acceso abierto');
  await expect(
    studentCard.locator('[data-student-delivery-history]'),
  ).toContainText('opened');
  await expect(
    studentCard.locator('[data-student-delivery-history]'),
  ).toContainText('app');

  const waitingBrowserPageReuse = await page.context().newPage();
  await waitingBrowserPageReuse.goto(waitingRoomHref);
  await expect(waitingBrowserPageReuse.locator('#waiting-title')).toHaveText(
    `Hola ${studentName}, tu app ya fue activada`,
  );
  await expect(waitingBrowserPageReuse.locator('#waiting-panel')).toContainText(
    'ya activó la app',
  );
  await waitingBrowserPageReuse.close();

  await studentCard
    .locator('[data-routine-day-title="1"]')
    .fill('Full body trainer');
  await studentCard
    .locator('[data-routine-day-meta="1"]')
    .fill('Activa · Fuerza base');
  await studentCard
    .locator('[data-routine-day-exercises="1"]')
    .fill(
      'Remo barra | 5 x 5 | 80% | 120 s | https://www.youtube.com/watch?v=dQw4w9WgXcQ\nPress banca | 4 x 8 | 75% | 90 s',
    );
  await studentCard
    .locator('[data-routine-day-title="3"]')
    .fill('Pull trainer');
  await studentCard
    .locator('[data-routine-day-meta="3"]')
    .fill('Activa · Espalda');
  await studentCard
    .locator('[data-routine-day-exercises="3"]')
    .fill('Jalón neutro | 4 x 12 | 68% | 75 s');
  await studentCard.getByRole('button', { name: 'Guardar rutina' }).click();

  await expect(page.locator('#trainer-status')).toContainText(
    'Rutina guardada correctamente.',
  );
  await expect(studentCard.locator('[data-student-routine]')).toHaveText(
    'Full body trainer',
  );
  await expect(
    studentCard.getByRole('link', { name: 'Vídeo' }).first(),
  ).toBeVisible();

  const studentDetailResponse = await request.get(
    `/api/trainer/students/${createdStudent.id}`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(studentDetailResponse.ok()).toBeTruthy();
  const studentDetailPayload = await studentDetailResponse.json();
  const accessToken = studentDetailPayload.student.accessToken;
  expect(accessToken).toBeTruthy();
  const routineResponse = await request.get(
    `/api/student/routine?access=${accessToken}&day=1`,
  );
  const routinePayload = await routineResponse.json();

  expect(routinePayload.currentDay.title).toBe('Full body trainer');
  expect(routinePayload.currentDay.exercises).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Remo barra',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
      expect.objectContaining({ name: 'Press banca' }),
    ]),
  );

  const dayThreeResponse = await request.get(
    `/api/student/routine?access=${accessToken}&day=3`,
  );
  const dayThreePayload = await dayThreeResponse.json();

  expect(dayThreePayload.currentDay.title).toBe('Pull trainer');
  expect(dayThreePayload.currentDay.exercises).toEqual(
    expect.arrayContaining([expect.objectContaining({ name: 'Jalón neutro' })]),
  );

  await studentCard.getByRole('button', { name: 'Revocar enlace' }).click();

  await expect(page.locator('#trainer-status')).toContainText(
    'Enlace revocado correctamente.',
  );
  await expect(studentCard.locator('[data-student-access-state]')).toHaveText(
    'Acceso revocado',
  );
});

test('trainer panel restores a saved session from local storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'local-trainer-token',
        refreshToken: 'local-trainer-refresh-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem('saulo-trainer-token', 'local-trainer-token');
  });

  await page.goto('/trainer');

  await expect(page.locator('#trainer-identity')).toContainText(
    'Saulo Trainer',
  );
  await expect(page.getByText('Lucía Ortega')).toBeVisible();
  await expect(page.locator('#trainer-status')).toContainText(
    'Sesión validada. Panel listo para operar.',
  );
});

test('trainer panel refreshes an expired saved session before loading students', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'expired-local-trainer-token',
        refreshToken: 'local-trainer-refresh-token',
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem(
      'saulo-trainer-token',
      'expired-local-trainer-token',
    );
  });

  await page.goto('/trainer');

  await expect(page.locator('#trainer-identity')).toContainText(
    'Saulo Trainer',
  );
  await expect(page.getByText('Lucía Ortega')).toBeVisible();
  await expect(page.locator('#trainer-status')).toContainText(
    'Sesión validada. Panel listo para operar.',
  );

  const session = await page.evaluate(() => {
    const raw = window.localStorage.getItem('saulo-trainer-session');
    return raw ? JSON.parse(raw) : null;
  });

  expect(session.accessToken).toBe('local-trainer-token');
  expect(session.refreshToken).toBe('local-trainer-refresh-token');
  expect(typeof session.expiresAt).toBe('string');
});

test('trainer panel clears stale metrics when an expired saved session cannot refresh', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'expired-local-trainer-token',
        refreshToken: 'invalid-refresh-token',
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem(
      'saulo-trainer-token',
      'expired-local-trainer-token',
    );
  });

  await page.goto('/trainer');

  await expect(page.locator('#trainer-identity')).toBeEmpty();
  await expect(page.locator('.empty-state')).toContainText(
    'No se pudo validar la sesión del entrenador.',
  );
  await expect(page.locator('#trainer-status')).toContainText(
    'La sesión del entrenador ha caducado. Inicia sesión de nuevo.',
  );
  await expect(page.locator('#summary-total')).toHaveText('0');
  await expect(page.locator('#summary-paid')).toHaveText('0');
  await expect(page.locator('#summary-pending')).toHaveText('0');
  await expect(page.locator('#summary-active')).toHaveText('0');

  const persistedSession = await page.evaluate(() => ({
    token: window.localStorage.getItem('saulo-trainer-token'),
    session: window.localStorage.getItem('saulo-trainer-session'),
  }));

  expect(persistedSession.token).toBeNull();
  expect(persistedSession.session).toBeNull();
});

test('trainer panel shows real follow-up data from the student activity', async ({
  page,
  request,
}) => {
  await request.post('/api/student/workout-reports', {
    headers: {
      Authorization: 'Bearer lucia-access',
    },
    data: {
      day: 3,
      feedback: 'Intensa',
      exercises: [
        {
          name: 'Jalón al pecho',
          done: true,
          comment: 'Buen control',
        },
      ],
      summary: 'Día 3 · Intensa',
    },
  });

  await request.post('/api/student/progress-photos', {
    headers: {
      Authorization: 'Bearer lucia-access',
    },
    data: {
      slot: 'Derecha',
      filename: 'derecha.png',
      contentType: 'image/png',
      dataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    },
  });

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'local-trainer-token',
        refreshToken: 'local-trainer-refresh-token',
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem('saulo-trainer-token', 'local-trainer-token');
  });

  await page.goto('/trainer');

  const luciaCard = page.locator('.student-card', { hasText: 'Lucía Ortega' });
  await expect(luciaCard.locator('[data-student-latest-report]')).toContainText(
    'Día 3',
  );
  await expect(luciaCard.locator('[data-student-latest-report]')).toContainText(
    'Intensa',
  );
  await expect(
    luciaCard.locator('[data-student-photos-summary]'),
  ).toContainText('Pendientes:');
  await expect(
    luciaCard.locator('[data-student-report-history]'),
  ).toContainText('Día 3');
  await expect(luciaCard.locator('[data-student-photo-detail]')).toContainText(
    'Derecha',
  );
  await expect(
    luciaCard.locator('[data-student-message-summary]'),
  ).toContainText('Recibidos:');
  await expect(
    luciaCard.locator('[data-student-message-detail]'),
  ).toContainText('Recibido');
});

test('trainer panel can filter students by search, status and plan', async ({
  page,
  request,
}) => {
  const stamp = Date.now();
  const pendingStudentName = `Pendiente Filtro ${stamp}`;
  const sentStudentName = `Enviado Filtro ${stamp}`;
  const sentStudentPlan = `Plan sent ${stamp}`;
  const pendingCard = page.locator('.student-card', {
    hasText: pendingStudentName,
  });
  const sentCard = page.locator('.student-card', {
    hasText: sentStudentName,
  });

  const createPendingStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: pendingStudentName,
      plan: 'Plan filtro',
      goal: 'Pendiente de pago',
    },
  });
  expect(createPendingStudent.status()).toBe(201);

  const createSentStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: sentStudentName,
      plan: sentStudentPlan,
      goal: 'Acceso enviado',
      contactEmail: `sent-${stamp}@saulofitness.app`,
      contactPhone: '+34611111111',
    },
  });
  expect(createSentStudent.status()).toBe(201);
  const sentStudent = (await createSentStudent.json()).student;

  const markSentStudentPaid = await request.post(
    `/api/trainer/students/${sentStudent.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
      data: {
        deliver: true,
      },
    },
  );
  expect(markSentStudentPaid.status()).toBe(201);

  const markSentStudentShared = await request.post(
    `/api/trainer/students/${sentStudent.id}/access/delivery`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
      data: {
        channel: 'copy',
        status: 'shared',
        note: 'Magic link compartido manualmente.',
      },
    },
  );
  expect(markSentStudentShared.status()).toBe(201);

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'local-trainer-token',
        refreshToken: 'local-trainer-refresh-token',
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem('saulo-trainer-token', 'local-trainer-token');
  });

  await page.goto('/trainer');

  await expect(pendingCard).toBeVisible();
  await expect(sentCard).toBeVisible();
  expect(
    Number((await page.locator('#ops-pending-payment').textContent()) || '0'),
  ).toBeGreaterThan(0);
  expect(
    Number((await page.locator('#ops-sent').textContent()) || '0'),
  ).toBeGreaterThan(0);

  await page.locator('#students-search').fill(sentStudentName);
  await expect(sentCard).toBeVisible();
  await expect(pendingCard).toHaveCount(0);

  await page.locator('#students-search').fill('');
  await page.locator('#students-status-filter').selectOption('pending');
  await expect(pendingCard).toBeVisible();
  await expect(sentCard).toHaveCount(0);

  await page.locator('#students-status-filter').selectOption('all');
  await page.locator('#students-plan-filter').selectOption(sentStudentPlan);
  await expect(sentCard).toBeVisible();
  await expect(pendingCard).toHaveCount(0);

  await page.locator('#students-plan-filter').selectOption('all');
  await page.locator('#students-status-filter').selectOption('sent');
  await expect(sentCard).toBeVisible();
  await expect(pendingCard).toHaveCount(0);
});

test('trainer panel can sort students and keeps summary metrics visible', async ({
  page,
  request,
}) => {
  const prefix = `Sort QA ${Date.now()}`;
  const pendingName = `${prefix} A`;
  const paidName = `${prefix} B`;

  const pendingResponse = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: pendingName,
      plan: 'Plan sort',
      goal: 'Pendiente',
    },
  });
  expect(pendingResponse.ok()).toBeTruthy();

  const paidCreateResponse = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: paidName,
      plan: 'Plan sort',
      goal: 'Pagado',
    },
  });
  expect(paidCreateResponse.ok()).toBeTruthy();
  const paidStudent = await paidCreateResponse.json();

  const paymentResponse = await request.post(
    `/api/trainer/students/${paidStudent.student.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentResponse.ok()).toBeTruthy();

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'saulo-trainer-session',
      JSON.stringify({
        accessToken: 'local-trainer-token',
        refreshToken: 'local-trainer-refresh-token',
        trainer: {
          id: 'local-trainer',
          email: 'local@saulofitness.app',
          name: 'Saulo Trainer',
          mode: 'local',
        },
      }),
    );
    window.localStorage.setItem('saulo-trainer-token', 'local-trainer-token');
  });

  await page.goto('/trainer');

  const total = Number(
    (await page.locator('#summary-total').textContent()) || '0',
  );
  const paid = Number(
    (await page.locator('#summary-paid').textContent()) || '0',
  );
  const pending = Number(
    (await page.locator('#summary-pending').textContent()) || '0',
  );

  expect(total).toBeGreaterThan(0);
  expect(paid).toBeGreaterThan(0);
  expect(pending).toBeGreaterThan(0);

  await page.locator('#students-search').fill(prefix);
  await page.locator('#students-sort').selectOption('operational');
  await expect(
    page.locator('.student-card').first().locator('[data-student-name]'),
  ).toHaveText(pendingName);

  await page.locator('#students-sort').selectOption('name-asc');
  await expect(
    page.locator('.student-card').first().locator('[data-student-name]'),
  ).toHaveText(pendingName);

  await page.locator('#students-sort').selectOption('paid-first');
  await expect(
    page.locator('.student-card').first().locator('[data-student-name]'),
  ).toHaveText(paidName);
});
