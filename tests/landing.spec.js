const { test, expect } = require('@playwright/test');

test('renders the temporary landing with visible form and free comments field', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Cuestionario técnico para tu plataforma',
    }),
  ).toBeVisible();
  await expect(page.locator('.wf-logo')).toBeVisible();
  await expect(page.locator('.form-panel')).toBeVisible();
  await expect(page.getByText('Si falta algo, añádelo aquí')).toBeVisible();
  await expect(page.getByPlaceholder('Ej. Saulo Fitness App')).toBeVisible();
});
