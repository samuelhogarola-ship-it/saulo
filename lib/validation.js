const { parsePrice, slugify } = require('./utils');

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function validatePublicRegistration(input) {
  const data = {
    full_name: normalizeText(input.full_name || input.fullName),
    email: normalizeOptionalText(input.email),
    phone: normalizeText(input.phone),
    comments: normalizeOptionalText(input.comments),
  };

  const errors = {};

  if (!data.full_name) {
    errors.full_name = 'El nombre completo es obligatorio.';
  }

  if (!data.phone) {
    errors.phone = 'El teléfono es obligatorio.';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Introduce un email válido.';
  }

  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

function validateAdminRegistration(input) {
  const base = validatePublicRegistration(input);
  const data = {
    ...base.data,
    payment_status: input.payment_status === 'paid' ? 'paid' : 'pending',
  };

  return { ...base, data };
}

function validateEventInput(input) {
  const title = normalizeText(input.title);
  const slug = slugify(input.slug || title);
  const data = {
    slug,
    title,
    subtitle: normalizeOptionalText(input.subtitle),
    description: normalizeOptionalText(input.description),
    event_date: normalizeText(input.event_date),
    event_time: normalizeText(input.event_time),
    location: normalizeOptionalText(input.location),
    price: parsePrice(input.price),
    registration_deadline: normalizeText(input.registration_deadline),
    teachers: normalizeOptionalText(input.teachers),
    poster_url: normalizeOptionalText(input.poster_url),
    organizer_email: normalizeOptionalText(input.organizer_email),
    is_active:
      input.is_active === 'false' ? false : Boolean(input.is_active ?? true),
  };

  const errors = {};

  if (!data.title) {
    errors.title = 'El nombre del evento es obligatorio.';
  }

  if (!data.slug) {
    errors.slug = 'El slug del evento es obligatorio.';
  }

  if (!data.event_date) {
    errors.event_date = 'La fecha es obligatoria.';
  }

  if (!data.event_time) {
    errors.event_time = 'La hora es obligatoria.';
  }

  if (!data.registration_deadline) {
    errors.registration_deadline =
      'La fecha límite de inscripción es obligatoria.';
  }

  if (!data.location) {
    errors.location = 'El lugar es obligatorio.';
  }

  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = {
  normalizeOptionalText,
  normalizeText,
  validateAdminRegistration,
  validateEventInput,
  validatePublicRegistration,
};
