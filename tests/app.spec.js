const { test, expect } = require('@playwright/test');

test('renders the real app workspace with coach metrics', async ({ page }) => {
  await page.goto('/app/');

  await expect(page.getByRole('heading', { name: 'Coach OS' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Panel general' }),
  ).toBeVisible();
  await expect(
    page.locator('.metric-label').filter({ hasText: 'Alumnos activos' }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: /Lucia Ortega/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Deja esta demo en el móvil con icono propio',
    }),
  ).toBeVisible();
  await expect(page.getByText('Añadir a pantalla de inicio')).toBeVisible();
});

test('switches from coach mode to student mode', async ({ page }) => {
  await page.goto('/app/');

  await page.getByRole('tab', { name: 'Alumno' }).click();

  await expect(
    page.getByRole('heading', { name: 'Mi area personal' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu perfil' })).toBeVisible();
  await expect(page.getByText('Acceso por PIN o magic link')).toBeVisible();
});

test('navigates to the billing panel from the sidebar', async ({ page }) => {
  await page.goto('/app/');

  await page.getByRole('button', { name: 'Pagos' }).click();

  await expect(
    page.getByRole('heading', { name: 'Renovaciones' }),
  ).toBeVisible();
  await expect(page.getByText('Plan Premium mensual')).toBeVisible();
});

test('supports direct links to the student routine demo', async ({ page }) => {
  await page.goto('/app/?role=student&section=plans');

  await expect(
    page.getByRole('heading', { name: 'Mi area personal' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Rutina activa' }),
  ).toBeVisible();
  await expect(page.getByText('Hoy: Pierna fuerza')).toBeVisible();
});
