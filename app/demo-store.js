(function () {
  const STORAGE_KEY = 'saulo-demo-store';
  const STORE_EVENT = 'saulo-demo-store:update';
  const STORE_VERSION = '2026-06-16-v1';
  const DAY_ORDER = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const DAY_LABELS = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  const LEGACY_DAY_MAP = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday',
  };
  let nextIdCounter = 100;

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function unique(items) {
    return [...new Set(items)];
  }

  function createId(prefix) {
    nextIdCounter += 1;
    return `${prefix}-${nextIdCounter}`;
  }

  function formatDateIso(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatMessageDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfTarget = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffDays = Math.round(
      (startOfToday.getTime() - startOfTarget.getTime()) / 86400000,
    );
    const time = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffDays === 0) {
      return `Hoy · ${time}`;
    }

    if (diffDays === 1) {
      return `Ayer · ${time}`;
    }

    return `${date.toLocaleDateString('es-ES')} · ${time}`;
  }

  function resolveDayKey(value) {
    if (!value && value !== 0) {
      return DAY_ORDER[0];
    }

    const raw = String(value).toLowerCase();
    if (DAY_LABELS[raw]) {
      return raw;
    }

    const numeric = Number(raw);
    if (Number.isInteger(numeric) && LEGACY_DAY_MAP[numeric]) {
      return LEGACY_DAY_MAP[numeric];
    }

    return DAY_ORDER[0];
  }

  function getDayLabel(dayKey) {
    return DAY_LABELS[resolveDayKey(dayKey)] || DAY_LABELS.monday;
  }

  function createEmptyDay(title) {
    return {
      title,
      meta: 'Rutina activa',
      exercises: [],
    };
  }

  function createEmptyWeek() {
    return {
      monday: createEmptyDay('Lunes activo'),
      tuesday: createEmptyDay('Martes activo'),
      wednesday: createEmptyDay('Miércoles activo'),
      thursday: createEmptyDay('Jueves activo'),
      friday: createEmptyDay('Viernes activo'),
      saturday: createEmptyDay('Sábado activo'),
      sunday: createEmptyDay('Domingo activo'),
    };
  }

  function createMessage(payload) {
    return {
      id: payload.id || createId('msg'),
      title: payload.title,
      body: payload.body,
      source: payload.source || 'App',
      direction: payload.direction,
      createdAt: payload.createdAt || new Date().toISOString(),
      clientId: payload.clientId || null,
      clientName: payload.clientName || null,
    };
  }

  function createExerciseLibrary() {
    return [
      {
        id: 'ex-hip-thrust',
        name: 'Hip thrust',
        muscleGroup: 'Glúteo',
        equipment: 'Barra',
        difficulty: 'Media',
        videoUrl: 'https://www.youtube.com/shorts/rVMsqygXtG4',
      },
      {
        id: 'ex-goblet-squat',
        name: 'Sentadilla goblet',
        muscleGroup: 'Pierna',
        equipment: 'Mancuerna',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-rdl',
        name: 'Peso muerto rumano',
        muscleGroup: 'Femoral',
        equipment: 'Barra',
        difficulty: 'Alta',
        videoUrl: '',
      },
      {
        id: 'ex-bench',
        name: 'Press banca',
        muscleGroup: 'Pecho',
        equipment: 'Barra',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-lat-pulldown',
        name: 'Jalón al pecho',
        muscleGroup: 'Espalda',
        equipment: 'Polea',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-dumbbell-row',
        name: 'Remo con mancuerna',
        muscleGroup: 'Espalda',
        equipment: 'Mancuerna',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-overhead-press',
        name: 'Press militar',
        muscleGroup: 'Hombro',
        equipment: 'Barra',
        difficulty: 'Alta',
        videoUrl: '',
      },
      {
        id: 'ex-incline-curl',
        name: 'Curl inclinado',
        muscleGroup: 'Bíceps',
        equipment: 'Mancuerna',
        difficulty: 'Baja',
        videoUrl: '',
      },
      {
        id: 'ex-bulgarian',
        name: 'Zancada búlgara',
        muscleGroup: 'Pierna',
        equipment: 'Mancuerna',
        difficulty: 'Alta',
        videoUrl: '',
      },
      {
        id: 'ex-plank',
        name: 'Plancha frontal',
        muscleGroup: 'Core',
        equipment: 'Peso corporal',
        difficulty: 'Baja',
        videoUrl: '',
      },
      {
        id: 'ex-lateral-raise',
        name: 'Elevaciones laterales',
        muscleGroup: 'Hombro',
        equipment: 'Mancuerna',
        difficulty: 'Baja',
        videoUrl: '',
      },
      {
        id: 'ex-triceps-rope',
        name: 'Extensión tríceps',
        muscleGroup: 'Tríceps',
        equipment: 'Polea',
        difficulty: 'Baja',
        videoUrl: '',
      },
      {
        id: 'ex-leg-press',
        name: 'Prensa inclinada',
        muscleGroup: 'Pierna',
        equipment: 'Máquina',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-ab-wheel',
        name: 'Ab wheel',
        muscleGroup: 'Core',
        equipment: 'Rueda',
        difficulty: 'Alta',
        videoUrl: '',
      },
      {
        id: 'ex-step-up',
        name: 'Step up',
        muscleGroup: 'Glúteo',
        equipment: 'Banco',
        difficulty: 'Media',
        videoUrl: '',
      },
      {
        id: 'ex-face-pull',
        name: 'Face pull',
        muscleGroup: 'Espalda',
        equipment: 'Polea',
        difficulty: 'Baja',
        videoUrl: '',
      },
    ];
  }

  function createExerciseEntry(
    exerciseId,
    series,
    reps,
    load,
    exerciseLibrary,
  ) {
    const exercise = exerciseLibrary.find((item) => item.id === exerciseId);
    if (!exercise) {
      return null;
    }

    return {
      id: createId('item'),
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      videoUrl: exercise.videoUrl,
      series,
      reps,
      load,
    };
  }

  function createTemplateDays(seed, exerciseLibrary) {
    return {
      monday: {
        title: seed.mondayTitle,
        meta: seed.mondayMeta,
        exercises: seed.monday
          .map((entry) =>
            createExerciseEntry(
              entry.exerciseId,
              entry.series,
              entry.reps,
              entry.load,
              exerciseLibrary,
            ),
          )
          .filter(Boolean),
      },
      tuesday: {
        title: seed.tuesdayTitle,
        meta: seed.tuesdayMeta,
        exercises: seed.tuesday
          .map((entry) =>
            createExerciseEntry(
              entry.exerciseId,
              entry.series,
              entry.reps,
              entry.load,
              exerciseLibrary,
            ),
          )
          .filter(Boolean),
      },
      wednesday: {
        title: seed.wednesdayTitle,
        meta: seed.wednesdayMeta,
        exercises: seed.wednesday
          .map((entry) =>
            createExerciseEntry(
              entry.exerciseId,
              entry.series,
              entry.reps,
              entry.load,
              exerciseLibrary,
            ),
          )
          .filter(Boolean),
      },
      thursday: {
        title: seed.thursdayTitle,
        meta: seed.thursdayMeta,
        exercises: seed.thursday
          .map((entry) =>
            createExerciseEntry(
              entry.exerciseId,
              entry.series,
              entry.reps,
              entry.load,
              exerciseLibrary,
            ),
          )
          .filter(Boolean),
      },
      friday: {
        title: seed.fridayTitle,
        meta: seed.fridayMeta,
        exercises: seed.friday
          .map((entry) =>
            createExerciseEntry(
              entry.exerciseId,
              entry.series,
              entry.reps,
              entry.load,
              exerciseLibrary,
            ),
          )
          .filter(Boolean),
      },
    };
  }

  function createPhotoHistory(name) {
    return [
      {
        id: `${name.toLowerCase().replaceAll(' ', '-')}-history-junio`,
        monthLabel: 'Junio 2026',
        title: `${name} · Seguimiento mensual`,
        description:
          'Registro del 30 de junio de 2026 para comparar evolución, definición y postura.',
        shots: [
          { label: 'Izquierda', tone: 'side-left', src: '' },
          { label: 'Derecha', tone: 'side-right', src: '' },
          { label: 'Frente', tone: 'front', src: '' },
          { label: 'Espalda', tone: 'back', src: '' },
        ],
      },
    ];
  }

  function createClient(payload) {
    return {
      id: payload.id,
      name: payload.name,
      plan: payload.plan,
      summary: payload.summary,
      goal: payload.goal,
      age: payload.age,
      weight: payload.weight,
      height: payload.height,
      profileNote: payload.profileNote,
      subscriptionEnd: payload.subscriptionEnd,
      planEnd: payload.planEnd,
      activeAssignmentId: payload.activeAssignmentId,
      photos: {
        nextDueDate: payload.nextDueDate || '2026-07-30',
        pendingUploads: {
          Izquierda: '',
          Derecha: '',
          Frente: '',
          Espalda: '',
        },
        history: createPhotoHistory(payload.name),
      },
      messages: {
        inbox: deepClone(payload.messages.inbox),
        sent: deepClone(payload.messages.sent),
        reminders: [],
      },
    };
  }

  function syncClientReminders(client) {
    client.messages.reminders = [
      createMessage({
        id: `${client.id}-reminder-checkin`,
        title: 'Check-in semanal',
        body: `Sube peso, sensaciones y 4 fotos de progreso para ${client.name}.`,
        source: 'App',
        direction: 'reminder',
        createdAt: '2026-06-17T09:00:00.000Z',
        clientId: client.id,
        clientName: client.name,
      }),
      createMessage({
        id: `${client.id}-reminder-renewal`,
        title: 'Renovación próxima',
        body: `La suscripción activa termina el ${formatDateIso(client.subscriptionEnd)}.`,
        source: 'App',
        direction: 'reminder',
        createdAt: '2026-06-20T18:00:00.000Z',
        clientId: client.id,
        clientName: client.name,
      }),
    ];
  }

  function createSeedState() {
    const exerciseLibrary = createExerciseLibrary();

    const templateLucia = {
      id: 'tpl-lucia-semana-a',
      name: 'Lucía · Definición Semana A',
      status: 'active',
      updatedAt: '2026-06-15T17:53:00.000Z',
      assignedClientIds: ['client-lucia', 'client-carla'],
      days: createTemplateDays(
        {
          mondayTitle: 'Pierna + glúteo',
          mondayMeta: 'Activa · Ganancia muscular',
          monday: [
            {
              exerciseId: 'ex-hip-thrust',
              series: '4',
              reps: '10',
              load: '75%',
            },
            {
              exerciseId: 'ex-bulgarian',
              series: '3',
              reps: '12',
              load: '14 kg',
            },
            {
              exerciseId: 'ex-rdl',
              series: '4',
              reps: '8',
              load: '70%',
            },
          ],
          tuesdayTitle: 'Core + movilidad',
          tuesdayMeta: 'Recuperación · Técnica',
          tuesday: [
            {
              exerciseId: 'ex-plank',
              series: '3',
              reps: '40 s',
              load: 'Control',
            },
            {
              exerciseId: 'ex-ab-wheel',
              series: '3',
              reps: '10',
              load: 'Control',
            },
          ],
          wednesdayTitle: 'Espalda + bíceps',
          wednesdayMeta: 'Activa · Ganancia muscular',
          wednesday: [
            {
              exerciseId: 'ex-lat-pulldown',
              series: '4',
              reps: '10',
              load: '68%',
            },
            {
              exerciseId: 'ex-dumbbell-row',
              series: '3',
              reps: '12',
              load: '22 kg',
            },
            {
              exerciseId: 'ex-incline-curl',
              series: '3',
              reps: '15',
              load: '10 kg',
            },
          ],
          thursdayTitle: 'Push + hombro',
          thursdayMeta: 'Activa · Técnica',
          thursday: [
            {
              exerciseId: 'ex-bench',
              series: '4',
              reps: '8',
              load: '72%',
            },
            {
              exerciseId: 'ex-overhead-press',
              series: '3',
              reps: '10',
              load: '24 kg',
            },
            {
              exerciseId: 'ex-lateral-raise',
              series: '3',
              reps: '15',
              load: '8 kg',
            },
          ],
          fridayTitle: 'Glúteo + acondicionamiento',
          fridayMeta: 'Activa · Resistencia',
          friday: [
            {
              exerciseId: 'ex-step-up',
              series: '3',
              reps: '12',
              load: '12 kg',
            },
            {
              exerciseId: 'ex-leg-press',
              series: '4',
              reps: '12',
              load: '120 kg',
            },
          ],
        },
        exerciseLibrary,
      ),
    };

    const templateStrength = {
      id: 'tpl-strength-base',
      name: 'Base fuerza · Upper / Lower',
      status: 'active',
      updatedAt: '2026-06-14T18:48:00.000Z',
      assignedClientIds: ['client-mario', 'client-hugo'],
      days: createTemplateDays(
        {
          mondayTitle: 'Lower strength',
          mondayMeta: 'Fuerza · Progresión',
          monday: [
            {
              exerciseId: 'ex-goblet-squat',
              series: '4',
              reps: '8',
              load: '28 kg',
            },
            {
              exerciseId: 'ex-rdl',
              series: '4',
              reps: '6',
              load: '80%',
            },
            {
              exerciseId: 'ex-step-up',
              series: '3',
              reps: '10',
              load: '16 kg',
            },
          ],
          tuesdayTitle: 'Upper push',
          tuesdayMeta: 'Fuerza · Técnica',
          tuesday: [
            {
              exerciseId: 'ex-bench',
              series: '5',
              reps: '5',
              load: '80%',
            },
            {
              exerciseId: 'ex-overhead-press',
              series: '4',
              reps: '6',
              load: '32 kg',
            },
            {
              exerciseId: 'ex-triceps-rope',
              series: '3',
              reps: '15',
              load: 'Peso directo',
            },
          ],
          wednesdayTitle: 'Movilidad + core',
          wednesdayMeta: 'Descarga · Control',
          wednesday: [
            {
              exerciseId: 'ex-plank',
              series: '3',
              reps: '45 s',
              load: 'Control',
            },
            {
              exerciseId: 'ex-ab-wheel',
              series: '3',
              reps: '12',
              load: 'Control',
            },
          ],
          thursdayTitle: 'Upper pull',
          thursdayMeta: 'Fuerza · Respaldo',
          thursday: [
            {
              exerciseId: 'ex-lat-pulldown',
              series: '4',
              reps: '8',
              load: '75%',
            },
            {
              exerciseId: 'ex-dumbbell-row',
              series: '4',
              reps: '10',
              load: '30 kg',
            },
            {
              exerciseId: 'ex-face-pull',
              series: '3',
              reps: '18',
              load: 'Peso directo',
            },
          ],
          fridayTitle: 'Lower volume',
          fridayMeta: 'Hipertrofia · Cierre',
          friday: [
            {
              exerciseId: 'ex-leg-press',
              series: '4',
              reps: '15',
              load: '140 kg',
            },
            {
              exerciseId: 'ex-bulgarian',
              series: '3',
              reps: '12',
              load: '18 kg',
            },
          ],
        },
        exerciseLibrary,
      ),
    };

    const templateExpress = {
      id: 'tpl-express-metabolic',
      name: 'Pérdida de grasa · Express',
      status: 'draft',
      updatedAt: '2026-06-12T09:20:00.000Z',
      assignedClientIds: [],
      days: createTemplateDays(
        {
          mondayTitle: 'Circuito pierna',
          mondayMeta: 'Metabólico · 35 min',
          monday: [
            {
              exerciseId: 'ex-goblet-squat',
              series: '3',
              reps: '15',
              load: '18 kg',
            },
            {
              exerciseId: 'ex-step-up',
              series: '3',
              reps: '12',
              load: '10 kg',
            },
          ],
          tuesdayTitle: 'Upper ligero',
          tuesdayMeta: 'Metabólico · 30 min',
          tuesday: [
            {
              exerciseId: 'ex-lat-pulldown',
              series: '3',
              reps: '12',
              load: '60%',
            },
            {
              exerciseId: 'ex-lateral-raise',
              series: '3',
              reps: '15',
              load: '6 kg',
            },
          ],
          wednesdayTitle: 'Core',
          wednesdayMeta: 'Control · 20 min',
          wednesday: [
            {
              exerciseId: 'ex-plank',
              series: '4',
              reps: '35 s',
              load: 'Control',
            },
          ],
          thursdayTitle: 'Posterior',
          thursdayMeta: 'Ligero · Técnica',
          thursday: [
            {
              exerciseId: 'ex-rdl',
              series: '3',
              reps: '10',
              load: '55%',
            },
          ],
          fridayTitle: 'Final total body',
          fridayMeta: 'Metabólico · 25 min',
          friday: [
            {
              exerciseId: 'ex-face-pull',
              series: '3',
              reps: '20',
              load: 'Peso directo',
            },
            {
              exerciseId: 'ex-ab-wheel',
              series: '3',
              reps: '8',
              load: 'Control',
            },
          ],
        },
        exerciseLibrary,
      ),
    };

    const assignments = [
      {
        id: 'asg-lucia-a',
        routineTemplateId: templateLucia.id,
        clientId: 'client-lucia',
        status: 'active',
        assignedAt: '2026-06-15T17:53:00.000Z',
        days: deepClone(templateLucia.days),
      },
      {
        id: 'asg-carla-a',
        routineTemplateId: templateLucia.id,
        clientId: 'client-carla',
        status: 'active',
        assignedAt: '2026-06-15T17:53:00.000Z',
        days: deepClone(templateLucia.days),
      },
      {
        id: 'asg-mario-a',
        routineTemplateId: templateStrength.id,
        clientId: 'client-mario',
        status: 'active',
        assignedAt: '2026-06-14T18:48:00.000Z',
        days: deepClone(templateStrength.days),
      },
      {
        id: 'asg-hugo-a',
        routineTemplateId: templateStrength.id,
        clientId: 'client-hugo',
        status: 'active',
        assignedAt: '2026-06-14T18:48:00.000Z',
        days: deepClone(templateStrength.days),
      },
    ];

    const clients = [
      createClient({
        id: 'client-lucia',
        name: 'Lucía Ortega',
        plan: 'Definición avanzada',
        summary: 'Hoy toca sumar.',
        goal: 'Bajar grasa y mantener fuerza',
        age: '31 años',
        weight: '63,4 kg',
        height: '168 cm',
        profileNote:
          'Adherencia alta con feedback rápido. Practica natación y cuida la rodilla tras una lesión.',
        subscriptionEnd: '2026-06-30',
        planEnd: '2026-07-08',
        activeAssignmentId: 'asg-lucia-a',
        messages: {
          inbox: [
            createMessage({
              id: 'lucia-inbox-1',
              title: 'Coach Saulo',
              body: 'Esta semana entrenaste muy duro. Descansa e hidrátate bien en los días de descarga.',
              source: 'Email',
              direction: 'received',
              createdAt: '2026-06-16T08:45:00.000Z',
            }),
            createMessage({
              id: 'lucia-inbox-2',
              title: 'Coach Saulo',
              body: 'Vamos a buscar más control técnico en la sentadilla búlgara. Mantén el foco.',
              source: 'Email',
              direction: 'received',
              createdAt: '2026-06-15T19:10:00.000Z',
            }),
          ],
          sent: [
            createMessage({
              id: 'lucia-sent-1',
              title: 'Consulta nutrición',
              body: 'Pregunté si mover carbohidratos al pre-entreno.',
              source: 'Email',
              direction: 'sent',
              createdAt: '2026-06-15T20:15:00.000Z',
            }),
          ],
        },
      }),
      createClient({
        id: 'client-mario',
        name: 'Mario Vega',
        plan: 'Fuerza base',
        summary: 'Busca técnica y progresión.',
        goal: 'Subir fuerza sin perder movilidad',
        age: '37 años',
        weight: '82,1 kg',
        height: '176 cm',
        profileNote:
          'Trabaja sentado y entrena al mediodía. Prefiere sesiones compactas y carga progresiva.',
        subscriptionEnd: '2026-07-12',
        planEnd: '2026-07-19',
        activeAssignmentId: 'asg-mario-a',
        messages: {
          inbox: [
            createMessage({
              id: 'mario-inbox-1',
              title: 'Coach Saulo',
              body: 'Esta semana prioriza descanso entre series pesadas y cuida el braceo en el press.',
              source: 'App',
              direction: 'received',
              createdAt: '2026-06-16T07:50:00.000Z',
            }),
          ],
          sent: [
            createMessage({
              id: 'mario-sent-1',
              title: 'Sensaciones hombro',
              body: 'El press militar fue mejor hoy, sin molestias al subir.',
              source: 'App',
              direction: 'sent',
              createdAt: '2026-06-15T21:02:00.000Z',
            }),
          ],
        },
      }),
      createClient({
        id: 'client-carla',
        name: 'Carla Nunes',
        plan: 'Recomposición',
        summary: 'Más constancia, menos ruido.',
        goal: 'Tonificar y mantener energía',
        age: '29 años',
        weight: '58,7 kg',
        height: '164 cm',
        profileNote:
          'Muy buena adherencia. Le motiva ver cambios visuales y check-ins de fotos cada mes.',
        subscriptionEnd: '2026-07-04',
        planEnd: '2026-07-11',
        activeAssignmentId: 'asg-carla-a',
        messages: {
          inbox: [
            createMessage({
              id: 'carla-inbox-1',
              title: 'Coach Saulo',
              body: 'Sigue el plan tal como está esta semana y avísame si notas fatiga en jueves.',
              source: 'App',
              direction: 'received',
              createdAt: '2026-06-14T12:18:00.000Z',
            }),
          ],
          sent: [
            createMessage({
              id: 'carla-sent-1',
              title: 'Check-in',
              body: 'Me noto con más energía y mejor descanso desde que ajustamos la cena.',
              source: 'App',
              direction: 'sent',
              createdAt: '2026-06-15T18:11:00.000Z',
            }),
          ],
        },
      }),
      createClient({
        id: 'client-hugo',
        name: 'Hugo Marín',
        plan: 'Pérdida de grasa',
        summary: 'Semana de adherencia limpia.',
        goal: 'Perder grasa y mejorar capacidad aeróbica',
        age: '34 años',
        weight: '91,3 kg',
        height: '182 cm',
        profileNote:
          'Quiere ver progreso en peso y fotos. Necesita recordatorios claros de renovación.',
        subscriptionEnd: '2026-06-26',
        planEnd: '2026-07-03',
        activeAssignmentId: 'asg-hugo-a',
        messages: {
          inbox: [
            createMessage({
              id: 'hugo-inbox-1',
              title: 'Coach Saulo',
              body: 'Buen trabajo esta semana. Vamos a mantener el cardio suave tras la sesión de pierna.',
              source: 'App',
              direction: 'received',
              createdAt: '2026-06-13T10:41:00.000Z',
            }),
          ],
          sent: [
            createMessage({
              id: 'hugo-sent-1',
              title: 'Peso semanal',
              body: 'Bajé 0,6 kg esta semana y mantuve bien el apetito.',
              source: 'App',
              direction: 'sent',
              createdAt: '2026-06-15T08:35:00.000Z',
            }),
          ],
        },
      }),
    ];

    clients.forEach(syncClientReminders);

    return {
      version: STORE_VERSION,
      meta: {
        createdAt: '2026-06-16T00:00:00.000Z',
        updatedAt: '2026-06-16T00:00:00.000Z',
      },
      trainer: {
        id: 'trainer-saulo',
        name: 'Saulo De Tassio',
        role: 'Entrenador principal',
        email: 'hola@saulofitness.com',
        studio: 'Saulo Fitness APP',
      },
      clients,
      exerciseLibrary,
      routineTemplates: [templateLucia, templateStrength, templateExpress],
      routineAssignments: assignments,
    };
  }

  function emitStoreUpdate() {
    window.dispatchEvent(new CustomEvent(STORE_EVENT));
  }

  function persistState(nextState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    emitStoreUpdate();
    return deepClone(nextState);
  }

  function ensureState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return persistState(createSeedState());
      }

      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== STORE_VERSION) {
        return persistState(createSeedState());
      }

      return parsed;
    } catch (error) {
      console.warn(
        'No se pudo cargar el estado compartido, reiniciando.',
        error,
      );
      return persistState(createSeedState());
    }
  }

  function getState() {
    return deepClone(ensureState());
  }

  function mutateState(recipe) {
    const draft = getState();
    recipe(draft);
    draft.meta.updatedAt = new Date().toISOString();
    return persistState(draft);
  }

  function subscribe(listener) {
    const handleUpdate = () => {
      listener(getState());
    };

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        listener(getState());
      }
    };

    window.addEventListener(STORE_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(STORE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }

  function getClientById(state, clientId) {
    return state.clients.find((client) => client.id === clientId) || null;
  }

  function resolveClientId(state, clientId) {
    if (clientId && getClientById(state, clientId)) {
      return clientId;
    }

    return state.clients[0]?.id || null;
  }

  function getClientRoutineAssignment(state, clientId) {
    const client = getClientById(state, clientId);
    if (!client) {
      return null;
    }

    return (
      state.routineAssignments.find(
        (assignment) => assignment.id === client.activeAssignmentId,
      ) || null
    );
  }

  function getRoutineTemplateById(state, templateId) {
    return (
      state.routineTemplates.find((template) => template.id === templateId) ||
      null
    );
  }

  function buildTemplateName(days) {
    const firstDayKey = DAY_ORDER.find(
      (dayKey) => days[dayKey] && days[dayKey].exercises.length,
    );
    if (!firstDayKey) {
      return 'Nueva rutina semanal';
    }

    const firstExercise = days[firstDayKey].exercises[0];
    return `${getDayLabel(firstDayKey)} · ${firstExercise.name}`;
  }

  function normalizeDays(days) {
    const week = createEmptyWeek();

    DAY_ORDER.forEach((dayKey) => {
      const source = days?.[dayKey];
      if (!source) {
        return;
      }

      week[dayKey] = {
        title: source.title || week[dayKey].title,
        meta: source.meta || week[dayKey].meta,
        exercises: (source.exercises || []).map((exercise) => ({
          id: exercise.id || createId('item'),
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty,
          videoUrl: exercise.videoUrl || '',
          series: String(exercise.series || ''),
          reps: String(exercise.reps || ''),
          load: String(exercise.load || ''),
        })),
      };
    });

    return week;
  }

  function saveRoutineTemplate(payload) {
    let templateId = payload.templateId || null;

    const nextState = mutateState((state) => {
      const normalizedDays = normalizeDays(payload.days);
      const name = payload.name?.trim() || buildTemplateName(normalizedDays);
      const existing = payload.templateId
        ? getRoutineTemplateById(state, payload.templateId)
        : null;

      if (existing) {
        existing.name = name;
        existing.status = payload.status || existing.status || 'draft';
        existing.updatedAt = new Date().toISOString();
        existing.days = normalizedDays;
        return;
      }

      templateId = createId('tpl');
      state.routineTemplates.unshift({
        id: templateId,
        name,
        status: payload.status || 'draft',
        days: normalizedDays,
        assignedClientIds: [],
        updatedAt: new Date().toISOString(),
      });
    });

    return {
      state: nextState,
      templateId,
    };
  }

  function assignRoutineToClient(payload) {
    let assignmentId = null;
    let templateId = payload.templateId || null;

    const nextState = mutateState((state) => {
      const client = getClientById(state, payload.clientId);
      if (!client) {
        return;
      }

      const normalizedDays = normalizeDays(payload.days);
      let template = templateId
        ? getRoutineTemplateById(state, templateId)
        : null;
      const templateName =
        payload.name?.trim() || buildTemplateName(normalizedDays);

      if (template) {
        template.name = templateName;
        template.days = normalizedDays;
        template.updatedAt = new Date().toISOString();
        template.status = 'active';
      } else {
        template = {
          id: createId('tpl'),
          name: templateName,
          status: 'active',
          days: normalizedDays,
          assignedClientIds: [],
          updatedAt: new Date().toISOString(),
        };
        state.routineTemplates.unshift(template);
        templateId = template.id;
      }

      template.assignedClientIds = unique([
        ...(template.assignedClientIds || []),
        client.id,
      ]);

      assignmentId = createId('asg');
      state.routineAssignments.unshift({
        id: assignmentId,
        routineTemplateId: template.id,
        clientId: client.id,
        days: deepClone(normalizedDays),
        assignedAt: new Date().toISOString(),
        status: 'active',
      });
      client.activeAssignmentId = assignmentId;
    });

    return {
      state: nextState,
      assignmentId,
      templateId,
    };
  }

  function sendTrainerMessage(payload) {
    return mutateState((state) => {
      const client = getClientById(state, payload.clientId);
      if (!client) {
        return;
      }

      client.messages.inbox.unshift(
        createMessage({
          title: payload.title,
          body: payload.body,
          source: payload.source || 'App',
          direction: 'received',
          clientId: client.id,
          clientName: client.name,
        }),
      );
    });
  }

  function sendClientMessage(payload) {
    return mutateState((state) => {
      const client = getClientById(state, payload.clientId);
      if (!client) {
        return;
      }

      client.messages.sent.unshift(
        createMessage({
          title: payload.title,
          body: payload.body,
          source: payload.source || 'App',
          direction: 'sent',
          clientId: client.id,
          clientName: client.name,
        }),
      );
    });
  }

  function recordWorkoutReport(payload) {
    return sendClientMessage({
      clientId: payload.clientId,
      title: 'Resumen de entrenamiento',
      body: payload.body,
      source: 'Rutina',
    });
  }

  function updateClientProfile(clientId, patch) {
    return mutateState((state) => {
      const client = getClientById(state, clientId);
      if (!client) {
        return;
      }

      Object.assign(client, patch);
      syncClientReminders(client);
    });
  }

  function updateClientPendingPhoto(clientId, label, src) {
    return mutateState((state) => {
      const client = getClientById(state, clientId);
      if (!client) {
        return;
      }

      client.photos.pendingUploads[label] = src;
    });
  }

  function getTrainerMessageBuckets(state, filterClientId) {
    const activeFilter = filterClientId || 'all';
    const inbox = [];
    const sent = [];
    const reminders = [];

    state.clients.forEach((client) => {
      if (activeFilter !== 'all' && client.id !== activeFilter) {
        return;
      }

      client.messages.sent.forEach((item) => {
        inbox.push({
          ...item,
          clientId: client.id,
          clientName: client.name,
          bucket: 'inbox',
        });
      });

      client.messages.inbox.forEach((item) => {
        sent.push({
          ...item,
          clientId: client.id,
          clientName: client.name,
          bucket: 'sent',
        });
      });

      client.messages.reminders.forEach((item) => {
        reminders.push({
          ...item,
          clientId: client.id,
          clientName: client.name,
          bucket: 'reminders',
        });
      });
    });

    const sortByDate = (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    return {
      inbox: inbox.sort(sortByDate),
      sent: sent.sort(sortByDate),
      reminders: reminders.sort(sortByDate),
    };
  }

  function resetStore() {
    window.localStorage.removeItem(STORAGE_KEY);
    emitStoreUpdate();
    return getState();
  }

  function getExerciseThumbnailTheme(exerciseName) {
    const name = exerciseName.toLowerCase();

    if (
      name.includes('sentadilla') ||
      name.includes('hip thrust') ||
      name.includes('peso muerto') ||
      name.includes('step up') ||
      name.includes('zancada')
    ) {
      return {
        glow: '#7c4dff',
        glowSecondary: '#ffffff',
        scene: `
          <rect x="198" y="64" width="6" height="70" rx="3" fill="#2b2b31" />
          <rect x="118" y="102" width="104" height="6" rx="3" fill="#d8d8de" />
          <rect x="104" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
          <rect x="224" y="96" width="12" height="18" rx="4" fill="#5a5a65" />
          <circle cx="152" cy="74" r="12" fill="#f3d7c4" />
          <rect x="144" y="86" width="20" height="28" rx="10" fill="#7c3aed" />
          <rect x="133" y="92" width="16" height="10" rx="5" fill="#f3d7c4" />
          <rect x="159" y="92" width="26" height="8" rx="4" fill="#f3d7c4" />
          <rect x="146" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
          <rect x="157" y="112" width="8" height="24" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    if (
      name.includes('jalón') ||
      name.includes('remo') ||
      name.includes('curl') ||
      name.includes('face pull')
    ) {
      return {
        glow: '#8b5cf6',
        glowSecondary: '#a78bfa',
        scene: `
          <rect x="214" y="34" width="8" height="102" rx="4" fill="#2d2d34" />
          <rect x="196" y="46" width="44" height="6" rx="3" fill="#4a4a53" />
          <rect x="214" y="52" width="2" height="24" fill="#b9b9c5" />
          <rect x="206" y="76" width="18" height="4" rx="2" fill="#d9d9e0" />
          <circle cx="140" cy="72" r="12" fill="#f3d7c4" />
          <rect x="132" y="84" width="20" height="30" rx="10" fill="#7c3aed" />
          <rect x="144" y="114" width="8" height="24" rx="4" fill="#f3d7c4" />
          <rect x="156" y="90" width="36" height="8" rx="4" fill="#f3d7c4" />
          <rect x="131" y="95" width="18" height="8" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    if (name.includes('press')) {
      return {
        glow: '#6d28d9',
        glowSecondary: '#a78bfa',
        scene: `
          <rect x="92" y="112" width="120" height="8" rx="4" fill="#3c3c45" />
          <rect x="110" y="96" width="48" height="12" rx="6" fill="#4f4f58" />
          <rect x="126" y="90" width="84" height="6" rx="3" fill="#dadbe1" />
          <rect x="116" y="84" width="12" height="18" rx="4" fill="#61616c" />
          <rect x="210" y="84" width="12" height="18" rx="4" fill="#61616c" />
          <circle cx="150" cy="74" r="11" fill="#f3d7c4" />
          <rect x="142" y="84" width="20" height="22" rx="10" fill="#7c3aed" />
          <rect x="135" y="93" width="16" height="8" rx="4" fill="#f3d7c4" />
          <rect x="160" y="93" width="18" height="8" rx="4" fill="#f3d7c4" />
        `,
      };
    }

    return {
      glow: '#7c3aed',
      glowSecondary: '#a78bfa',
      scene: `
        <circle cx="148" cy="74" r="12" fill="#f3d7c4" />
        <rect x="140" y="86" width="20" height="32" rx="10" fill="#7c3aed" />
        <rect x="129" y="92" width="16" height="8" rx="4" fill="#f3d7c4" />
        <rect x="156" y="92" width="18" height="8" rx="4" fill="#f3d7c4" />
        <rect x="144" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
        <rect x="154" y="118" width="8" height="18" rx="4" fill="#f3d7c4" />
        <rect x="196" y="92" width="44" height="8" rx="4" fill="#3f3f47" />
        <rect x="84" y="104" width="50" height="8" rx="4" fill="#3f3f47" />
      `,
    };
  }

  function getExerciseThumbnailSrc(exerciseName, title) {
    const theme = getExerciseThumbnailTheme(exerciseName);
    const safeExerciseName = escapeHtml(exerciseName);
    const safeTitle = escapeHtml(title || 'Saulo Fitness');
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img" aria-label="${safeExerciseName}">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#111114" />
            <stop offset="55%" stop-color="#1a1a20" />
            <stop offset="100%" stop-color="#060608" />
          </linearGradient>
          <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.9" />
            <stop offset="100%" stop-color="${theme.glowSecondary}" stop-opacity="0.15" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" rx="24" fill="url(#bg)" />
        <circle cx="74" cy="54" r="58" fill="url(#glow)" opacity="0.55" />
        <circle cx="262" cy="34" r="40" fill="${theme.glowSecondary}" opacity="0.16" />
        <rect x="0" y="138" width="320" height="42" fill="#0c0c0f" />
        <rect x="22" y="138" width="276" height="2" fill="rgba(255,255,255,0.08)" />
        ${theme.scene}
        <rect x="18" y="18" width="138" height="24" rx="12" fill="rgba(255,255,255,0.08)" />
        <text x="32" y="34" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
        <rect x="18" y="146" width="178" height="20" rx="10" fill="rgba(255,255,255,0.08)" />
        <text x="30" y="160" fill="#ffffff" font-size="12" font-family="Arial, sans-serif" font-weight="700">${safeExerciseName}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getProgressPhotoScene(tone) {
    const base = `
      <ellipse cx="110" cy="248" rx="40" ry="10" fill="rgba(17,17,20,0.18)" />
      <ellipse cx="110" cy="68" rx="22" ry="10" fill="#1a1a1f" opacity="0.38" />
      <circle cx="110" cy="88" r="22" fill="#efc8b0" />
      <path d="M88 112c5-10 19-16 22-16s17 6 22 16l4 20c3 14-7 28-22 28h-8c-15 0-25-14-22-28z" fill="#17171b" />
      <path d="M93 116c6-7 14-12 17-12s11 5 17 12l3 19c2 10-5 19-16 19h-8c-11 0-18-9-16-19z" fill="#7c3aed" />
      <rect x="80" y="118" width="12" height="56" rx="6" fill="#efc8b0" />
      <rect x="128" y="118" width="12" height="56" rx="6" fill="#efc8b0" />
      <path d="M96 160h11l4 43c1 12-6 28-17 33l-6 2 2-34z" fill="#efc8b0" />
      <path d="M124 160h-11l-4 43c-1 12 6 28 17 33l6 2-2-34z" fill="#efc8b0" />
      <rect x="89" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
      <rect x="118" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
    `;

    if (tone === 'side-left') {
      return `
        <ellipse cx="106" cy="248" rx="35" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="104" cy="68" rx="20" ry="10" fill="#1a1a1f" opacity="0.38" />
        <path d="M101 66c-11 2-18 11-18 22 0 13 8 22 20 22 7 0 13-2 17-8-7-1-11-5-11-12 0-9 5-17 13-19-4-4-12-7-21-5z" fill="#efc8b0" />
        <path d="M96 106c8-2 19 2 26 10l6 18c4 14-6 29-22 31l-6 1c-12 1-21-8-21-20 0-20 4-33 17-40z" fill="#17171b" />
        <path d="M98 111c7-2 16 2 21 8l4 15c3 10-4 21-16 23l-6 1c-9 1-15-6-15-15 0-15 3-25 12-32z" fill="#7c3aed" />
        <path d="M121 119c7 7 11 19 8 32l-3 17h-10l-1-20c0-11-2-18-8-24z" fill="#efc8b0" />
        <path d="M94 121c-4 12-5 26 0 42l4 10H88c-5-9-8-23-6-35 1-8 4-15 12-17z" fill="#efc8b0" />
        <path d="M100 166h11l2 36c1 15-5 29-16 35l-4 2 1-33z" fill="#efc8b0" />
        <path d="M112 166h8l1 37c1 14 4 27 12 34l-9 2c-9-7-14-20-14-34z" fill="#efc8b0" />
        <rect x="91" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="121" y="234" width="13" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    if (tone === 'side-right') {
      return `
        <ellipse cx="114" cy="248" rx="35" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="116" cy="68" rx="20" ry="10" fill="#1a1a1f" opacity="0.38" />
        <path d="M119 66c11 2 18 11 18 22 0 13-8 22-20 22-7 0-13-2-17-8 7-1 11-5 11-12 0-9-5-17-13-19 4-4 12-7 21-5z" fill="#efc8b0" />
        <path d="M124 106c-8-2-19 2-26 10l-6 18c-4 14 6 29 22 31l6 1c12 1 21-8 21-20 0-20-4-33-17-40z" fill="#17171b" />
        <path d="M122 111c-7-2-16 2-21 8l-4 15c-3 10 4 21 16 23l6 1c9 1 15-6 15-15 0-15-3-25-12-32z" fill="#7c3aed" />
        <path d="M99 119c-7 7-11 19-8 32l3 17h10l1-20c0-11 2-18 8-24z" fill="#efc8b0" />
        <path d="M126 121c4 12 5 26 0 42l-4 10h10c5-9 8-23 6-35-1-8-4-15-12-17z" fill="#efc8b0" />
        <path d="M120 166h-11l-2 36c-1 15 5 29 16 35l4 2-1-33z" fill="#efc8b0" />
        <path d="M108 166h-8l-1 37c-1 14-4 27-12 34l9 2c9-7 14-20 14-34z" fill="#efc8b0" />
        <rect x="115" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="86" y="234" width="13" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    if (tone === 'back') {
      return `
        <ellipse cx="110" cy="248" rx="40" ry="10" fill="rgba(17,17,20,0.18)" />
        <ellipse cx="110" cy="68" rx="22" ry="10" fill="#1a1a1f" opacity="0.38" />
        <circle cx="110" cy="88" r="22" fill="#d8b49e" />
        <path d="M88 112c5-10 19-16 22-16s17 6 22 16l4 20c3 14-7 28-22 28h-8c-15 0-25-14-22-28z" fill="#17171b" />
        <path d="M93 116c6-7 14-12 17-12s11 5 17 12l3 19c2 10-5 19-16 19h-8c-11 0-18-9-16-19z" fill="#6f38eb" />
        <rect x="80" y="118" width="12" height="56" rx="6" fill="#d8b49e" />
        <rect x="128" y="118" width="12" height="56" rx="6" fill="#d8b49e" />
        <path d="M96 160h11l4 43c1 12-6 28-17 33l-6 2 2-34z" fill="#d8b49e" />
        <path d="M124 160h-11l-4 43c-1 12 6 28 17 33l6 2-2-34z" fill="#d8b49e" />
        <rect x="89" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
        <rect x="118" y="233" width="14" height="6" rx="3" fill="#0a0a0a" />
      `;
    }

    return base;
  }

  function getProgressPhotoSrc(label, tone, uploadedSrc) {
    if (uploadedSrc) {
      return uploadedSrc;
    }

    const scene = getProgressPhotoScene(tone);
    const safeLabel = escapeHtml(label);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 300" role="img" aria-label="${safeLabel}">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f7f4ff" />
            <stop offset="100%" stop-color="#ece7ff" />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#111114" />
            <stop offset="100%" stop-color="#1f1f25" />
          </linearGradient>
        </defs>
        <rect width="220" height="300" rx="24" fill="url(#wall)" />
        <rect y="228" width="220" height="72" fill="url(#floor)" />
        <rect x="22" y="24" width="176" height="242" rx="18" fill="rgba(255,255,255,0.44)" stroke="rgba(111,44,255,0.18)" />
        ${scene}
        <rect x="18" y="18" width="52" height="18" rx="9" fill="rgba(17,17,20,0.08)" />
        <text x="28" y="31" fill="#111114" font-size="11" font-family="Arial, sans-serif" font-weight="700">${safeLabel}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  window.SauloDemoStore = {
    DAY_ORDER,
    DAY_LABELS,
    createEmptyWeek,
    escapeHtml,
    formatDateIso,
    formatMessageDate,
    getClientById,
    getClientRoutineAssignment,
    getDayLabel,
    getExerciseThumbnailSrc,
    getProgressPhotoSrc,
    getRoutineTemplateById,
    getState,
    getTrainerMessageBuckets,
    recordWorkoutReport,
    resolveClientId,
    resolveDayKey,
    resetStore,
    saveRoutineTemplate,
    sendClientMessage,
    sendTrainerMessage,
    subscribe,
    updateClientPendingPhoto,
    updateClientProfile,
    assignRoutineToClient,
  };
})();
