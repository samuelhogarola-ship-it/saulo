const { test, expect } = require('@playwright/test');

test('keeps student access isolated by access token', async ({ request }) => {
  const luciaSession = await request.get(
    '/api/student/session?access=lucia-access',
  );
  const hugoSession = await request.get(
    '/api/student/session?access=hugo-access',
  );
  const invalidSession = await request.get(
    '/api/student/session?access=invalid-access',
  );

  expect(luciaSession.ok()).toBeTruthy();
  expect(hugoSession.ok()).toBeTruthy();
  expect(invalidSession.status()).toBe(403);

  const luciaPayload = await luciaSession.json();
  const hugoPayload = await hugoSession.json();

  expect(luciaPayload.student).toEqual(
    expect.objectContaining({
      id: 'student-lucia',
      name: 'Lucía Ortega',
    }),
  );
  expect(hugoPayload.student).toEqual(
    expect.objectContaining({
      id: 'student-hugo',
      name: 'Hugo Martín',
    }),
  );

  const luciaRoutine = await request.get(
    '/api/student/routine?access=lucia-access&day=1',
  );
  const hugoRoutine = await request.get(
    '/api/student/routine?access=hugo-access&day=1',
  );

  expect((await luciaRoutine.json()).currentDay.title).toBe('Pierna + glúteo');
  expect((await hugoRoutine.json()).currentDay.title).toBe('Fuerza + control');
});

test('trainer API can send a message to a single student', async ({
  request,
}) => {
  const uniqueMessage = `Mensagem privada ${Date.now()}`;
  const trainerMessage = await request.post('/api/trainer/messages', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      studentId: 'student-hugo',
      title: 'Coach Saulo',
      body: uniqueMessage,
    },
  });

  expect(trainerMessage.status()).toBe(201);

  const hugoMessages = await request.get(
    '/api/student/messages?access=hugo-access',
  );
  const luciaMessages = await request.get(
    '/api/student/messages?access=lucia-access',
  );

  const hugoInbox = (await hugoMessages.json()).inbox;
  const luciaInbox = (await luciaMessages.json()).inbox;

  expect(hugoInbox).toEqual(
    expect.arrayContaining([expect.objectContaining({ body: uniqueMessage })]),
  );
  expect(luciaInbox).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ body: uniqueMessage })]),
  );
});

test('trainer API exposes the current trainer session', async ({ request }) => {
  const session = await request.get('/api/trainer/session', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
  });

  expect(session.ok()).toBeTruthy();

  const payload = await session.json();
  expect(payload.trainer).toEqual(
    expect.objectContaining({
      id: 'local-trainer',
      email: 'local@saulofitness.app',
      name: 'Saulo Trainer',
      mode: 'local',
    }),
  );

  const invalidSession = await request.get('/api/trainer/session', {
    headers: {
      Authorization: 'Bearer invalid-token',
    },
  });
  expect(invalidSession.status()).toBe(401);
});

test('trainer API can log in with product credentials', async ({ request }) => {
  const login = await request.post('/api/trainer/login', {
    data: {
      email: 'local@saulofitness.app',
      password: 'saulo1234',
    },
  });

  expect(login.status()).toBe(201);

  const payload = await login.json();
  expect(payload.session).toEqual(
    expect.objectContaining({
      accessToken: 'local-trainer-token',
      expiresAt: expect.any(String),
      trainer: expect.objectContaining({
        email: 'local@saulofitness.app',
        mode: 'local',
      }),
    }),
  );

  const invalidLogin = await request.post('/api/trainer/login', {
    data: {
      email: 'local@saulofitness.app',
      password: 'incorrecta',
    },
  });

  expect(invalidLogin.status()).toBe(401);
});

test('trainer API can refresh a valid trainer session', async ({ request }) => {
  const refresh = await request.post('/api/trainer/refresh', {
    data: {
      refreshToken: 'local-trainer-refresh-token',
    },
  });

  expect(refresh.status()).toBe(201);

  const payload = await refresh.json();
  expect(payload.session).toEqual(
    expect.objectContaining({
      accessToken: 'local-trainer-token',
      refreshToken: 'local-trainer-refresh-token',
      expiresAt: expect.any(String),
      trainer: expect.objectContaining({
        email: 'local@saulofitness.app',
      }),
    }),
  );

  const invalidRefresh = await request.post('/api/trainer/refresh', {
    data: {
      refreshToken: 'refresh-invalido',
    },
  });

  expect(invalidRefresh.status()).toBe(401);
});

test('trainer API can create a student and assign a routine', async ({
  request,
}) => {
  const accessToken = `student-access-${Date.now()}`;
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: 'Alumno API',
      plan: 'Producto MVP',
      accessToken,
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;
  const updateRoutine = await request.put(
    `/api/trainer/students/${createdStudent.id}/routine`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
      data: {
        routine: {
          days: [
            {
              day: 1,
              label: 'Día 1',
              title: 'Full body API',
              meta: 'Plan activo',
              exercises: [
                {
                  name: 'Remo API',
                  reps: '3 x 10',
                  load: 'Moderado',
                  rest: '60 s',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                },
              ],
            },
            {
              day: 3,
              label: 'Día 3',
              title: 'Espalda API',
              meta: 'Activa · Técnica',
              exercises: [
                {
                  name: 'Jalón API',
                  reps: '4 x 12',
                  load: '65%',
                  rest: '75 s',
                },
                {
                  name: 'Curl API',
                  reps: '3 x 15',
                  load: '10 kg',
                  rest: '60 s',
                },
              ],
            },
          ],
        },
      },
    },
  );
  expect(updateRoutine.ok()).toBeTruthy();

  const routine = await request.get(
    `/api/student/routine?access=${accessToken}&day=1`,
  );
  const payload = await routine.json();

  expect(payload.currentDay.title).toBe('Full body API');
  expect(payload.currentDay.exercises).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Remo API',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
    ]),
  );

  const dayThreeRoutine = await request.get(
    `/api/student/routine?access=${accessToken}&day=3`,
  );
  const dayThreePayload = await dayThreeRoutine.json();

  expect(dayThreePayload.currentDay.title).toBe('Espalda API');
  expect(dayThreePayload.currentDay.exercises).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Jalón API' }),
      expect.objectContaining({ name: 'Curl API' }),
    ]),
  );
});

test('student API persists progress photo uploads', async ({ request }) => {
  const upload = await request.post('/api/student/progress-photos', {
    headers: {
      Authorization: 'Bearer lucia-access',
    },
    data: {
      slot: 'Frente',
      filename: 'frente.png',
      contentType: 'image/png',
      dataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    },
  });

  expect(upload.status()).toBe(201);

  const profile = await request.get('/api/student/profile?access=lucia-access');

  const profilePayload = await profile.json();

  expect(profilePayload.photos.pendingUploads.Frente).toEqual(
    expect.objectContaining({
      slot: 'Frente',
      status: 'pending',
    }),
  );
});

test('trainer detail exposes latest workout report and photo status', async ({
  request,
}) => {
  const uniqueFeedback = `Sólida ${Date.now()}`;

  const report = await request.post('/api/student/workout-reports', {
    headers: {
      Authorization: 'Bearer lucia-access',
    },
    data: {
      day: 1,
      feedback: uniqueFeedback,
      exercises: [
        {
          name: 'Hip thrust',
          done: true,
          comment: 'Buen bloqueo arriba',
        },
      ],
      summary: `Día 1 · ${uniqueFeedback}`,
    },
  });

  expect(report.status()).toBe(201);

  const upload = await request.post('/api/student/progress-photos', {
    headers: {
      Authorization: 'Bearer lucia-access',
    },
    data: {
      slot: 'Espalda',
      filename: 'espalda.png',
      contentType: 'image/png',
      dataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
    },
  });

  expect(upload.status()).toBe(201);

  const detail = await request.get('/api/trainer/students/student-lucia', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
  });

  expect(detail.ok()).toBeTruthy();

  const payload = await detail.json();
  expect(payload.student.latestWorkoutReport).toEqual(
    expect.objectContaining({
      day: 1,
      feedback: uniqueFeedback,
    }),
  );
  expect(payload.student.workoutReportHistory).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        day: 1,
        feedback: uniqueFeedback,
      }),
    ]),
  );
  expect(payload.student.photoSummary).toEqual(
    expect.objectContaining({
      pendingCount: expect.any(Number),
      historyCount: expect.any(Number),
    }),
  );
  expect(payload.student.photoDetail).toEqual(
    expect.objectContaining({
      pendingSlots: expect.arrayContaining(['Espalda']),
      historyItems: expect.any(Array),
    }),
  );
  expect(payload.student.messageSummary).toEqual(
    expect.objectContaining({
      inboxCount: expect.any(Number),
      sentCount: expect.any(Number),
      remindersCount: expect.any(Number),
    }),
  );
  expect(payload.student.messageDetail).toEqual(expect.any(Array));
});

test('trainer API can rotate and revoke student access links', async ({
  request,
}) => {
  const accessToken = `student-access-${Date.now()}`;
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: 'Alumno Acceso',
      accessToken,
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;

  const initialSession = await request.get(
    `/api/student/session?access=${accessToken}`,
  );
  expect(initialSession.ok()).toBeTruthy();

  const rotateAccess = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/rotate`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(rotateAccess.status()).toBe(201);

  const rotatedPayload = await rotateAccess.json();
  const rotatedToken = rotatedPayload.access.accessToken;

  expect(rotatedPayload.access).toEqual(
    expect.objectContaining({
      studentId: createdStudent.id,
      accessRevokedAt: null,
      accessPath: `/app/?access=${encodeURIComponent(rotatedToken)}`,
    }),
  );
  expect(rotatedPayload.access.accessUrl).toContain(
    rotatedPayload.access.accessPath,
  );
  expect(rotatedToken).not.toBe(accessToken);

  const oldSession = await request.get(
    `/api/student/session?access=${accessToken}`,
  );
  const newSession = await request.get(
    `/api/student/session?access=${rotatedToken}`,
  );
  expect(oldSession.status()).toBe(403);
  expect(newSession.ok()).toBeTruthy();

  const revokeAccess = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/revoke`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(revokeAccess.ok()).toBeTruthy();

  const revokedPayload = await revokeAccess.json();
  expect(revokedPayload.access).toEqual(
    expect.objectContaining({
      studentId: createdStudent.id,
      accessToken: rotatedToken,
    }),
  );
  expect(revokedPayload.access.accessRevokedAt).toBeTruthy();

  const revokedSession = await request.get(
    `/api/student/session?access=${rotatedToken}`,
  );
  expect(revokedSession.status()).toBe(403);
});

test('rotating access after payment invalidates the previous waiting room link', async ({
  request,
}) => {
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: `Alumno Rotación Espera ${Date.now()}`,
      contactEmail: 'rotate@saulofitness.app',
      contactPhone: '+34612312312',
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;

  const paymentReceived = await request.post(
    `/api/trainer/students/${createdStudent.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentReceived.status()).toBe(201);

  const paymentPayload = await paymentReceived.json();
  const initialWaitingRoomToken = paymentPayload.waitingRoom.waitingRoomToken;

  const initialWaitingRoom = await request.get(
    `/api/waiting-room/${initialWaitingRoomToken}`,
  );
  expect(initialWaitingRoom.ok()).toBeTruthy();

  const rotateAccess = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/rotate`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(rotateAccess.status()).toBe(201);

  const studentDetail = await request.get(
    `/api/trainer/students/${createdStudent.id}`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(studentDetail.ok()).toBeTruthy();
  const detailPayload = await studentDetail.json();

  expect(detailPayload.student.waitingRoomToken).toBeTruthy();
  expect(detailPayload.student.waitingRoomToken).not.toBe(
    initialWaitingRoomToken,
  );
  expect(detailPayload.student.deliveryStatus).toBe('pending');
  expect(detailPayload.student.waitingRoomConsumedAt).toBeFalsy();

  const oldWaitingRoom = await request.get(
    `/api/waiting-room/${initialWaitingRoomToken}`,
  );
  expect(oldWaitingRoom.status()).toBe(404);

  const newWaitingRoom = await request.get(
    `/api/waiting-room/${detailPayload.student.waitingRoomToken}`,
  );
  expect(newWaitingRoom.ok()).toBeTruthy();
});

test('trainer API can generate a waiting room magic link after payment', async ({
  request,
}) => {
  const createStudent = await request.post('/api/trainer/students', {
    headers: {
      Authorization: 'Bearer local-trainer-token',
    },
    data: {
      name: 'Alumno Espera',
      contactEmail: 'espera@saulofitness.app',
      contactPhone: '+34611111111',
    },
  });
  expect(createStudent.status()).toBe(201);

  const createdStudent = (await createStudent.json()).student;
  const paymentReceived = await request.post(
    `/api/trainer/students/${createdStudent.id}/payment-received`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(paymentReceived.status()).toBe(201);

  const payload = await paymentReceived.json();
  expect(payload.waitingRoom).toEqual(
    expect.objectContaining({
      studentId: createdStudent.id,
      waitingRoomPath: expect.stringContaining('/acceso/'),
    }),
  );
  expect(payload.waitingRoom.paymentReceivedAt).toBeTruthy();
  expect(payload.waitingRoom.waitingRoomSentAt).toBeTruthy();
  expect(payload.delivery).toEqual(
    expect.objectContaining({
      status: 'ready-to-share',
      contactEmail: 'espera@saulofitness.app',
      contactPhone: '+34611111111',
      waitingRoomUrl: expect.stringContaining('/acceso/'),
      shareMessage: expect.stringContaining('Saulo Fitness APP'),
      whatsappUrl: expect.stringContaining('wa.me'),
      mailtoUrl: expect.stringContaining('mailto:'),
    }),
  );
  expect(payload.delivery.shareMessage).toContain('de un solo uso');
  expect(payload.delivery.shareMessage).toContain('tu sesión quedará activa');

  const markShared = await request.post(
    `/api/trainer/students/${createdStudent.id}/access/delivery`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
      data: {
        channel: 'whatsapp',
        status: 'shared',
      },
    },
  );
  expect(markShared.status()).toBe(201);
  const sharedPayload = await markShared.json();
  expect(sharedPayload.student).toEqual(
    expect.objectContaining({
      id: createdStudent.id,
      deliveryStatus: 'shared',
      deliveryChannel: 'whatsapp',
    }),
  );
  expect(sharedPayload.student.deliveryHistory).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: expect.stringContaining('shared'),
        title: expect.stringContaining('whatsapp'),
      }),
    ]),
  );

  const waitingToken = payload.waitingRoom.waitingRoomToken;
  const waitingRoom = await request.get(`/api/waiting-room/${waitingToken}`);
  expect(waitingRoom.ok()).toBeTruthy();

  const waitingPayload = await waitingRoom.json();
  expect(waitingPayload.student).toEqual(
    expect.objectContaining({
      id: createdStudent.id,
      name: 'Alumno Espera',
    }),
  );
  expect(waitingPayload.accessToken).toBeUndefined();
  expect(waitingPayload.appPath).toBeUndefined();

  const consumeWaitingRoom = await request.post(
    `/api/waiting-room/${waitingToken}/consume`,
  );
  expect(consumeWaitingRoom.ok()).toBeTruthy();
  const consumePayload = await consumeWaitingRoom.json();
  expect(consumePayload.accessToken).toBeTruthy();
  expect(consumePayload.appPath).toContain('/app/?access=');
  expect(consumePayload.appPath).toContain(consumePayload.accessToken);

  const openedStudentDetail = await request.get(
    `/api/trainer/students/${createdStudent.id}`,
    {
      headers: {
        Authorization: 'Bearer local-trainer-token',
      },
    },
  );
  expect(openedStudentDetail.ok()).toBeTruthy();
  const openedStudentPayload = await openedStudentDetail.json();
  expect(openedStudentPayload.student.waitingRoomConsumedAt).toBeTruthy();
  expect(openedStudentPayload.student.deliveryStatus).toBe('opened');
  expect(openedStudentPayload.student.deliveryChannel).toBe('app');
  expect(openedStudentPayload.student.deliveryHistory).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: expect.stringContaining('opened'),
        title: expect.stringContaining('app'),
      }),
    ]),
  );

  const waitingRoomReuse = await request.get(
    `/api/waiting-room/${waitingToken}`,
  );
  expect(waitingRoomReuse.status()).toBe(409);
  const waitingRoomReusePayload = await waitingRoomReuse.json();
  expect(waitingRoomReusePayload).toEqual(
    expect.objectContaining({
      state: 'already-opened',
      student: expect.objectContaining({
        id: createdStudent.id,
        name: 'Alumno Espera',
      }),
      waitingRoomConsumedAt: expect.any(String),
    }),
  );
  expect(waitingRoomReusePayload.accessToken).toBeUndefined();
  expect(waitingRoomReusePayload.appPath).toBeUndefined();
});
