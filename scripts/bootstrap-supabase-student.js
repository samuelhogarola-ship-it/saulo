const crypto = require('node:crypto');

const { projectRoot, runtime, supabase } = require('../lib/config');
const {
  loadStudentTemplate,
  normalizeMessagesTemplate,
  normalizePhotoSlots,
  normalizeRoutineBlueprint,
  validateStudentTemplate,
} = require('../lib/product-student-template');

async function main() {
  if (runtime.requestedDataMode !== 'supabase' || !supabase.hasConfig) {
    throw new Error(
      'Este script necesita SAULO_DATA_MODE=supabase y credenciales reales de Supabase.',
    );
  }

  const trainer = await resolveTrainer();
  const studentInput = resolveStudentInput();
  const student = await createOrUpdateStudent(trainer.id, studentInput);
  const subscription = await upsertSubscription(student.id, studentInput);
  const routine = await rebuildRoutine(
    student.id,
    studentInput.planLabel,
    studentInput.routineBlueprint,
  );
  const reminders = await ensureMessages(
    student.id,
    studentInput.initialMessages,
  );
  const pendingPhotos = await ensurePendingPhotos(
    student.id,
    studentInput.photoSlots,
  );

  console.log('Saulo Fitness APP · Supabase student bootstrap');
  console.log(`- Trainer: ${trainer.name} <${trainer.email}>`);
  console.log(`- Student: ${student.name} (${student.id})`);
  console.log(`- Access token: ${student.access_token}`);
  console.log(
    `- Template: ${studentInput.templateLabel || 'Variables de entorno / valores por defecto'}`,
  );
  console.log(`- Subscription: ${subscription.plan_label || 'Plan 30 días'}`);
  console.log(`- Active routine: ${routine.title}`);
  console.log(`- Messages ensured: ${reminders}`);
  console.log(`- Pending photo slots ensured: ${pendingPhotos}`);
}

async function resolveTrainer() {
  const trainerId = String(process.env.BOOTSTRAP_TRAINER_ID || '').trim();
  const trainerEmail = String(process.env.BOOTSTRAP_TRAINER_EMAIL || '')
    .trim()
    .toLowerCase();

  if (!trainerId && !trainerEmail) {
    throw new Error(
      'Define BOOTSTRAP_TRAINER_ID o BOOTSTRAP_TRAINER_EMAIL para asignar el alumno.',
    );
  }

  const query = trainerId
    ? { id: `eq.${trainerId}`, limit: '1' }
    : { email: `eq.${trainerEmail}`, limit: '1' };
  const [trainer] = await restSelect('trainers', query);

  if (!trainer) {
    throw new Error(
      'No se encontró el entrenador en Supabase. Ejecuta antes npm run product:bootstrap:trainer.',
    );
  }

  return trainer;
}

function resolveStudentInput() {
  const template = loadStudentTemplate(
    projectRoot,
    process.env.BOOTSTRAP_STUDENT_TEMPLATE_PATH,
  );
  const validation = validateStudentTemplate(template);
  if (validation.errors.length) {
    throw new Error(
      `La plantilla de alumno no es válida: ${validation.errors.join(' ')}`,
    );
  }
  const name = String(process.env.BOOTSTRAP_STUDENT_NAME || '').trim();
  const email = String(
    process.env.BOOTSTRAP_STUDENT_CONTACT_EMAIL || '',
  ).trim();

  const resolvedName = name || String(template.name || '').trim();
  const resolvedEmail =
    email ||
    String(template.contactEmail || template.contact_email || '').trim();

  if (!resolvedName || !resolvedEmail) {
    throw new Error(
      'Define BOOTSTRAP_STUDENT_NAME y BOOTSTRAP_STUDENT_CONTACT_EMAIL, o usa una plantilla válida.',
    );
  }

  return {
    templateLabel: template.templateLabel || template.name || '',
    name: resolvedName,
    plan:
      String(process.env.BOOTSTRAP_STUDENT_PLAN || '').trim() ||
      String(template.plan || '').trim() ||
      'Plan personalizado',
    age:
      String(process.env.BOOTSTRAP_STUDENT_AGE || '').trim() ||
      String(template.age || '').trim() ||
      null,
    weight:
      String(process.env.BOOTSTRAP_STUDENT_WEIGHT || '').trim() ||
      String(template.weight || '').trim() ||
      null,
    goal:
      String(process.env.BOOTSTRAP_STUDENT_GOAL || '').trim() ||
      String(template.goal || '').trim() ||
      'Ganar fuerza y mejorar adherencia',
    summary:
      String(process.env.BOOTSTRAP_STUDENT_SUMMARY || '').trim() ||
      String(template.summary || '').trim() ||
      'Solo tú marcas tus límites.',
    profileNoteTitle:
      String(process.env.BOOTSTRAP_STUDENT_PROFILE_NOTE_TITLE || '').trim() ||
      String(
        template.profileNoteTitle || template.profile_note_title || '',
      ).trim() ||
      'Adherencia alta con feedback rápido',
    profileNote:
      String(process.env.BOOTSTRAP_STUDENT_PROFILE_NOTE || '').trim() ||
      String(template.profileNote || template.profile_note || '').trim() ||
      'Prefiere instrucciones claras y seguimiento breve después de cada sesión.',
    contactEmail: resolvedEmail,
    contactPhone:
      String(process.env.BOOTSTRAP_STUDENT_CONTACT_PHONE || '').trim() ||
      String(template.contactPhone || template.contact_phone || '').trim() ||
      null,
    accessToken:
      String(process.env.BOOTSTRAP_STUDENT_ACCESS_TOKEN || '').trim() ||
      String(template.accessToken || template.access_token || '').trim() ||
      null,
    planLabel:
      String(process.env.BOOTSTRAP_STUDENT_PLAN_LABEL || '').trim() ||
      String(template.planLabel || template.plan_label || '').trim() ||
      'Plan 30 días',
    validUntil:
      String(process.env.BOOTSTRAP_STUDENT_VALID_UNTIL || '').trim() ||
      String(template.validUntil || template.valid_until || '').trim() ||
      addDaysIso(30),
    planEnd:
      String(process.env.BOOTSTRAP_STUDENT_PLAN_END || '').trim() ||
      String(template.planEnd || template.plan_end || '').trim() ||
      addDaysIso(37),
    nextPhotoDueAt:
      String(process.env.BOOTSTRAP_STUDENT_NEXT_PHOTO_DUE_AT || '').trim() ||
      String(
        template.nextPhotoDueAt || template.next_photo_due_at || '',
      ).trim() ||
      addDaysIso(28),
    routineBlueprint: normalizeRoutineBlueprint(
      template.routineBlueprint || template.routine_blueprint,
    ),
    initialMessages: normalizeMessagesTemplate(
      template.initialMessages || template.initial_messages,
    ),
    photoSlots: normalizePhotoSlots(
      template.photoSlots || template.photo_slots,
    ),
  };
}

async function createOrUpdateStudent(trainerId, input) {
  const [existing] = await restSelect('students', {
    trainer_id: `eq.${trainerId}`,
    contact_email: `eq.${input.contactEmail}`,
    limit: '1',
  });

  const payload = {
    trainer_id: trainerId,
    name: input.name,
    plan: input.plan,
    age: input.age,
    weight: input.weight,
    goal: input.goal,
    summary: input.summary,
    profile_note_title: input.profileNoteTitle,
    profile_note: input.profileNote,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    next_photo_due_at: input.nextPhotoDueAt,
  };

  if (existing) {
    if (input.accessToken) {
      payload.access_token = input.accessToken;
    }

    await restUpdate('students', { id: `eq.${existing.id}` }, payload);
    const [updated] = await restSelect('students', {
      id: `eq.${existing.id}`,
      limit: '1',
    });
    return updated;
  }

  const inserted = await restInsert('students', {
    ...payload,
    access_token: input.accessToken || createAccessToken(),
  });
  return inserted[0];
}

async function upsertSubscription(studentId, input) {
  const [existing] = await restSelect('subscriptions', {
    student_id: `eq.${studentId}`,
    order: 'created_at.desc',
    limit: '1',
  });

  const payload = {
    status: 'Membresía activa',
    summary: 'Acceso completo a rutina, mensajes y seguimiento.',
    started_at: todayIso(),
    valid_until: input.validUntil,
    plan_label: input.planLabel,
    plan_end: input.planEnd,
  };

  if (existing) {
    await restUpdate('subscriptions', { id: `eq.${existing.id}` }, payload);
    return { ...existing, ...payload };
  }

  const inserted = await restInsert('subscriptions', {
    student_id: studentId,
    ...payload,
  });
  return inserted[0];
}

async function rebuildRoutine(studentId, routineTitle, routineBlueprint) {
  await restUpdate(
    'routines',
    { student_id: `eq.${studentId}`, is_active: 'eq.true' },
    { is_active: false },
  );

  const insertedRoutine = await restInsert('routines', {
    student_id: studentId,
    title: routineTitle || 'Rutina activa',
    is_active: true,
  });
  const routine = insertedRoutine[0];

  for (const day of routineBlueprint) {
    const insertedDay = await restInsert('routine_days', {
      routine_id: routine.id,
      day_number: day.day_number,
      title: day.title,
      meta: day.meta,
    });
    const routineDay = insertedDay[0];

    for (const [index, exercise] of day.exercises.entries()) {
      await restInsert('routine_exercises', {
        routine_id: routine.id,
        routine_day_id: routineDay.id,
        position: index + 1,
        name: exercise.name,
        reps: exercise.reps,
        load: exercise.load,
        rest: exercise.rest,
        video_url: exercise.video_url || null,
      });
    }
  }

  return routine;
}

async function ensureMessages(studentId, initialMessages) {
  const existing = await restSelect('messages', {
    student_id: `eq.${studentId}`,
    limit: '20',
  });

  let ensured = 0;
  for (const message of initialMessages) {
    const alreadyExists = existing.some(
      (item) =>
        item.direction === message.direction &&
        item.title === message.title &&
        item.body === message.body,
    );

    if (alreadyExists) {
      continue;
    }

    await restInsert('messages', {
      student_id: studentId,
      ...message,
    });
    ensured += 1;
  }

  return ensured;
}

async function ensurePendingPhotos(studentId, photoSlots) {
  const existing = await restSelect('progress_photos', {
    student_id: `eq.${studentId}`,
    status: 'eq.pending',
    limit: '20',
  });

  let ensured = 0;
  for (const [slot, label] of photoSlots) {
    const alreadyExists = existing.some((item) => item.slot === slot);
    if (alreadyExists) {
      continue;
    }

    await restInsert('progress_photos', {
      student_id: studentId,
      slot,
      label,
      url: `https://example.invalid/progress/${studentId}/${slot}.jpg`,
      status: 'pending',
    });
    ensured += 1;
  }

  return ensured;
}

async function restSelect(table, query = {}) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: serviceHeaders({ Accept: 'application/json' }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

async function restInsert(table, payload) {
  const response = await fetch(`${supabase.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: serviceHeaders({
      Accept: 'application/json',
      Prefer: 'return=representation',
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
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
    headers: serviceHeaders({
      Prefer: 'return=minimal',
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

function serviceHeaders(extra = {}) {
  return {
    apikey: supabase.serviceRoleKey,
    Authorization: `Bearer ${supabase.serviceRoleKey}`,
    ...extra,
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function createAccessToken() {
  return crypto.randomBytes(18).toString('base64url');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
