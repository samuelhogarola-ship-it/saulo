const { test, expect } = require('@playwright/test');

test('renders the student app with the routines section by default', async ({
  page,
}) => {
  await page.goto('/app/');

  await expect(
    page.getByRole('heading', { name: 'Saulo Fitness APP' }),
  ).toBeVisible();
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(page.locator('#student-plan')).toHaveText('Definición');
  await expect(
    page
      .getByLabel('Secciones de alumno')
      .getByRole('button', { name: 'Rutinas' }),
  ).toBeVisible();
  await expect(page.locator('#student-summary')).toHaveText(
    'Solo tú marcas tus límites.',
  );
  await expect(page.locator('#context-nav')).toContainText('Día 1');
  await expect(page.locator('#routine-day-label')).toHaveText('Día 1');
  await expect(page.getByRole('heading', { name: 'Hip thrust' })).toBeVisible();
});

test('supports deep links to a specific training day', async ({ page }) => {
  await page.goto('/app/?section=routines&day=3');

  await expect(page.locator('#routine-day-label')).toHaveText('Día 3');
  await expect(page.locator('#routine-day-title')).toHaveText(
    'Espalda + bíceps',
  );
  await expect(page.locator('#context-nav')).toContainText('Día 3');
  await expect(page.getByText('Jalón al pecho')).toBeVisible();
  await expect(page.getByText('Sin vídeo').first()).toBeVisible();
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

test('creates a workout report when training is completed', async ({
  page,
}) => {
  await page.goto('/app/?section=routines&day=1');

  await page
    .locator('textarea')
    .first()
    .fill('Muy buenas sensaciones en la parte final.');

  await page.getByRole('button', { name: 'Entrenamiento finalizado' }).click();
  await expect(
    page.getByRole('heading', { name: '¿Qué tal fue la rutina?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Bien' }).click();

  await expect(page.getByText('Día 1 finalizado')).toBeVisible();
  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Mensajes' })
    .click();
  await expect(page.getByText('Informe Día 1')).toBeVisible();
});

test('renders message columns and profile/subscription sections', async ({
  page,
}) => {
  await page.goto('/app/');

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Mensajes' })
    .click();
  await expect(page.locator('#messages-title')).toHaveText('Mensajes');
  await expect(page.locator('#context-nav')).toContainText('Buzón de entrada');
  await expect(
    page.getByRole('heading', { name: 'Recibidos', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Enviados', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Recordatorios', exact: true }),
  ).toBeVisible();

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Suscripción' })
    .click();
  await expect(page.locator('#subscription-title')).toHaveText('Suscripción');
  await expect(page.locator('#context-nav')).toContainText('Plan 30 días');
  await expect(
    page.locator('.info-card strong').filter({ hasText: 'Membresía activa' }),
  ).toBeVisible();
  await expect(page.getByText('8 de julio de 2026')).toBeVisible();

  await page
    .getByLabel('Secciones de alumno')
    .getByRole('button', { name: 'Perfil' })
    .click();
  await expect(page.locator('#profile-title')).toHaveText('Perfil');
  await expect(page.locator('#hero-title')).toHaveText('Mide tu progreso.');
  await expect(page.locator('#hero-copy')).toHaveAttribute('hidden', '');
  await expect(page.locator('#hero-stat-grid')).toBeVisible();
  await expect(page.locator('#profile-calendar')).toBeVisible();
  await expect(page.getByText('Junio 2026')).toBeVisible();
  await expect(page.getByText('Hoy en verde.')).toBeVisible();
  await expect(page.locator('#context-nav')).toContainText('Objetivo');
  await expect(page.locator('#context-nav')).toContainText('Fotos');
  await page
    .locator('#context-nav')
    .getByRole('button', { name: 'Fotos' })
    .click();
  await expect(page.locator('#profile-photos-card')).toBeVisible();
  await expect(page.getByText('Se suben 1 vez al mes')).toBeVisible();
  await expect(page.getByText('31 años')).toBeVisible();
  await expect(page.getByText('63,4 kg')).toBeVisible();
  await expect(
    page.getByText('Practica natación y cuida la rodilla'),
  ).toBeVisible();
});
