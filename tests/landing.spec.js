const { test, expect } = require('@playwright/test');

test('renders the production hold landing', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Web en produccion, nos veremos pronto.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Web Fuengirola Studio' }),
  ).toHaveAttribute('href', 'https://webfuengirola.com');
  await expect(page.locator('.brand-mark')).toBeHidden();
  await expect(page.locator('.footer-links')).toBeHidden();
  await expect(page.getByText('Mensajes de la demo')).toHaveCount(0);
  await expect(page.locator('form')).toHaveCount(0);
});

test('keeps the landing out of the public student app flow', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
  await expect(page.locator('a[href="/app/"]')).toHaveCount(0);
  await expect(page.locator('a[href="/app"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/app/?demo="]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', {
      name: 'Web en produccion, nos veremos pronto.',
    }),
  ).toBeVisible();
});
