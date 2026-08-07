insert into public.events (
  id,
  slug,
  title,
  subtitle,
  description,
  event_date,
  event_time,
  location,
  price,
  registration_deadline,
  teachers,
  poster_url,
  organizer_email,
  is_active
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'girl-power-fuengirola',
    'Girl Power',
    'Fuerza · Energía · Conexión',
    'Entrenamiento grupal en la playa. Sudar, quemar calorías y disfrutar. Evento orientado a energía, conexión y motivación.',
    '2026-06-20',
    '19:00',
    'Playa de Fuengirola',
    30,
    '2026-06-10',
    'Saulo y Tamires',
    '/landing:eve.png',
    'hola@saulofitness.com',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'bachata-day-fuengirola',
    'Bachata Day',
    'Ritmo · Comunidad · Verano',
    'Sesión especial al aire libre para disfrutar del movimiento, la música y la conexión en grupo.',
    '2026-07-04',
    '20:30',
    'Paseo marítimo de Fuengirola',
    25,
    '2026-06-28',
    'Saulo y equipo invitado',
    '/landing saulo.png',
    'hola@saulofitness.com',
    true
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  location = excluded.location,
  price = excluded.price,
  registration_deadline = excluded.registration_deadline,
  teachers = excluded.teachers,
  poster_url = excluded.poster_url,
  organizer_email = excluded.organizer_email,
  is_active = excluded.is_active;

insert into public.event_registrations (
  id,
  event_id,
  full_name,
  email,
  phone,
  comments,
  payment_status,
  registered_at,
  source
)
values
  (
    '31111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'Lucía Ortega',
    'lucia@example.com',
    '600 111 222',
    'Voy con dos amigas.',
    'paid',
    '2026-06-01T11:10:00Z',
    'public_form'
  ),
  (
    '32222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Marta Ruiz',
    'marta@example.com',
    '600 111 333',
    null,
    'pending',
    '2026-06-02T14:00:00Z',
    'public_form'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    'Andrea Santos',
    null,
    '600 111 444',
    'Prefiero pagar en mano.',
    'pending',
    '2026-06-03T18:00:00Z',
    'manual_admin'
  ),
  (
    '34444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'Mario Vega',
    'mario@example.com',
    '600 222 333',
    null,
    'paid',
    '2026-06-05T09:15:00Z',
    'public_form'
  ),
  (
    '35555555-5555-4555-8555-555555555555',
    '22222222-2222-4222-8222-222222222222',
    'Hugo Martín',
    'hugo@example.com',
    '600 333 444',
    'Confirmar horario final.',
    'pending',
    '2026-06-06T13:40:00Z',
    'manual_admin'
  )
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  comments = excluded.comments,
  payment_status = excluded.payment_status,
  registered_at = excluded.registered_at,
  source = excluded.source;

insert into public.event_notifications (
  id,
  event_id,
  registration_id,
  message,
  is_read,
  created_at
)
values
  (
    '41111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    '31111111-1111-4111-8111-111111111111',
    'Nueva inscripción de Lucía Ortega.',
    false,
    '2026-06-01T11:10:00Z'
  ),
  (
    '42222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    '32222222-2222-4222-8222-222222222222',
    'Nueva inscripción de Marta Ruiz.',
    false,
    '2026-06-02T14:00:00Z'
  ),
  (
    '43333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333',
    'Nueva inscripción de Andrea Santos.',
    false,
    '2026-06-03T18:00:00Z'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    '34444444-4444-4444-8444-444444444444',
    'Nueva inscripción de Mario Vega.',
    true,
    '2026-06-05T09:15:00Z'
  ),
  (
    '45555555-5555-4555-8555-555555555555',
    '22222222-2222-4222-8222-222222222222',
    '35555555-5555-4555-8555-555555555555',
    'Nueva inscripción de Hugo Martín.',
    true,
    '2026-06-06T13:40:00Z'
  )
on conflict (id) do update
set
  message = excluded.message,
  is_read = excluded.is_read,
  created_at = excluded.created_at;
