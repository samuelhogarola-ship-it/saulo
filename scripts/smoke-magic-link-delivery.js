const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { verifySignedPayload } = require('../lib/magic-link-delivery');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const appPort = Number(process.env.DELIVERY_SMOKE_APP_PORT || 4317);
  const providerPort = Number(process.env.DELIVERY_SMOKE_PROVIDER_PORT || 8788);
  const providerHost = process.env.DELIVERY_SMOKE_PROVIDER_HOST || '127.0.0.1';
  const outputPath =
    process.env.DELIVERY_SMOKE_OUTPUT_PATH ||
    path.join(os.tmpdir(), `saulo-magic-link-smoke-${Date.now()}.json`);

  removeFileIfExists(outputPath);

  const providerSecret =
    process.env.MAGIC_LINK_WEBHOOK_SECRET || 'smoke-secret';
  const providerBearerToken =
    process.env.MAGIC_LINK_WEBHOOK_BEARER_TOKEN || 'smoke-bearer-token';
  const providerServer = createMockProviderServer({
    host: providerHost,
    port: providerPort,
    outputPath,
    secret: providerSecret,
    bearerToken: providerBearerToken,
  });

  try {
    await startHttpServer(providerServer, providerPort, providerHost);

    const appProcess = spawnProcess('node', ['server.js'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(appPort),
        SAULO_DATA_MODE: 'local',
        MAGIC_LINK_WEBHOOK_URL: `http://${providerHost}:${providerPort}/webhook/magic-link`,
        MAGIC_LINK_WEBHOOK_SECRET: providerSecret,
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: providerBearerToken,
        MOCK_MAGIC_LINK_PROVIDER_OUTPUT_PATH: outputPath,
      },
    });

    try {
      await waitForOutput(
        appProcess,
        `Saulo Fitness APP listening on http://127.0.0.1:${appPort}`,
        'app server',
      );

      const createdStudent = await createStudent(appPort);
      const paymentPayload = await markPaymentReceived(
        appPort,
        createdStudent.id,
      );
      const webhookRecord = await waitForWebhookFile(outputPath);
      const studentDetail = await getStudentDetail(appPort, createdStudent.id);

      assertWebhookRecord({
        createdStudent,
        paymentPayload,
        webhookRecord,
        studentDetail,
      });

      console.log('Saulo Fitness APP · Delivery smoke check');
      console.log(`- App URL: http://127.0.0.1:${appPort}`);
      console.log(
        `- Provider URL: http://${providerHost}:${providerPort}/webhook/magic-link`,
      );
      console.log(`- Student: ${createdStudent.name} (${createdStudent.id})`);
      console.log(
        `- Waiting room: ${paymentPayload.waitingRoom.waitingRoomUrl}`,
      );
      console.log(`- Delivery status: ${paymentPayload.delivery.status}`);
      console.log(`- Delivery channel: ${studentDetail.deliveryChannel}`);
      console.log(
        `- Delivery note: ${studentDetail.deliveryHistory?.[0]?.meta || 'n/a'}`,
      );
      console.log(`- Output file: ${outputPath}`);
      console.log(
        '\nLocal delivery path is working: payment received triggered the webhook, delivered the waiting room link and persisted the provider metadata.',
      );
    } finally {
      await stopProcess(appProcess);
    }
  } finally {
    await stopHttpServer(providerServer);
  }
}

async function createStudent(appPort) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/trainer/students`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer local-trainer-token',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: `Delivery Smoke ${Date.now()}`,
        plan: 'Plan producto',
        goal: 'Validar entrega automatica',
        contactEmail: `delivery-smoke-${Date.now()}@saulofitness.app`,
        contactPhone: '+34611111111',
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.student?.id) {
    throw new Error(
      payload.message || 'No se pudo crear el alumno para el smoke de entrega.',
    );
  }

  return payload.student;
}

async function markPaymentReceived(appPort, studentId) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/trainer/students/${encodeURIComponent(studentId)}/payment-received`,
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

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.delivery || !payload.waitingRoom) {
    throw new Error(
      payload.message ||
        'No se pudo marcar pago recibido en el smoke de entrega.',
    );
  }

  if (payload.delivery.status !== 'delivered' || !payload.delivery.dispatched) {
    throw new Error(
      `La entrega automática no quedó en estado delivered. Estado recibido: ${payload.delivery.status || 'desconocido'}.`,
    );
  }

  return payload;
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
    'El proveedor mock no escribió el payload del webhook a tiempo.',
  );
}

async function getStudentDetail(appPort, studentId) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/trainer/students/${encodeURIComponent(studentId)}`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.student) {
    throw new Error(
      payload.message ||
        'No se pudo leer el detalle del alumno tras la entrega automática.',
    );
  }

  return payload.student;
}

function assertWebhookRecord({
  createdStudent,
  paymentPayload,
  webhookRecord,
  studentDetail,
}) {
  const payload = webhookRecord?.payload || {};

  if (payload.event !== 'student_magic_link_ready') {
    throw new Error('El webhook no contiene el evento esperado.');
  }

  if (payload.student?.id !== createdStudent.id) {
    throw new Error('El webhook no apunta al alumno creado en el smoke.');
  }

  if (
    payload.access?.waitingRoomUrl !== paymentPayload.waitingRoom.waitingRoomUrl
  ) {
    throw new Error(
      'El waiting room enviado por webhook no coincide con la respuesta del backend.',
    );
  }

  if (
    !String(payload.message || '').includes(
      paymentPayload.waitingRoom.waitingRoomUrl,
    )
  ) {
    throw new Error(
      'El mensaje compartido no incluye el waiting room link esperado.',
    );
  }

  if (studentDetail.deliveryStatus !== 'sent') {
    throw new Error(
      `El detalle del alumno no quedó en estado sent. Estado recibido: ${studentDetail.deliveryStatus || 'desconocido'}.`,
    );
  }

  if (studentDetail.deliveryChannel !== 'whatsapp') {
    throw new Error(
      `El detalle del alumno no persistió el canal del proveedor. Canal recibido: ${studentDetail.deliveryChannel || 'desconocido'}.`,
    );
  }

  if (
    !Array.isArray(studentDetail.deliveryHistory) ||
    !studentDetail.deliveryHistory.length
  ) {
    throw new Error(
      'El detalle del alumno no devolvió historial de entregas tras el webhook.',
    );
  }

  if (
    !String(studentDetail.deliveryHistory[0]?.meta || '').includes(
      'deliveryId=mock-delivery-001',
    )
  ) {
    throw new Error(
      'El detalle del alumno no guardó el deliveryId del proveedor mock.',
    );
  }
}

function createMockProviderServer({
  host,
  port,
  outputPath,
  secret,
  bearerToken,
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
          deliveryId: 'mock-delivery-001',
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

function spawnProcess(command, args, options) {
  const child = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.__stdout = '';
  child.__stderr = '';

  child.stdout.on('data', (chunk) => {
    child.__stdout += chunk;
  });

  child.stderr.on('data', (chunk) => {
    child.__stderr += chunk;
  });

  return child;
}

async function waitForOutput(child, expectedText, label) {
  const timeoutAt = Date.now() + 12000;

  while (Date.now() < timeoutAt) {
    if (child.exitCode != null) {
      throw new Error(
        `${label} terminó antes de tiempo.\nSTDOUT:\n${child.__stdout}\nSTDERR:\n${child.__stderr}`,
      );
    }

    if (
      child.__stdout.includes(expectedText) ||
      child.__stderr.includes(expectedText)
    ) {
      return;
    }

    await sleep(100);
  }

  throw new Error(
    `Timeout esperando a ${label}.\nSTDOUT:\n${child.__stdout}\nSTDERR:\n${child.__stderr}`,
  );
}

async function stopProcess(child) {
  if (!child || child.exitCode != null) {
    return;
  }

  child.kill('SIGTERM');
  const timeoutAt = Date.now() + 3000;

  while (Date.now() < timeoutAt) {
    if (child.exitCode != null) {
      return;
    }
    await sleep(50);
  }

  child.kill('SIGKILL');
}

async function startHttpServer(server, port, host) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
}

async function stopHttpServer(server) {
  if (!server.listening) {
    return;
  }

  await new Promise((resolve) => server.close(resolve));
}

function removeFileIfExists(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch (_error) {
    // Best effort cleanup.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function respond(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
