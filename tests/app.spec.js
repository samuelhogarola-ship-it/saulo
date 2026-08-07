const { test, expect } = require('@playwright/test');

test('renders the connected student app with the weekly routine by default', async ({
  page,
}) => {
  await page.goto('/app/?access=lucia-access');

  await expect(
    page.getByRole('heading', { name: 'Saulo Fitness APP' }),
  ).toBeVisible();
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(page.locator('#student-name')).toHaveText('Lucía Ortega');
  await expect(page.locator('#student-plan')).toContainText(
    'Definición avanzada',
  );
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Lunes' }),
  ).toBeVisible();
  await expect(page.locator('#routine-day-label')).toHaveText('Lunes');
  await expect(page.getByRole('heading', { name: 'Hip thrust' })).toBeVisible();
});

test('supports deep links to a specific training day', async ({ page }) => {
  await page.goto('/app/?access=lucia-access&section=routines&day=3');

  await expect(page.locator('#student-name')).toHaveText('Lucía Ortega');
  await expect(page.locator('#routine-day-label')).toHaveText('Miércoles');
  await expect(page.locator('#routine-day-title')).toHaveText(
    'Espalda + bíceps',
  );
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Miércoles' }),
  ).toBeVisible();
  await expect(page.getByText('Jalón al pecho')).toBeVisible();
});

test('loads the student product from the API', async ({ page }) => {
  await page.goto('/app/?access=lucia-access&section=routines&day=1');

  await expect(page.locator('#student-name')).toHaveText('Lucía Ortega');
  await expect(page.locator('#status-banner')).toBeHidden();
  await expect(
    page.getByText('Video disponible en este ejercicio'),
  ).toBeVisible();
});

test('opens the embedded exercise video modal from the student routine', async ({
  page,
}) => {
  await page.goto('/app/?access=lucia-access&section=routines&day=1');

  await page.locator('.exercise-video.is-clickable').first().click();

  await expect(page.locator('.workout-modal-video')).toBeVisible();
  await expect(
    page.locator('.workout-modal-video .video-frame iframe'),
  ).toHaveAttribute('src', /youtube\.com\/embed\/rVMsqygXtG4/);
});

test('opens the demo link without requiring PIN while activation is paused', async ({
  page,
}) => {
  await page.goto('/app/?access=lucia-access&section=routines&day=1');

  const firstComment = page.locator('.exercise-comment').first();
  await expect(firstComment).toBeVisible();
  await firstComment.fill('Muito boas sensações na parte final.');

  await page.getByRole('button', { name: 'Entrenamiento finalizado' }).click();
  await expect(
    page.getByRole('heading', { name: '¿Qué tal fue la rutina?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Bien' }).click();

  await expect(page.locator('#topbar-title')).toHaveText('Mensajes');
  await expect(page.locator('#messages-sent-panel')).toBeVisible();
  await expect(
    page
      .locator('#messages-sent-panel')
      .getByText('Resumen de entrenamiento')
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator('#messages-sent-panel')
      .getByText(/Hoy · \d{2}:\d{2}/)
      .first(),
  ).toBeVisible();
  await expect(page.locator('#trainer-message-filter')).toHaveValue(
    'client-lucia',
  );
});

test('renders message, subscription and profile sections', async ({ page }) => {
  await page.goto('/app/?access=lucia-access');

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Mensajes' })
    .click();
  await expect(page.locator('#messages-title')).toHaveText('Mensajes');
  await expect(page.locator('#messages-inbox-panel')).toBeVisible();
  await expect(
    page.getByText('Esta semana prioriza descanso entre series pesadas', {
      exact: false,
    }),
  ).toBeVisible();

  await page
    .locator('#context-nav')
    .getByRole('button', { name: 'Enviar mensaje' })
    .click();
  await page.locator('#message-compose-subject').fill('Dúvida rápida');
  await page
    .locator('#message-compose-body')
    .fill('Podemos mover a sessão de amanhã para a tarde?');
  await page
    .locator('#messages-compose-panel')
    .getByRole('button', { name: 'Enviar mensaje' })
    .click();
  await expect(page.locator('#messages-sent-panel')).toBeVisible();
  await expect(page.getByText('Dúvida rápida')).toBeVisible();

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Suscripción' })
    .click();
  await expect(page.locator('#subscription-title')).toHaveText('Suscripción');
  await expect(page.getByText('12 de julio de 2026')).toBeVisible();
  await expect(page.getByText('19 de julio de 2026')).toBeVisible();

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Perfil' })
    .click();
  await expect(page.locator('#profile-title')).toHaveText('Perfil');
  await expect(page.getByText('82,1 kg')).toBeVisible();
  await expect(
    page.getByText('Subir fuerza sin perder movilidad'),
  ).toBeVisible();
});

test('trainer navigation loads the five main sections', async ({ page }) => {
  await page.goto('/trainer/');

  await expect(page.locator('#trainer-topbar-title')).toHaveText('Ejercicios');
  const trainerNav = page.getByLabel('Secciones del panel entrenador');
  await expect(
    trainerNav.getByRole('button', { name: 'Clientes' }),
  ).toBeVisible();
  await expect(
    trainerNav.getByRole('button', { name: 'Ejercicios' }),
  ).toBeVisible();
  await expect(
    trainerNav.getByRole('button', { name: 'Rutinas' }),
  ).toBeVisible();
  await expect(
    trainerNav.getByRole('button', { name: 'Mensajes' }),
  ).toBeVisible();
  await expect(
    trainerNav.getByRole('button', { name: 'Eventos' }),
  ).toBeVisible();
  await expect(
    trainerNav.getByRole('button', { name: 'Ajustes' }),
  ).toBeVisible();

  await trainerNav.getByRole('button', { name: 'Clientes' }).click();
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Clientes');
  await trainerNav.getByRole('button', { name: 'Rutinas' }).click();
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Rutinas');
  await trainerNav.getByRole('button', { name: 'Mensajes' }).click();
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Mensajes');
  await trainerNav.getByRole('button', { name: 'Eventos' }).click();
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Eventos');
  await trainerNav.getByRole('button', { name: 'Ajustes' }).click();
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Ajustes');
});

test('guardar rutina creates a draft template without assigned clients', async ({
  page,
}) => {
  await page.goto('/trainer/');

  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  await page.locator('#builder-routine-name').fill('Rutina draft Playwright');
  await page.locator('#exercise-search-input').fill('Face pull');
  await page.getByRole('button', { name: 'Elegir día para Face pull' }).click();
  await page.locator('[data-add-exercise-day="ex-face-pull"]').first().click();
  await page.getByRole('button', { name: 'Guardar rutina' }).click();

  await expect(page.locator('#trainer-topbar-title')).toHaveText('Rutinas');
  const draftCard = page
    .locator('.routine-row')
    .filter({ hasText: 'Rutina draft Playwright' });
  await expect(draftCard).toContainText('Rutina prototipo');
});

test('trainer can create and send a routine and the student view updates', async ({
  page,
}) => {
  await page.goto('/trainer/');

  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  await page.locator('#builder-routine-name').fill('Rutina conectada');
  await page.locator('#builder-client-select').selectOption('client-mario');
  await page.locator('#exercise-search-input').fill('Face pull');
  await page.getByRole('button', { name: 'Elegir día para Face pull' }).click();
  await page.locator('[data-add-exercise-day="ex-face-pull"]').first().click();
  await page.getByRole('button', { name: 'Crear y Enviar Rutina' }).click();

  await expect(page.locator('#trainer-topbar-title')).toHaveText('Clientes');
  await expect(page.locator('#client-detail-name')).toHaveText('Mario Vega');
  await expect(page.locator('#client-active-routine-name')).toHaveText(
    'Rutina conectada',
  );

  await page.goto('/app/?client=client-mario&section=routines&day=monday');
  await expect(page.locator('#student-name')).toHaveText('Mario Vega');
  await expect(page.getByRole('heading', { name: 'Face pull' })).toBeVisible();
});

test('trainer messages and profile edits sync back to the student view', async ({
  page,
}) => {
  await page.goto(
    '/trainer/?section=messages&client=client-hugo&messageView=trainer-messages-compose',
  );

  await page.locator('#trainer-message-client').selectOption('client-hugo');
  await page.locator('#trainer-message-subject').fill('Ajuste semanal');
  await page
    .locator('#trainer-message-body')
    .fill('Revisa el cardio suave y confirma sensaciones mañana.');
  await page
    .locator('#trainer-message-form')
    .getByRole('button', { name: 'Enviar mensaje' })
    .click();

  await page.goto('/trainer/?section=clients&client=client-hugo');
  await page.locator('#client-weight-input').fill('89,9 kg');
  await page.locator('#client-weight-input').blur();
  await page.locator('#client-subscription-input').fill('2026-08-01');
  await page.locator('#client-subscription-input').blur();

  await page.goto(
    '/app/?client=client-hugo&section=messages&focus=messages-inbox',
  );
  await expect(page.getByText('Ajuste semanal')).toBeVisible();

  await page.goto('/app/?client=client-hugo&section=profile');
  await expect(page.getByText('89,9 kg')).toBeVisible();

  await page.goto(
    '/app/?client=client-hugo&section=messages&focus=messages-reminders',
  );
  await expect(page.locator('#subscription-end-value')).toHaveText(
    '1 de agosto de 2026',
  );
});

test('reset demo restores the seed state', async ({ page }) => {
  await page.goto('/trainer/?section=clients&client=client-hugo');

  await page.locator('#client-weight-input').fill('99,9 kg');
  await page.locator('#client-weight-input').blur();

  await page
    .getByLabel('Secciones del panel entrenador')
    .getByRole('button', { name: 'Ajustes' })
    .click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Restablecer datos' }).click();

  await page.goto('/app/?client=client-hugo&section=profile');
  await expect(page.getByText('91,3 kg')).toBeVisible();
});

test.describe('PWA behavior', () => {
  test.use({ serviceWorkers: 'allow' });

  test('registers the service worker and serves the app shell offline', async ({
    page,
    context,
  }) => {
    await page.goto('/app/?section=routines&day=monday');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );

    const cacheKeys = await page.evaluate(() => caches.keys());
    expect(cacheKeys).toContain('saulo-fitness-pwa-v6');

    await context.setOffline(true);
    await page.goto('/app/?section=messages');

    await expect(page.locator('#topbar-title')).toHaveText('Mensajes');
    await expect(page.locator('#messages-title')).toHaveText('Mensajes');

    await context.setOffline(false);
  });
});

test('requires a valid student access link before loading product data', async ({
  page,
}) => {
  await page.goto('/app/');

  await expect(page.locator('#status-banner')).toContainText(
    'Acceso no disponible.',
  );
  await expect(page.locator('#student-name')).toHaveText('Acceso requerido');
  await expect(page.locator('#exercise-list')).toBeEmpty();
});

test('blocks invalid student access without showing routine data', async ({
  page,
}) => {
  await page.goto('/app/?access=invalid-access&section=routines&day=1');

  await expect(page).toHaveURL(/\/app\/\?section=routines&day=1&focus=day-1$/);
  await expect(page.locator('#status-banner')).toContainText(
    'Acceso no disponible.',
  );
  await expect(page.locator('#student-name')).toHaveText('Acceso requerido');
  await expect(page.locator('#exercise-list')).toBeEmpty();
});

test('shows a clean error state for an invalid waiting-room link', async ({
  page,
}) => {
  await page.goto('/sala/waiting-room-token-invalido');

  await expect(page.locator('#waiting-title')).toHaveText(
    'Enlace no disponible',
  );
  await expect(page.locator('#waiting-copy')).toContainText(
    'ya no está activo',
  );
  await expect(page.locator('#waiting-panel')).toContainText(
    'Enlace de acceso no disponible.',
  );
  await expect(page.locator('#waiting-actions')).toBeHidden();
});

test('persists student access locally after the first valid magic link', async ({
  page,
}) => {
  await page.goto('/app/?access=lucia-access&section=messages');

  await expect(page.locator('#student-name')).toHaveText('Lucía Ortega');
  await expect(page).toHaveURL(/\/app\/\?section=messages/);

  await page.goto('/app/?section=profile');

  await expect(page.locator('#student-name')).toHaveText('Lucía Ortega');
  await expect(page.locator('#profile-title')).toHaveText('Perfil');
});

test('switching to a new student access clears cached payloads from the previous token', async ({
  page,
  request,
}) => {
  const firstAccessToken = `switch-access-a-${Date.now()}`;
  const secondAccessToken = `switch-access-b-${Date.now()}`;

  const firstStudentResponse = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Switch A ${Date.now()}`,
      contactEmail: `switch-a-${Date.now()}@saulofitness.app`,
      accessToken: firstAccessToken,
    },
  });
  expect(firstStudentResponse.status()).toBe(201);
  const firstStudent = (await firstStudentResponse.json()).student;

  const secondStudentResponse = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Switch B ${Date.now()}`,
      contactEmail: `switch-b-${Date.now()}@saulofitness.app`,
      accessToken: secondAccessToken,
    },
  });
  expect(secondStudentResponse.status()).toBe(201);
  const secondStudent = (await secondStudentResponse.json()).student;

  await page.goto(`/app/?access=${firstAccessToken}&section=messages`);

  await expect(page.locator('#student-name')).toHaveText(firstStudent.name);

  const luciaCacheKeys = await page.evaluate(
    (accessToken) =>
      Object.keys(window.localStorage).filter((key) =>
        key.includes(`access=${accessToken}`),
      ),
    firstAccessToken,
  );
  expect(luciaCacheKeys.length).toBeGreaterThan(0);

  await page.goto(`/app/?access=${secondAccessToken}&section=messages`);

  await expect(page).toHaveURL(
    /\/app\/\?section=messages(?:&focus=messages-inbox)?$/,
  );
  await expect(page.locator('#student-name')).toHaveText(secondStudent.name);

  const localState = await page.evaluate(
    ({ firstAccessToken, secondAccessToken }) => ({
      storedToken: window.localStorage.getItem('saulo-student-access-token'),
      luciaKeys: Object.keys(window.localStorage).filter((key) =>
        key.includes(`access=${firstAccessToken}`),
      ),
      hugoKeys: Object.keys(window.localStorage).filter((key) =>
        key.includes(`access=${secondAccessToken}`),
      ),
    }),
    { firstAccessToken, secondAccessToken },
  );

  expect(localState.storedToken).toBe(secondAccessToken);
  expect(localState.luciaKeys).toEqual([]);
  expect(localState.hugoKeys.length).toBeGreaterThan(0);
});

test('clears persisted student access after the token is revoked', async ({
  page,
  request,
}) => {
  const accessToken = `revocable-access-${Date.now()}`;
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Revocable ${Date.now()}`,
      contactEmail: `revocable-${Date.now()}@saulofitness.app`,
      accessToken,
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;

  await page.goto(`/app/?access=${accessToken}&section=routines&day=1`);
  await expect(page.locator('#student-name')).toHaveText(createdStudent.name);

  const revokeResponse = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/revoke`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(revokeResponse.ok()).toBeTruthy();

  await page.goto('/app/?section=messages');
  await expect(page.locator('#status-banner')).toContainText(
    'Acceso no disponible.',
  );
  await expect(page.locator('#student-name')).toHaveText('Acceso requerido');

  const storedToken = await page.evaluate(() =>
    window.localStorage.getItem('saulo-student-access-token'),
  );
  expect(storedToken || '').toBe('');
});

test('consumes the waiting room magic link and keeps the student session in the PWA', async ({
  page,
  request,
}) => {
  const paymentReceived = await request.post(
    '/api/trainer/students/student-hugo/payment-received',
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentReceived.status()).toBe(201);

  const payload = await paymentReceived.json();
  const waitingRoomUrl = payload.waitingRoom.waitingRoomUrl;
  const waitingRoomToken = payload.waitingRoom.waitingRoomToken;

  await page.goto(waitingRoomUrl);
  await expect(page.locator('#waiting-title')).toContainText('Hugo Martín');
  await expect(page.locator('#waiting-copy')).toContainText('de un solo uso');
  await expect(page.locator('#waiting-panel')).toContainText(
    'tu sesión quedará iniciada',
  );

  const waitingRoomStillAvailable = await request.get(
    `/api/waiting-room/${waitingRoomToken}`,
  );
  expect(waitingRoomStillAvailable.ok()).toBeTruthy();

  await page.getByRole('link', { name: 'Abrir y activar tu app' }).click();
  await expect(page).toHaveURL(/\/app\/\?section=routines&day=1/);
  await expect(page.locator('#student-name')).toHaveText('Hugo Martín');
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');

  await page.goto('/app/?section=messages');
  await expect(page.locator('#student-name')).toHaveText('Hugo Martín');
  await expect(page.locator('#topbar-title')).toHaveText('Mensajes');

  await page.goto(waitingRoomUrl);
  await expect(page.locator('#waiting-title')).toContainText(
    'tu app ya fue activada',
  );
  await expect(page.locator('#waiting-panel')).toContainText(
    'ya activó la app',
  );
  await page.getByRole('link', { name: 'Abrir tu app' }).click();
  await expect(page).toHaveURL(/\/app\/\?section=routines&day=1/);
  await expect(page.locator('#student-name')).toHaveText('Hugo Martín');
});

test('redirects legacy access links into the real waiting-room product flow', async ({
  page,
  request,
}) => {
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Legacy ${Date.now()}`,
      contactEmail: `legacy-${Date.now()}@saulofitness.app`,
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;
  const paymentReceived = await request.post(
    `/api/trainer/students/${createdStudent.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentReceived.status()).toBe(201);

  const payload = await paymentReceived.json();
  const waitingRoomToken = payload.waitingRoom.waitingRoomToken;

  await page.goto(`/acceso/${waitingRoomToken}`);
  await expect(page).toHaveURL(new RegExp(`/sala/${waitingRoomToken}`));
  await expect(page.locator('#waiting-title')).toContainText(
    createdStudent.name,
  );

  await page.goto(`/demo/${waitingRoomToken}`);
  await expect(page).toHaveURL(new RegExp(`/sala/${waitingRoomToken}`));
});

test('shows the old waiting-room link as unavailable after access rotation', async ({
  page,
  request,
}) => {
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Waiting Old ${Date.now()}`,
      contactEmail: `waiting-old-${Date.now()}@saulofitness.app`,
      contactPhone: '+34644444444',
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;
  const paymentReceived = await request.post(
    `/api/trainer/students/${createdStudent.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentReceived.status()).toBe(201);

  const paymentPayload = await paymentReceived.json();
  const previousWaitingRoomToken = paymentPayload.waitingRoom.waitingRoomToken;

  const rotateAccess = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/rotate`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(rotateAccess.status()).toBe(201);

  await page.goto(`/sala/${previousWaitingRoomToken}`);

  await expect(page.locator('#waiting-title')).toHaveText(
    'Enlace no disponible',
  );
  await expect(page.locator('#waiting-panel')).toContainText(
    'Enlace de acceso no disponible.',
  );
  await expect(page.locator('#waiting-actions')).toBeHidden();
});

test.describe('PWA behavior', () => {
  test.use({ serviceWorkers: 'allow' });

  test('registers the service worker and serves the app shell offline', async ({
    page,
    context,
  }) => {
    await page.goto('/app/?access=lucia-access&section=routines&day=1');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );

    const cacheKeys = await page.evaluate(() => caches.keys());
    expect(cacheKeys).toContain('saulo-fitness-app-v13');

    await context.setOffline(true);
    await page.goto('/app/?access=lucia-access&section=messages');
    await expect(page.locator('#topbar-title')).toHaveText('Mensajes');
    await context.setOffline(false);
  });
});

test('opens the events panel inside app saulo and allows trainer login', async ({
  page,
}) => {
  await page.goto('/app/eventos');

  await expect(
    page.getByRole('heading', { name: 'APP Eventos' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Panel de eventos dentro de Saulo Fitness APP',
    }),
  ).toBeVisible();

  await page.getByLabel('Email').fill('local@saulofitness.app');
  await page.getByLabel('Contraseña').fill('saulo1234');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Gestiona eventos y registros' }),
  ).toBeVisible();
  await expect(page.getByText('local@saulofitness.app')).toBeVisible();
});

test('redirects the old events admin route to the app saulo panel', async ({
  page,
}) => {
  await page.goto('/admin/eventos');

  await expect(page).toHaveURL(/\/app\/eventos\/?$/);
  await expect(
    page.getByRole('heading', { name: 'APP Eventos' }),
  ).toBeVisible();
});
