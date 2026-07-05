const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { delivery, projectRoot, runtime, supabase } = require('../lib/config');
const { verifySignedPayload } = require('../lib/magic-link-delivery');

const port = Number(process.env.MOCK_MAGIC_LINK_PROVIDER_PORT || 8787);
const host = process.env.MOCK_MAGIC_LINK_PROVIDER_HOST || '127.0.0.1';
const outputPath = resolveOutputPath(
  process.env.MOCK_MAGIC_LINK_PROVIDER_OUTPUT_PATH || '',
);

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook/magic-link') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, message: 'Ruta no encontrada.' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const authorization = req.headers.authorization || '';
      const signatureHeader =
        delivery.webhookSignatureHeader || 'x-saulo-signature';
      const signature = req.headers[signatureHeader.toLowerCase()];

      if (delivery.webhookBearerToken) {
        const expectedBearer = `Bearer ${delivery.webhookBearerToken}`;
        if (authorization !== expectedBearer) {
          respond(res, 401, {
            ok: false,
            message: 'Bearer token no válido.',
          });
          return;
        }
      }

      if (
        delivery.webhookSecret &&
        !verifySignedPayload(body, delivery.webhookSecret, signature)
      ) {
        respond(res, 401, {
          ok: false,
          message: 'Firma HMAC no válida.',
        });
        return;
      }

      const payload = JSON.parse(body || '{}');
      const record = {
        receivedAt: new Date().toISOString(),
        headers: req.headers,
        payload,
      };

      if (outputPath) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(record, null, 2));
      }

      console.log('Magic link webhook received');
      console.log(`- Student: ${payload.student?.name || 'Unknown'}`);
      console.log(`- Waiting room: ${payload.access?.waitingRoomUrl || 'n/a'}`);
      console.log(`- Output: ${outputPath || 'stdout only'}`);

      respond(res, 200, {
        ok: true,
        mode: runtime.resolvedDataMode,
        student: payload.student?.name || '',
        channel: payload.student?.contactPhone ? 'whatsapp' : 'email',
        deliveryId: `mock-delivery-${Date.now()}`,
      });
    } catch (error) {
      respond(res, 400, {
        ok: false,
        message: error.message || 'No se pudo procesar el webhook.',
      });
    }
  });
});

server.listen(port, host, () => {
  console.log('Saulo Fitness APP · Mock magic link delivery');
  console.log(`- URL: http://${host}:${port}/webhook/magic-link`);
  console.log(`- Output file: ${outputPath || 'disabled'}`);
  console.log(
    `- Expected bearer: ${delivery.webhookBearerToken ? 'configured' : 'disabled'}`,
  );
  console.log(
    `- Expected signature: ${delivery.webhookSecret ? 'configured' : 'disabled'}`,
  );
  console.log(
    `- Suggested MAGIC_LINK_WEBHOOK_URL: http://${host}:${port}/webhook/magic-link`,
  );

  if (runtime.requestedDataMode !== 'supabase' || !supabase.hasConfig) {
    console.log(
      '- Note: puedes probar la recepción del webhook en local, pero el envío automático real seguirá dependiendo de arrancar la app en modo supabase.',
    );
  }
});

function resolveOutputPath(value) {
  const nextValue = String(value || '').trim();

  if (!nextValue) {
    return '';
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

function respond(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}
