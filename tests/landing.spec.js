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

test('keeps the user on the first step when required data is missing', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Siguiente' }).click();

  await expect(page.locator('#progress-text')).toHaveText('Paso 1 de 7');
  await expect(page.locator('input[name="brandName"]')).toBeFocused();
  await expect(page.locator('#form-status')).toContainText(
    'Revisa los campos obligatorios antes de continuar con el siguiente bloque.',
  );
});

test('shows a validation message when the uploaded logo has an invalid format', async ({
  page,
}) => {
  await page.goto('/');

  await page.locator('input[name="logoFile"]').setInputFiles({
    name: 'logo.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('invalid logo file'),
  });

  await expect(page.locator('#form-status')).toContainText(
    'El logotipo debe estar en formato PNG, JPG, SVG o WEBP.',
  );
});

test('rejects API submissions without project name', async ({ request }) => {
  const response = await request.post('/api/questionnaire', {
    multipart: {
      accessSystem: 'pin',
    },
  });
  const payload = await response.json();

  expect(response.status()).toBe(400);
  expect(payload).toEqual({
    ok: false,
    message: 'El nombre del proyecto app es obligatorio.',
  });
});

test('rejects API submissions with an unsupported logo format', async ({
  request,
}) => {
  const response = await request.post('/api/questionnaire', {
    multipart: {
      brandName: 'Saulo Fitness App',
      accessSystem: 'pin',
      logoFile: {
        name: 'logo.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid logo file'),
      },
    },
  });
  const payload = await response.json();

  expect(response.status()).toBe(400);
  expect(payload).toEqual({
    ok: false,
    message: 'El logotipo debe estar en formato PNG, JPG, SVG o WEBP.',
  });
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
