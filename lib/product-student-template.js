const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ROUTINE_BLUEPRINT = [
  {
    day_number: 1,
    title: 'Pierna + glúteo',
    meta: 'Activa · Ganancia muscular',
    exercises: [
      {
        name: 'Hip thrust',
        reps: '4 x 10',
        load: '75%',
        rest: '90 s',
        video_url: 'https://www.youtube.com/watch?v=rVMsqygXtG4',
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
  {
    day_number: 2,
    title: 'Recuperación activa',
    meta: 'Cardio ligero · Movilidad',
    exercises: [
      {
        name: 'Caminata inclinada',
        reps: '25 min',
        load: 'Ritmo suave',
        rest: 'Sin descanso',
      },
    ],
  },
  {
    day_number: 3,
    title: 'Espalda + bíceps',
    meta: 'Activa · Técnica',
    exercises: [
      {
        name: 'Jalón al pecho',
        reps: '4 x 12',
        load: '65%',
        rest: '75 s',
      },
      {
        name: 'Remo con mancuerna',
        reps: '3 x 10',
        load: '22 kg',
        rest: '60 s',
      },
    ],
  },
  {
    day_number: 4,
    title: 'Recuperación activa',
    meta: 'Movilidad · Respiración',
    exercises: [
      {
        name: 'Bicicleta suave',
        reps: '20 min',
        load: 'Zona 2',
        rest: 'Sin descanso',
      },
    ],
  },
  {
    day_number: 5,
    title: 'Torso + core',
    meta: 'Activa · Fuerza base',
    exercises: [
      {
        name: 'Press banca con mancuernas',
        reps: '4 x 10',
        load: '18 kg',
        rest: '75 s',
      },
      {
        name: 'Press militar sentado',
        reps: '3 x 12',
        load: '12 kg',
        rest: '60 s',
      },
    ],
  },
  {
    day_number: 6,
    title: 'Recuperación activa',
    meta: 'Cardio ligero · Paso diario',
    exercises: [
      {
        name: 'Paseo largo',
        reps: '35 min',
        load: 'Ritmo cómodo',
        rest: 'Sin descanso',
      },
    ],
  },
  {
    day_number: 7,
    title: 'Descanso',
    meta: 'Descanso activo',
    exercises: [
      {
        name: 'Movilidad general',
        reps: '15 min',
        load: 'Sin carga',
        rest: 'Sin descanso',
      },
    ],
  },
];

const DEFAULT_REMINDERS = [
  {
    direction: 'reminder',
    title: 'Check-in semanal',
    tag: 'Recordatorio',
    source: 'App',
    body: 'Sube peso, sensaciones y 4 fotos de progreso.',
  },
  {
    direction: 'inbox',
    title: 'Coach Saulo',
    tag: 'Recibido',
    source: 'App',
    body: 'Esta semana has entrenado muy duro. Recuerda descansar e hidratarte bien en los días de recuperación activa.',
  },
];

const PHOTO_SLOTS = [
  ['left', 'Izquierda'],
  ['right', 'Derecha'],
  ['front', 'Frente'],
  ['back', 'Espalda'],
];

function loadStudentTemplate(projectRoot, templatePath) {
  const nextValue = String(templatePath || '').trim();

  if (!nextValue) {
    return {};
  }

  const absolutePath = path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No se encontró la plantilla de alumno: ${absolutePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `No se pudo leer la plantilla de alumno ${absolutePath}: ${error.message}`,
    );
  }
}

function normalizeRoutineBlueprint(input) {
  if (!Array.isArray(input) || !input.length) {
    return DEFAULT_ROUTINE_BLUEPRINT;
  }

  return input.map((day, index) => ({
    day_number: Number(day.day_number || day.day || index + 1),
    title: String(day.title || `Día ${index + 1}`).trim(),
    meta: String(day.meta || 'Plan activo').trim(),
    exercises: Array.isArray(day.exercises)
      ? day.exercises.map((exercise, exerciseIndex) => ({
          name: String(
            exercise.name || `Ejercicio ${exerciseIndex + 1}`,
          ).trim(),
          reps: String(exercise.reps || '').trim(),
          load: String(exercise.load || '').trim(),
          rest: String(exercise.rest || '').trim(),
          video_url: String(
            exercise.video_url || exercise.videoUrl || '',
          ).trim(),
        }))
      : [],
  }));
}

function normalizeMessagesTemplate(input) {
  if (!Array.isArray(input) || !input.length) {
    return DEFAULT_REMINDERS;
  }

  return input.map((message) => ({
    direction: String(message.direction || 'inbox').trim(),
    title: String(message.title || 'Coach Saulo').trim(),
    tag: String(message.tag || 'Recibido').trim(),
    source: String(message.source || 'App').trim(),
    body: String(message.body || '').trim(),
  }));
}

function normalizePhotoSlots(input) {
  if (!Array.isArray(input) || !input.length) {
    return PHOTO_SLOTS;
  }

  return input.map((entry, index) => {
    if (Array.isArray(entry)) {
      return [
        String(entry[0] || `slot-${index + 1}`).trim(),
        String(entry[1] || `Foto ${index + 1}`).trim(),
      ];
    }

    return [
      String(entry.slot || `slot-${index + 1}`).trim(),
      String(entry.label || `Foto ${index + 1}`).trim(),
    ];
  });
}

function validateStudentTemplate(template) {
  const errors = [];
  const warnings = [];
  const current = template && typeof template === 'object' ? template : {};

  if (!String(current.name || '').trim()) {
    errors.push('Falta `name`.');
  }

  const contactEmail = String(
    current.contactEmail || current.contact_email || '',
  ).trim();
  if (!contactEmail) {
    errors.push('Falta `contactEmail`.');
  }

  const routineBlueprint = normalizeRoutineBlueprint(
    current.routineBlueprint || current.routine_blueprint,
  );
  const days = routineBlueprint.map((day) => day.day_number);
  const invalidDays = days.filter(
    (day) => !Number.isInteger(day) || day < 1 || day > 7,
  );
  if (invalidDays.length) {
    errors.push(`Hay días fuera de rango 1-7: ${invalidDays.join(', ')}.`);
  }

  const uniqueDays = new Set(days);
  if (uniqueDays.size !== days.length) {
    errors.push('La rutina contiene días duplicados.');
  }

  routineBlueprint.forEach((day) => {
    if (!day.exercises.length) {
      warnings.push(`El ${day.title} no tiene ejercicios.`);
    }

    day.exercises.forEach((exercise, index) => {
      if (!exercise.name) {
        errors.push(
          `El ejercicio ${index + 1} del día ${day.day_number} no tiene nombre.`,
        );
      }
    });
  });

  const messages = normalizeMessagesTemplate(
    current.initialMessages || current.initial_messages,
  );
  messages.forEach((message, index) => {
    if (!['inbox', 'sent', 'reminder'].includes(message.direction)) {
      errors.push(
        `El mensaje ${index + 1} tiene una dirección no válida: ${message.direction}.`,
      );
    }
    if (!message.body) {
      errors.push(`El mensaje ${index + 1} no tiene body.`);
    }
  });

  const photoSlots = normalizePhotoSlots(
    current.photoSlots || current.photo_slots,
  );
  const slotNames = photoSlots.map(([slot]) => slot);
  if (new Set(slotNames).size !== slotNames.length) {
    errors.push('Los slots de fotos contienen duplicados.');
  }

  return {
    errors,
    warnings,
    routineDays: routineBlueprint.length,
    messageCount: messages.length,
    photoSlotCount: photoSlots.length,
  };
}

module.exports = {
  DEFAULT_REMINDERS,
  DEFAULT_ROUTINE_BLUEPRINT,
  PHOTO_SLOTS,
  loadStudentTemplate,
  normalizeMessagesTemplate,
  normalizePhotoSlots,
  normalizeRoutineBlueprint,
  validateStudentTemplate,
};
