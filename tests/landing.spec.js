const { test, expect } = require('@playwright/test');

test('shows the production placeholder on the public home', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Web en producción' }),
  ).toBeVisible();
  await expect(page.getByText('Saulo Fitness')).toBeVisible();
  await expect(
    page.locator('img[src="./saulo-logo-transparent.png"]'),
  ).toHaveCount(1);
  await expect(page.locator('[data-intro-screen]')).toHaveCount(0);
  await expect(page.locator('#inicio')).toHaveCount(0);
  await expect(page.locator('script[src="./landing.js"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://saulofitness.com/saulo-fitness-og.png',
  );
});

test('shows the production placeholder on the Portuguese public home', async ({
  page,
}) => {
  await page.goto('/index-pt-br.html');

  await expect(
    page.getByRole('heading', { name: 'Site em produção' }),
  ).toBeVisible();
  await expect(page.locator('[data-intro-screen]')).toHaveCount(0);
  await expect(page.locator('#inicio')).toHaveCount(0);
});

test('keeps the actual app surface available', async ({ page }) => {
  await page.goto('/app');

  await expect(page.locator('.student-app')).toHaveCount(1);
  await expect(page.locator('.trainer-app')).toHaveCount(0);
});

test('redirects retired public marketing pages to the production placeholder', async ({
  page,
}) => {
  await page.goto('/app.html');

  await expect(
    page.getByRole('heading', { name: 'Web en producción' }),
  ).toBeVisible();
  await expect(page.locator('.app-hero')).toHaveCount(0);
});
