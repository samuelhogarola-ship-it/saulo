const { test, expect } = require('@playwright/test');

test('retires the public events pages behind the production placeholder', async ({
  page,
}) => {
  await page.goto('/eventos');

  await expect(
    page.getByRole('heading', { name: 'Web en producción' }),
  ).toBeVisible();
  await expect(page.locator('[data-event-registration-form]')).toHaveCount(0);
  await expect(page.locator('.events-hero--marked')).toHaveCount(0);

  await page.goto('/eventos/reset-de-verano');

  await expect(
    page.getByRole('heading', { name: 'Web en producción' }),
  ).toBeVisible();
  await expect(page.locator('[data-event-registration-form]')).toHaveCount(0);
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
