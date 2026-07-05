const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { verifySignedPayload } = require('../lib/magic-link-delivery');
const { respond, sleep } = require('./_smoke-runtime');

function createMockDeliveryServer({
  host,
  port,
  outputPath,
  secret,
  bearerToken,
  deliveryId = 'mock-delivery-001',
}) {
  return http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook/magic-link') {
      respond(res, 404, { ok: false, message: 'Ruta no encontrada.' });
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const authorization = req.headers.authorization || '';
        const signature = req.headers['x-saulo-signature'];

        if (authorization !== `Bearer ${bearerToken}`) {
          respond(res, 401, {
            ok: false,
            message: 'Bearer token no válido.',
          });
          return;
        }

        if (!verifySignedPayload(body, secret, signature)) {
          respond(res, 401, {
            ok: false,
            message: 'Firma HMAC no válida.',
          });
          return;
        }

        const payload = JSON.parse(body || '{}');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
          outputPath,
          JSON.stringify(
            {
              receivedAt: new Date().toISOString(),
              host,
              port,
              headers: req.headers,
              payload,
            },
            null,
            2,
          ),
        );

        respond(res, 200, {
          ok: true,
          student: payload.student?.name || '',
          channel: payload.student?.contactPhone ? 'whatsapp' : 'email',
          deliveryId,
        });
      } catch (error) {
        respond(res, 400, {
          ok: false,
          message: error.message || 'No se pudo procesar el webhook.',
        });
      }
    });
  });
}

async function waitForWebhookFile(outputPath) {
  const timeoutAt = Date.now() + 8000;

  while (Date.now() < timeoutAt) {
    if (fs.existsSync(outputPath)) {
      const raw = fs.readFileSync(outputPath, 'utf8');
      if (raw.trim()) {
        return JSON.parse(raw);
      }
    }
    await sleep(150);
  }

  throw new Error(
    'El mock de delivery no escribió el payload del webhook a tiempo.',
  );
}

module.exports = {
  createMockDeliveryServer,
  waitForWebhookFile,
};
