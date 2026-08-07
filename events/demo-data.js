function createDemoState() {
  const events = [
    {
      id: 'event_girl_power',
      slug: 'girl-power-fuengirola',
      title: 'Girl Power',
      subtitle: 'Fuerza · Energía · Conexión',
      description:
        'Entrenamiento grupal en la playa. Sudar, quemar calorías y disfrutar. Evento orientado a energía, conexión y motivación.',
      event_date: '2026-06-20',
      event_time: '19:00:00',
      location: 'Playa de Fuengirola',
      price: 30,
      registration_deadline: '2026-06-10',
      teachers: 'Saulo y Tamires',
      poster_url: '/landing:eve.png',
      organizer_email: 'hola@saulofitness.com',
      is_active: true,
      created_at: '2026-06-12T10:00:00.000Z',
    },
    {
      id: 'event_bachata_day',
      slug: 'bachata-day-fuengirola',
      title: 'Bachata Day',
      subtitle: 'Ritmo · Comunidad · Verano',
      description:
        'Sesión especial al aire libre para disfrutar del movimiento, la música y la conexión en grupo.',
      event_date: '2026-07-04',
      event_time: '20:30:00',
      location: 'Paseo marítimo de Fuengirola',
      price: 25,
      registration_deadline: '2026-06-28',
      teachers: 'Saulo y equipo invitado',
      poster_url: '/landing saulo.png',
      organizer_email: 'hola@saulofitness.com',
      is_active: true,
      created_at: '2026-06-12T10:05:00.000Z',
    },
  ];

  const registrations = [
    {
      id: 'reg_1',
      event_id: 'event_girl_power',
      full_name: 'Lucía Ortega',
      email: 'lucia@example.com',
      phone: '600 111 222',
      comments: 'Voy con dos amigas.',
      payment_status: 'paid',
      registered_at: '2026-06-01T11:10:00.000Z',
      created_by: null,
      source: 'public_form',
    },
    {
      id: 'reg_2',
      event_id: 'event_girl_power',
      full_name: 'Marta Ruiz',
      email: 'marta@example.com',
      phone: '600 111 333',
      comments: null,
      payment_status: 'pending',
      registered_at: '2026-06-02T14:00:00.000Z',
      created_by: null,
      source: 'public_form',
    },
    {
      id: 'reg_3',
      event_id: 'event_girl_power',
      full_name: 'Andrea Santos',
      email: null,
      phone: '600 111 444',
      comments: 'Prefiero pagar en mano.',
      payment_status: 'pending',
      registered_at: '2026-06-03T18:00:00.000Z',
      created_by: 'demo_admin',
      source: 'manual_admin',
    },
    {
      id: 'reg_4',
      event_id: 'event_bachata_day',
      full_name: 'Mario Vega',
      email: 'mario@example.com',
      phone: '600 222 333',
      comments: null,
      payment_status: 'paid',
      registered_at: '2026-06-05T09:15:00.000Z',
      created_by: null,
      source: 'public_form',
    },
    {
      id: 'reg_5',
      event_id: 'event_bachata_day',
      full_name: 'Hugo Martín',
      email: 'hugo@example.com',
      phone: '600 333 444',
      comments: 'Confirmar horario final.',
      payment_status: 'pending',
      registered_at: '2026-06-06T13:40:00.000Z',
      created_by: 'demo_admin',
      source: 'manual_admin',
    },
  ];

  const notifications = registrations.map((registration) => ({
    id: `note_${registration.id}`,
    event_id: registration.event_id,
    registration_id: registration.id,
    message: `Nueva inscripción de ${registration.full_name}.`,
    is_read: registration.event_id === 'event_bachata_day',
    created_at: registration.registered_at,
  }));

  const collaborators = [
    {
      id: 'collab_viewer',
      event_id: 'event_girl_power',
      user_id: 'demo_viewer',
      role: 'event_viewer',
      created_at: '2026-06-12T10:10:00.000Z',
    },
    {
      id: 'collab_manager',
      event_id: 'event_girl_power',
      user_id: 'demo_manager',
      role: 'event_manager',
      created_at: '2026-06-12T10:10:00.000Z',
    },
  ];

  return {
    events,
    registrations,
    notifications,
    collaborators,
  };
}

module.exports = {
  createDemoState,
};
