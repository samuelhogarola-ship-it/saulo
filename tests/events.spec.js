const { test, expect } = require('@playwright/test');

test('renders the public event landing with the poster-driven hero', async ({
  page,
}) => {
  await page.goto('/eventos/girl-power-fuengirola');

  await expect(page.getByRole('heading', { name: 'Girl Power' })).toBeVisible();
  await expect(page.getByText('Playa de Fuengirola')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inscribirme' })).toBeVisible();
  await expect(
    page.getByText('Saulo y Tamires', { exact: true }),
  ).toBeVisible();
});

test('submits the public registration form and shows success feedback', async ({
  page,
}) => {
  await page.goto('/eventos/girl-power-fuengirola');

  await page.locator('input[name="full_name"]').fill('Playwright Public');
  await page.locator('input[name="email"]').fill('public@example.com');
  await page.locator('input[name="phone"]').fill('600 444 777');
  await page.locator('textarea[name="comments"]').fill('Reserva de prueba.');
  await page.getByRole('button', { name: 'Inscribirme' }).click();

  await expect(page.locator('#event-form-status')).toContainText(
    'Tu inscripción ha sido recibida',
  );
});

test('redirects unauthenticated users from admin events to login', async ({
  page,
}) => {
  await page.goto('/admin/eventos');

  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Entra por Magic Link' }),
  ).toBeVisible();
});

test('shows the events link in the trainer sidebar', async ({ page }) => {
  await page.goto('/trainer/');

  await expect(
    page
      .getByLabel('Secciones del panel entrenador')
      .getByRole('button', { name: 'Eventos' }),
  ).toBeVisible();
});

test('admin demo login can see the seeded event list and detail', async ({
  page,
}) => {
  await loginAs(page, 'owner@saulo.test');

  await expect(page).toHaveURL(/\/admin\/eventos$/);
  await expect(
    page.getByRole('heading', { name: 'Eventos', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Girl Power')).toBeVisible();
  await expect(page.getByText('Bachata Day')).toBeVisible();

  await page.getByRole('link', { name: 'Ver inscritos' }).first().click();
  await expect(page).toHaveURL(/\/admin\/eventos\//);
  await expect(page.getByText('Listado completo')).toBeVisible();
});

test('event manager can add a manual registration and toggle payment status', async ({
  page,
}) => {
  await loginAs(page, 'manager@saulo.test');

  await page.getByRole('link', { name: 'Ver inscritos' }).first().click();

  await page
    .locator('#admin-manual-registration-form input[name="full_name"]')
    .fill('Playwright Manager');
  await page
    .locator('#admin-manual-registration-form input[name="phone"]')
    .fill('600 888 999');
  await page
    .locator('#admin-manual-registration-form select[name="payment_status"]')
    .selectOption('pending');
  await page
    .locator('#admin-manual-registration-form')
    .getByRole('button', { name: 'Añadir inscrito' })
    .click();

  await expect(
    page.locator('input[name="full_name"][value="Playwright Manager"]'),
  ).toBeVisible();

  const row = page.locator('[data-registration-form]').filter({
    has: page.locator('input[name="full_name"][value="Playwright Manager"]'),
  });
  await row.getByRole('button', { name: 'Pagado' }).click();

  await expect(row.locator('select[name="payment_status"]')).toHaveValue(
    'paid',
  );
});

test('event viewer only sees assigned events and cannot mutate', async ({
  page,
}) => {
  await loginAs(page, 'viewer@saulo.test');

  await expect(page.getByText('Girl Power')).toBeVisible();
  await expect(page.getByText('Bachata Day')).toHaveCount(0);

  await page.getByRole('link', { name: 'Ver inscritos' }).click();
  await expect(page.locator('#admin-manual-registration-form')).toHaveCount(0);
  await expect(page.locator('#admin-event-edit-form')).toHaveCount(0);
  await expect(page.getByText('Acceso en modo lectura.')).toBeVisible();
});

async function loginAs(page, email) {
  await page.goto('/admin/login');
  await page.locator('input[name="email"]').fill(email);
  await page.getByRole('button', { name: 'Enviar acceso' }).click();
  await page.waitForURL(/\/admin\/eventos/);
}
