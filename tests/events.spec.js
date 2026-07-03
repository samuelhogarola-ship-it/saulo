const { test, expect } = require('@playwright/test');

test('renders the public events list and event detail', async ({ page }) => {
  await page.goto('/eventos');

  await expect(
    page.getByRole('heading', {
      name: 'Entrenamientos en directo para vivir el cambio contigo.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Reservar plaza' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Reservar plaza' }).first().click();

  await expect(
    page.getByRole('heading', { name: 'Girl Power Bootcamp' }),
  ).toBeVisible();
  await expect(page.locator('[data-event-registration-form]')).toBeVisible();
});

test('persists a public event registration and exposes it in admin', async ({
  page,
  request,
}) => {
  const registrationName = `Test User ${Date.now()}`;

  await page.goto('/eventos/girl-power-bootcamp');
  await page.getByLabel('Nombre completo').fill(registrationName);
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Mensaje').fill('Quiero reservar una plaza.');
  await page.getByRole('button', { name: 'Reservar plaza' }).click();

  await expect(page.locator('[data-form-status]')).toContainText(
    'Solicitud recibida',
  );

  const loginResponse = await request.post('/api/trainer/login', {
    data: {
      email: 'local@saulofitness.app',
      password: 'saulo1234',
    },
  });
  expect(loginResponse.ok()).toBeTruthy();
  const session = await loginResponse.json();

  const eventsResponse = await request.get('/api/admin/events', {
    headers: {
      Authorization: `Bearer ${session.session.accessToken}`,
    },
  });
  expect(eventsResponse.ok()).toBeTruthy();
  const eventsPayload = await eventsResponse.json();
  const bootcamp = eventsPayload.events.find(
    (item) => item.slug === 'girl-power-bootcamp',
  );
  expect(bootcamp).toBeTruthy();

  const detailResponse = await request.get(`/api/admin/events/${bootcamp.id}`, {
    headers: {
      Authorization: `Bearer ${session.session.accessToken}`,
    },
  });
  expect(detailResponse.ok()).toBeTruthy();
  const detailPayload = await detailResponse.json();
  expect(
    detailPayload.event.registrations.some(
      (registration) => registration.fullName === registrationName,
    ),
  ).toBeTruthy();
});
