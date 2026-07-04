const express = require('express');
const os = require('node:os');
const path = require('node:path');

const { supabase, trainerApiToken, trainerLogin } = require('./lib/config');
const { createEventsStore } = require('./lib/events-store');
const {
  renderAdminEventsPage,
  renderEventDetailPage,
  renderEventsListPage,
} = require('./lib/site-pages');

const app = express();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const publicDir = __dirname;
const eventsStore = createEventsStore();
const demoLinks = new Map([
  [
    '101',
    {
      token: '101',
      used: false,
      claimedAt: null,
    },
  ],
]);

app.use(express.json({ limit: '8mb' }));
app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/app', (_req, res) => {
  res.sendFile(path.join(publicDir, 'app', 'index.html'));
});

app.get('/demo/:token', (req, res) => {
  const demoLink = demoLinks.get(req.params.token);

  if (!demoLink) {
    res.status(404).send(renderInvalidDemoLinkPage('Enlace no válido.'));
    return;
  }

  if (demoLink.used) {
    res
      .status(410)
      .send(
        renderInvalidDemoLinkPage(
          'Este enlace ya se utilizó para activar la demo en un teléfono.',
        ),
      );
    return;
  }

  res.redirect(`/app/?demo=${demoLink.token}&claim=1`);
});

app.post('/api/demo-links/:token/claim', (req, res) => {
  const demoLink = demoLinks.get(req.params.token);
  const pin = String(req.body?.pin || '').trim();

  if (!demoLink) {
    res.status(404).json({
      ok: false,
      message: 'El enlace de demo no existe.',
    });
    return;
  }

  if (demoLink.used) {
    res.status(410).json({
      ok: false,
      message: 'Este enlace ya se ha utilizado y ha dejado de funcionar.',
    });
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    res.status(400).json({
      ok: false,
      message: 'El PIN debe tener exactamente 4 dígitos.',
    });
    return;
  }

  demoLink.used = true;
  demoLink.claimedAt = new Date().toISOString();

  res.json({
    ok: true,
    token: demoLink.token,
    claimedAt: demoLink.claimedAt,
  });
});

app.get(
  '/eventos',
  asyncHandler(async (req, res) => {
    const lang = normalizePublicLanguage(req.query.lang);
    const events = await eventsStore.listPublicEvents();
    res.send(renderEventsListPage({ events, lang }));
  }),
);

app.get(
  '/eventos/:slug',
  asyncHandler(async (req, res) => {
    const lang = normalizePublicLanguage(req.query.lang);
    const event = await eventsStore.getPublicEventBySlug(req.params.slug);
    res.send(renderEventDetailPage({ event, lang }));
  }),
);

app.get('/admin/eventos', (_req, res) => {
  res.redirect(302, '/app/eventos');
});

app.get(
  '/api/public/events',
  asyncHandler(async (req, res) => {
    const limit =
      req.query.limit == null
        ? undefined
        : Number.parseInt(req.query.limit, 10);
    const events = await eventsStore.listPublicEvents({
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    res.json({ events });
  }),
);

app.post(
  '/api/public/events/:slug/registrations',
  asyncHandler(async (req, res) => {
    const registration = await eventsStore.createPublicRegistration(
      req.params.slug,
      req.body || {},
    );
    res.status(201).json({
      ok: true,
      registration,
      message: 'Solicitud recibida. Te contactaremos para confirmar tu plaza.',
    });
  }),
);

app.post(
  '/api/trainer/login',
  asyncHandler(async (req, res) => {
    const session = await loginTrainer(req.body || {});
    res.status(201).json({ ok: true, session });
  }),
);

app.post(
  '/api/trainer/refresh',
  asyncHandler(async (req, res) => {
    const session = await refreshTrainerSession(req.body || {});
    res.status(201).json({ ok: true, session });
  }),
);

app.get(
  '/api/admin/events',
  asyncHandler(async (req, res) => {
    const events = await eventsStore.listAdminEvents(getTrainerAuth(req));
    res.json({ events });
  }),
);

app.get(
  '/api/admin/events/:eventId',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.getAdminEvent(
      getTrainerAuth(req),
      req.params.eventId,
    );
    res.json({ event });
  }),
);

app.post(
  '/api/admin/events',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.createAdminEvent(
      getTrainerAuth(req),
      req.body || {},
    );
    res.status(201).json({ ok: true, event });
  }),
);

app.patch(
  '/api/admin/events/:eventId',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.updateAdminEvent(
      getTrainerAuth(req),
      req.params.eventId,
      req.body || {},
    );
    res.json({ ok: true, event });
  }),
);

app.use((error, _req, res, _next) => {
  const status = Number.isFinite(error?.status) ? error.status : 500;
  const message = error?.message || 'Error interno del servidor.';
  res.status(status).json({ ok: false, message });
});

app.listen(port, host, () => {
  const networkUrls = getNetworkUrls(port);

  console.log(`Saulo app listening on http://127.0.0.1:${port}`);

  if (networkUrls.length) {
    console.log('Available on local network:');
    networkUrls.forEach((url) => console.log(`- ${url}`));
  }
});

async function loginTrainer(credentials) {
  const email = String(credentials?.email || '')
    .trim()
    .toLowerCase();
  const password = String(credentials?.password || '').trim();

  if (!email || !password) {
    throw createHttpError(400, 'Email y contraseña son obligatorios.');
  }

  if (!supabase.hasConfig) {
    if (
      email !== trainerLogin.email.toLowerCase() ||
      password !== trainerLogin.password
    ) {
      throw createHttpError(401, 'Credenciales de entrenador no válidas.');
    }

    return {
      accessToken: trainerApiToken,
      refreshToken: 'local-trainer-refresh-token',
      expiresAt: createSessionExpiryIso(3600),
      trainer: {
        id: 'local-trainer',
        email: trainerLogin.email,
        name: 'Saulo Trainer',
        mode: 'local',
      },
    };
  }

  const response = await fetch(
    `${supabase.url}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: supabase.serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.access_token) {
    throw createHttpError(
      401,
      payload.error_description ||
        payload.msg ||
        'Credenciales de entrenador no válidas.',
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || null,
    expiresAt: createSessionExpiryIso(payload.expires_in || 3600),
    trainer: {
      id: payload.user?.id || 'trainer',
      email: payload.user?.email || email,
      name:
        payload.user?.user_metadata?.full_name ||
        payload.user?.user_metadata?.name ||
        payload.user?.email ||
        'Trainer',
      mode: 'supabase',
    },
  };
}

async function refreshTrainerSession(input) {
  const refreshToken = String(input?.refreshToken || '').trim();

  if (!refreshToken) {
    throw createHttpError(400, 'Refresh token no disponible.');
  }

  if (!supabase.hasConfig) {
    if (refreshToken !== 'local-trainer-refresh-token') {
      throw createHttpError(
        401,
        'No se pudo renovar la sesión del entrenador.',
      );
    }

    return {
      accessToken: trainerApiToken,
      refreshToken: 'local-trainer-refresh-token',
      expiresAt: createSessionExpiryIso(3600),
      trainer: {
        id: 'local-trainer',
        email: trainerLogin.email,
        name: 'Saulo Trainer',
        mode: 'local',
      },
    };
  }

  const response = await fetch(
    `${supabase.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        apikey: supabase.serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.access_token) {
    throw createHttpError(
      401,
      payload.error_description ||
        payload.msg ||
        'No se pudo renovar la sesión del entrenador.',
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || refreshToken,
    expiresAt: createSessionExpiryIso(payload.expires_in || 3600),
    trainer: {
      id: payload.user?.id || 'trainer',
      email: payload.user?.email || '',
      name:
        payload.user?.user_metadata?.full_name ||
        payload.user?.user_metadata?.name ||
        payload.user?.email ||
        'Trainer',
      mode: 'supabase',
    },
  };
}

function getTrainerAuth(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return { token };
}

function normalizePublicLanguage(value) {
  return String(value || '')
    .trim()
    .toLowerCase() === 'pt-br'
    ? 'pt-br'
    : 'es';
}

function createSessionExpiryIso(secondsFromNow) {
  return new Date(Date.now() + secondsFromNow * 1000).toISOString();
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function renderInvalidDemoLinkPage(message) {
  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Enlace de demo no disponible</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: radial-gradient(circle at top, rgba(123, 22, 255, 0.25), transparent 24%), linear-gradient(180deg, #0a0411 0%, #05020a 100%);
          color: #fcf8ff;
          font-family: Outfit, sans-serif;
        }
        article {
          width: min(100%, 560px);
          padding: 28px;
          border: 1px solid rgba(220, 190, 255, 0.18);
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(25, 13, 39, 0.96), rgba(10, 7, 17, 0.96));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.38);
        }
        p {
          color: #c9bcde;
          line-height: 1.7;
        }
        a {
          color: white;
        }
      </style>
    </head>
    <body>
      <article>
        <p>Saulo Fitness APP</p>
        <h1>Enlace no disponible</h1>
        <p>${escapeHtml(message)}</p>
        <p>Si necesitas otra demo para el móvil, genera un enlace nuevo.</p>
        <a href="/">Volver a la landing</a>
      </article>
    </body>
  </html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function getNetworkUrls(currentPort) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }

      urls.push(`http://${entry.address}:${currentPort}`);
    });
  });

  return [...new Set(urls)];
}
