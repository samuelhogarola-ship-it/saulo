const { test, expect } = require('@playwright/test');

test('renders the student app with the routines section by default', async ({
  page,
}) => {
  await page.goto('/app/');

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
  await page.goto('/app/?section=routines&day=3');

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

test('shows the demo onboarding banner for the first client link', async ({
  page,
}) => {
  await page.goto('/app/?demo=101&section=routines&day=1');

  await expect(page.locator('#demo-banner strong')).toHaveText(
    'Hola Saulo, listo para comprobar la primera demo?',
  );
  await expect(page.locator('#demo-banner')).toContainText(
    'Mira las opciones disponibles',
  );
});

test('supports activation with one-time link and unlock with PIN', async ({
  page,
}) => {
  await page.goto('/app/?demo=201&claim=1&section=routines&day=1');

  await expect(
    page.getByRole('heading', { name: 'Activa tu acceso en este dispositivo' }),
  ).toBeVisible();
  await page.locator('#activation-pin-input').fill('1234');
  await page.getByRole('button', { name: 'Activar app' }).click();

  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(
    page.getByRole('heading', { name: 'Activa tu acceso en este dispositivo' }),
  ).toHaveCount(0);

  await page.evaluate(() => window.sessionStorage.clear());
  await page.goto('/app/');

  await expect(
    page.getByRole('heading', { name: 'Introduce tu PIN para continuar' }),
  ).toBeVisible();
  await page.locator('#activation-pin-input').fill('1234');
  await page.getByRole('button', { name: 'Entrar con PIN' }).click();

  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(
    page.getByRole('heading', { name: 'Introduce tu PIN para continuar' }),
  ).toHaveCount(0);
});

test('creates a workout report when training is completed', async ({
  page,
}) => {
  await page.goto('/app/?section=routines&day=1');

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
  await expect(
    page.locator('#messages-sent-panel').getByText(/Hoy · \d{2}:\d{2}/),
  ).toBeVisible();
});

test('renders message, subscription and profile sections', async ({ page }) => {
  await page.goto('/app/');

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
