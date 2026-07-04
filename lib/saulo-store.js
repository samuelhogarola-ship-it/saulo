const crypto = require('node:crypto');

const {
  defaultStudentAccessToken,
  supabase,
  trainerLogin,
  trainerApiToken,
} = require('./config');

const DAY_LABELS = {
  1: 'Día 1',
  2: 'Día 2',
  3: 'Día 3',
  4: 'Día 4',
  5: 'Día 5',
  6: 'Día 6',
  7: 'Día 7',
};

function createSauloStore() {
  if (supabase.hasConfig) {
    return createSupabaseStore();
  }

  return createLocalStore();
}

function createLocalStore() {
  const state = createSeedState();
  const localRefreshToken = 'local-trainer-refresh-token';

  return {
    mode: 'local',
    async loginTrainer(credentials) {
      const email = String(credentials?.email || '')
        .trim()
        .toLowerCase();
      const password = String(credentials?.password || '').trim();

      if (
        email !== trainerLogin.email.toLowerCase() ||
        password !== trainerLogin.password
      ) {
        throw createHttpError(401, 'Credenciales de entrenador no válidas.');
      }

      return {
        accessToken: trainerApiToken,
        refreshToken: localRefreshToken,
        expiresAt: createSessionExpiryIso(3600),
        trainer: {
          id: 'local-trainer',
          email: trainerLogin.email,
          name: 'Saulo Trainer',
          mode: 'local',
        },
      };
    },
    async refreshTrainerSession(input) {
      const refreshToken = String(input?.refreshToken || '').trim();

      if (refreshToken !== localRefreshToken) {
        throw createHttpError(
          401,
          'No se pudo renovar la sesión del entrenador.',
        );
      }

      return {
        accessToken: trainerApiToken,
        refreshToken: localRefreshToken,
        expiresAt: createSessionExpiryIso(3600),
        trainer: {
          id: 'local-trainer',
          email: trainerLogin.email,
          name: 'Saulo Trainer',
          mode: 'local',
        },
      };
    },
    async getTrainerSession(authContext) {
      requireTrainer(authContext);
      return {
        id: 'local-trainer',
        email: 'local@saulofitness.app',
        name: 'Saulo Trainer',
        mode: 'local',
      };
    },
    getDefaultAccessToken() {
      return defaultStudentAccessToken;
    },
    getDefaultWaitingRoomToken() {
      return state.students[0]?.waitingRoomToken || '';
    },
    async resolveStudent(accessToken) {
      return resolveLocalStudent(state, accessToken);
    },
    async getSession(accessToken) {
      const student = resolveLocalStudent(state, accessToken);
      return {
        accessToken: student.accessToken,
        student: serializeStudent(student),
      };
    },
    async getProfile(accessToken) {
      const student = resolveLocalStudent(state, accessToken);
      return {
        student: serializeStudent(student),
        photos: student.photos,
      };
    },
    async getSubscription(accessToken) {
      return resolveLocalStudent(state, accessToken).subscription;
    },
    async getRoutine(accessToken, requestedDay) {
      const student = resolveLocalStudent(state, accessToken);
      const day = normalizeDay(requestedDay);
      return {
        days: student.routine.days.map((item) => ({
          day: item.day,
          label: DAY_LABELS[item.day],
          active: item.exercises.length > 0,
        })),
        currentDay:
          student.routine.days.find((item) => item.day === day) ||
          student.routine.days[0],
      };
    },
    async getMessages(accessToken) {
      return resolveLocalStudent(state, accessToken).messages;
    },
    async createMessage(accessToken, input) {
      const student = resolveLocalStudent(state, accessToken);
      const message = {
        id: createId('msg'),
        title: input.title,
        tag: 'Enviado',
        date: formatMessageDate(new Date()),
        source: 'App',
        body: input.body,
        direction: 'sent',
      };
      student.messages.sent.unshift(message);
      return message;
    },
    async createWorkoutReport(accessToken, input) {
      const student = resolveLocalStudent(state, accessToken);
      const routineDay =
        student.routine.days.find(
          (item) => item.day === normalizeDay(input.day),
        ) || student.routine.days[0];
      const report = {
        id: createId('report'),
        title: 'Resumen de entrenamiento',
        meta: `${routineDay.title} · ${String(input.feedback || '').toLowerCase()}`,
        day: routineDay.day,
        feedback: input.feedback,
        exercises: input.exercises || [],
        createdAt: new Date().toISOString(),
      };
      student.workoutReports.unshift(report);
      student.messages.sent.unshift({
        id: createId('msg'),
        title: report.title,
        tag: 'Enviado',
        date: formatMessageDate(new Date()),
        source: 'App',
        direction: 'sent',
        body: `${routineDay.label} · ${routineDay.title} · ${input.feedback}. ${report.exercises
          .map(
            (item) =>
              `${item.name} (${item.done ? 'hecho' : 'pendiente'}): ${
                item.comment || 'Sin comentario'
              }`,
          )
          .join(' | ')}`,
      });
      return report;
    },
    async uploadProgressPhoto(accessToken, input) {
      const student = resolveLocalStudent(state, accessToken);
      const photo = {
        id: createId('photo'),
        label: input.slot,
        slot: input.slot,
        url: input.dataUrl,
        capturedAt: new Date().toISOString(),
        status: 'pending',
      };
      student.photos.pendingUploads[input.slot] = photo;
      return photo;
    },
    async listStudents(authContext) {
      requireTrainer(authContext);
      return state.students.map(serializeTrainerStudent);
    },
    async getTrainerStudent(authContext, studentId) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      return serializeTrainerStudent(student);
    },
    async createStudent(authContext, input) {
      requireTrainer(authContext);
      const student = createStudentFromInput(input);
      state.students.push(student);
      return serializeTrainerStudent(student);
    },
    async updateStudentRoutine(authContext, studentId, routine) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      student.routine = normalizeRoutine(routine);
      return serializeTrainerStudent(student);
    },
    async createTrainerMessage(authContext, input) {
      requireTrainer(authContext);
      const student = state.students.find(
        (item) => item.id === input.studentId,
      );
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      const message = {
        id: createId('msg'),
        title: input.title || 'Coach Saulo',
        tag: 'Recibido',
        date: formatMessageDate(new Date()),
        source: 'App',
        direction: 'inbox',
        body: input.body,
      };
      student.messages.inbox.unshift(message);
      return message;
    },
    async rotateStudentAccess(authContext, studentId) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      const rotatedAt = new Date().toISOString();
      student.accessToken = createAccessToken();
      student.accessRevokedAt = null;
      if (student.paymentReceivedAt) {
        student.waitingRoomToken = createAccessToken();
        student.waitingRoomSentAt = rotatedAt;
        student.waitingRoomConsumedAt = null;
        student.deliveryStatus = 'pending';
        student.deliveryChannel = '';
        student.deliverySentAt = null;
        student.deliveryError = '';
      }
      return serializeAccessState(student);
    },
    async revokeStudentAccess(authContext, studentId) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      student.accessRevokedAt = new Date().toISOString();
      return serializeAccessState(student);
    },
    async markPaymentReceived(authContext, studentId) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      student.paymentReceivedAt = new Date().toISOString();
      student.accessRevokedAt = null;
      student.accessToken = createAccessToken();
      student.waitingRoomToken = createAccessToken();
      student.waitingRoomSentAt = new Date().toISOString();
      student.waitingRoomConsumedAt = null;
      student.deliveryStatus = 'pending';
      student.deliveryChannel = '';
      student.deliverySentAt = null;
      student.deliveryError = '';
      student.accessDeliveries = [];
      return serializeWaitingRoomState(student);
    },
    async recordWaitingRoomDelivery(authContext, studentId, input) {
      requireTrainer(authContext);
      const student = state.students.find((item) => item.id === studentId);
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      student.deliveryStatus = String(input?.status || 'pending');
      student.deliveryChannel = String(input?.channel || '').trim();
      student.deliverySentAt = input?.sentAt || null;
      student.deliveryError = String(input?.error || '').trim();
      student.accessDeliveries = Array.isArray(student.accessDeliveries)
        ? student.accessDeliveries
        : [];
      student.accessDeliveries.unshift({
        id: createId('delivery'),
        channel: student.deliveryChannel || '',
        status: student.deliveryStatus || 'pending',
        note: String(input?.note || input?.error || '').trim(),
        createdAt: student.deliverySentAt || new Date().toISOString(),
      });
      return serializeTrainerStudent(student);
    },
    async getWaitingRoomPreview(waitingRoomToken) {
      const token = String(waitingRoomToken || '').trim();
      const student = state.students.find(
        (item) =>
          item.waitingRoomToken === token &&
          item.paymentReceivedAt &&
          !item.accessRevokedAt,
      );
      if (!student) {
        throw createHttpError(404, 'Enlace de acceso no disponible.');
      }
      if (student.waitingRoomConsumedAt) {
        throw createHttpError(
          409,
          'Este magic link ya activó la app. Si sigues en el mismo móvil, abre tu app instalada o continúa desde aquí.',
          {
            waitingRoom: serializeWaitingRoomSession(student),
            code: 'WAITING_ROOM_ALREADY_OPENED',
          },
        );
      }
      return serializeWaitingRoomSession(student);
    },
    async consumeWaitingRoomSession(waitingRoomToken) {
      const token = String(waitingRoomToken || '').trim();
      const student = state.students.find(
        (item) =>
          item.waitingRoomToken === token &&
          item.paymentReceivedAt &&
          !item.accessRevokedAt &&
          !item.waitingRoomConsumedAt,
      );
      if (!student) {
        throw createHttpError(404, 'Enlace de acceso no disponible.');
      }
      student.waitingRoomConsumedAt = new Date().toISOString();
      student.deliveryStatus = 'opened';
      student.deliveryChannel = 'app';
      student.deliverySentAt = student.waitingRoomConsumedAt;
      student.deliveryError = '';
      student.accessDeliveries = Array.isArray(student.accessDeliveries)
        ? student.accessDeliveries
        : [];
      student.accessDeliveries.unshift({
        id: createId('delivery'),
        channel: 'app',
        status: 'opened',
        note: 'El alumno abrió la sala de espera y activó la app.',
        createdAt: student.waitingRoomConsumedAt,
      });
      return serializeWaitingRoomSession(student);
    },
  };
}

function createSupabaseStore() {
  return {
    mode: 'supabase',
    async loginTrainer(credentials) {
      const email = String(credentials?.email || '')
        .trim()
        .toLowerCase();
      const password = String(credentials?.password || '').trim();

      if (!email || !password) {
        throw createHttpError(400, 'Email y contraseña son obligatorios.');
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

      const trainer = await resolveSupabaseTrainerProfile({
        token: payload.access_token,
      });

      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token || null,
        expiresAt: createSessionExpiryIso(payload.expires_in || 3600),
        trainer: {
          id: trainer.id,
          email: trainer.email || email,
          name: trainer.name || trainer.email || 'Trainer',
          mode: 'supabase',
        },
      };
    },
    async refreshTrainerSession(input) {
      const refreshToken = String(input?.refreshToken || '').trim();

      if (!refreshToken) {
        throw createHttpError(400, 'Refresh token no disponible.');
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

      const trainer = await resolveSupabaseTrainerProfile({
        token: payload.access_token,
      });

      return {
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token || refreshToken,
        expiresAt: createSessionExpiryIso(payload.expires_in || 3600),
        trainer: {
          id: trainer.id,
          email: trainer.email || '',
          name: trainer.name || trainer.email || 'Trainer',
          mode: 'supabase',
        },
      };
    },
    async getTrainerSession(authContext) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      return {
        id: trainer.id,
        email: trainer.email || '',
        name: trainer.name || trainer.email || 'Trainer',
        mode: 'supabase',
      };
    },
    getDefaultAccessToken() {
      return defaultStudentAccessToken;
    },
    getDefaultWaitingRoomToken() {
      return '';
    },
    async resolveStudent(accessToken) {
      return getSupabaseStudent(accessToken);
    },
    async getSession(accessToken) {
      const student = await getSupabaseStudent(accessToken);
      return {
        accessToken,
        student: serializeSupabaseStudent(student),
      };
    },
    async getProfile(accessToken) {
      const student = await getSupabaseStudent(accessToken);
      const photos = await restSelect('progress_photos', {
        student_id: `eq.${student.id}`,
        order: 'captured_at.desc',
      });
      return {
        student: serializeSupabaseStudent(student),
        photos: {
          nextDueDate: student.next_photo_due_at,
          history: photos.filter((item) => item.status !== 'pending'),
          pendingUploads: Object.fromEntries(
            photos
              .filter((item) => item.status === 'pending')
              .map((item) => [item.slot, serializePhoto(item)]),
          ),
        },
      };
    },
    async getSubscription(accessToken) {
      const student = await getSupabaseStudent(accessToken);
      const [subscription] = await restSelect('subscriptions', {
        student_id: `eq.${student.id}`,
        limit: '1',
      });
      return serializeSubscription(subscription);
    },
    async getRoutine(accessToken, requestedDay) {
      const student = await getSupabaseStudent(accessToken);
      const [routine] = await restSelect('routines', {
        student_id: `eq.${student.id}`,
        is_active: 'eq.true',
        limit: '1',
      });
      if (!routine) {
        throw createHttpError(404, 'Rutina no encontrada.');
      }
      const days = await restSelect('routine_days', {
        routine_id: `eq.${routine.id}`,
        order: 'day_number.asc',
      });
      const exercises = await restSelect('routine_exercises', {
        routine_id: `eq.${routine.id}`,
        order: 'position.asc',
      });
      const day = normalizeDay(requestedDay);
      const serializedDays = days.map((item) =>
        serializeRoutineDay(
          item,
          exercises.filter((exercise) => exercise.routine_day_id === item.id),
        ),
      );
      return {
        days: serializedDays.map((item) => ({
          day: item.day,
          label: item.label,
          active: item.exercises.length > 0,
        })),
        currentDay:
          serializedDays.find((item) => item.day === day) || serializedDays[0],
      };
    },
    async getMessages(accessToken) {
      const student = await getSupabaseStudent(accessToken);
      const messages = await restSelect('messages', {
        student_id: `eq.${student.id}`,
        order: 'created_at.desc',
      });
      return {
        inbox: messages
          .filter((item) => item.direction === 'inbox')
          .map(serializeMessage),
        sent: messages
          .filter((item) => item.direction === 'sent')
          .map(serializeMessage),
        reminders: messages
          .filter((item) => item.direction === 'reminder')
          .map(serializeMessage),
      };
    },
    async createMessage(accessToken, input) {
      const student = await getSupabaseStudent(accessToken);
      const [message] = await restInsert('messages', {
        student_id: student.id,
        direction: 'sent',
        title: input.title,
        tag: 'Enviado',
        source: 'App',
        body: input.body,
      });
      return serializeMessage(message);
    },
    async createWorkoutReport(accessToken, input) {
      const student = await getSupabaseStudent(accessToken);
      const [report] = await restInsert('workout_reports', {
        student_id: student.id,
        day_number: normalizeDay(input.day),
        feedback: input.feedback,
        exercises: input.exercises || [],
      });
      await restInsert('messages', {
        student_id: student.id,
        direction: 'sent',
        title: 'Resumen de entrenamiento',
        tag: 'Enviado',
        source: 'App',
        body: input.summary,
      });
      return serializeWorkoutReport(report);
    },
    async uploadProgressPhoto(accessToken, input) {
      const student = await getSupabaseStudent(accessToken);
      const extension = getExtension(input.filename, input.contentType);
      const objectPath = `${student.id}/${Date.now()}-${slugify(input.slot)}${extension}`;
      const base64 = String(input.dataUrl || '').split(',')[1] || '';
      const uploadResponse = await fetch(
        `${supabase.url}/storage/v1/object/${supabase.storageBucket}/${objectPath}`,
        {
          method: 'POST',
          headers: supabaseHeaders({ 'Content-Type': input.contentType }),
          body: Buffer.from(base64, 'base64'),
        },
      );
      if (!uploadResponse.ok) {
        throw createHttpError(502, await uploadResponse.text());
      }
      const url = `${supabase.url}/storage/v1/object/public/${supabase.storageBucket}/${objectPath}`;
      const [photo] = await restInsert('progress_photos', {
        student_id: student.id,
        slot: input.slot,
        label: input.slot,
        url,
        status: 'pending',
      });
      return serializePhoto(photo);
    },
    async listStudents(authContext) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      const students = await restSelect('students', {
        trainer_id: `eq.${trainer.id}`,
        order: 'created_at.asc',
      });
      return students.map(serializeSupabaseTrainerStudent);
    },
    async getTrainerStudent(authContext, studentId) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      const [latestReport] = await restSelect('workout_reports', {
        student_id: `eq.${studentId}`,
        order: 'created_at.desc',
        limit: '1',
      });
      const reports = await restSelect('workout_reports', {
        student_id: `eq.${studentId}`,
        order: 'created_at.desc',
        limit: '3',
      });
      const photos = await restSelect('progress_photos', {
        student_id: `eq.${studentId}`,
        order: 'captured_at.desc',
      });
      const messages = await restSelect('messages', {
        student_id: `eq.${studentId}`,
        order: 'created_at.desc',
        limit: '12',
      });
      const deliveries = await restSelect('access_deliveries', {
        student_id: `eq.${studentId}`,
        order: 'created_at.desc',
        limit: '5',
      });
      const serializedMessages = {
        inbox: messages
          .filter((item) => item.direction === 'inbox')
          .map(serializeMessage),
        sent: messages
          .filter((item) => item.direction === 'sent')
          .map(serializeMessage),
        reminders: messages
          .filter((item) => item.direction === 'reminder')
          .map(serializeMessage),
      };
      return serializeSupabaseTrainerStudent({
        ...student,
        latestWorkoutReport: serializeLatestWorkoutReport(latestReport),
        workoutReportHistory: serializeWorkoutReportHistory(reports),
        photoSummary: {
          nextDueDate: student.next_photo_due_at || '',
          historyCount: photos.filter((item) => item.status !== 'pending')
            .length,
          pendingCount: photos.filter((item) => item.status === 'pending')
            .length,
        },
        photoDetail: {
          pendingSlots: photos
            .filter((item) => item.status === 'pending')
            .map((item) => item.slot),
          historyItems: photos
            .filter((item) => item.status !== 'pending')
            .slice(0, 3)
            .map((item) => ({
              label: item.slot,
              meta: item.captured_at || '',
            })),
        },
        messageSummary: serializeMessageSummary(serializedMessages),
        messageDetail: serializeMessageDetail(serializedMessages),
        deliveryHistory: serializeDeliveryHistory(deliveries),
      });
    },
    async createStudent(authContext, input) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      const [student] = await restInsert('students', {
        trainer_id: trainer.id,
        name: input.name,
        plan: input.plan,
        age: input.age,
        weight: input.weight,
        goal: input.goal,
        contact_email: input.contactEmail || null,
        contact_phone: input.contactPhone || null,
        summary: input.summary || 'Solo tú marcas tus límites.',
        profile_note_title:
          input.profileNoteTitle || 'Adherencia alta con feedback rápido',
        profile_note: input.profileNote || '',
        access_token: input.accessToken || createAccessToken(),
      });
      return serializeSupabaseTrainerStudent(student);
    },
    async updateStudentRoutine(authContext, studentId, routine) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }

      const nextRoutine = normalizeRoutine(routine);

      await restUpdate(
        'routines',
        { student_id: `eq.${studentId}`, is_active: 'eq.true' },
        { is_active: false },
      );

      const [createdRoutine] = await restInsert('routines', {
        student_id: studentId,
        title: nextRoutine.title || 'Rutina activa',
        is_active: true,
      });

      const createdDays = [];
      for (const day of nextRoutine.days) {
        const dayNumber = normalizeDay(day.day || day.day_number);
        const [createdDay] = await restInsert('routine_days', {
          routine_id: createdRoutine.id,
          day_number: dayNumber,
          title: day.title || DAY_LABELS[dayNumber],
          meta: day.meta || 'Plan activo',
        });
        createdDays.push(createdDay);

        const exercises = Array.isArray(day.exercises) ? day.exercises : [];
        for (const [index, exercise] of exercises.entries()) {
          await restInsert('routine_exercises', {
            routine_id: createdRoutine.id,
            routine_day_id: createdDay.id,
            position: index + 1,
            name: exercise.name || `Ejercicio ${index + 1}`,
            reps: exercise.reps,
            load: exercise.load,
            rest: exercise.rest,
            video_url: exercise.videoUrl || exercise.video_url || null,
          });
        }
      }

      return {
        id: createdRoutine.id,
        title: createdRoutine.title,
        studentId,
        days: createdDays.length,
      };
    },
    async createTrainerMessage(authContext, input) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      await requireOwnedSupabaseStudent(trainer.id, input.studentId);
      const [message] = await restInsert('messages', {
        student_id: input.studentId,
        direction: 'inbox',
        title: input.title || 'Coach Saulo',
        tag: 'Recibido',
        source: 'App',
        body: input.body,
      });
      return serializeMessage(message);
    },
    async rotateStudentAccess(authContext, studentId) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      await requireOwnedSupabaseStudent(trainer.id, studentId);
      const [currentStudent] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!currentStudent) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      const accessToken = createAccessToken();
      const rotatedAt = new Date().toISOString();
      const update = {
        access_token: accessToken,
        access_revoked_at: null,
      };

      if (currentStudent.payment_received_at) {
        update.waiting_room_token = createAccessToken();
        update.waiting_room_sent_at = rotatedAt;
        update.waiting_room_consumed_at = null;
        update.delivery_status = 'pending';
        update.delivery_channel = null;
        update.delivery_sent_at = null;
        update.delivery_error = null;
      }

      await restUpdate(
        'students',
        { id: `eq.${studentId}`, trainer_id: `eq.${trainer.id}` },
        update,
      );
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      return serializeSupabaseAccessState(student);
    },
    async revokeStudentAccess(authContext, studentId) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      await requireOwnedSupabaseStudent(trainer.id, studentId);
      await restUpdate(
        'students',
        { id: `eq.${studentId}`, trainer_id: `eq.${trainer.id}` },
        {
          access_revoked_at: new Date().toISOString(),
        },
      );
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      return serializeSupabaseAccessState(student);
    },
    async markPaymentReceived(authContext, studentId) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      await requireOwnedSupabaseStudent(trainer.id, studentId);
      const accessToken = createAccessToken();
      const waitingRoomToken = createAccessToken();
      const now = new Date().toISOString();
      await restUpdate(
        'students',
        { id: `eq.${studentId}`, trainer_id: `eq.${trainer.id}` },
        {
          payment_received_at: now,
          access_token: accessToken,
          access_revoked_at: null,
          waiting_room_token: waitingRoomToken,
          waiting_room_sent_at: now,
          waiting_room_consumed_at: null,
          delivery_status: 'pending',
          delivery_channel: null,
          delivery_sent_at: null,
          delivery_error: null,
        },
      );
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      return serializeSupabaseWaitingRoomState(student);
    },
    async recordWaitingRoomDelivery(authContext, studentId, input) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      await requireOwnedSupabaseStudent(trainer.id, studentId);
      await restUpdate(
        'students',
        { id: `eq.${studentId}`, trainer_id: `eq.${trainer.id}` },
        {
          delivery_status: input?.status || 'pending',
          delivery_channel: input?.channel || null,
          delivery_sent_at: input?.sentAt || null,
          delivery_error: input?.error || null,
        },
      );
      await restInsert('access_deliveries', {
        student_id: studentId,
        channel: input?.channel || null,
        status: input?.status || 'pending',
        note: input?.note || input?.error || null,
      });
      const [student] = await restSelect('students', {
        id: `eq.${studentId}`,
        trainer_id: `eq.${trainer.id}`,
        limit: '1',
      });
      if (!student) {
        throw createHttpError(404, 'Alumno no encontrado.');
      }
      const deliveries = await restSelect('access_deliveries', {
        student_id: `eq.${studentId}`,
        order: 'created_at.desc',
        limit: '5',
      });
      return serializeSupabaseTrainerStudent({
        ...student,
        deliveryHistory: serializeDeliveryHistory(deliveries),
      });
    },
    async getWaitingRoomPreview(waitingRoomToken) {
      const token = String(waitingRoomToken || '').trim();
      const [student] = await restSelect('students', {
        waiting_room_token: `eq.${token}`,
        access_revoked_at: 'is.null',
        limit: '1',
      });
      if (!student || !student.payment_received_at) {
        throw createHttpError(404, 'Enlace de acceso no disponible.');
      }
      if (student.waiting_room_consumed_at) {
        throw createHttpError(
          409,
          'Este magic link ya activó la app. Si sigues en el mismo móvil, abre tu app instalada o continúa desde aquí.',
          {
            waitingRoom: serializeSupabaseWaitingRoomSession(student),
            code: 'WAITING_ROOM_ALREADY_OPENED',
          },
        );
      }
      return serializeSupabaseWaitingRoomSession(student);
    },
    async consumeWaitingRoomSession(waitingRoomToken) {
      const token = String(waitingRoomToken || '').trim();
      const [student] = await restSelect('students', {
        waiting_room_token: `eq.${token}`,
        access_revoked_at: 'is.null',
        waiting_room_consumed_at: 'is.null',
        limit: '1',
      });
      if (!student || !student.payment_received_at) {
        throw createHttpError(404, 'Enlace de acceso no disponible.');
      }
      await restUpdate(
        'students',
        { id: `eq.${student.id}` },
        {
          waiting_room_consumed_at: new Date().toISOString(),
          delivery_status: 'opened',
          delivery_channel: 'app',
          delivery_sent_at: new Date().toISOString(),
          delivery_error: null,
        },
      );
      await restInsert('access_deliveries', {
        student_id: student.id,
        channel: 'app',
        status: 'opened',
        note: 'El alumno abrió la sala de espera y activó la app.',
      });
      return serializeSupabaseWaitingRoomSession(student);
    },
  };
}

function createSeedState() {
  return {
    students: [
      {
        id: 'student-lucia',
        accessToken: defaultStudentAccessToken,
        accessRevokedAt: null,
        paymentReceivedAt: '2026-06-01T09:00:00.000Z',
        waitingRoomToken: 'espera-lucia',
        waitingRoomSentAt: '2026-06-01T09:00:00.000Z',
        waitingRoomConsumedAt: null,
        deliveryStatus: 'shared',
        deliveryChannel: 'whatsapp',
        deliverySentAt: '2026-06-01T09:02:00.000Z',
        deliveryError: '',
        accessDeliveries: [
          {
            id: 'delivery-lucia-1',
            channel: 'whatsapp',
            status: 'shared',
            note: 'Acceso preparado para compartir por WhatsApp.',
            createdAt: '2026-06-01T09:02:00.000Z',
          },
        ],
        name: 'Lucía Ortega',
        plan: 'Definición',
        age: '31 años',
        weight: '63,4 kg',
        goal: 'Bajar grasa y mantener fuerza',
        contactEmail: 'lucia@saulofitness.app',
        contactPhone: '+34600000001',
        summary: 'Solo tú marcas tus límites.',
        profileNoteTitle: 'Adherencia alta con feedback rápido',
        profileNote: 'Practica natación y cuida la rodilla tras una lesión.',
        subscription: {
          status: 'Membresía activa',
          summary: 'Acceso completo a rutina, mensajes y seguimiento.',
          startedAt: '2026-06-01',
          validUntil: '2026-06-30',
          planLabel: 'Plan 30 días',
          planEnd: '2026-07-08',
        },
        routine: createSeedRoutine(),
        messages: createSeedMessages(),
        photos: {
          nextDueDate: '2026-07-30',
          pendingUploads: {},
          history: [
            {
              month: 'Junio 2026',
              title: 'Lucía Ortega · Seguimiento mensual',
              copy: 'Registro mensual del 30 de junio de 2026 para comparar definición y postura.',
              shots: [
                { label: 'Izquierda', tone: 'side-left' },
                { label: 'Derecha', tone: 'side-right' },
                { label: 'Frente', tone: 'front' },
                { label: 'Espalda', tone: 'back' },
              ],
            },
          ],
        },
        workoutReports: [],
      },
      {
        id: 'student-hugo',
        accessToken: 'hugo-access',
        accessRevokedAt: null,
        paymentReceivedAt: null,
        waitingRoomToken: null,
        waitingRoomSentAt: null,
        waitingRoomConsumedAt: null,
        deliveryStatus: '',
        deliveryChannel: '',
        deliverySentAt: null,
        deliveryError: '',
        accessDeliveries: [],
        name: 'Hugo Martín',
        plan: 'Fuerza base',
        age: '39 años',
        weight: '91,3 kg',
        goal: 'Ganar fuerza sin dolor lumbar',
        contactEmail: 'hugo@saulofitness.app',
        contactPhone: '+34600000002',
        summary: 'Progreso sólido, técnica primero.',
        profileNoteTitle: 'Control técnico prioritario',
        profileNote: 'Prefiere sesiones cortas y objetivos medibles.',
        subscription: {
          status: 'Membresía activa',
          summary: 'Acceso completo a rutina, mensajes y seguimiento.',
          startedAt: '2026-06-15',
          validUntil: '2026-07-15',
          planLabel: 'Plan 30 días',
          planEnd: '2026-07-22',
        },
        routine: createSeedRoutine('Fuerza + control'),
        messages: createSeedMessages(),
        photos: {
          nextDueDate: '2026-07-30',
          pendingUploads: {},
          history: [],
        },
        workoutReports: [],
      },
    ],
  };
}

function createSeedRoutine(dayOneTitle = 'Pierna + glúteo') {
  return {
    days: [
      {
        day: 1,
        label: 'Día 1',
        title: dayOneTitle,
        meta: 'Activa · Ganancia muscular',
        exercises: [
          {
            name: 'Hip thrust',
            videoUrl: 'https://www.youtube.com/shorts/rVMsqygXtG4',
            reps: '4 x 10',
            load: '75%',
            rest: '90 s',
          },
          {
            name: 'Sentadilla búlgara',
            reps: '3 x 12',
            load: '14 kg',
            rest: '75 s',
          },
          {
            name: 'Peso muerto rumano',
            reps: '4 x 8',
            load: '70%',
            rest: '90 s',
          },
        ],
      },
      createRecoveryDay(2),
      {
        day: 3,
        label: 'Día 3',
        title: 'Espalda + bíceps',
        meta: 'Activa · Ganancia muscular',
        exercises: [
          { name: 'Jalón al pecho', reps: '4 x 10', load: '68%', rest: '90 s' },
          {
            name: 'Remo con mancuerna',
            reps: '3 x 12',
            load: '22 kg',
            rest: '75 s',
          },
          {
            name: 'Curl inclinado',
            reps: '3 x 15',
            load: '10 kg',
            rest: '60 s',
          },
        ],
      },
      createRecoveryDay(4, 'Bicicleta ligera'),
      {
        day: 5,
        label: 'Día 5',
        title: 'Push + core',
        meta: 'Activa · Ganancia muscular',
        exercises: [
          {
            name: 'Press inclinado',
            reps: '4 x 8',
            load: '72%',
            rest: '120 s',
          },
          {
            name: 'Press militar',
            reps: '3 x 10',
            load: '24 kg',
            rest: '90 s',
          },
        ],
      },
      createRecoveryDay(6, 'Paseo suave'),
      createRecoveryDay(7, 'Cardio suave'),
    ],
  };
}

function createRecoveryDay(day, exerciseName = 'Caminata rápida') {
  return {
    day,
    label: DAY_LABELS[day],
    title: 'Descanso activo',
    meta: 'Recuperación · Cardio ligero',
    exercises: [
      {
        name: exerciseName,
        reps: day === 7 ? '20 min' : '25 min',
        load: 'Suave',
        rest: 'Continuo',
      },
      {
        name: day % 2 === 0 ? 'Movilidad de cadera' : 'Respiración',
        reps: day % 2 === 0 ? '8 min' : '5 min',
        load: 'Control',
        rest: 'Continuo',
      },
    ],
  };
}

function createSeedMessages() {
  return {
    inbox: [
      {
        id: 'msg-inbox-1',
        title: 'Coach Saulo',
        tag: 'Recibido',
        date: 'Hoy · 08:45',
        source: 'App',
        direction: 'inbox',
        body: 'Esta semana treinaste muito duro. Lembra-te de descansar e hidratar-te bem nos dias de descanso ativo.',
      },
      {
        id: 'msg-inbox-2',
        title: 'Coach Saulo',
        tag: 'Recibido',
        date: 'Ayer · 19:10',
        source: 'App',
        direction: 'inbox',
        body: 'Esta semana vamos procurar mais controlo técnico. Mantém o foco, dorme bem e aproveita os dias leves para recuperar sem perder ritmo.',
      },
    ],
    sent: [
      {
        id: 'msg-sent-1',
        title: 'Consulta nutrición',
        tag: 'Enviado',
        date: 'Ayer · 20:15',
        source: 'App',
        direction: 'sent',
        body: 'Pregunté si mover carbohidratos al pre-entreno.',
      },
    ],
    reminders: [
      {
        id: 'msg-reminder-1',
        title: 'Check-in semanal',
        tag: 'Recordatorio',
        date: 'Martes · 09:00',
        source: 'App',
        direction: 'reminder',
        body: 'Sube peso, sensaciones y 4 fotos de progreso.',
      },
      {
        id: 'msg-reminder-2',
        title: 'Renovación próxima',
        tag: 'Recordatorio',
        date: 'Viernes · 18:00',
        source: 'App',
        direction: 'reminder',
        body: 'Tu plan actual finaliza el 30 de junio de 2026.',
      },
    ],
  };
}

function resolveLocalStudent(state, accessToken) {
  const token = String(accessToken || defaultStudentAccessToken).trim();
  const student = state.students.find(
    (item) =>
      (item.accessToken === token || item.id === token) &&
      !item.accessRevokedAt,
  );
  if (!student) {
    throw createHttpError(403, 'Acceso de alumno no válido.');
  }
  return student;
}

function createStudentFromInput(input) {
  const id = createId('student');
  return {
    id,
    accessToken: input.accessToken || createAccessToken(),
    accessRevokedAt: null,
    paymentReceivedAt: null,
    waitingRoomToken: null,
    waitingRoomSentAt: null,
    waitingRoomConsumedAt: null,
    deliveryStatus: '',
    deliveryChannel: '',
    deliverySentAt: null,
    deliveryError: '',
    accessDeliveries: [],
    name: input.name,
    plan: input.plan || 'Plan personalizado',
    age: input.age || '',
    weight: input.weight || '',
    goal: input.goal || '',
    contactEmail: input.contactEmail || '',
    contactPhone: input.contactPhone || '',
    summary: input.summary || 'Solo tú marcas tus límites.',
    profileNoteTitle: input.profileNoteTitle || 'Notas de perfil',
    profileNote: input.profileNote || '',
    subscription: {
      status: 'Membresía activa',
      summary: 'Acceso completo a rutina, mensajes y seguimiento.',
      startedAt: new Date().toISOString().slice(0, 10),
      validUntil: input.validUntil || '',
      planLabel: input.planLabel || 'Plan 30 días',
      planEnd: input.planEnd || '',
    },
    routine: createSeedRoutine(),
    messages: { inbox: [], sent: [], reminders: [] },
    photos: { nextDueDate: '', pendingUploads: {}, history: [] },
    workoutReports: [],
  };
}

function normalizeRoutine(routine) {
  if (!routine || !Array.isArray(routine.days)) {
    return createSeedRoutine();
  }
  return routine;
}

function serializeTrainerStudent(student) {
  return {
    ...serializeStudent(student),
    accessToken: student.accessToken,
    accessRevokedAt: student.accessRevokedAt || null,
    paymentReceivedAt: student.paymentReceivedAt || null,
    waitingRoomToken: student.waitingRoomToken || null,
    waitingRoomSentAt: student.waitingRoomSentAt || null,
    waitingRoomConsumedAt: student.waitingRoomConsumedAt || null,
    deliveryStatus: student.deliveryStatus || '',
    deliveryChannel: student.deliveryChannel || '',
    deliverySentAt: student.deliverySentAt || null,
    deliveryError: student.deliveryError || '',
    subscription: student.subscription,
    routine: student.routine,
    messages: student.messages,
    latestWorkoutReport: serializeLatestWorkoutReport(
      student.workoutReports?.[0] || null,
    ),
    workoutReportHistory: serializeWorkoutReportHistory(
      student.workoutReports || [],
    ),
    photoSummary: serializePhotoSummary(student.photos),
    photoDetail: serializePhotoDetail(student.photos),
    messageSummary: serializeMessageSummary(student.messages),
    messageDetail: serializeMessageDetail(student.messages),
    deliveryHistory: serializeDeliveryHistory(student.accessDeliveries || []),
  };
}

function serializeAccessState(student) {
  return {
    studentId: student.id,
    accessToken: student.accessToken,
    accessRevokedAt: student.accessRevokedAt || null,
  };
}

function serializeWaitingRoomState(student) {
  return {
    studentId: student.id,
    accessToken: student.accessToken,
    paymentReceivedAt: student.paymentReceivedAt || null,
    waitingRoomToken: student.waitingRoomToken || null,
    waitingRoomSentAt: student.waitingRoomSentAt || null,
    waitingRoomConsumedAt: student.waitingRoomConsumedAt || null,
    deliveryStatus: student.deliveryStatus || '',
    deliveryChannel: student.deliveryChannel || '',
    deliverySentAt: student.deliverySentAt || null,
    deliveryError: student.deliveryError || '',
  };
}

function serializeStudent(student) {
  return {
    id: student.id,
    name: student.name,
    plan: student.plan,
    age: student.age,
    weight: student.weight,
    goal: student.goal,
    summary: student.summary,
    profileNoteTitle: student.profileNoteTitle,
    profileNote: student.profileNote,
    contactEmail: student.contactEmail || '',
    contactPhone: student.contactPhone || '',
  };
}

function serializeSupabaseStudent(student) {
  return {
    id: student.id,
    name: student.name,
    plan: student.plan,
    age: student.age,
    weight: student.weight,
    goal: student.goal,
    summary: student.summary,
    profileNoteTitle: student.profile_note_title,
    profileNote: student.profile_note,
    contactEmail: student.contact_email || '',
    contactPhone: student.contact_phone || '',
  };
}

function serializeSupabaseTrainerStudent(student) {
  return {
    ...serializeSupabaseStudent(student),
    accessToken: student.access_token,
    accessRevokedAt: student.access_revoked_at || null,
    paymentReceivedAt: student.payment_received_at || null,
    waitingRoomToken: student.waiting_room_token || null,
    waitingRoomSentAt: student.waiting_room_sent_at || null,
    waitingRoomConsumedAt: student.waiting_room_consumed_at || null,
    deliveryStatus: student.delivery_status || '',
    deliveryChannel: student.delivery_channel || '',
    deliverySentAt: student.delivery_sent_at || null,
    deliveryError: student.delivery_error || '',
    latestWorkoutReport: student.latestWorkoutReport || null,
    workoutReportHistory: student.workoutReportHistory || [],
    photoSummary: student.photoSummary || null,
    photoDetail: student.photoDetail || null,
    messageSummary: student.messageSummary || null,
    messageDetail: student.messageDetail || [],
    deliveryHistory: student.deliveryHistory || [],
  };
}

function serializeLatestWorkoutReport(report) {
  if (!report) {
    return null;
  }

  return {
    title: report.title || 'Resumen de entrenamiento',
    feedback: report.feedback || '',
    day: report.day || report.day_number || null,
    createdAt: report.createdAt || report.created_at || null,
  };
}

function serializePhotoSummary(photos) {
  const history = Array.isArray(photos?.history) ? photos.history : [];
  const pendingUploads = photos?.pendingUploads || {};

  return {
    nextDueDate: photos?.nextDueDate || '',
    historyCount: history.length,
    pendingCount: Object.keys(pendingUploads).length,
  };
}

function serializeWorkoutReportHistory(reports) {
  return (Array.isArray(reports) ? reports : []).slice(0, 3).map((report) => ({
    title: report.title || 'Resumen de entrenamiento',
    feedback: report.feedback || '',
    day: report.day || report.day_number || null,
    createdAt: report.createdAt || report.created_at || null,
  }));
}

function serializePhotoDetail(photos) {
  const pendingUploads = photos?.pendingUploads || {};
  const history = Array.isArray(photos?.history) ? photos.history : [];

  return {
    pendingSlots: Object.keys(pendingUploads),
    historyItems: history.slice(0, 3).map((item) => ({
      label: item.month || item.label || item.title || 'Registro',
      meta:
        item.copy ||
        `${Array.isArray(item.shots) ? item.shots.length : 0} fotos subidas`,
    })),
  };
}

function serializeMessageSummary(messages) {
  const inbox = Array.isArray(messages?.inbox) ? messages.inbox : [];
  const sent = Array.isArray(messages?.sent) ? messages.sent : [];
  const reminders = Array.isArray(messages?.reminders)
    ? messages.reminders
    : [];
  const latest = [inbox[0], sent[0], reminders[0]]
    .filter(Boolean)
    .sort((left, right) => compareMessageDates(right?.date, left?.date))[0];

  return {
    inboxCount: inbox.length,
    sentCount: sent.length,
    remindersCount: reminders.length,
    latestTitle: latest?.title || '',
    latestDate: latest?.date || '',
  };
}

function serializeMessageDetail(messages) {
  const latestItems = [
    ...(Array.isArray(messages?.inbox) ? messages.inbox : []).slice(0, 1),
    ...(Array.isArray(messages?.sent) ? messages.sent : []).slice(0, 1),
    ...(Array.isArray(messages?.reminders) ? messages.reminders : []).slice(
      0,
      1,
    ),
  ].filter(Boolean);

  return latestItems.map((item) => ({
    title: `${item.tag || item.direction || 'Mensaje'} · ${item.title || 'Sin título'}`,
    meta: `${item.date || 'Sin fecha'}${item.body ? ` · ${item.body}` : ''}`,
  }));
}

function compareMessageDates(left, right) {
  return String(left || '').localeCompare(String(right || ''));
}

function serializeSupabaseWaitingRoomState(student) {
  return {
    studentId: student.id,
    accessToken: student.access_token,
    paymentReceivedAt: student.payment_received_at || null,
    waitingRoomToken: student.waiting_room_token || null,
    waitingRoomSentAt: student.waiting_room_sent_at || null,
    waitingRoomConsumedAt: student.waiting_room_consumed_at || null,
    deliveryStatus: student.delivery_status || '',
    deliveryChannel: student.delivery_channel || '',
    deliverySentAt: student.delivery_sent_at || null,
    deliveryError: student.delivery_error || '',
  };
}

function serializeDeliveryHistory(entries) {
  return (Array.isArray(entries) ? entries : []).slice(0, 5).map((entry) => ({
    title: [
      entry.status || 'pending',
      entry.channel ? `· ${entry.channel}` : '',
    ]
      .join(' ')
      .trim(),
    meta: [
      entry.createdAt || entry.created_at
        ? formatDateTime(entry.createdAt || entry.created_at)
        : '',
      entry.note || '',
    ]
      .filter(Boolean)
      .join(' · '),
  }));
}

function serializeWaitingRoomSession(student) {
  return {
    student: {
      id: student.id,
      name: student.name,
      plan: student.plan,
    },
    accessToken: student.accessToken,
    paymentReceivedAt: student.paymentReceivedAt || null,
    waitingRoomSentAt: student.waitingRoomSentAt || null,
    waitingRoomConsumedAt: student.waitingRoomConsumedAt || null,
  };
}

function serializeSupabaseWaitingRoomSession(student) {
  return {
    student: {
      id: student.id,
      name: student.name,
      plan: student.plan,
    },
    accessToken: student.access_token,
    paymentReceivedAt: student.payment_received_at || null,
    waitingRoomSentAt: student.waiting_room_sent_at || null,
    waitingRoomConsumedAt: student.waiting_room_consumed_at || null,
  };
}

function serializeSupabaseAccessState(student) {
  return {
    studentId: student.id,
    accessToken: student.access_token,
    accessRevokedAt: student.access_revoked_at || null,
  };
}

function serializeSubscription(subscription) {
  return {
    status: subscription?.status || 'Sin membresía activa',
    summary: subscription?.summary || '',
    startedAt: subscription?.started_at || '',
    validUntil: subscription?.valid_until || '',
    planLabel: subscription?.plan_label || '',
    planEnd: subscription?.plan_end || '',
  };
}

function serializeRoutineDay(day, exercises) {
  return {
    day: day.day_number,
    label: DAY_LABELS[day.day_number],
    title: day.title,
    meta: day.meta,
    exercises: exercises.map((exercise) => ({
      name: exercise.name,
      videoUrl: exercise.video_url,
      reps: exercise.reps,
      load: exercise.load,
      rest: exercise.rest,
    })),
  };
}

function serializeMessage(message) {
  return {
    id: message.id,
    title: message.title,
    tag: message.tag,
    date: message.date || formatMessageDate(new Date(message.created_at)),
    source: message.source,
    direction: message.direction,
    body: message.body,
  };
}

function serializeWorkoutReport(report) {
  return {
    id: report.id,
    title: 'Resumen de entrenamiento',
    day: report.day_number,
    feedback: report.feedback,
    exercises: report.exercises || [],
    createdAt: report.created_at,
  };
}

function serializePhoto(photo) {
  return {
    id: photo.id,
    label: photo.label,
    slot: photo.slot,
    url: photo.url,
    capturedAt: photo.captured_at,
    status: photo.status,
  };
}

async function getSupabaseStudent(accessToken) {
  const token = String(accessToken || defaultStudentAccessToken).trim();
  const [student] = await restSelect('students', {
    access_token: `eq.${token}`,
    access_revoked_at: 'is.null',
    limit: '1',
  });
  if (!student) {
    throw createHttpError(403, 'Acceso de alumno no válido.');
  }
  return student;
}

async function restSelect(table, query = {}) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: supabaseHeaders({ Accept: 'application/json' }),
  });
  if (!response.ok) {
    throw createHttpError(response.status, await response.text());
  }
  return response.json();
}

async function restInsert(table, payload) {
  const response = await fetch(`${supabase.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: supabaseHeaders({
      Accept: 'application/json',
      Prefer: 'return=representation',
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw createHttpError(response.status, await response.text());
  }
  return response.json();
}

async function restUpdate(table, query, payload) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: supabaseHeaders({
      Prefer: 'return=minimal',
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw createHttpError(response.status, await response.text());
  }
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabase.serviceRoleKey,
    Authorization: `Bearer ${supabase.serviceRoleKey}`,
    ...extra,
  };
}

async function requireSupabaseTrainer(authContext) {
  const token = authContext?.token;
  if (!token) {
    throw createHttpError(401, 'Acceso de entrenador requerido.');
  }
  const response = await fetch(`${supabase.url}/auth/v1/user`, {
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw createHttpError(401, 'Sesión de entrenador no válida.');
  }
  return response.json();
}

async function resolveSupabaseTrainerProfile(authContext) {
  const user = await requireSupabaseTrainer(authContext);
  const email = String(user.email || '')
    .trim()
    .toLowerCase();
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    'Trainer';

  if (!email) {
    throw createHttpError(
      403,
      'La cuenta Auth del entrenador no tiene email válido.',
    );
  }

  const trainerByAuth = await restSelect('trainers', {
    auth_user_id: `eq.${user.id}`,
    limit: '1',
  });

  if (trainerByAuth[0]) {
    const trainer = trainerByAuth[0];

    if (trainer.email !== email || trainer.name !== name) {
      await restUpdate(
        'trainers',
        { id: `eq.${trainer.id}` },
        { email, name, auth_user_id: user.id },
      );
      return {
        ...trainer,
        email,
        name,
        auth_user_id: user.id,
      };
    }

    return trainer;
  }

  const trainerByEmail = await restSelect('trainers', {
    email: `eq.${email}`,
    limit: '1',
  });

  if (trainerByEmail[0]) {
    const trainer = trainerByEmail[0];
    await restUpdate(
      'trainers',
      { id: `eq.${trainer.id}` },
      { auth_user_id: user.id, email, name },
    );
    return {
      ...trainer,
      auth_user_id: user.id,
      email,
      name,
    };
  }

  const created = await restInsert('trainers', {
    auth_user_id: user.id,
    email,
    name,
  });

  return created[0];
}

async function requireOwnedSupabaseStudent(trainerId, studentId) {
  const [student] = await restSelect('students', {
    id: `eq.${studentId}`,
    trainer_id: `eq.${trainerId}`,
    limit: '1',
  });

  if (!student) {
    throw createHttpError(404, 'Alumno no encontrado.');
  }

  return student;
}

function requireTrainer(authContext) {
  if (authContext?.token !== trainerApiToken) {
    throw createHttpError(401, 'Acceso de entrenador requerido.');
  }
}

function normalizeDay(value) {
  const day = Number(value || 1);
  return Number.isInteger(day) && day >= 1 && day <= 7 ? day : 1;
}

function formatMessageDate(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `Hoy · ${hours}:${minutes}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createAccessToken() {
  return crypto.randomBytes(18).toString('base64url');
}

function createSessionExpiryIso(expiresInSeconds) {
  const parsed = Number(expiresInSeconds);
  const ttlSeconds =
    Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 3600;

  return new Date(Date.now() + ttlSeconds * 1000).toISOString();
}

function getExtension(filename = '', contentType = '') {
  const extension = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.'))
    : '';
  if (extension) {
    return extension;
  }
  return contentType.includes('jpeg') ? '.jpg' : '.png';
}

function slugify(value) {
  return String(value || 'photo')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createHttpError(status, message, details = {}) {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, details);
  return error;
}

module.exports = {
  createHttpError,
  createSauloStore,
};
