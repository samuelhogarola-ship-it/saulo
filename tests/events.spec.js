const { test, expect } = require('@playwright/test');

test('renders the public events list and event detail', async ({ page }) => {
  await page.goto('/eventos');

  await expect(
    page.getByRole('heading', {
      name: 'Próximos eventos para entrenar en directo con dirección.',
    }),
  ).toBeVisible();
  await expect(page.locator('.events-hero--marked')).toBeVisible();
  await expect(page.locator('.events-hero__poster')).toHaveAttribute(
    'src',
    '/event-assets/girl-power-hero.png',
  );
  await expect(page.locator('.events-experience-grid article')).toHaveCount(3);
  await expect(
    page
      .locator('.events-list')
      .getByRole('link', { name: 'Apúntate ya' })
      .first(),
  ).toBeVisible();

  await page
    .locator('.events-list')
    .getByRole('link', { name: 'Apúntate ya' })
    .first()
    .click();

  await expect(
    page.getByRole('heading', { name: 'Reset de verano' }),
  ).toBeVisible();
  await expect(page.locator('.event-detail-hero--marked')).toBeVisible();
  await expect(page.locator('.event-detail-meta-grid article')).toHaveCount(3);
  await expect(page.locator('[data-event-registration-form]')).toBeVisible();
});

test('persists a public event registration and exposes it in admin', async ({
  page,
  request,
}) => {
  const registrationName = `Test User ${Date.now()}`;

  await page.goto('/eventos/reset-de-verano');
  await page.getByLabel('Nombre completo').fill(registrationName);
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Mensaje').fill('Quiero reservar una plaza.');
  await page.getByRole('button', { name: 'Apúntate ya' }).click();

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
    (item) => item.slug === 'reset-de-verano',
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

test('keeps the event detail when switching language', async ({ page }) => {
  await page.goto('/eventos/reset-de-verano');

  await expect(page.getByRole('link', { name: '🇧🇷 PT-BR' })).toHaveAttribute(
    'href',
    '/eventos/reset-de-verano?lang=pt-br',
  );
  await expect(page.getByRole('link', { name: '🇪🇸 ES' })).toHaveAttribute(
    'href',
    '/eventos/reset-de-verano',
  );
});
