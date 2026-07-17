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
      name: 'TRANSFORMA TU CUERPO',
    }),
  ).toBeVisible();
  await expect(
    page.locator('#inicio').getByRole('link', { name: 'Solicitar valoración' }),
  ).toHaveAttribute('href', 'https://wa.me/34622923988');
  await expect(
    page.getByText(
      'Entrenamiento personalizado · Nutrición · Seguimiento semanal · Coaching online',
    ),
  ).toBeVisible();
  await expect(page.locator('[data-events-grid]')).toHaveCount(1);
  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/trainer"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/acceso/"]')).toHaveCount(0);
  await expect(
    page.getByText(
      'Encuentros presenciales para entrenar en directo, compartir energía y reforzar el proceso.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Cambios visibles cuando el trabajo está bien planteado.'),
  ).toBeVisible();
  await expect(
    page.locator('#resultados .success-story--proof').nth(2).locator('img'),
  ).toHaveAttribute('src', './assets/casos-reales/todos/caso-real-07.jpeg');
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
  await expect(
    page.locator('.success-story--proof').nth(2).locator('img'),
  ).toHaveAttribute('src', './assets/casos-reales/todos/caso-real-07.jpeg');
  await expect(
    page.locator('.success-story--proof').nth(4).locator('img'),
  ).toHaveAttribute('src', './assets/casos-reales/todos/caso-real-20.jpeg');

  await page.goto('/sobre-mi');
  await expect(
    page.getByRole('heading', {
      name: 'Entrenar bien no es castigo. Es dirección, exigencia y criterio.',
    }),
  ).toBeVisible();
});

test('renders the curated real-cases gallery without duplicate-person slots', async ({
  page,
}) => {
  await page.goto('/casos-reales');

  const items = page.locator('.proof-gallery__item');
  await expect(items).toHaveCount(25);

  await expect(items.nth(8).locator('figcaption')).toHaveText('Caso real 10');
  await expect(items.nth(9).locator('figcaption')).toHaveText('Caso real 10');
  await expect(items.nth(10).locator('figcaption')).toHaveText('Caso real 13');
  await expect(items.nth(11).locator('figcaption')).toHaveText('Caso real 13');
  await expect(items.nth(17).locator('figcaption')).toHaveText('Caso real 18');
  await expect(items.nth(20).locator('img')).toHaveAttribute(
    'src',
    './assets/casos-reales/todos/caso-real-30.jpeg',
  );
  await expect(items.nth(20).locator('figcaption')).toHaveText('Caso real 24');
  await expect(items.nth(24).locator('figcaption')).toHaveText('Caso real 28');

  const renderedSources = await items
    .locator('img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-08.jpeg',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-12.jpeg',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-15.jpeg',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-22.jpeg',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-25.jpeg',
  );
});

test('shows the intro only on the first visit of the browser', async ({
  page,
}) => {
  await page.goto('/');

  expect(
    await page.evaluate(() => localStorage.getItem('saulo-landing-intro-seen')),
  ).toBe('true');

  await page.reload();

  await expect(page.locator('[data-intro-screen]')).toHaveClass(/is-hidden/);
});
