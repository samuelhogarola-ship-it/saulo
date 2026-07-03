const crypto = require('node:crypto');

const { supabase, trainerApiToken } = require('./config');
const { createHttpError } = require('./saulo-store');

function createEventsStore() {
  if (supabase.hasConfig) {
    return createSupabaseEventsStore();
  }

  return createLocalEventsStore();
}

function createLocalEventsStore() {
  const state = createSeedState();

  return {
    mode: 'local',
    async listPublicEvents({ limit } = {}) {
      const events = state.events
        .filter((event) => event.isPublished)
        .sort(compareEventsByStartDate)
        .map((event) => serializeEventSummary(event, state.registrations));

      return typeof limit === 'number' ? events.slice(0, limit) : events;
    },
    async getPublicEventBySlug(slug) {
      const event = state.events.find(
        (item) => item.slug === slug && item.isPublished,
      );
      if (!event) {
        throw createHttpError(404, 'Evento no disponible.');
      }

      return serializeEventDetail(event, state.registrations);
    },
    async createPublicRegistration(slug, input) {
      const event = state.events.find(
        (item) => item.slug === slug && item.isPublished,
      );
      if (!event) {
        throw createHttpError(404, 'Evento no disponible.');
      }

      const registration = createRegistrationRecord(event.id, input);
      state.registrations.unshift(registration);

      return serializeRegistration(registration);
    },
    async listAdminEvents(authContext) {
      requireLocalTrainer(authContext);

      return state.events
        .slice()
        .sort(compareEventsByStartDate)
        .map((event) => serializeAdminEventSummary(event, state.registrations));
    },
    async getAdminEvent(authContext, eventId) {
      requireLocalTrainer(authContext);

      const event = state.events.find((item) => item.id === eventId);
      if (!event) {
        throw createHttpError(404, 'Evento no encontrado.');
      }

      return serializeAdminEventDetail(event, state.registrations);
    },
    async createAdminEvent(authContext, input) {
      requireLocalTrainer(authContext);

      const event = createEventRecord(input);
      state.events.unshift(event);

      return serializeAdminEventDetail(event, state.registrations);
    },
    async updateAdminEvent(authContext, eventId, input) {
      requireLocalTrainer(authContext);

      const event = state.events.find((item) => item.id === eventId);
      if (!event) {
        throw createHttpError(404, 'Evento no encontrado.');
      }

      applyEventUpdate(event, input);
      return serializeAdminEventDetail(event, state.registrations);
    },
  };
}

function createSupabaseEventsStore() {
  return {
    mode: 'supabase',
    async listPublicEvents({ limit } = {}) {
      const events = await restSelect('events', {
        select:
          'id,slug,title,summary,description,location,starts_at,ends_at,price_label,poster_url,cta_label,is_published,created_at,updated_at',
        is_published: 'eq.true',
        order: 'starts_at.asc',
      });

      const visible = await Promise.all(
        events.map(async (event) => {
          const registrationCount = await getEventRegistrationCount(event.id);
          return serializeSupabaseEventSummary(event, registrationCount);
        }),
      );

      return typeof limit === 'number' ? visible.slice(0, limit) : visible;
    },
    async getPublicEventBySlug(slug) {
      const [event] = await restSelect('events', {
        select:
          'id,slug,title,summary,description,location,starts_at,ends_at,price_label,poster_url,cta_label,is_published,created_at,updated_at',
        slug: `eq.${slug}`,
        is_published: 'eq.true',
        limit: '1',
      });

      if (!event) {
        throw createHttpError(404, 'Evento no disponible.');
      }

      const registrationCount = await getEventRegistrationCount(event.id);
      return serializeSupabaseEventDetail(event, registrationCount);
    },
    async createPublicRegistration(slug, input) {
      const [event] = await restSelect('events', {
        select: 'id,slug,is_published',
        slug: `eq.${slug}`,
        is_published: 'eq.true',
        limit: '1',
      });

      if (!event) {
        throw createHttpError(404, 'Evento no disponible.');
      }

      const payload = createSupabaseRegistrationPayload(event.id, input);
      const created = await restInsert('event_registrations', payload);

      return serializeSupabaseRegistration(created[0]);
    },
    async listAdminEvents(authContext) {
      await resolveSupabaseTrainerProfile(authContext);

      const events = await restSelect('events', {
        select:
          'id,slug,title,summary,description,location,starts_at,ends_at,price_label,poster_url,cta_label,is_published,created_at,updated_at,trainer_id',
        order: 'starts_at.asc',
      });

      const enriched = await Promise.all(
        events.map(async (event) => {
          const registrationCount = await getEventRegistrationCount(event.id);
          return serializeSupabaseAdminEventSummary(event, registrationCount);
        }),
      );

      return enriched;
    },
    async getAdminEvent(authContext, eventId) {
      await resolveSupabaseTrainerProfile(authContext);

      const [event] = await restSelect('events', {
        select:
          'id,slug,title,summary,description,location,starts_at,ends_at,price_label,poster_url,cta_label,is_published,created_at,updated_at,trainer_id',
        id: `eq.${eventId}`,
        limit: '1',
      });

      if (!event) {
        throw createHttpError(404, 'Evento no encontrado.');
      }

      const registrations = await restSelect('event_registrations', {
        select:
          'id,event_id,full_name,email,phone,message,status,source,created_at',
        event_id: `eq.${eventId}`,
        order: 'created_at.desc',
      });

      return serializeSupabaseAdminEventDetail(event, registrations);
    },
    async createAdminEvent(authContext, input) {
      const trainer = await resolveSupabaseTrainerProfile(authContext);
      const payload = createSupabaseEventPayload(input, trainer.id);
      const created = await restInsert('events', payload);

      return this.getAdminEvent(authContext, created[0].id);
    },
    async updateAdminEvent(authContext, eventId, input) {
      await resolveSupabaseTrainerProfile(authContext);

      const update = createSupabaseEventUpdate(input);
      update.updated_at = new Date().toISOString();
      await restUpdate('events', { id: `eq.${eventId}` }, update);

      return this.getAdminEvent(authContext, eventId);
    },
  };
}

function createSeedState() {
  return {
    events: [
      {
        id: 'event-girl-power',
        slug: 'girl-power-bootcamp',
        title: 'Girl Power Bootcamp',
        summary:
          'Una experiencia intensiva para ganar fuerza, técnica y confianza con energía premium.',
        description:
          'Una jornada completa para entrenar con propósito, pulir técnica, compartir ambiente de equipo y salir con un plan real para seguir progresando.',
        location: 'Fuengirola · Playa del Castillo',
        startsAt: '2026-07-20T09:30:00+02:00',
        endsAt: '2026-07-20T13:30:00+02:00',
        priceLabel: 'Reservas desde 35€',
        posterUrl: '/event-assets/girl-power-hero.png',
        ctaLabel: 'Reservar plaza',
        isPublished: true,
        createdAt: '2026-07-01T09:00:00+02:00',
        updatedAt: '2026-07-01T09:00:00+02:00',
      },
      {
        id: 'event-reset-fall',
        slug: 'reset-de-verano',
        title: 'Reset de verano',
        summary:
          'Encuentro guiado para retomar rutina, nutrición y foco con seguimiento directo.',
        description:
          'Sesión presencial con entrenamiento, revisión de hábitos y estrategia de vuelta al plan para llegar a septiembre con estructura y resultados.',
        location: 'Mijas Costa · Studio privado',
        startsAt: '2026-08-08T10:00:00+02:00',
        endsAt: '2026-08-08T12:30:00+02:00',
        priceLabel: 'Acceso limitado',
        posterUrl: '/landing%20saulo.png',
        ctaLabel: 'Solicitar plaza',
        isPublished: true,
        createdAt: '2026-07-01T09:15:00+02:00',
        updatedAt: '2026-07-01T09:15:00+02:00',
      },
    ],
    registrations: [
      {
        id: 'registration-seed-1',
        eventId: 'event-girl-power',
        fullName: 'Lucía Ortega',
        email: 'lucia@saulofitness.app',
        phone: '+34600000001',
        message: 'Voy con una amiga. ¿Podemos ir juntas?',
        status: 'pending',
        source: 'public_form',
        createdAt: '2026-07-02T19:20:00+02:00',
      },
    ],
  };
}

function createEventRecord(input) {
  const title = normalizeText(input.title);
  if (!title) {
    throw createHttpError(400, 'El título del evento es obligatorio.');
  }

  const startsAt = normalizeDateTime(input.startsAt);
  if (!startsAt) {
    throw createHttpError(400, 'La fecha del evento es obligatoria.');
  }

  const summary = normalizeText(input.summary);
  if (!summary) {
    throw createHttpError(400, 'El resumen del evento es obligatorio.');
  }

  const now = new Date().toISOString();
  return {
    id: createId('event'),
    slug: ensureSlug(input.slug || title),
    title,
    summary,
    description:
      normalizeText(input.description) ||
      'Evento presencial de Saulo Fitness con enfoque premium y plazas limitadas.',
    location: normalizeText(input.location) || 'Ubicación por confirmar',
    startsAt,
    endsAt: normalizeDateTime(input.endsAt) || '',
    priceLabel: normalizeText(input.priceLabel) || 'Plazas limitadas',
    posterUrl:
      normalizeText(input.posterUrl) || '/event-assets/girl-power-hero.png',
    ctaLabel: normalizeText(input.ctaLabel) || 'Reservar plaza',
    isPublished: normalizePublished(input.isPublished),
    createdAt: now,
    updatedAt: now,
  };
}

function applyEventUpdate(event, input) {
  const title = normalizeText(input.title);
  if (title) {
    event.title = title;
  }

  const slug = ensureSlug(input.slug);
  if (slug) {
    event.slug = slug;
  }

  const summary = normalizeText(input.summary);
  if (summary) {
    event.summary = summary;
  }

  const description = normalizeText(input.description);
  if (description) {
    event.description = description;
  }

  const location = normalizeText(input.location);
  if (location) {
    event.location = location;
  }

  const startsAt = normalizeDateTime(input.startsAt);
  if (startsAt) {
    event.startsAt = startsAt;
  }

  const endsAt = normalizeDateTime(input.endsAt);
  if (endsAt || input.endsAt === '') {
    event.endsAt = endsAt;
  }

  const priceLabel = normalizeText(input.priceLabel);
  if (priceLabel) {
    event.priceLabel = priceLabel;
  }

  const posterUrl = normalizeText(input.posterUrl);
  if (posterUrl) {
    event.posterUrl = posterUrl;
  }

  const ctaLabel = normalizeText(input.ctaLabel);
  if (ctaLabel) {
    event.ctaLabel = ctaLabel;
  }

  if (input.isPublished != null) {
    event.isPublished = normalizePublished(input.isPublished);
  }

  event.updatedAt = new Date().toISOString();
}

function createRegistrationRecord(eventId, input) {
  const fullName = normalizeText(input.fullName);
  if (!fullName) {
    throw createHttpError(400, 'El nombre es obligatorio.');
  }

  const email = normalizeText(input.email).toLowerCase();
  const phone = normalizeText(input.phone);

  if (!email && !phone) {
    throw createHttpError(
      400,
      'Necesitamos al menos un email o teléfono de contacto.',
    );
  }

  return {
    id: createId('registration'),
    eventId,
    fullName,
    email,
    phone,
    message: normalizeText(input.message),
    status: 'pending',
    source: 'public_form',
    createdAt: new Date().toISOString(),
  };
}

function serializeEventSummary(event, registrations) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    priceLabel: event.priceLabel,
    posterUrl: event.posterUrl,
    ctaLabel: event.ctaLabel,
    registrationCount: registrations.filter((item) => item.eventId === event.id)
      .length,
  };
}

function serializeEventDetail(event, registrations) {
  return {
    ...serializeEventSummary(event, registrations),
    description: event.description,
  };
}

function serializeAdminEventSummary(event, registrations) {
  return {
    ...serializeEventSummary(event, registrations),
    isPublished: event.isPublished,
    updatedAt: event.updatedAt,
  };
}

function serializeAdminEventDetail(event, registrations) {
  return {
    ...serializeAdminEventSummary(event, registrations),
    description: event.description,
    registrations: registrations
      .filter((item) => item.eventId === event.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(serializeRegistration),
  };
}

function serializeRegistration(registration) {
  return {
    id: registration.id,
    eventId: registration.eventId,
    fullName: registration.fullName,
    email: registration.email,
    phone: registration.phone,
    message: registration.message,
    status: registration.status,
    source: registration.source,
    createdAt: registration.createdAt,
  };
}

function serializeSupabaseEventSummary(event, registrationCount) {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    location: event.location,
    startsAt: event.starts_at,
    endsAt: event.ends_at || '',
    priceLabel: event.price_label || 'Plazas limitadas',
    posterUrl: event.poster_url || '/event-assets/girl-power-hero.png',
    ctaLabel: event.cta_label || 'Reservar plaza',
    registrationCount,
  };
}

function serializeSupabaseEventDetail(event, registrationCount) {
  return {
    ...serializeSupabaseEventSummary(event, registrationCount),
    description: event.description || '',
  };
}

function serializeSupabaseAdminEventSummary(event, registrationCount) {
  return {
    ...serializeSupabaseEventSummary(event, registrationCount),
    isPublished: Boolean(event.is_published),
    updatedAt: event.updated_at || event.created_at,
  };
}

function serializeSupabaseAdminEventDetail(event, registrations) {
  return {
    ...serializeSupabaseAdminEventSummary(event, registrations.length),
    description: event.description || '',
    registrations: registrations.map(serializeSupabaseRegistration),
  };
}

function serializeSupabaseRegistration(registration) {
  return {
    id: registration.id,
    eventId: registration.event_id,
    fullName: registration.full_name,
    email: registration.email || '',
    phone: registration.phone || '',
    message: registration.message || '',
    status: registration.status || 'pending',
    source: registration.source || 'public_form',
    createdAt: registration.created_at,
  };
}

function createSupabaseEventPayload(input, trainerId) {
  const event = createEventRecord(input);

  return {
    trainer_id: trainerId,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    description: event.description,
    location: event.location,
    starts_at: event.startsAt,
    ends_at: event.endsAt || null,
    price_label: event.priceLabel,
    poster_url: event.posterUrl,
    cta_label: event.ctaLabel,
    is_published: event.isPublished,
  };
}

function createSupabaseEventUpdate(input) {
  const update = {};

  const slug = ensureSlug(input.slug);
  if (slug) {
    update.slug = slug;
  }

  const title = normalizeText(input.title);
  if (title) {
    update.title = title;
  }

  const summary = normalizeText(input.summary);
  if (summary) {
    update.summary = summary;
  }

  const description = normalizeText(input.description);
  if (description) {
    update.description = description;
  }

  const location = normalizeText(input.location);
  if (location) {
    update.location = location;
  }

  const startsAt = normalizeDateTime(input.startsAt);
  if (startsAt) {
    update.starts_at = startsAt;
  }

  if (input.endsAt != null) {
    update.ends_at = normalizeDateTime(input.endsAt) || null;
  }

  const priceLabel = normalizeText(input.priceLabel);
  if (priceLabel) {
    update.price_label = priceLabel;
  }

  const posterUrl = normalizeText(input.posterUrl);
  if (posterUrl) {
    update.poster_url = posterUrl;
  }

  const ctaLabel = normalizeText(input.ctaLabel);
  if (ctaLabel) {
    update.cta_label = ctaLabel;
  }

  if (input.isPublished != null) {
    update.is_published = normalizePublished(input.isPublished);
  }

  return update;
}

function createSupabaseRegistrationPayload(eventId, input) {
  const registration = createRegistrationRecord(eventId, input);

  return {
    event_id: registration.eventId,
    full_name: registration.fullName,
    email: registration.email || null,
    phone: registration.phone || null,
    message: registration.message || null,
    status: registration.status,
    source: registration.source,
  };
}

async function getEventRegistrationCount(eventId) {
  const registrations = await restSelect('event_registrations', {
    select: 'id',
    event_id: `eq.${eventId}`,
  });

  return registrations.length;
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

function requireLocalTrainer(authContext) {
  if (authContext?.token !== trainerApiToken) {
    throw createHttpError(401, 'Acceso de entrenador requerido.');
  }
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
    return trainerByAuth[0];
  }

  const trainerByEmail = await restSelect('trainers', {
    email: `eq.${email}`,
    limit: '1',
  });

  if (trainerByEmail[0]) {
    return trainerByEmail[0];
  }

  throw createHttpError(
    403,
    `No existe un trainer asociado al email ${email}.`,
  );
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeDateTime(value) {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}

function normalizePublished(value) {
  return value === true || value === 'true' || value === 'on' || value === 1;
}

function ensureSlug(value) {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function compareEventsByStartDate(left, right) {
  return String(left.startsAt || left.starts_at || '').localeCompare(
    String(right.startsAt || right.starts_at || ''),
  );
}

module.exports = {
  createEventsStore,
};
