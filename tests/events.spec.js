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
