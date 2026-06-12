const express = require('express');
const os = require('node:os');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const publicDir = __dirname;
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

app.use(express.json());
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
    return res.status(404).send(renderInvalidDemoLinkPage('Enlace no válido.'));
  }

  if (demoLink.used) {
    return res
      .status(410)
      .send(
        renderInvalidDemoLinkPage(
          'Este enlace ya se utilizó para activar la demo en un teléfono.',
        ),
      );
  }

  return res.redirect(`/app/?demo=${demoLink.token}&claim=1`);
});

app.post('/api/demo-links/:token/claim', (req, res) => {
  const demoLink = demoLinks.get(req.params.token);
  const pin = String(req.body?.pin || '').trim();

  if (!demoLink) {
    return res.status(404).json({
      ok: false,
      message: 'El enlace de demo no existe.',
    });
  }

  if (demoLink.used) {
    return res.status(410).json({
      ok: false,
      message: 'Este enlace ya se ha utilizado y ha dejado de funcionar.',
    });
  }

  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({
      ok: false,
      message: 'El PIN debe tener exactamente 4 dígitos.',
    });
  }

  demoLink.used = true;
  demoLink.claimedAt = new Date().toISOString();

  return res.json({
    ok: true,
    token: demoLink.token,
    claimedAt: demoLink.claimedAt,
  });
});

app.listen(port, host, () => {
  const networkUrls = getNetworkUrls(port);

  console.log(`Saulo app listening on http://127.0.0.1:${port}`);

  if (networkUrls.length) {
    console.log('Available on local network:');
    networkUrls.forEach((url) => console.log(`- ${url}`));
  }
});

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

function getNetworkUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }

      urls.push(`http://${entry.address}:${port}`);
    });
  });

  return [...new Set(urls)];
}
