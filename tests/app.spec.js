const { test, expect } = require('@playwright/test');

test('renders the student app with the routines section by default', async ({
  page,
}) => {
  await page.goto('/app/?access=lucia-access');

  await expect(
    page.getByRole('heading', { name: 'Saulo Fitness APP' }),
  ).toBeVisible();
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(page.locator('#student-plan')).toContainText('Definición');
  await expect(page.locator('#student-summary')).toHaveText(
    'Solo tú marcas tus límites.',
  );
  await expect(
    page
      .getByLabel('Secciones de alumno')
      .getByRole('button', { name: 'Rutinas' }),
  ).toBeVisible();
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Día 1' }),
  ).toBeVisible();
  await expect(page.locator('#routine-day-label')).toHaveText('Día 1');
  await expect(page.getByRole('heading', { name: 'Hip thrust' })).toBeVisible();
  await expect(
    page.getByText('Video disponible en este ejercicio'),
  ).toBeVisible();
});

test('supports deep links to a specific training day', async ({ page }) => {
  await page.goto('/app/?access=lucia-access&section=routines&day=3');

  await expect(page.locator('#routine-day-label')).toHaveText('Día 3');
  await expect(page.locator('#routine-day-title')).toHaveText(
    'Espalda + bíceps',
  );
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Día 3' }),
  ).toBeVisible();
  await expect(page.getByText('Jalón al pecho')).toBeVisible();
  await expect(page.getByText('Remo con mancuerna')).toBeVisible();
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

test('creates a workout report when training is completed', async ({
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
});

test('renders message, subscription and profile sections', async ({ page }) => {
  await page.goto('/app/?access=lucia-access');

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Mensajes' })
    .click();
  await expect(page.locator('#messages-title')).toHaveText('Mensajes');
  await expect(
    page.locator('#context-nav').getByRole('button', {
      name: 'Buzón de entrada',
    }),
  ).toBeVisible();
  await expect(page.locator('#messages-inbox-panel')).toBeVisible();
  await expect(
    page.getByText('Esta semana treinaste muito duro', { exact: false }),
  ).toBeVisible();

  await page
    .locator('#context-nav')
    .getByRole('button', { name: 'Enviar mensaje' })
    .click();
  await expect(page.locator('#messages-compose-panel')).toBeVisible();
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
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Plan 30 días' }),
  ).toBeVisible();
  await expect(page.getByText('Membresía activa')).toBeVisible();
  await expect(page.getByText('8 de julio de 2026')).toBeVisible();

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Perfil' })
    .click();
  await expect(page.locator('#profile-title')).toHaveText('Perfil');
  await expect(
    page.locator('#context-nav').getByRole('button', { name: 'Fotos' }),
  ).toBeVisible();
  await expect(page.getByText('31 años')).toBeVisible();
  await expect(page.getByText('63,4 kg')).toBeVisible();
  await expect(
    page.getByText('Practica natación y cuida la rodilla tras una lesión.'),
  ).toBeVisible();
  await page
    .locator('#context-nav')
    .getByRole('button', { name: 'Fotos' })
    .click();
  await expect(page.locator('#profile-photos-card')).toBeVisible();
  await expect(page.getByText('Histórico mensual')).toBeVisible();
  await expect(page.getByText('Junio 2026')).toBeVisible();
  await expect(page.getByText('4 fotos subidas')).toBeVisible();
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
    expect(cacheKeys).toContain('saulo-fitness-app-v12');

    await context.setOffline(true);
    await page.goto('/app/?access=lucia-access&section=messages');
    await expect(page.locator('#topbar-title')).toHaveText('Mensajes');
    await context.setOffline(false);
  });
});
