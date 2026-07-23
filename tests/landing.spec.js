const { test, expect } = require('@playwright/test');

test('renders the public landing with multipage navigation and contact CTAs', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-intro-screen]')).toHaveClass(/is-hidden/, {
    timeout: 7000,
  });
  await expect(page.locator('.intro-screen__logo')).toHaveCount(0);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Inicio' }),
  ).toHaveAttribute('href', '/');
  await expect(page.locator('.site-logo')).toHaveAttribute('href', '/');
  const logoMark = await page.locator('.site-logo').evaluate((logo) => {
    return getComputedStyle(logo, '::after').backgroundImage;
  });
  expect(logoMark).toContain('saulo-logo-transparent.png');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://saulofitness.com/saulo-fitness-og.png',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://saulofitness.com/',
  );
  await expect(page.locator('link[rel="icon"][sizes="48x48"]')).toHaveAttribute(
    'href',
    '/favicon-48.png',
  );
  await expect(
    page.locator('link[rel="icon"][sizes="192x192"]'),
  ).toHaveAttribute('href', '/favicon-192.png');
  const organizationData = await page
    .locator('script[type="application/ld+json"]')
    .evaluate((script) => JSON.parse(script.textContent));
  expect(organizationData.logo).toBe(
    'https://saulofitness.com/favicon-192.png',
  );
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
  await expect(page.locator('[data-clueso-stage]')).toHaveCount(1);
  await expect(page.locator('.home-clueso-stage__sticky')).toHaveCSS(
    'position',
    'sticky',
  );
  await expect(page.locator('#saulo-fitness')).toHaveCount(1);
  await expect(
    page.locator('#saulo-fitness [data-deck-stack-card]'),
  ).toHaveCount(3);
  await expect(
    page.locator('#saulo-fitness .stacking-cards__item-top'),
  ).toHaveCount(0);
  await expect(
    page.locator('#saulo-fitness .stacking-cards__item-visual--coaching img'),
  ).toHaveAttribute(
    'src',
    './assets/servicio/entrenamiento-supervisado-saulo.jpg?v=20260723',
  );
  await expect(
    page.locator('#saulo-fitness .stacking-cards__item-visual--online img'),
  ).toHaveAttribute('src', './saulo-fitness-og.png');
  await expect(
    page.locator('#inicio').getByRole('link', { name: 'Solicitar valoración' }),
  ).toHaveAttribute('href', 'https://wa.me/34622923988');
  await expect(
    page.getByText(
      'Entrenamiento personalizado · Nutrición · Seguimiento semanal · Coaching online',
    ),
  ).toBeVisible();
  await expect(page.locator('[data-events-grid]')).toHaveCount(1);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'App' }),
  ).toHaveAttribute('href', './app.html');
  await expect(page.locator('a[href^="/trainer"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/acceso/"]')).toHaveCount(0);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'App' }),
  ).not.toHaveAttribute('href', '/app');
  await expect(
    page.getByText(
      'Vive el ambiente y el deporte con nuestros eventos en directo.',
    ),
  ).toBeVisible();
  await expect(
    page.getByText('Cambios visibles cuando el trabajo está bien planteado.'),
  ).toBeVisible();
  await expect(
    page.locator('#resultados .success-story--proof').nth(2).locator('img'),
  ).toHaveAttribute(
    'src',
    './assets/casos-reales/todos/caso-real-07.jpeg?v=20260723',
  );
});

test('renders the public app landing without exposing direct app access', async ({
  page,
}) => {
  await page.goto('/app.html');

  await expect(
    page.getByRole('heading', {
      name: 'El complemento ideal para tus entrenamientos.',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Screenshots reales', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('img[src="./assets/app-showcase/saulo-app-rutinas.png"]'),
  ).toHaveCount(2);
  await expect(page.locator('.app-device-phone')).toHaveCount(1);
  await expect(page.locator('.app-laptop')).toHaveCount(1);
  await expect(page.locator('.routine-demo__exercise')).toHaveCount(3);
  await expect(
    page.getByText('Pierna + glúteo', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Solicitar valoración' }),
  ).toHaveAttribute('href', 'https://wa.me/34622923988');
  await expect(page.locator('a[href="/app"]')).toHaveCount(0);
  await expect(page.locator('a[href^="/app/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/app/?"]')).toHaveCount(0);
});

test('shows the events coming-soon photo when the agenda is empty', async ({
  page,
}) => {
  await page.route('**/api/public/events?limit=5', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ events: [] }),
    });
  });

  await page.goto('/');

  await expect(page.getByText('Nuevos eventos')).toBeVisible();
  await expect(
    page.locator('.event-preview-card--coming-soon img'),
  ).toHaveAttribute('src', './event-assets/proximos-eventos-playa.jpg');

  const comingSoonTitleFits = await page
    .locator('.event-preview-card--coming-soon h3')
    .evaluate((heading) => heading.scrollWidth <= heading.clientWidth + 1);
  expect(comingSoonTitleFits).toBe(true);
});

test('keeps key conversion pages inside the mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.hero__background')).toHaveCSS(
    'background-size',
    /auto/,
  );
  await expect(page.locator('.hero__background')).toHaveCSS(
    'background-position',
    /66% 100%/,
  );
  const heroMobileStack = await page.locator('#inicio').evaluate((hero) => {
    const photo = hero
      .querySelector('.hero__background')
      .getBoundingClientRect();
    const cta = hero.querySelector('.hero__actions').getBoundingClientRect();
    return {
      ctaBelowPhoto: cta.top >= photo.bottom - 1,
      ctaInsideHero: cta.bottom <= hero.getBoundingClientRect().bottom,
    };
  });
  expect(heroMobileStack.ctaBelowPhoto).toBe(true);
  expect(heroMobileStack.ctaInsideHero).toBe(true);

  await page.goto('/app.html');

  const appHeroFits = await page.locator('.app-hero__copy').evaluate((copy) => {
    const copyRect = copy.getBoundingClientRect();
    const heroRect = copy.closest('.app-hero').getBoundingClientRect();
    return copyRect.left >= heroRect.left && copyRect.right <= heroRect.right;
  });
  expect(appHeroFits).toBe(true);

  await page.goto('/sobre-mi.html');
  await expect(page.locator('.about-portrait img')).toBeVisible();

  await page.goto('/casos-exito.html');
  await expect(
    page.locator('.cases-closing').getByRole('link', {
      name: 'Solicitar valoración',
    }),
  ).toBeVisible();
});

test('keeps the hero headline and portrait safely framed', async ({ page }) => {
  const desktopViewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 820 },
    { width: 1024, height: 768 },
  ];

  for (const viewport of desktopViewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('body')).toHaveClass(/intro-complete/, {
      timeout: 7000,
    });

    const heroLayout = await page.locator('#inicio').evaluate((hero) => {
      const heading = hero.querySelector('h1').getBoundingClientRect();
      const headlineLines = [...hero.querySelectorAll('h1 span')].map(
        (line) => {
          const rect = line.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            clientWidth: line.clientWidth,
            scrollWidth: line.scrollWidth,
          };
        },
      );
      const photo = hero
        .querySelector('.hero__background')
        .getBoundingClientRect();
      const photoStyle = getComputedStyle(
        hero.querySelector('.hero__background'),
      );

      return {
        headingLeft: heading.left,
        headingRight: heading.right,
        headingClientWidth: hero.querySelector('h1').clientWidth,
        headingScrollWidth: hero.querySelector('h1').scrollWidth,
        headlineLines,
        photoLeft: photo.left,
        photoAsset: photoStyle.backgroundImage,
        photoPosition: photoStyle.backgroundPosition,
        photoSize: photoStyle.backgroundSize,
        viewportWidth: window.innerWidth,
      };
    });

    expect(heroLayout.headingLeft).toBeGreaterThanOrEqual(0);
    expect(heroLayout.headingRight).toBeLessThanOrEqual(
      heroLayout.viewportWidth,
    );
    expect(heroLayout.headingScrollWidth).toBeLessThanOrEqual(
      heroLayout.headingClientWidth + 1,
    );
    expect(heroLayout.photoAsset).toContain('landing-saulo-hero.png');
    expect(heroLayout.photoPosition).toContain('58%');
    expect(heroLayout.photoPosition).toContain('100%');
    expect(heroLayout.photoSize).toContain('auto');
    const maxPhotoLeftRatio = heroLayout.viewportWidth > 1080 ? 0.48 : 0.53;
    expect(heroLayout.photoLeft).toBeLessThanOrEqual(
      heroLayout.viewportWidth * maxPhotoLeftRatio,
    );

    for (const line of heroLayout.headlineLines) {
      expect(line.left).toBeGreaterThanOrEqual(0);
      expect(line.right).toBeLessThanOrEqual(heroLayout.viewportWidth);
      expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth + 1);
    }
  }
});

test('redirects the explicit index page to the clean home URL', async ({
  page,
}) => {
  await page.goto('/index.html');

  await expect(page).toHaveURL(/\/$/);
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
  ).toHaveAttribute(
    'src',
    './assets/casos-reales/todos/caso-real-07.jpeg?v=20260723',
  );
  await expect(
    page.locator('.success-story--proof').nth(4).locator('img'),
  ).toHaveAttribute(
    'src',
    './assets/casos-reales/todos/caso-real-20.jpeg?v=20260723',
  );

  await page.goto('/sobre-mi');
  await expect(
    page.getByRole('heading', {
      name: 'Entrenar bien no es castigo. Es dirección, exigencia y criterio.',
    }),
  ).toBeVisible();
  await expect(page.locator('.about-portrait img')).toHaveAttribute(
    'src',
    './landing-saulo-torso.png',
  );
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
    './assets/casos-reales/todos/caso-real-30.jpeg?v=20260723',
  );
  await expect(items.nth(20).locator('figcaption')).toHaveText('Caso real 24');
  await expect(items.nth(24).locator('figcaption')).toHaveText('Caso real 28');

  const renderedSources = await items
    .locator('img')
    .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-08.jpeg?v=20260723',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-12.jpeg?v=20260723',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-15.jpeg?v=20260723',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-22.jpeg?v=20260723',
  );
  expect(renderedSources).not.toContain(
    './assets/casos-reales/todos/caso-real-25.jpeg?v=20260723',
  );
});

test('shows the intro again whenever the home is loaded', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).toHaveClass(/has-intro/);
  await expect(page.locator('[data-intro-screen]')).not.toHaveClass(
    /is-hidden/,
  );

  await page.reload();

  await expect(page.locator('body')).toHaveClass(/has-intro/);
  await expect(page.locator('[data-intro-screen]')).not.toHaveClass(
    /is-hidden/,
  );
});

test('skips the intro once when returning through the Inicio navigation link', async ({
  page,
}) => {
  await page.goto('/sobre-mi.html');

  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Inicio' })
    .click();

  await expect(page).toHaveURL('/');
  await expect(page.locator('[data-intro-screen]')).toHaveClass(/is-hidden/);
  await expect(page.locator('body')).toHaveClass(/intro-complete/);
});
