(function () {
  function createInitialStudentProfile() {
    return {
      name: 'Lucía Ortega',
      plan: 'Definición',
      age: '31 años',
      weight: '63,4 kg',
      goal: 'Bajar grasa y mantener fuerza',
    };
  }

  function createBatteryByDay() {
    return {
      1: { level: 84, label: 'Alta', note: 'Solo tú marcas tus límites.' },
      2: {
        level: 42,
        label: 'Media',
        note: 'Recupera para volver más fuerte.',
      },
      3: { level: 88, label: 'Alta', note: 'Hoy vas un paso más allá.' },
      4: { level: 36, label: 'Media', note: 'Sigue sumando con calma.' },
      5: { level: 92, label: 'Muy alta', note: 'Hoy toca apretar de verdad.' },
      6: { level: 32, label: 'Media', note: 'Mueve el cuerpo y respira.' },
      7: { level: 24, label: 'Baja', note: 'Descansa y vuelve con hambre.' },
    };
  }

  function createInitialRoutinesByDay() {
    return {
      1: {
        label: 'Día 1',
        title: 'Pierna + glúteo',
        meta: 'Activa · Ganancia muscular',
        exercises: [
          {
            name: 'Hip thrust',
            video: 'Ver vídeo',
            videoUrl: 'https://www.youtube.com/shorts/rVMsqygXtG4',
            reps: '4 x 10',
            load: '75%',
            rest: '90 s',
          },
          {
            name: 'Sentadilla búlgara',
            video: 'Sin vídeo',
            reps: '3 x 12',
            load: '14 kg',
            rest: '75 s',
          },
          {
            name: 'Peso muerto rumano',
            video: 'Sin vídeo',
            reps: '4 x 8',
            load: '70%',
            rest: '90 s',
          },
        ],
      },
      2: {
        label: 'Día 2',
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Caminata rápida',
            video: 'Sin vídeo',
            reps: '25 min',
            load: 'Z2',
            rest: 'Continuo',
          },
          {
            name: 'Movilidad de cadera',
            video: 'Sin vídeo',
            reps: '8 min',
            load: 'Suave',
            rest: 'Continuo',
          },
        ],
      },
      3: {
        label: 'Día 3',
        title: 'Espalda + bíceps',
        meta: 'Activa · Ganancia muscular',
        exercises: [
          {
            name: 'Jalón al pecho',
            video: 'Sin vídeo',
            reps: '4 x 10',
            load: '68%',
            rest: '90 s',
          },
          {
            name: 'Remo con mancuerna',
            video: 'Sin vídeo',
            reps: '3 x 12',
            load: '22 kg',
            rest: '75 s',
          },
          {
            name: 'Curl inclinado',
            video: 'Sin vídeo',
            reps: '3 x 15',
            load: '10 kg',
            rest: '60 s',
          },
        ],
      },
      4: {
        label: 'Día 4',
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Bicicleta ligera',
            video: 'Sin vídeo',
            reps: '20 min',
            load: 'Suave',
            rest: 'Continuo',
          },
          {
            name: 'Movilidad torácica',
            video: 'Sin vídeo',
            reps: '6 min',
            load: 'Suave',
            rest: 'Continuo',
          },
        ],
      },
      5: {
        label: 'Día 5',
        title: 'Push + core',
        meta: 'Activa · Ganancia muscular',
        exercises: [
          {
            name: 'Press inclinado',
            video: 'Sin vídeo',
            reps: '4 x 8',
            load: '72%',
            rest: '120 s',
          },
          {
            name: 'Press militar',
            video: 'Sin vídeo',
            reps: '3 x 10',
            load: '24 kg',
            rest: '90 s',
          },
        ],
      },
      6: {
        label: 'Día 6',
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Paseo suave',
            video: 'Sin vídeo',
            reps: '30 min',
            load: 'Muy suave',
            rest: 'Continuo',
          },
          {
            name: 'Movilidad de hombro',
            video: 'Sin vídeo',
            reps: '8 min',
            load: 'Suave',
            rest: 'Continuo',
          },
        ],
      },
      7: {
        label: 'Día 7',
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Cardio suave',
            video: 'Sin vídeo',
            reps: '20 min',
            load: 'Suave',
            rest: 'Continuo',
          },
          {
            name: 'Respiración',
            video: 'Sin vídeo',
            reps: '5 min',
            load: 'Control',
            rest: 'Continuo',
          },
        ],
      },
    };
  }

  function createInitialMessages() {
    return {
      inbox: [
        {
          title: 'Coach Saulo',
          tag: 'Recibido',
          date: 'Hoy · 08:45',
          source: 'Email',
          body: 'Esta semana treinaste muito duro. Lembra-te de descansar e hidratar-te bem nos dias de descanso activo.',
        },
        {
          title: 'Coach Saulo',
          tag: 'Recibido',
          date: 'Ayer · 19:10',
          source: 'Email',
          body: 'Esta semana vamos procurar mais controlo técnico. Mantém o foco, dorme bem e aproveita os dias leves para recuperar sem perder ritmo.',
        },
      ],
      sent: [
        {
          title: 'Consulta nutrición',
          tag: 'Enviado',
          date: 'Ayer · 20:15',
          source: 'Email',
          body: 'Pregunté si mover carbohidratos al pre-entreno.',
        },
      ],
      reminders: [
        {
          title: 'Check-in semanal',
          tag: 'Recordatorio',
          date: 'Martes · 09:00',
          source: 'App',
          body: 'Sube peso, sensaciones y 4 fotos de progreso.',
        },
        {
          title: 'Renovación próxima',
          tag: 'Recordatorio',
          date: 'Viernes · 18:00',
          source: 'App',
          body: 'Tu plan actual finaliza el 30 de junio de 2026.',
        },
      ],
    };
  }

  function createInitialState() {
    return {
      section: 'routines',
      day: 1,
      report: null,
      accessToken: null,
      appError: null,
      isLoading: true,
      contextKey: 'day-1',
      exerciseChecks: {},
      profileUploads: {},
      photos: null,
      subscription: null,
      messages: createInitialMessages(),
    };
  }

  function normalizeRoutineDay(day) {
    return {
      day: Number(day.day || 1),
      label: day.label || `Día ${day.day || 1}`,
      title: day.title || 'Rutina',
      meta: day.meta || 'Plan activo',
      exercises: Array.isArray(day.exercises) ? day.exercises : [],
    };
  }

  function applyRoutineData(routinesByDay, routineData) {
    if (!routineData?.currentDay) {
      return routinesByDay;
    }

    const currentDay = normalizeRoutineDay(routineData.currentDay);
    return {
      ...routinesByDay,
      [currentDay.day]: currentDay,
    };
  }

  function applyProductData({
    studentProfile,
    state,
    routinesByDay,
    data,
    getAccessToken,
  }) {
    const nextState = {
      ...state,
      accessToken: data.accessToken || getAccessToken(),
      subscription: data.subscription,
      photos: data.photos,
      messages: data.messages || state.messages,
    };

    return {
      studentProfile: {
        ...studentProfile,
        ...data.student,
      },
      routinesByDay: applyRoutineData(routinesByDay, data.routine),
      state: nextState,
    };
  }

  async function loadProductData(day) {
    return window.SauloApi.loadStudent(day);
  }

  window.SauloState = {
    applyProductData,
    applyRoutineData,
    createBatteryByDay,
    createInitialRoutinesByDay,
    createInitialState,
    createInitialStudentProfile,
    loadProductData,
  };
})();
