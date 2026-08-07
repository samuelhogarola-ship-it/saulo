const path = require('node:path');

const { sendRegistrationEmails } = require('../lib/email');
const { supabase } = require('../lib/config');
const {
  createId,
  createTimestamp,
  formatCurrency,
  formatDateDayMonth,
  formatTime,
} = require('../lib/utils');
const { createDemoState } = require('./demo-data');

const state = createDemoState();

function createEventsBackend() {
  return {
    getPublicEventBySlug,
    createPublicRegistration,
    getEventsForUser,
    getEventDetailForUser,
    createEvent,
    updateEvent,
    uploadPoster,
    createAdminRegistration,
    updateRegistration,
    deleteRegistration,
    markNotificationsRead,
  };
}

async function getPublicEventBySlug(slug) {
  return withFallback(
    () => remoteGetPublicEventBySlug(slug),
    () => localGetPublicEventBySlug(slug),
  );
}

async function createPublicRegistration(slug, registrationInput) {
  return withFallback(
    () => remoteCreatePublicRegistration(slug, registrationInput),
    () => localCreatePublicRegistration(slug, registrationInput),
  );
}

async function getEventsForUser(authContext) {
  return withFallback(
    () => remoteGetEventsForUser(authContext),
    () => localGetEventsForUser(authContext),
  );
}

async function getEventDetailForUser(authContext, eventId) {
  return withFallback(
    () => remoteGetEventDetailForUser(authContext, eventId),
    () => localGetEventDetailForUser(authContext, eventId),
  );
}

async function createEvent(authContext, eventInput) {
  return withFallback(
    () => remoteCreateEvent(authContext, eventInput),
    () => localCreateEvent(authContext, eventInput),
  );
}

async function updateEvent(authContext, eventId, eventInput) {
  return withFallback(
    () => remoteUpdateEvent(authContext, eventId, eventInput),
    () => localUpdateEvent(authContext, eventId, eventInput),
  );
}

async function uploadPoster(authContext, eventId, asset) {
  return withFallback(
    () => remoteUploadPoster(authContext, eventId, asset),
    () => localUploadPoster(authContext, eventId, asset),
  );
}

async function createAdminRegistration(authContext, eventId, input) {
  return withFallback(
    () => remoteCreateAdminRegistration(authContext, eventId, input),
    () => localCreateAdminRegistration(authContext, eventId, input),
  );
}

async function updateRegistration(authContext, registrationId, input) {
  return withFallback(
    () => remoteUpdateRegistration(authContext, registrationId, input),
    () => localUpdateRegistration(authContext, registrationId, input),
  );
}

async function deleteRegistration(authContext, registrationId) {
  return withFallback(
    () => remoteDeleteRegistration(authContext, registrationId),
    () => localDeleteRegistration(authContext, registrationId),
  );
}

async function markNotificationsRead(authContext, eventId) {
  return withFallback(
    () => remoteMarkNotificationsRead(authContext, eventId),
    () => localMarkNotificationsRead(authContext, eventId),
  );
}

async function withFallback(remoteHandler, localHandler) {
  if (!supabase.hasConfig) {
    return localHandler();
  }

  try {
    return await remoteHandler();
  } catch (_error) {
    return localHandler();
  }
}

function localGetPublicEventBySlug(slug) {
  const event = state.events.find(
    (item) => item.slug === slug && item.is_active === true,
  );

  return event ? decorateEvent(event) : null;
}

function localCreatePublicRegistration(slug, input) {
  const event = state.events.find(
    (item) => item.slug === slug && item.is_active === true,
  );

  if (!event) {
    throw new Error('Evento no disponible.');
  }

  const registration = {
    id: createId('reg'),
    event_id: event.id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    comments: input.comments,
    payment_status: 'pending',
    registered_at: createTimestamp(),
    created_by: null,
    source: 'public_form',
  };

  state.registrations.unshift(registration);
  state.notifications.unshift({
    id: createId('note'),
    event_id: event.id,
    registration_id: registration.id,
    message: `Nueva inscripción de ${registration.full_name}.`,
    is_read: false,
    created_at: registration.registered_at,
  });

  void sendRegistrationEmails({ event, registration }).catch(() => {});

  return {
    event: decorateEvent(event),
    registration,
  };
}

function localGetEventsForUser(authContext) {
  const accessibleEvents = state.events
    .filter((event) => getPermission(authContext, event.id).canRead)
    .map((event) => buildEventCard(authContext, event));

  return {
    events: accessibleEvents,
    canCreateEvents: canManageAllEvents(authContext),
  };
}

function localGetEventDetailForUser(authContext, eventId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) {
    return null;
  }

  const permission = getPermission(authContext, eventId);
  if (!permission.canRead) {
    return null;
  }

  const registrations = state.registrations
    .filter((item) => item.event_id === eventId)
    .sort((left, right) =>
      right.registered_at.localeCompare(left.registered_at),
    );

  const notifications = state.notifications.filter(
    (item) => item.event_id === eventId,
  );

  return {
    event: decorateEvent(event),
    permission,
    registrations,
    notifications,
    summary: createEventSummary(registrations),
  };
}

function localCreateEvent(authContext, input) {
  if (!canManageAllEvents(authContext)) {
    throw new Error('No tienes permisos para crear eventos.');
  }

  const event = {
    id: createId('event'),
    poster_url: input.poster_url || '/landing:eve.png',
    created_at: createTimestamp(),
    ...input,
  };

  state.events.unshift(event);
  return decorateEvent(event);
}

function localUpdateEvent(authContext, eventId, input) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) {
    throw new Error('Evento no encontrado.');
  }

  if (!getPermission(authContext, eventId).canManage) {
    throw new Error('No tienes permisos para editar este evento.');
  }

  Object.assign(event, input);
  return decorateEvent(event);
}

function localUploadPoster(authContext, eventId, asset) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event) {
    throw new Error('Evento no encontrado.');
  }

  if (!getPermission(authContext, eventId).canManage) {
    throw new Error('No tienes permisos para cambiar el cartel.');
  }

  event.poster_url = `data:${asset.contentType};base64,${asset.base64Data}`;
  return decorateEvent(event);
}

function localCreateAdminRegistration(authContext, eventId, input) {
  const permission = getPermission(authContext, eventId);
  if (!permission.canManage) {
    throw new Error('No tienes permisos para añadir inscritos.');
  }

  const event = state.events.find((item) => item.id === eventId);
  const registration = {
    id: createId('reg'),
    event_id: eventId,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    comments: input.comments,
    payment_status: input.payment_status,
    registered_at: createTimestamp(),
    created_by: authContext.userId,
    source: 'manual_admin',
  };

  state.registrations.unshift(registration);
  state.notifications.unshift({
    id: createId('note'),
    event_id: eventId,
    registration_id: registration.id,
    message: `Inscripción manual añadida para ${registration.full_name}.`,
    is_read: false,
    created_at: registration.registered_at,
  });

  void sendRegistrationEmails({ event, registration }).catch(() => {});
  return registration;
}

function localUpdateRegistration(authContext, registrationId, input) {
  const registration = state.registrations.find(
    (item) => item.id === registrationId,
  );
  if (!registration) {
    throw new Error('Inscripción no encontrada.');
  }

  if (!getPermission(authContext, registration.event_id).canManage) {
    throw new Error('No tienes permisos para editar esta inscripción.');
  }

  Object.assign(registration, input);
  return registration;
}

function localDeleteRegistration(authContext, registrationId) {
  const registrationIndex = state.registrations.findIndex(
    (item) => item.id === registrationId,
  );

  if (registrationIndex === -1) {
    throw new Error('Inscripción no encontrada.');
  }

  const registration = state.registrations[registrationIndex];
  if (!getPermission(authContext, registration.event_id).canManage) {
    throw new Error('No tienes permisos para eliminar esta inscripción.');
  }

  state.registrations.splice(registrationIndex, 1);
  state.notifications = state.notifications.filter(
    (item) => item.registration_id !== registrationId,
  );

  return { ok: true };
}

function localMarkNotificationsRead(authContext, eventId) {
  if (!getPermission(authContext, eventId).canRead) {
    return { ok: false };
  }

  state.notifications.forEach((notification) => {
    if (notification.event_id === eventId) {
      notification.is_read = true;
    }
  });

  return { ok: true };
}

function getPermission(authContext, eventId) {
  if (!authContext) {
    return { canRead: false, canManage: false, role: null };
  }

  if (canManageAllEvents(authContext)) {
    return { canRead: true, canManage: true, role: authContext.globalRole };
  }

  const collaborator = state.collaborators.find(
    (item) => item.event_id === eventId && item.user_id === authContext.userId,
  );

  if (!collaborator) {
    return { canRead: false, canManage: false, role: null };
  }

  return {
    canRead: true,
    canManage: collaborator.role === 'event_manager',
    role: collaborator.role,
  };
}

function canManageAllEvents(authContext) {
  return Boolean(
    authContext && ['owner', 'admin'].includes(authContext.globalRole),
  );
}

function createEventSummary(registrations) {
  const totalRegistrations = registrations.length;
  const totalPaid = registrations.filter(
    (registration) => registration.payment_status === 'paid',
  ).length;

  return {
    totalRegistrations,
    totalPaid,
    totalPending: totalRegistrations - totalPaid,
  };
}

function buildEventCard(authContext, event) {
  const registrations = state.registrations.filter(
    (item) => item.event_id === event.id,
  );
  const unreadNotifications = state.notifications.filter(
    (item) => item.event_id === event.id && !item.is_read,
  ).length;

  return {
    ...decorateEvent(event),
    permission: getPermission(authContext, event.id),
    registrationsCount: registrations.length,
    unreadNotifications,
    summary: createEventSummary(registrations),
  };
}

function decorateEvent(event) {
  const eventDate = event.event_date;

  return {
    ...event,
    formattedDateLong: formatDateDayMonth(eventDate),
    formattedTime: formatTime(event.event_time),
    formattedPrice: formatCurrency(event.price),
    landing: getLandingMeta(event),
  };
}

function getLandingMeta(event) {
  if (event.slug === 'girl-power-fuengirola') {
    return {
      eyebrow: 'Juntas somos imparables',
      heroActions: ['Entrena', 'Disfruta', 'Brilla'],
      bodyHeadline: 'Sudamos, quemamos calorías y disfrutamos',
      includes: [
        'Entrenamiento guiado por Saulo y Tamires',
        'Sesión de energía, fuerza y conexión',
        'Ambiente motivador y buena música',
        'Sorpresas y dinámicas grupales',
      ],
      benefits: [
        { title: 'Fuerza', copy: 'Juntas somos más fuertes' },
        { title: 'Energía', copy: 'Activa tu cuerpo y tu mente' },
        { title: 'Conexión', copy: 'Creamos lazos, creamos poder' },
      ],
      contacts: ['@saulofitness', '@tamirescorreaa', '695 578 960'],
    };
  }

  return {
    eyebrow: event.subtitle || 'Evento especial',
    heroActions: ['Muévete', 'Conecta', 'Disfruta'],
    bodyHeadline: event.description,
    includes: [
      'Evento guiado por el equipo de Saulo Fitness',
      'Dinámica grupal pensada para disfrutar',
      'Ambiente cuidado y motivador',
      'Seguimiento manual desde el panel de eventos',
    ],
    benefits: [
      { title: 'Movimiento', copy: 'Activación en grupo con buena energía' },
      { title: 'Comunidad', copy: 'Una experiencia para compartir' },
      { title: 'Recuerdo', copy: 'Una sesión que deja ganas de repetir' },
    ],
    contacts: ['@saulofitness', 'hola@saulofitness.com'],
  };
}

async function remoteGetPublicEventBySlug(slug) {
  const events = await restSelect('events', {
    select: '*',
    filters: {
      slug: `eq.${slug}`,
      is_active: 'eq.true',
    },
    limit: 1,
  });

  return events[0] ? decorateEvent(events[0]) : null;
}

async function remoteCreatePublicRegistration(slug, input) {
  const event = await remoteGetPublicEventBySlug(slug);
  if (!event) {
    throw new Error('Evento no disponible.');
  }

  const today = new Date().toISOString().slice(0, 10);
  if (event.registration_deadline && event.registration_deadline < today) {
    throw new Error('La inscripción para este evento ya está cerrada.');
  }

  const [registration] = await restInsert('event_registrations', [
    {
      event_id: event.id,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      comments: input.comments,
      payment_status: 'pending',
      source: 'public_form',
    },
  ]);

  await restInsert('event_notifications', [
    {
      event_id: event.id,
      registration_id: registration.id,
      message: `Nueva inscripción de ${registration.full_name}.`,
      is_read: false,
    },
  ]);

  void sendRegistrationEmails({
    event,
    registration: {
      ...registration,
      registered_at: registration.registered_at || createTimestamp(),
    },
  }).catch(() => {});

  return {
    event,
    registration,
  };
}

async function remoteGetEventsForUser(authContext) {
  const events = await restSelect('events', {
    select: '*',
  });
  const registrations = await restSelect('event_registrations', {
    select: '*',
  });
  const notifications = await restSelect('event_notifications', {
    select: '*',
  });
  const collaborators = await restSelect('event_collaborators', {
    select: '*',
  });

  return buildRemoteAccessibleEvents(
    authContext,
    events,
    registrations,
    notifications,
    collaborators,
  );
}

function buildRemoteAccessibleEvents(
  authContext,
  events,
  registrations,
  notifications,
  collaborators,
) {
  const canManageEvents = canManageAllEvents(authContext);
  const eventRolesById = new Map(
    collaborators
      .filter((item) => item.user_id === authContext.userId)
      .map((item) => [item.event_id, item.role]),
  );

  const visibleEvents = events
    .filter((event) => canManageEvents || eventRolesById.has(event.id))
    .map((event) => {
      const role = canManageEvents
        ? authContext.globalRole
        : eventRolesById.get(event.id);
      const eventRegistrations = registrations.filter(
        (registration) => registration.event_id === event.id,
      );
      const unreadNotifications = notifications.filter(
        (notification) =>
          notification.event_id === event.id && !notification.is_read,
      ).length;

      return {
        ...decorateEvent(event),
        permission: {
          canRead: true,
          canManage: canManageEvents || role === 'event_manager',
          role,
        },
        registrationsCount: eventRegistrations.length,
        unreadNotifications,
        summary: createEventSummary(eventRegistrations),
      };
    });

  return {
    events: visibleEvents,
    canCreateEvents: canManageEvents,
  };
}

async function remoteGetEventDetailForUser(authContext, eventId) {
  const listing = await remoteGetEventsForUser(authContext);
  const eventCard = listing.events.find((item) => item.id === eventId);
  if (!eventCard) {
    return null;
  }

  const registrations = await restSelect('event_registrations', {
    select: '*',
    filters: {
      event_id: `eq.${eventId}`,
    },
    order: 'registered_at.desc',
  });
  const notifications = await restSelect('event_notifications', {
    select: '*',
    filters: {
      event_id: `eq.${eventId}`,
    },
    order: 'created_at.desc',
  });

  return {
    event: eventCard,
    permission: eventCard.permission,
    registrations,
    notifications,
    summary: createEventSummary(registrations),
  };
}

async function remoteCreateEvent(authContext, input) {
  if (!canManageAllEvents(authContext)) {
    throw new Error('No tienes permisos para crear eventos.');
  }

  const [event] = await restInsert('events', [input]);
  return decorateEvent(event);
}

async function remoteUpdateEvent(authContext, eventId, input) {
  const detail = await remoteGetEventDetailForUser(authContext, eventId);
  if (!detail?.permission?.canManage) {
    throw new Error('No tienes permisos para editar este evento.');
  }

  const [event] = await restPatch(
    'events',
    {
      id: `eq.${eventId}`,
    },
    input,
  );

  return decorateEvent(event);
}

async function remoteUploadPoster(authContext, eventId, asset) {
  const detail = await remoteGetEventDetailForUser(authContext, eventId);
  if (!detail?.permission?.canManage) {
    throw new Error('No tienes permisos para cambiar el cartel.');
  }

  const fileExtension = path.extname(asset.filename || '') || '.png';
  const objectPath = `${eventId}/${Date.now()}${fileExtension}`;
  const uploadResponse = await fetch(
    `${supabase.url}/storage/v1/object/${supabase.storageBucket}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': asset.contentType,
        'x-upsert': 'true',
      },
      body: Buffer.from(asset.base64Data, 'base64'),
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(await uploadResponse.text());
  }

  const posterUrl = `${supabase.url}/storage/v1/object/public/${supabase.storageBucket}/${objectPath}`;
  return remoteUpdateEvent(authContext, eventId, { poster_url: posterUrl });
}

async function remoteCreateAdminRegistration(authContext, eventId, input) {
  const detail = await remoteGetEventDetailForUser(authContext, eventId);
  if (!detail?.permission?.canManage) {
    throw new Error('No tienes permisos para añadir inscritos.');
  }

  const [registration] = await restInsert('event_registrations', [
    {
      event_id: eventId,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      comments: input.comments,
      payment_status: input.payment_status,
      source: 'manual_admin',
      created_by: authContext.userId,
    },
  ]);

  await restInsert('event_notifications', [
    {
      event_id: eventId,
      registration_id: registration.id,
      message: `Inscripción manual añadida para ${registration.full_name}.`,
      is_read: false,
    },
  ]);

  void sendRegistrationEmails({
    event: detail.event,
    registration: {
      ...registration,
      registered_at: registration.registered_at || createTimestamp(),
    },
  }).catch(() => {});

  return registration;
}

async function remoteUpdateRegistration(authContext, registrationId, input) {
  const [registration] = await restSelect('event_registrations', {
    select: '*',
    filters: { id: `eq.${registrationId}` },
    limit: 1,
  });

  if (!registration) {
    throw new Error('Inscripción no encontrada.');
  }

  const detail = await remoteGetEventDetailForUser(
    authContext,
    registration.event_id,
  );
  if (!detail?.permission?.canManage) {
    throw new Error('No tienes permisos para editar esta inscripción.');
  }

  const [updatedRegistration] = await restPatch(
    'event_registrations',
    { id: `eq.${registrationId}` },
    input,
  );
  return updatedRegistration;
}

async function remoteDeleteRegistration(authContext, registrationId) {
  const [registration] = await restSelect('event_registrations', {
    select: '*',
    filters: { id: `eq.${registrationId}` },
    limit: 1,
  });

  if (!registration) {
    throw new Error('Inscripción no encontrada.');
  }

  const detail = await remoteGetEventDetailForUser(
    authContext,
    registration.event_id,
  );
  if (!detail?.permission?.canManage) {
    throw new Error('No tienes permisos para eliminar esta inscripción.');
  }

  await restDelete('event_notifications', {
    registration_id: `eq.${registrationId}`,
  });
  await restDelete('event_registrations', {
    id: `eq.${registrationId}`,
  });

  return { ok: true };
}

async function remoteMarkNotificationsRead(authContext, eventId) {
  const detail = await remoteGetEventDetailForUser(authContext, eventId);
  if (!detail?.permission?.canRead) {
    return { ok: false };
  }

  await restPatch(
    'event_notifications',
    {
      event_id: `eq.${eventId}`,
    },
    {
      is_read: true,
    },
  );

  return { ok: true };
}

async function restSelect(table, { select = '*', filters = {}, limit, order }) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  url.searchParams.set('select', select);

  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  if (limit != null) {
    url.searchParams.set('limit', String(limit));
  }

  if (order) {
    url.searchParams.set('order', order);
  }

  const response = await fetch(url, {
    headers: restHeaders(),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function restInsert(table, rows) {
  const response = await fetch(`${supabase.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders(),
      Prefer: 'return=representation',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function restPatch(table, filters, payload) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...restHeaders(),
      Prefer: 'return=representation',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function restDelete(table, filters) {
  const url = new URL(`${supabase.url}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: 'DELETE',
    headers: restHeaders(),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return { ok: true };
}

function restHeaders() {
  return {
    apikey: supabase.serviceRoleKey,
    Authorization: `Bearer ${supabase.serviceRoleKey}`,
  };
}

module.exports = {
  createEventsBackend,
};
