const { runtime, supabase, trainerLogin } = require('../lib/config');

async function main() {
  if (runtime.requestedDataMode !== 'supabase' || !supabase.hasConfig) {
    throw new Error(
      'Este script necesita SAULO_DATA_MODE=supabase y credenciales reales de Supabase.',
    );
  }

  const email = String(
    process.env.BOOTSTRAP_TRAINER_EMAIL || trainerLogin.email || '',
  ).trim();
  const password = String(
    process.env.BOOTSTRAP_TRAINER_PASSWORD || trainerLogin.password || '',
  ).trim();
  const name =
    String(process.env.BOOTSTRAP_TRAINER_NAME || '').trim() || 'Saulo Trainer';
  const adoptUnassigned =
    String(process.env.BOOTSTRAP_ADOPT_UNASSIGNED_STUDENTS || '')
      .trim()
      .toLowerCase() === 'true';

  if (!email || !password || !name) {
    throw new Error(
      'Define BOOTSTRAP_TRAINER_EMAIL y BOOTSTRAP_TRAINER_PASSWORD, o deja TRAINER_LOGIN_EMAIL y TRAINER_LOGIN_PASSWORD reales. BOOTSTRAP_TRAINER_NAME es opcional y por defecto usa "Saulo Trainer".',
    );
  }

  const user = await createOrLoadAuthUser({ email, password, name });
  const trainer = await createOrLinkTrainerProfile({ user, email, name });

  let adopted = 0;
  if (adoptUnassigned) {
    adopted = await assignUnownedStudents(trainer.id);
  }

  console.log('Saulo Fitness APP · Supabase trainer bootstrap');
  console.log(`- Auth user: ${user.id}`);
  console.log(`- Trainer row: ${trainer.id}`);
  console.log(`- Email: ${trainer.email}`);
  console.log(`- Name: ${trainer.name}`);
  console.log(`- Adopted unassigned students: ${adopted}`);
}

async function createOrLoadAuthUser({ email, password, name }) {
  const createResponse = await fetch(`${supabase.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        name,
      },
    }),
  });

  if (createResponse.ok) {
    const payload = await createResponse.json();
    return payload.user || payload;
  }

  const errorText = await createResponse.text();
  if (
    !/already registered|already been registered|user already/i.test(errorText)
  ) {
    throw new Error(`No se pudo crear el usuario Auth: ${errorText}`);
  }

  const listResponse = await fetch(
    `${supabase.url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: serviceHeaders(),
    },
  );

  if (!listResponse.ok) {
    throw new Error(await listResponse.text());
  }

  const listPayload = await listResponse.json();
  const user = (listPayload.users || []).find(
    (candidate) =>
      String(candidate.email || '').toLowerCase() === email.toLowerCase(),
  );

  if (!user) {
    throw new Error('El usuario Auth ya existía, pero no se pudo recuperar.');
  }

  await fetch(`${supabase.url}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: serviceHeaders(),
    body: JSON.stringify({
      password,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: name,
        name,
      },
    }),
  });

  return user;
}

async function createOrLinkTrainerProfile({ user, email, name }) {
  const trainerByAuth = await restSelect('trainers', {
    auth_user_id: `eq.${user.id}`,
    limit: '1',
  });
  if (trainerByAuth[0]) {
    await restUpdate(
      'trainers',
      { id: `eq.${trainerByAuth[0].id}` },
      { email, name, auth_user_id: user.id },
    );
    return { ...trainerByAuth[0], email, name, auth_user_id: user.id };
  }

  const trainerByEmail = await restSelect('trainers', {
    email: `eq.${email}`,
    limit: '1',
  });
  if (trainerByEmail[0]) {
    await restUpdate(
      'trainers',
      { id: `eq.${trainerByEmail[0].id}` },
      { auth_user_id: user.id, email, name },
    );
    return { ...trainerByEmail[0], auth_user_id: user.id, email, name };
  }

  const inserted = await restInsert('trainers', {
    auth_user_id: user.id,
    email,
    name,
  });
  return inserted[0];
}

async function assignUnownedStudents(trainerId) {
  const students = await restSelect('students', {
    trainer_id: 'is.null',
  });

  let adopted = 0;
  for (const student of students) {
    await restUpdate(
      'students',
      { id: `eq.${student.id}` },
      { trainer_id: trainerId },
    );
    adopted += 1;
  }

  return adopted;
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

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
