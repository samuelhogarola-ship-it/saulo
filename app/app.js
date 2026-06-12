const appData = {
  coach: {
    title: 'Panel general',
    heroTitle: 'Centro de operaciones del entrenador',
    heroCopy:
      'Control diario del negocio: alumnos activos, renovaciones, seguimiento y respuestas pendientes.',
    heroHighlightValue: 'Conectar autenticacion y panel coach',
    heroHighlightMeta: 'Base lista para Supabase Auth y roles',
    syncStatus: 'Datos mock listos para conectar',
    infrastructureTarget: '100-150 alumnos activos',
    infrastructureCopy:
      'Banco de videos, historico anual y mensajeria basica ya previstos.',
    studentPanelTitle: 'Vista de alumnos',
    studentPanelPill: 'Coach view',
    metrics: [
      {
        label: 'Alumnos activos',
        value: '84',
        detail: '12 onboarding esta semana',
      },
      {
        label: 'Rutinas por revisar',
        value: '19',
        detail: '7 necesitan ajuste hoy',
      },
      {
        label: 'Mensajes pendientes',
        value: '26',
        detail: 'Prioridad alta: 4',
      },
      {
        label: 'Renovaciones cercanas',
        value: '11',
        detail: '3 vencen en 48h',
      },
    ],
    students: [
      {
        id: 'lucia',
        name: 'Lucia Ortega',
        plan: 'Definicion avanzada',
        attendance: '5/5 sesiones',
        status: { tone: 'is-good', text: 'En ritmo' },
        objective: 'Bajar al 18% de grasa sin perder fuerza',
        phase: 'Semana 6 de 10',
        communication: 'WhatsApp prioritario',
        checkin: 'Fotos entregadas ayer',
        latestNote: 'Responder sobre ajuste de cardio post entreno.',
        today: 'Actualizar macros y responder dudas del viernes.',
      },
      {
        id: 'alvaro',
        name: 'Alvaro Ruiz',
        plan: 'Volumen limpio',
        attendance: '4/5 sesiones',
        status: { tone: 'is-warn', text: 'Seguimiento' },
        objective: 'Ganar 3 kg manteniendo cintura estable',
        phase: 'Semana 3 de 8',
        communication: 'Chat interno',
        checkin: 'Video tecnico pendiente',
        latestNote: 'Necesita feedback sobre sentadilla frontal.',
        today: 'Pedir video y reagendar check-in del lunes.',
      },
      {
        id: 'marta',
        name: 'Marta Perez',
        plan: 'Recomposicion',
        attendance: '2/5 sesiones',
        status: { tone: 'is-alert', text: 'Riesgo de baja' },
        objective: 'Recuperar constancia tras viaje de trabajo',
        phase: 'Semana 2 de relanzamiento',
        communication: 'Llamada + WhatsApp',
        checkin: 'Sin completar esta semana',
        latestNote: 'Enviar mensaje proactivo antes de renovacion.',
        today: 'Preparar toque personal y version ligera de rutina.',
      },
    ],
    plans: [
      {
        title: 'Pierna fuerza',
        meta: 'Lunes • 7 ejercicios • Lucia / Alvaro',
        state: 'Actualizar video de hip thrust',
      },
      {
        title: 'Torso hipertrofia',
        meta: 'Martes • 8 ejercicios • 14 alumnos',
        state: 'Biblioteca completa',
      },
      {
        title: 'Full body express',
        meta: 'Viernes • 5 ejercicios • Marta',
        state: 'Version adherencia baja fatiga',
      },
    ],
    checkins: [
      {
        title: 'Lucia envio progreso',
        meta: 'Hace 4h • fotos + peso + energia',
        state: 'Revisar antes de las 18:00',
      },
      {
        title: 'Alvaro debe grabar tecnica',
        meta: 'Pendiente • sentadilla frontal',
        state: 'Enviar recordatorio',
      },
      {
        title: 'Marta sin check-in',
        meta: '2 dias tarde',
        state: 'Activar protocolo retencion',
      },
    ],
    messages: [
      {
        title: 'Lucia Ortega',
        meta: 'Pregunta sobre macros pre-entreno',
        preview: 'Quiere saber si mover carbohidratos a la comida 2.',
      },
      {
        title: 'Alvaro Ruiz',
        meta: 'No encuentra video de referencia',
        preview: 'Necesita enlace rapido a la sentadilla frontal.',
      },
      {
        title: 'Marta Perez',
        meta: 'Pide semana mas flexible',
        preview: 'Solicita adaptar la rutina al viaje de trabajo.',
      },
    ],
    billing: [
      {
        title: 'Plan Premium mensual',
        meta: '3 renovaciones en 48h',
        status: 'Cobro automatico listo',
      },
      {
        title: 'Plan seguimiento basico',
        meta: '5 renovaciones esta semana',
        status: '2 requieren confirmacion manual',
      },
      {
        title: 'Onboarding nuevo',
        meta: '4 pagos iniciales pendientes',
        status: 'Preparar enlace externo',
      },
    ],
  },
  student: {
    title: 'Mi area personal',
    heroTitle: 'Todo lo que el alumno necesita sin friccion',
    heroCopy:
      'Rutina activa, progreso, mensajeria y seguimiento en una sola vista clara.',
    heroHighlightValue: 'Acceso por PIN o magic link',
    heroHighlightMeta: 'Entrada rapida sin soporte por password',
    syncStatus: 'Vista alumno preparada para login real',
    infrastructureTarget: 'Experiencia de uso diaria',
    infrastructureCopy:
      'Entrar, entrenar, reportar progreso y contactar con el coach desde el mismo flujo.',
    studentPanelTitle: 'Mi perfil y progreso',
    studentPanelPill: 'Alumno view',
    metrics: [
      {
        label: 'Entrenos esta semana',
        value: '4/5',
        detail: '1 sesion pendiente hoy',
      },
      {
        label: 'Check-in siguiente',
        value: '24h',
        detail: 'Mañana a las 09:00',
      },
      {
        label: 'Mensajes sin leer',
        value: '2',
        detail: 'Coach respondio esta mañana',
      },
      {
        label: 'Proxima renovacion',
        value: '7 dias',
        detail: 'Plan premium mensual',
      },
    ],
    students: [
      {
        id: 'self',
        name: 'Tu perfil',
        plan: 'Definicion avanzada',
        attendance: '4/5 sesiones',
        status: { tone: 'is-good', text: 'Buen ritmo' },
        objective: 'Perder grasa manteniendo fuerza',
        phase: 'Semana 6 de 10',
        communication: 'Boton directo a WhatsApp',
        checkin: 'Mañana a las 09:00',
        latestNote: 'Tu coach revisara tus fotos y ajustes nutricionales.',
        today: 'Completar sesion pierna y registrar energia.',
      },
    ],
    plans: [
      {
        title: 'Hoy: Pierna fuerza',
        meta: '7 ejercicios • 65 minutos',
        state: 'Incluye video y tiempos de descanso',
      },
      {
        title: 'Mañana: Cardio suave + movilidad',
        meta: '25 minutos',
        state: 'Objetivo de recuperacion',
      },
      {
        title: 'Viernes: Torso hipertrofia',
        meta: '8 ejercicios • 70 minutos',
        state: 'Carga guiada por RIR',
      },
    ],
    checkins: [
      {
        title: 'Fotos de progreso',
        meta: 'Pendiente mañana',
        state: 'Sube 4 fotos desde la app',
      },
      {
        title: 'Peso y sensaciones',
        meta: 'Registro semanal',
        state: '2 minutos para completar',
      },
      {
        title: 'Video tecnico opcional',
        meta: 'Sentadilla frontal',
        state: 'Puedes enviarlo por WhatsApp',
      },
    ],
    messages: [
      {
        title: 'Coach Saulo',
        meta: 'Respuesta nueva',
        preview:
          'Mantén los carbohidratos pre-entreno y recorta la cena ligera.',
      },
      {
        title: 'Recordatorio automatico',
        meta: 'Check-in mañana',
        preview: 'No olvides subir fotos, peso y energía general.',
      },
    ],
    billing: [
      {
        title: 'Tu plan actual',
        meta: 'Premium mensual',
        status: 'Renovacion prevista en 7 dias',
      },
      {
        title: 'Metodo de pago',
        meta: 'Enlace externo activo',
        status: 'Cambio a suscripcion automatica disponible',
      },
    ],
  },
};

const state = {
  role: 'coach',
  section: 'overview',
  selectedStudentId: appData.coach.students[0].id,
};

const workspaceTitle = document.querySelector('#workspace-title');
const heroTitle = document.querySelector('#hero-title');
const heroCopy = document.querySelector('#hero-copy');
const heroHighlightValue = document.querySelector('#hero-highlight-value');
const heroHighlightMeta = document.querySelector('#hero-highlight-meta');
const syncStatus = document.querySelector('#sync-status');
const infrastructureTarget = document.querySelector('#infrastructure-target');
const infrastructureCopy = document.querySelector('#infrastructure-copy');
const studentsPanelTitle = document.querySelector('#students-panel-title');
const studentsPanelPill = document.querySelector('#students-panel-pill');
const metricsGrid = document.querySelector('#metrics-grid');
const studentList = document.querySelector('#student-list');
const studentDetail = document.querySelector('#student-detail');
const plansList = document.querySelector('#plans-list');
const checkinsList = document.querySelector('#checkins-list');
const messagesList = document.querySelector('#messages-list');
const billingList = document.querySelector('#billing-list');
const roleButtons = [...document.querySelectorAll('.role-button')];
const navButtons = [...document.querySelectorAll('.nav-link')];

roleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextRole = button.dataset.role;

    if (!nextRole || nextRole === state.role) {
      return;
    }

    state.role = nextRole;
    state.section = 'overview';
    state.selectedStudentId = appData[nextRole].students[0].id;
    renderApp();
  });
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextSection = button.dataset.section;

    if (!nextSection) {
      return;
    }

    state.section = nextSection;
    updateNavigation();
    focusSection(nextSection);
  });
});

renderApp();

function renderApp() {
  const currentData = appData[state.role];
  const selectedStudent =
    currentData.students.find(
      (student) => student.id === state.selectedStudentId,
    ) || currentData.students[0];

  state.selectedStudentId = selectedStudent.id;

  workspaceTitle.textContent = currentData.title;
  heroTitle.textContent = currentData.heroTitle;
  heroCopy.textContent = currentData.heroCopy;
  heroHighlightValue.textContent = currentData.heroHighlightValue;
  heroHighlightMeta.textContent = currentData.heroHighlightMeta;
  syncStatus.textContent = currentData.syncStatus;
  infrastructureTarget.textContent = currentData.infrastructureTarget;
  infrastructureCopy.textContent = currentData.infrastructureCopy;
  studentsPanelTitle.textContent = currentData.studentPanelTitle;
  studentsPanelPill.textContent = currentData.studentPanelPill;

  renderMetrics(currentData.metrics);
  renderStudents(currentData.students, selectedStudent.id);
  renderStudentDetail(selectedStudent);
  renderCollection(plansList, currentData.plans, renderStackItem);
  renderCollection(checkinsList, currentData.checkins, renderTimelineItem);
  renderCollection(messagesList, currentData.messages, renderMessageItem);
  renderCollection(billingList, currentData.billing, renderBillingItem);
  updateRoleButtons();
  updateNavigation();
}

function renderMetrics(metrics) {
  metricsGrid.innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card">
          <span class="metric-label">${escapeHtml(metric.label)}</span>
          <strong class="metric-value">${escapeHtml(metric.value)}</strong>
          <p class="metric-detail">${escapeHtml(metric.detail)}</p>
        </article>
      `,
    )
    .join('');
}

function renderStudents(students, selectedStudentId) {
  studentList.innerHTML = students
    .map((student) => {
      const isActive = student.id === selectedStudentId;

      return `
        <button
          class="student-card ${isActive ? 'is-active' : ''}"
          data-student-id="${escapeHtml(student.id)}"
          role="option"
          aria-selected="${isActive ? 'true' : 'false'}"
        >
          <strong>${escapeHtml(student.name)}</strong>
          <p class="student-meta">${escapeHtml(student.plan)}</p>
          <p class="student-meta">${escapeHtml(student.attendance)}</p>
          <span class="status-pill ${escapeHtml(student.status.tone)}">${escapeHtml(student.status.text)}</span>
        </button>
      `;
    })
    .join('');

  [...studentList.querySelectorAll('[data-student-id]')].forEach((button) => {
    button.addEventListener('click', () => {
      const nextStudentId = button.dataset.studentId;

      if (!nextStudentId) {
        return;
      }

      state.selectedStudentId = nextStudentId;
      renderApp();
    });
  });
}

function renderStudentDetail(student) {
  studentDetail.innerHTML = `
    <article class="detail-card">
      <span class="status-pill ${escapeHtml(student.status.tone)}">${escapeHtml(student.status.text)}</span>
      <h3>${escapeHtml(student.name)}</h3>
      <p class="student-meta">${escapeHtml(student.latestNote)}</p>

      <div class="detail-grid">
        <div>
          <span>Objetivo</span>
          <strong>${escapeHtml(student.objective)}</strong>
        </div>
        <div>
          <span>Fase actual</span>
          <strong>${escapeHtml(student.phase)}</strong>
        </div>
        <div>
          <span>Comunicacion</span>
          <strong>${escapeHtml(student.communication)}</strong>
        </div>
      </div>

      <div class="detail-list">
        <div>
          <span>Check-in</span>
          <strong>${escapeHtml(student.checkin)}</strong>
        </div>
        <div>
          <span>Hoy toca</span>
          <strong>${escapeHtml(student.today)}</strong>
        </div>
      </div>
    </article>
  `;
}

function renderCollection(container, items, renderer) {
  container.innerHTML = items.map(renderer).join('');
}

function renderStackItem(item) {
  return `
    <article class="stack-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="item-meta">${escapeHtml(item.meta)}</p>
      <p class="item-meta">${escapeHtml(item.state)}</p>
    </article>
  `;
}

function renderTimelineItem(item) {
  return `
    <article class="timeline-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="item-meta">${escapeHtml(item.meta)}</p>
      <p class="item-meta">${escapeHtml(item.state)}</p>
    </article>
  `;
}

function renderMessageItem(item) {
  return `
    <article class="message-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="item-meta">${escapeHtml(item.meta)}</p>
      <p class="message-preview">${escapeHtml(item.preview)}</p>
    </article>
  `;
}

function renderBillingItem(item) {
  return `
    <article class="billing-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p class="billing-meta">${escapeHtml(item.meta)}</p>
      <p class="billing-meta">${escapeHtml(item.status)}</p>
    </article>
  `;
}

function updateRoleButtons() {
  roleButtons.forEach((button) => {
    const isActive = button.dataset.role === state.role;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function updateNavigation() {
  navButtons.forEach((button) => {
    const isActive = button.dataset.section === state.section;
    button.classList.toggle('is-active', isActive);
  });
}

function focusSection(sectionName) {
  const section = document.querySelector(`[data-panel="${sectionName}"]`);

  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
