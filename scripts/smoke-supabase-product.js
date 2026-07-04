const { runtime, supabase, trainerLogin } = require('../lib/config');
const { createSauloStore } = require('../lib/saulo-store');

async function main() {
  if (runtime.requestedDataMode !== 'supabase' || !supabase.hasConfig) {
    throw new Error(
      'Este script necesita SAULO_DATA_MODE=supabase y credenciales reales de Supabase.',
    );
  }

  const store = createSauloStore();
  if (store.mode !== 'supabase') {
    throw new Error(
      `El store arrancó en modo ${store.mode}. Revisa SAULO_DATA_MODE y las credenciales de Supabase.`,
    );
  }

  const trainerCredentials = resolveTrainerCredentials();
  const trainerSession = await store.loginTrainer(trainerCredentials);
  assertTrainerSessionShape(trainerSession, 'login');
  const auth = { token: trainerSession.accessToken };
  const trainer = await store.getTrainerSession(auth);
  const students = await store.listStudents(auth);

  const refreshedSession = await refreshTrainerSessionOrFail(
    store,
    trainerSession,
  );
  assertTrainerSessionShape(refreshedSession, 'refresh');
  const refreshedAuth = { token: refreshedSession.accessToken };
  const refreshedTrainer = await store.getTrainerSession(refreshedAuth);
  const refreshedStudents = await store.listStudents(refreshedAuth);

  if (!students.length) {
    throw new Error(
      'No hay alumnos para este entrenador. Ejecuta antes npm run product:bootstrap:student.',
    );
  }

  assertRefreshConsistency({
    trainer,
    refreshedTrainer,
    students,
    refreshedStudents,
  });

  const targetStudent = resolveTargetStudent(students);
  const waitingRoomFlow = resolveWaitingRoomFlowConfig();
  const accessState = waitingRoomFlow.enabled
    ? await runWaitingRoomFlowCheck({
        store,
        auth: refreshedAuth,
        student: targetStudent,
      })
    : {
        student: targetStudent,
        accessToken: targetStudent.accessToken,
        waitingRoomTriggered: false,
      };
  const studentDetail = await store.getTrainerStudent(
    refreshedAuth,
    targetStudent.id,
  );
  const studentSession = await store.getSession(accessState.accessToken);
  const subscription = await store.getSubscription(accessState.accessToken);
  const routine = await store.getRoutine(
    accessState.accessToken,
    resolveRequestedDay(),
  );
  const messages = await store.getMessages(accessState.accessToken);
  const profile = await store.getProfile(accessState.accessToken);

  assertConsistentStudent(accessState.student, studentDetail, studentSession);

  console.log('Saulo Fitness APP · Supabase smoke check');
  console.log(`- Store mode: ${store.mode}`);
  console.log(`- Trainer: ${trainer.name} <${trainer.email}>`);
  console.log(
    `- Trainer refresh token available: ${trainerSession.refreshToken ? 'yes' : 'no'}`,
  );
  console.log(
    `- Trainer session renewed: ${refreshedSession.accessToken ? 'yes' : 'no'}`,
  );
  console.log(`- Students visible for trainer: ${students.length}`);
  console.log(`- Target student: ${targetStudent.name} (${targetStudent.id})`);
  console.log(`- Contact email: ${targetStudent.contactEmail || 'n/a'}`);
  console.log(`- Access token: ${maskToken(accessState.accessToken)}`);
  console.log(
    `- Payment received: ${accessState.student.paymentReceivedAt ? 'yes' : 'no'}`,
  );
  console.log(
    `- Waiting room ready: ${accessState.student.waitingRoomToken ? 'yes' : 'no'}`,
  );
  console.log(
    `- Delivery status: ${accessState.student.deliveryStatus || 'not-sent-yet'}`,
  );
  console.log(
    `- Waiting room flow checked live: ${waitingRoomFlow.enabled ? 'yes' : 'no'}`,
  );
  if (waitingRoomFlow.enabled) {
    console.log(
      `- Waiting room reuse after activation: ${accessState.waitingRoomReuseState || 'unknown'}`,
    );
  }
  console.log(`- Subscription: ${subscription.planLabel || 'sin plan'}`);
  console.log(
    `- Routine day ${routine.currentDay.day}: ${routine.currentDay.title}`,
  );
  console.log(
    `- Exercises on current day: ${routine.currentDay.exercises.length}`,
  );
  console.log(`- Inbox messages: ${messages.inbox.length}`);
  console.log(`- Sent messages: ${messages.sent.length}`);
  console.log(`- Reminder messages: ${messages.reminders.length}`);
  console.log(
    `- Progress photos history: ${Array.isArray(profile.photos?.history) ? profile.photos.history.length : 0}`,
  );
  console.log(
    `- Pending progress photo slots: ${Object.keys(profile.photos?.pendingUploads || {}).length}`,
  );
  console.log(
    '\nSupabase product path is responding with real trainer auth, refresh and student data.',
  );
}

async function runWaitingRoomFlowCheck({ store, auth, student }) {
  const paymentState = await store.markPaymentReceived(auth, student.id);
  const waitingRoomToken = String(paymentState.waitingRoomToken || '').trim();
  const accessToken = String(paymentState.accessToken || '').trim();

  if (!waitingRoomToken) {
    throw new Error(
      'El flujo real de pago recibido no devolvió waitingRoomToken.',
    );
  }

  if (!accessToken) {
    throw new Error(
      'El flujo real de pago recibido no devolvió accessToken rotado.',
    );
  }

  const preview = await store.getWaitingRoomPreview(waitingRoomToken);
  if (
    preview.student?.id !== student.id ||
    preview.accessToken ||
    preview.appPath
  ) {
    throw new Error(
      'La preview de la sala de espera no respeta el contrato esperado del producto.',
    );
  }

  const consumed = await store.consumeWaitingRoomSession(waitingRoomToken);
  if (String(consumed.accessToken || '').trim() !== accessToken) {
    throw new Error(
      'Consumir la sala de espera no devolvió el access token activo esperado.',
    );
  }

  if (
    !String(consumed.appPath || '').includes(
      encodeURIComponent(consumed.accessToken),
    )
  ) {
    throw new Error(
      'Consumir la sala de espera no devolvió una ruta final válida hacia la app.',
    );
  }

  const updatedStudent = await store.getTrainerStudent(auth, student.id);
  if (!updatedStudent.waitingRoomConsumedAt) {
    throw new Error(
      'El detalle del alumno no refleja waitingRoomConsumedAt tras consumir la sala de espera.',
    );
  }

  if (updatedStudent.deliveryStatus !== 'opened') {
    throw new Error(
      'El detalle del alumno no refleja deliveryStatus=opened tras consumir la sala de espera.',
    );
  }

  await assertConsumedWaitingRoomReuse({
    store,
    waitingRoomToken,
    studentId: student.id,
  });

  return {
    student: updatedStudent,
    accessToken,
    waitingRoomTriggered: true,
    waitingRoomReuseState: 'already-opened',
  };
}

async function assertConsumedWaitingRoomReuse({
  store,
  waitingRoomToken,
  studentId,
}) {
  try {
    await store.getWaitingRoomPreview(waitingRoomToken);
  } catch (error) {
    if (Number(error.status) !== 409) {
      throw new Error(
        `Reabrir la sala de espera consumida devolvió ${error.status || 'un error inesperado'} en lugar de 409.`,
      );
    }

    if (error.code !== 'WAITING_ROOM_ALREADY_OPENED') {
      throw new Error(
        'La sala de espera consumida no devolvió el código WAITING_ROOM_ALREADY_OPENED esperado.',
      );
    }

    if (error.waitingRoom?.student?.id !== studentId) {
      throw new Error(
        'La reapertura de la sala de espera consumida no quedó asociada al alumno correcto.',
      );
    }

    if (!error.waitingRoom?.waitingRoomConsumedAt) {
      throw new Error(
        'La reapertura de la sala de espera consumida no devolvió waitingRoomConsumedAt.',
      );
    }

    return;
  }

  throw new Error(
    'La sala de espera consumida siguió respondiendo como disponible en lugar de pasar a estado already-opened.',
  );
}

async function refreshTrainerSessionOrFail(store, trainerSession) {
  if (!trainerSession?.refreshToken) {
    throw new Error(
      'El login real no devolvió refresh token. No se puede validar la renovación real de la sesión del entrenador.',
    );
  }

  return store.refreshTrainerSession({
    refreshToken: trainerSession.refreshToken,
  });
}

function resolveTrainerCredentials() {
  const email = String(
    process.env.SMOKE_TRAINER_EMAIL || trainerLogin.email || '',
  )
    .trim()
    .toLowerCase();
  const password = String(
    process.env.SMOKE_TRAINER_PASSWORD || trainerLogin.password || '',
  ).trim();

  if (!email || !password) {
    throw new Error(
      'Define SMOKE_TRAINER_EMAIL y SMOKE_TRAINER_PASSWORD para validar el login real del entrenador.',
    );
  }

  return { email, password };
}

function resolveRequestedDay() {
  const parsed = Number(process.env.SMOKE_STUDENT_DAY || '1');

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 7) {
    return 1;
  }

  return parsed;
}

function resolveWaitingRoomFlowConfig() {
  return {
    enabled:
      String(process.env.SMOKE_TRIGGER_WAITING_ROOM || '')
        .trim()
        .toLowerCase() === 'true',
  };
}

function resolveTargetStudent(students) {
  const expectedId = String(process.env.SMOKE_STUDENT_ID || '').trim();
  const expectedEmail = String(
    process.env.SMOKE_STUDENT_CONTACT_EMAIL || '',
  ).trim();
  const expectedName = String(process.env.SMOKE_STUDENT_NAME || '').trim();
  const expectedAccessToken = String(
    process.env.SMOKE_STUDENT_ACCESS_TOKEN || '',
  ).trim();

  if (expectedId) {
    const match = students.find((student) => student.id === expectedId);
    if (!match) {
      throw new Error(`No se encontró el alumno con id ${expectedId}.`);
    }
    return match;
  }

  if (expectedAccessToken) {
    const match = students.find(
      (student) => student.accessToken === expectedAccessToken,
    );
    if (!match) {
      throw new Error(
        'No se encontró un alumno del entrenador con ese access token.',
      );
    }
    return match;
  }

  if (expectedEmail) {
    const matches = students.filter(
      (student) =>
        String(student.contactEmail || '').toLowerCase() ===
        expectedEmail.toLowerCase(),
    );
    if (!matches.length) {
      throw new Error(
        `No se encontró el alumno con contact email ${expectedEmail}.`,
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `Hay más de un alumno con contact email ${expectedEmail}. Usa SMOKE_STUDENT_ID.`,
      );
    }
    return matches[0];
  }

  if (expectedName) {
    const matches = students.filter(
      (student) => String(student.name || '') === expectedName,
    );
    if (!matches.length) {
      throw new Error(`No se encontró el alumno con nombre ${expectedName}.`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Hay más de un alumno llamado ${expectedName}. Usa SMOKE_STUDENT_ID.`,
      );
    }
    return matches[0];
  }

  if (students.length === 1) {
    return students[0];
  }

  throw new Error(
    'Hay varios alumnos. Define SMOKE_STUDENT_ID, SMOKE_STUDENT_CONTACT_EMAIL, SMOKE_STUDENT_NAME o SMOKE_STUDENT_ACCESS_TOKEN.',
  );
}

function assertConsistentStudent(targetStudent, studentDetail, studentSession) {
  if (targetStudent.id !== studentDetail.id) {
    throw new Error(
      'La vista de detalle del entrenador no coincide con el alumno seleccionado.',
    );
  }

  if (targetStudent.id !== studentSession.student?.id) {
    throw new Error(
      'La sesión del alumno no coincide con el alumno que el entrenador puede ver.',
    );
  }
}

function assertTrainerSessionShape(session, source) {
  const accessToken = String(session?.accessToken || '').trim();
  const refreshToken = String(session?.refreshToken || '').trim();
  const expiresAt = String(session?.expiresAt || '').trim();

  if (!accessToken) {
    throw new Error(
      `La sesión de entrenador obtenida por ${source} no trae access token.`,
    );
  }

  if (!refreshToken) {
    throw new Error(
      `La sesión de entrenador obtenida por ${source} no trae refresh token.`,
    );
  }

  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) {
    throw new Error(
      `La sesión de entrenador obtenida por ${source} no trae expiresAt válido.`,
    );
  }
}

function assertRefreshConsistency({
  trainer,
  refreshedTrainer,
  students,
  refreshedStudents,
}) {
  if (trainer.id !== refreshedTrainer.id) {
    throw new Error(
      'El refresh devolvió una sesión ligada a otro entrenador distinto.',
    );
  }

  if (students.length !== refreshedStudents.length) {
    throw new Error(
      'La lista de alumnos cambió después del refresh. Revisa ownership o sesión del entrenador.',
    );
  }
}

function maskToken(value) {
  const token = String(value || '').trim();

  if (!token) {
    return 'n/a';
  }

  if (token.length <= 10) {
    return token;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
