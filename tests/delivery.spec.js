const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const { test, expect } = require('@playwright/test');

const {
  createMagicLinkWebhookPayload,
  sendMagicLinkWebhook,
  signPayload,
  verifySignedPayload,
} = require('../lib/magic-link-delivery');

test('signs and sends the magic link webhook payload', async () => {
  const requests = [];
  const secret = 'saulo-secret';
  const signatureHeader = 'x-saulo-signature';

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      requests.push({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;

  const payload = createMagicLinkWebhookPayload({
    appName: 'Saulo Fitness APP',
    senderName: 'Coach Saulo',
    student: {
      id: 'student-1',
      name: 'Lucía',
      plan: 'Definición',
    },
    waitingRoom: {
      waitingRoomUrl: 'https://saulofitness.com/sala/token-1',
      waitingRoomPath: '/sala/token-1',
    },
    access: {
      accessUrl: 'https://saulofitness.com/app/?access=abc',
      accessPath: '/app/?access=abc',
    },
    share: {
      contactEmail: 'lucia@saulo.app',
      contactPhone: '+34600000001',
      shareMessage: 'Hola Lucía',
      mailtoUrl: 'mailto:lucia@saulo.app',
      whatsappUrl: 'https://wa.me/34600000001',
    },
  });

  const response = await sendMagicLinkWebhook({
    webhookUrl: `http://127.0.0.1:${port}/delivery`,
    timeoutMs: 2000,
    secret,
    signatureHeader,
    bearerToken: 'provider-token',
    payload,
  });

  server.close();

  expect(response).toEqual(
    expect.objectContaining({
      ok: true,
      status: 200,
    }),
  );
  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe('POST');
  expect(requests[0].url).toBe('/delivery');
  expect(requests[0].headers.authorization).toBe('Bearer provider-token');
  expect(requests[0].headers[signatureHeader]).toBe(
    signPayload(requests[0].body, secret),
  );

  const sentPayload = JSON.parse(requests[0].body);
  expect(sentPayload).toEqual(
    expect.objectContaining({
      event: 'student_magic_link_ready',
      appName: 'Saulo Fitness APP',
      senderName: 'Coach Saulo',
      student: expect.objectContaining({
        id: 'student-1',
      }),
      access: expect.objectContaining({
        waitingRoomUrl: 'https://saulofitness.com/sala/token-1',
      }),
    }),
  );
});

test('times out the webhook call when provider does not respond', async () => {
  const server = http.createServer((_req, _res) => {
    // Intentionally left hanging to trigger timeout.
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;

  await expect(
    sendMagicLinkWebhook({
      webhookUrl: `http://127.0.0.1:${port}/timeout`,
      timeoutMs: 50,
      payload: { ok: true },
    }),
  ).rejects.toThrow();

  server.close();
});

test('verifies the webhook signature safely', async () => {
  const body = JSON.stringify({ hello: 'saulo' });
  const secret = 'signature-secret';
  const validSignature = signPayload(body, secret);

  expect(verifySignedPayload(body, secret, validSignature)).toBe(true);
  expect(verifySignedPayload(body, secret, 'firma-invalida')).toBe(false);
  expect(verifySignedPayload(body, '', '')).toBe(true);
  expect(verifySignedPayload(body, secret, '')).toBe(false);
});

test('payment received persists the provider-confirmed delivery channel', async () => {
  const providerRequests = [];
  const provider = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      providerRequests.push({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ ok: true, channel: 'email', deliveryId: 'prov-123' }),
      );
    });
  });

  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve));
  const providerAddress = provider.address();
  const providerPort =
    typeof providerAddress === 'object' && providerAddress
      ? providerAddress.port
      : null;

  const appPort = 4400 + Math.floor(Math.random() * 200);
  const projectRoot = path.resolve(__dirname, '..');
  const appProcess = spawn('node', ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(appPort),
      HOST: '127.0.0.1',
      SAULO_DATA_MODE: 'local',
      MAGIC_LINK_WEBHOOK_URL: `http://127.0.0.1:${providerPort}/webhook/magic-link`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForOutput(
      appProcess,
      `Saulo Fitness APP listening on http://127.0.0.1:${appPort}`,
    );

    const createResponse = await fetch(
      `http://127.0.0.1:${appPort}/api/trainer/students`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer local-trainer-token',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: `Canal proveedor ${Date.now()}`,
          contactEmail: 'canal@saulofitness.app',
          contactPhone: '+34622222222',
        }),
      },
    );
    expect(createResponse.ok).toBeTruthy();
    const createPayload = await createResponse.json();

    const paymentResponse = await fetch(
      `http://127.0.0.1:${appPort}/api/trainer/students/${encodeURIComponent(createPayload.student.id)}/payment-received`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer local-trainer-token',
          Accept: 'application/json',
        },
        body: JSON.stringify({ deliver: true }),
      },
    );
    expect(paymentResponse.ok).toBeTruthy();
    const paymentPayload = await paymentResponse.json();

    expect(paymentPayload.delivery.status).toBe('delivered');
    expect(paymentPayload.delivery.providerMeta).toEqual(
      expect.objectContaining({
        channel: 'email',
        deliveryId: 'prov-123',
      }),
    );

    const detailResponse = await fetch(
      `http://127.0.0.1:${appPort}/api/trainer/students/${encodeURIComponent(createPayload.student.id)}`,
      {
        headers: {
          Authorization: 'Bearer local-trainer-token',
          Accept: 'application/json',
        },
      },
    );
    expect(detailResponse.ok).toBeTruthy();
    const detailPayload = await detailResponse.json();

    expect(providerRequests).toHaveLength(1);
    expect(detailPayload.student.deliveryStatus).toBe('sent');
    expect(detailPayload.student.deliveryChannel).toBe('email');
    expect(detailPayload.student.deliveryHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: expect.stringContaining('sent'),
          title: expect.stringContaining('email'),
          meta: expect.stringContaining('deliveryId=prov-123'),
        }),
      ]),
    );
  } finally {
    provider.close();
    await stopProcess(appProcess);
  }
});

async function waitForOutput(process, expectedText, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let stdout = '';
  let stderr = '';

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => {
        cleanup();
        reject(
          new Error(
            `Timeout esperando "${expectedText}".\nstdout:\n${stdout}\nstderr:\n${stderr}`,
          ),
        );
      },
      Math.max(0, deadline - Date.now()),
    );

    const onStdout = (chunk) => {
      stdout += chunk.toString();
      if (stdout.includes(expectedText)) {
        cleanup();
        resolve();
      }
    };
    const onStderr = (chunk) => {
      stderr += chunk.toString();
    };
    const onExit = (code) => {
      cleanup();
      reject(
        new Error(
          `El proceso salió antes de tiempo con código ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    };

    function cleanup() {
      clearTimeout(timeout);
      process.stdout?.off('data', onStdout);
      process.stderr?.off('data', onStderr);
      process.off('exit', onExit);
    }

    process.stdout?.on('data', onStdout);
    process.stderr?.on('data', onStderr);
    process.on('exit', onExit);
  });
}

async function stopProcess(process) {
  if (!process || process.killed || process.exitCode != null) {
    return;
  }

  process.kill('SIGTERM');
  await new Promise((resolve) => {
    process.once('exit', resolve);
    setTimeout(resolve, 2000);
  });
}
