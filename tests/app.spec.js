const { test, expect } = require('@playwright/test');

test('renders the connected student app with the weekly routine by default', async ({
  page,
}) => {
  await page.goto('/app/');

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

test('supports legacy deep links and the client query param', async ({
  page,
}) => {
  await page.goto('/app/?client=client-lucia&section=routines&day=3');

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

test('shows the demo onboarding banner for the first client link', async ({
  page,
}) => {
  await page.goto('/app/?demo=101&section=routines&day=1');

  await expect(page.locator('#demo-banner strong')).toHaveText(
    'Hola Saulo, listo para revisar tu app?',
  );
  await expect(page.locator('#demo-banner')).toContainText(
    'Comprueba la experiencia completa del alumno',
  );
});

test('opens the demo link without requiring PIN while activation is paused', async ({
  page,
}) => {
  await page.goto('/demo/101');

  await expect(page).toHaveURL(/demo=101/);
  await expect(page).toHaveURL(/claim=1/);
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(
    page.getByRole('heading', { name: 'Activa tu acceso en este dispositivo' }),
  ).toHaveCount(0);
});

test('creates a workout report and surfaces it in the trainer inbox', async ({
  page,
}) => {
  await page.goto('/app/?client=client-lucia&section=routines&day=monday');

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
  await expect(page.getByText('Resumen de entrenamiento')).toBeVisible();

  await page.goto('/trainer/?section=messages&messageClient=client-lucia');
  await expect(page.locator('#trainer-topbar-title')).toHaveText('Mensajes');
  await expect(
    page
      .locator('#trainer-messages-inbox')
      .getByText('Resumen de entrenamiento'),
  ).toBeVisible();
  await expect(page.locator('#trainer-message-filter')).toHaveValue(
    'client-lucia',
  );
});

test('renders connected message, subscription and profile sections for a selected client', async ({
  page,
}) => {
  await page.goto('/app/?client=client-mario');

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
