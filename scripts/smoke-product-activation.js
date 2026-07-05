const os = require('node:os');
const path = require('node:path');

const {
  createMockDeliveryServer,
  waitForWebhookFile,
} = require('./_mock-delivery');
const {
  removeFileIfExists,
  spawnProcess,
  startHttpServer,
  stopHttpServer,
  stopProcess,
  waitForOutput,
} = require('./_smoke-runtime');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const appPort = Number(process.env.ACTIVATION_SMOKE_APP_PORT || 4318);
  const deliveryPort = Number(
    process.env.ACTIVATION_SMOKE_DELIVERY_PORT || 8789,
  );
  const deliveryHost =
    process.env.ACTIVATION_SMOKE_DELIVERY_HOST || '127.0.0.1';
  const outputPath =
    process.env.ACTIVATION_SMOKE_OUTPUT_PATH ||
    path.join(os.tmpdir(), `saulo-activation-smoke-${Date.now()}.json`);

  removeFileIfExists(outputPath);

  const deliverySecret =
    process.env.MAGIC_LINK_WEBHOOK_SECRET || 'activation-smoke-secret';
  const deliveryBearerToken =
    process.env.MAGIC_LINK_WEBHOOK_BEARER_TOKEN ||
    'activation-smoke-bearer-token';
  const deliveryServer = createMockDeliveryServer({
    host: deliveryHost,
    port: deliveryPort,
    outputPath,
    secret: deliverySecret,
    bearerToken: deliveryBearerToken,
    deliveryId: 'activation-smoke-delivery-001',
  });

  try {
    await startHttpServer(deliveryServer, deliveryPort, deliveryHost);

    const appProcess = spawnProcess('node', ['server.js'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(appPort),
        SAULO_DATA_MODE: 'local',
        MAGIC_LINK_WEBHOOK_URL: `http://${deliveryHost}:${deliveryPort}/webhook/magic-link`,
        MAGIC_LINK_WEBHOOK_SECRET: deliverySecret,
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: deliveryBearerToken,
      },
    });

    try {
      await waitForOutput(
        appProcess,
        `Saulo Fitness APP listening on http://127.0.0.1:${appPort}`,
        'app server',
      );

      const student = await createStudent(appPort);
      const paymentPayload = await markPaymentReceived(appPort, student.id);
      const webhookRecord = await waitForWebhookFile(outputPath);
      const waitingRoomToken = paymentPayload.waitingRoom.waitingRoomToken;
      const waitingPreview = await getWaitingRoomPreview(
        appPort,
        waitingRoomToken,
      );
      const activationPayload = await consumeWaitingRoom(
        appPort,
        waitingRoomToken,
      );
      const studentSession = await getStudentSession(
        appPort,
        activationPayload.accessToken,
      );
      const routine = await getStudentRoutine(
        appPort,
        activationPayload.accessToken,
      );
      const studentDetail = await getStudentDetail(appPort, student.id);
      const reopened = await getWaitingRoomPreviewStatus(
        appPort,
        waitingRoomToken,
      );

      assertActivationFlow({
        student,
        paymentPayload,
        webhookRecord,
        waitingPreview,
        activationPayload,
        studentSession,
        routine,
        studentDetail,
        reopened,
      });

      console.log('Saulo Fitness APP · Product activation smoke');
      console.log(`- App URL: http://127.0.0.1:${appPort}`);
      console.log(
        `- Delivery endpoint: http://${deliveryHost}:${deliveryPort}/webhook/magic-link`,
      );
      console.log(`- Student: ${student.name} (${student.id})`);
      console.log(
        `- Waiting room: ${paymentPayload.waitingRoom.waitingRoomUrl}`,
      );
      console.log(
        `- Delivery status before open: ${paymentPayload.delivery.status}`,
      );
      console.log(
        `- Delivery status after open: ${studentDetail.deliveryStatus}`,
      );
      console.log(
        `- Delivery channel after open: ${studentDetail.deliveryChannel}`,
      );
      console.log(`- Activated app path: ${activationPayload.appPath}`);
      console.log(`- Routine day: ${routine.currentDay.day}`);
      console.log(`- Waiting room reuse state: ${reopened.state}`);
      console.log(`- Output file: ${outputPath}`);
      console.log(
        '\nFull local activation path is working: payment received triggered delivery, the waiting room activated the session, and the student API opened with a real access token.',
      );
    } finally {
      await stopProcess(appProcess);
    }
  } finally {
    await stopHttpServer(deliveryServer);
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
        name: `Activation Smoke ${Date.now()}`,
        plan: 'Plan producto',
        goal: 'Validar activacion PWA',
        contactEmail: `activation-smoke-${Date.now()}@saulofitness.app`,
        contactPhone: '+34612222222',
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.student?.id) {
    throw new Error(
      payload.message ||
        'No se pudo crear el alumno para el smoke de activación.',
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
        'No se pudo marcar pago recibido para el smoke de activación.',
    );
  }

  return payload;
}

async function getWaitingRoomPreview(appPort, waitingRoomToken) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/waiting-room/${encodeURIComponent(waitingRoomToken)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.message ||
        'La sala de espera no respondió correctamente antes de consumir el acceso.',
    );
  }

  return payload;
}

async function consumeWaitingRoom(appPort, waitingRoomToken) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/waiting-room/${encodeURIComponent(waitingRoomToken)}/consume`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.accessToken || !payload.appPath) {
    throw new Error(
      payload.message ||
        'Consumir la sala de espera no activó correctamente la sesión del alumno.',
    );
  }

  return payload;
}

async function getStudentSession(appPort, accessToken) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/student/session`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.student?.id) {
    throw new Error(
      payload.message ||
        'La sesión del alumno no respondió tras la activación.',
    );
  }

  return payload;
}

async function getStudentRoutine(appPort, accessToken) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/student/routine?day=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.currentDay?.day) {
    throw new Error(
      payload.message ||
        'La rutina del alumno no respondió tras la activación de la sesión.',
    );
  }

  return payload;
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
        'No se pudo leer el detalle final del alumno tras la activación.',
    );
  }

  return payload.student;
}

async function getWaitingRoomPreviewStatus(appPort, waitingRoomToken) {
  const response = await fetch(
    `http://127.0.0.1:${appPort}/api/waiting-room/${encodeURIComponent(waitingRoomToken)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  const payload = await response.json().catch(() => ({}));
  return {
    status: response.status,
    state: payload.state || '',
    payload,
  };
}

function assertActivationFlow({
  student,
  paymentPayload,
  webhookRecord,
  waitingPreview,
  activationPayload,
  studentSession,
  routine,
  studentDetail,
  reopened,
}) {
  if (paymentPayload.delivery.status !== 'delivered') {
    throw new Error(
      `La entrega automática previa a la activación no quedó en delivered. Estado recibido: ${paymentPayload.delivery.status || 'desconocido'}.`,
    );
  }

  if (webhookRecord?.payload?.student?.id !== student.id) {
    throw new Error(
      'El webhook de entrega no coincide con el alumno activado.',
    );
  }

  if (waitingPreview.student?.id !== student.id) {
    throw new Error(
      'La preview de la sala de espera no pertenece al alumno creado.',
    );
  }

  if (waitingPreview.accessToken || waitingPreview.appPath) {
    throw new Error(
      'La preview de la sala de espera expuso accessToken o appPath antes de consumir el acceso.',
    );
  }

  if (!String(activationPayload.appPath || '').includes('/app/?access=')) {
    throw new Error(
      'La sala de espera no devolvió una ruta válida hacia la app.',
    );
  }

  if (
    !String(activationPayload.appPath || '').includes(
      encodeURIComponent(activationPayload.accessToken),
    )
  ) {
    throw new Error(
      'La ruta final de la app no contiene el access token activado esperado.',
    );
  }

  if (studentSession.student.id !== student.id) {
    throw new Error(
      'La sesión activa del alumno no coincide con el acceso consumido.',
    );
  }

  if (!routine.currentDay?.exercises?.length) {
    throw new Error(
      'La rutina del alumno no quedó accesible tras la activación.',
    );
  }

  if (!studentDetail.waitingRoomConsumedAt) {
    throw new Error(
      'El detalle del alumno no refleja waitingRoomConsumedAt tras activar la app.',
    );
  }

  if (studentDetail.deliveryStatus !== 'opened') {
    throw new Error(
      `El detalle del alumno no quedó en opened tras activar la app. Estado recibido: ${studentDetail.deliveryStatus || 'desconocido'}.`,
    );
  }

  if (studentDetail.deliveryChannel !== 'app') {
    throw new Error(
      `El detalle del alumno no cambió el canal a app tras la activación. Canal recibido: ${studentDetail.deliveryChannel || 'desconocido'}.`,
    );
  }

  if (
    !Array.isArray(studentDetail.deliveryHistory) ||
    !studentDetail.deliveryHistory.some((item) =>
      String(item.title || '').includes('opened'),
    )
  ) {
    throw new Error(
      'El historial de entrega no registró la apertura de la app desde la sala de espera.',
    );
  }

  if (reopened.status !== 409 || reopened.state !== 'already-opened') {
    throw new Error(
      'Reabrir la sala de espera no devolvió el estado already-opened esperado.',
    );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
