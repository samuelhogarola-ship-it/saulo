const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');

const express = require('express');

const {
  clearSession,
  persistDemoSession,
  persistRemoteSession,
  requestMagicLink,
  resolveAuthContext,
  verifyMagicLink,
} = require('./lib/auth');
const { appName, supabase } = require('./lib/config');
const {
  validateAdminRegistration,
  validateEventInput,
  validatePublicRegistration,
} = require('./lib/validation');
const { createEventsBackend } = require('./events/backend');
const {
  renderAdminEventDetailPage,
  renderAdminEventsPage,
  renderAdminLoginPage,
  renderNotFoundPage,
  renderPublicEventPage,
} = require('./events/templates');
const { escapeHtml, getBaseUrl } = require('./lib/utils');

const app = express();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const publicDir = __dirname;
const eventsBackend = createEventsBackend();

const demoLinks = new Map([
  [
    '101',
    {
      token: '101',
      used: false,
      claimedAt: null,
      pinHash: null,
    },
  ],
  [
    '201',
    {
      token: '201',
      used: false,
      claimedAt: null,
      pinHash: null,
    },
  ],
]);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

app.use((req, _res, next) => {
  if (process.env.DEBUG_REQUESTS === 'true') {
    console.log(`[request] ${req.method} ${req.url}`);
  }
  next();
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/app', (_req, res) => {
  res.sendFile(path.join(publicDir, 'app', 'index.html'));
});

app.get('/app/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'app', 'index.html'));
});

app.get('/trainer', (_req, res) => {
  res.sendFile(path.join(publicDir, 'trainer', 'index.html'));
});

app.get('/trainer/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'trainer', 'index.html'));
});

app.get('/eventos/:slug', async (req, res) => {
  const event = await eventsBackend.getPublicEventBySlug(req.params.slug);

  if (!event) {
    res
      .status(404)
      .send(
        renderNotFoundPage(
          'Evento no disponible',
          'Este evento no existe o ya no está activo.',
        ),
      );
    return;
  }

  res.send(renderPublicEventPage(event));
});

app.get('/admin/login', async (req, res) => {
  const authContext = await resolveAuthContext(req, res);
  if (authContext) {
    res.redirect('/admin/eventos');
    return;
  }

  const message =
    req.query.sent === '1'
      ? 'Te hemos enviado un Magic Link a tu email.'
      : req.query.demo === '1'
        ? 'Acceso demo concedido. Ya puedes gestionar los eventos.'
        : null;

  const error = typeof req.query.error === 'string' ? req.query.error : null;

  const modeHint = supabase.hasConfig
    ? null
    : 'Modo demo activo: si el entorno no puede enviar emails, el acceso se abrirá localmente al enviar el formulario.';

  res.send(
    renderAdminLoginPage({
      modeHint,
      message,
      error,
    }),
  );
});

app.post('/auth/magic-link', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  if (!email) {
    res.redirect('/admin/login?error=Introduce%20un%20email%20válido');
    return;
  }

  try {
    const result = await requestMagicLink({
      email,
      redirectTo: `${getBaseUrl(req)}/auth/callback`,
    });

    if (result.mode === 'demo') {
      persistDemoSession(res, result.demoUser);
      res.redirect('/admin/eventos');
      return;
    }

    res.redirect('/admin/login?sent=1');
  } catch (_error) {
    res.redirect('/admin/login?error=No%20se%20pudo%20enviar%20el%20acceso');
  }
});

app.get('/auth/callback', async (req, res) => {
  const tokenHash = String(req.query.token_hash || '');
  const type = String(req.query.type || 'magiclink');

  if (!tokenHash) {
    res.redirect('/admin/login?error=Acceso%20inv%C3%A1lido');
    return;
  }

  try {
    const authPayload = await verifyMagicLink({ tokenHash, type });
    persistRemoteSession(res, authPayload);
    res.redirect('/admin/eventos');
  } catch (_error) {
    res.redirect(
      '/admin/login?error=El%20Magic%20Link%20ha%20caducado%20o%20no%20es%20v%C3%A1lido',
    );
  }
});

app.post('/auth/logout', (_req, res) => {
  clearSession(res);
  res.redirect('/admin/login');
});

app.get('/admin/eventos', async (req, res) => {
  const authContext = await requireAuthPage(req, res);
  if (!authContext) {
    return;
  }

  const data = await eventsBackend.getEventsForUser(authContext);
  res.send(
    renderAdminEventsPage({
      authContext,
      data,
    }),
  );
});

app.get('/admin/eventos/:eventId', async (req, res) => {
  const authContext = await requireAuthPage(req, res);
  if (!authContext) {
    return;
  }

  const detail = await eventsBackend.getEventDetailForUser(
    authContext,
    req.params.eventId,
  );

  if (!detail) {
    res
      .status(404)
      .send(
        renderNotFoundPage(
          'Evento no encontrado',
          'No tienes acceso a este evento o no existe.',
        ),
      );
    return;
  }

  await eventsBackend.markNotificationsRead(authContext, req.params.eventId);
  res.send(
    renderAdminEventDetailPage({
      authContext,
      detail,
    }),
  );
});

app.post('/api/events/:slug/registrations', async (req, res) => {
  const validation = validatePublicRegistration(req.body || {});
  if (!validation.isValid) {
    res.status(400).json({
      ok: false,
      errors: validation.errors,
      message: 'Revisa los campos obligatorios.',
    });
    return;
  }

  try {
    const result = await eventsBackend.createPublicRegistration(
      req.params.slug,
      validation.data,
    );

    res.status(201).json({
      ok: true,
      registration: result.registration,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message,
    });
  }
});

app.post('/api/admin/events', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  const validation = validateEventInput(req.body || {});
  if (!validation.isValid) {
    res.status(400).json({
      ok: false,
      errors: validation.errors,
      message: 'Revisa los datos del evento.',
    });
    return;
  }

  try {
    const event = await eventsBackend.createEvent(authContext, validation.data);
    res.status(201).json({ ok: true, event });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
});

app.patch('/api/admin/events/:eventId', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  const validation = validateEventInput(req.body || {});
  if (!validation.isValid) {
    res.status(400).json({
      ok: false,
      errors: validation.errors,
      message: 'Revisa los datos del evento.',
    });
    return;
  }

  try {
    const event = await eventsBackend.updateEvent(
      authContext,
      req.params.eventId,
      validation.data,
    );
    res.json({ ok: true, event });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
});

app.post('/api/admin/events/:eventId/poster', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  const { filename, contentType, base64Data } = req.body || {};
  if (!base64Data) {
    res.status(400).json({ ok: false, message: 'Falta la imagen del cartel.' });
    return;
  }

  try {
    const event = await eventsBackend.uploadPoster(
      authContext,
      req.params.eventId,
      {
        filename,
        contentType,
        base64Data,
      },
    );
    res.json({ ok: true, event });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
});

app.post('/api/admin/events/:eventId/registrations', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  const validation = validateAdminRegistration(req.body || {});
  if (!validation.isValid) {
    res.status(400).json({
      ok: false,
      errors: validation.errors,
      message: 'Revisa los datos del inscrito.',
    });
    return;
  }

  try {
    const registration = await eventsBackend.createAdminRegistration(
      authContext,
      req.params.eventId,
      validation.data,
    );
    res.status(201).json({ ok: true, registration });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
});

app.patch('/api/admin/registrations/:registrationId', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  const validation = validateAdminRegistration(req.body || {});
  if (!validation.isValid) {
    res.status(400).json({
      ok: false,
      errors: validation.errors,
      message: 'Revisa los datos del inscrito.',
    });
    return;
  }

  try {
    const registration = await eventsBackend.updateRegistration(
      authContext,
      req.params.registrationId,
      validation.data,
    );
    res.json({ ok: true, registration });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
});

app.delete('/api/admin/registrations/:registrationId', async (req, res) => {
  const authContext = await requireAuthApi(req, res);
  if (!authContext) {
    return;
  }

  try {
    await eventsBackend.deleteRegistration(
      authContext,
      req.params.registrationId,
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(403).json({ ok: false, message: error.message });
  }
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
  demoLink.pinHash = hashPin(pin);

  res.json({
    ok: true,
    token: demoLink.token,
    claimedAt: demoLink.claimedAt,
  });
});

app.post('/api/demo-links/:token/unlock', (req, res) => {
  const demoLink = demoLinks.get(req.params.token);
  const pin = String(req.body?.pin || '').trim();

  if (!demoLink || !demoLink.used || !demoLink.pinHash) {
    res.status(404).json({
      ok: false,
      message: 'No existe una activación válida para este acceso.',
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

  if (demoLink.pinHash !== hashPin(pin)) {
    res.status(401).json({
      ok: false,
      message: 'El PIN no es correcto.',
    });
    return;
  }

  res.json({
    ok: true,
    token: demoLink.token,
    claimedAt: demoLink.claimedAt,
  });
});

app.use(express.static(publicDir, { extensions: ['html'] }));

const server = app.listen(port, host, () => {
  const networkUrls = getNetworkUrls(port);

  console.log(`${appName} listening on http://127.0.0.1:${port}`);

  if (networkUrls.length) {
    console.log('Available on local network:');
    networkUrls.forEach((url) => console.log(`- ${url}`));
  }
});

async function requireAuthPage(req, res) {
  const authContext = await resolveAuthContext(req, res);
  if (!authContext) {
    res.redirect('/admin/login');
    return null;
  }

  return authContext;
}

async function requireAuthApi(req, res) {
  const authContext = await resolveAuthContext(req, res);
  if (!authContext) {
    res.status(401).json({
      ok: false,
      message: 'Necesitas iniciar sesión para continuar.',
    });
    return null;
  }

  return authContext;
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
        <p>${escapeHtml(appName)}</p>
        <h1>Enlace no disponible</h1>
        <p>${escapeHtml(message)}</p>
        <p>Si necesitas otra demo para el móvil, genera un enlace nuevo.</p>
        <a href="/">Volver a la landing</a>
      </article>
    </body>
  </html>`;
}

function getNetworkUrls(serverPort) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }

      urls.push(`http://${entry.address}:${serverPort}`);
    });
  });

  return [...new Set(urls)];
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

module.exports = {
  app,
  server,
};
