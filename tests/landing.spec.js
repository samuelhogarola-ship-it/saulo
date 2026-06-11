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

test('submits the questionnaire and shows the thank-you screen', async ({
  page,
}) => {
  await page.goto('/');

  await page
    .getByPlaceholder('Ej. Saulo Fitness App')
    .fill('Saulo Fitness App');

  for (let step = 0; step < 6; step += 1) {
    await page.getByRole('button', { name: 'Siguiente' }).click();
  }

  await page.getByRole('button', { name: 'Enviar cuestionario' }).click();

  await expect(
    page.getByRole('heading', {
      name: 'Tu mensaje se ha enviado, muchas gracias',
    }),
  ).toBeVisible();
});
