const { test, expect } = require('@playwright/test');

test('renders the public landing with multipage navigation and contact CTAs', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-intro-screen]')).toHaveClass(/is-hidden/);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Inicio' }),
  ).toHaveAttribute('href', './index.html');
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Casos de éxito' }),
  ).toHaveAttribute('href', './casos-exito.html');
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Sobre mí' }),
  ).toHaveAttribute('href', './sobre-mi.html');
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Eventos' }),
  ).toHaveAttribute('href', '/eventos');
  await expect(
    page.getByRole('heading', {
      name: 'Tu mejor versión no se improvisa.',
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Hablar por WhatsApp' }),
  ).toHaveAttribute('href', 'https://wa.me/34622923988');
  await expect(
    page.locator('#inicio').getByRole('link', { name: 'Escribir por email' }),
  ).toHaveAttribute('href', 'mailto:info@webfuengirola.com');
  await expect(page.locator('[data-events-grid] article')).toHaveCount(5);
  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
});

test('opens the dedicated pages for casos de éxito and sobre mí', async ({
  page,
}) => {
  await page.goto('/casos-exito');
  await expect(
    page.getByRole('heading', {
      name: 'Resultados que se notan en el cuerpo, en la técnica y en la cabeza.',
    }),
  ).toBeVisible();

  await page.goto('/sobre-mi');
  await expect(
    page.getByRole('heading', {
      name: 'Entrenar bien no es castigo. Es dirección, exigencia y criterio.',
    }),
  ).toBeVisible();
});

test('shows the intro only on the first visit of the session', async ({
  page,
}) => {
  await page.goto('/');

  expect(
    await page.evaluate(() =>
      sessionStorage.getItem('saulo-landing-intro-seen'),
    ),
  ).toBe('true');

  await page.reload();

  await expect(page.locator('[data-intro-screen]')).toHaveClass(/is-hidden/);
});
