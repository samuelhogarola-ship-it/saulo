const { test, expect } = require('@playwright/test');

test('renders the brand landing and keeps the public flow clean', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Tu mejor version, nuestra mision.',
    }),
  ).toBeVisible();
  await expect(page.getByAltText('Logo de Saulo Fitness')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'DESCUBRIR LA APP' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'CONTACTO' })).toBeVisible();
  await expect(page.getByText('Mensajes de la demo')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
});

test('links the landing CTA to the public student app demo', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'DESCUBRIR LA APP' }).click();

  await expect(
    page.getByRole('heading', { name: 'Saulo Fitness APP' }),
  ).toBeVisible();
  await expect(page.locator('#topbar-title')).toHaveText('Rutinas del alumno');
  await expect(page.locator('#context-nav')).toContainText('Día 1');
  await expect(page.locator('#demo-banner strong')).toHaveText(
    'Hola Saulo, listo para comprobar la primera demo?',
  );
});
