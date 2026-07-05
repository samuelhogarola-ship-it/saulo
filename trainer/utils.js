(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'pendiente';
    }
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatLatestReport(report) {
    if (!report) {
      return 'Todavía no hay informes de entrenamiento enviados.';
    }

    const dayLabel = report.day ? `Día ${report.day}` : 'Entrenamiento';
    const feedback = report.feedback ? ` · ${report.feedback}` : '';
    const createdAt = report.createdAt
      ? ` · ${formatDate(report.createdAt)}`
      : '';
    return `${dayLabel}${feedback}${createdAt}`;
  }

  function formatPhotoSummary(summary) {
    if (!summary) {
      return 'Sin fotos de progreso registradas todavía.';
    }

    const parts = [
      `Pendientes: ${summary.pendingCount || 0}`,
      `Histórico: ${summary.historyCount || 0}`,
    ];

    if (summary.nextDueDate) {
      parts.push(`Próximo registro: ${formatDate(summary.nextDueDate)}`);
    }

    return parts.join(' · ');
  }

  function formatReportHistory(history) {
    if (!Array.isArray(history) || !history.length) {
      return [
        {
          title: 'Sin histórico reciente',
          meta: 'Cuando el alumno finalice entrenamientos, aparecerán aquí.',
        },
      ];
    }

    return history.map((report) => ({
      title: `Día ${report.day || '—'} · ${report.feedback || 'Sin feedback'}`,
      meta: report.createdAt
        ? `Enviado el ${formatDate(report.createdAt)}`
        : 'Sin fecha registrada',
    }));
  }

  function formatPhotoDetail(detail) {
    const items = [];

    if (detail?.pendingSlots?.length) {
      items.push({
        title: 'Pendientes de revisión',
        meta: detail.pendingSlots.join(', '),
      });
    }

    if (Array.isArray(detail?.historyItems) && detail.historyItems.length) {
      detail.historyItems.forEach((item) => {
        items.push({
          title: item.label || 'Registro',
          meta: item.meta || 'Seguimiento disponible',
        });
      });
    }

    return items.length
      ? items
      : [
          {
            title: 'Sin detalle todavía',
            meta: 'Cuando el alumno suba fotos aparecerán aquí.',
          },
        ];
  }

  function formatMessageSummary(summary) {
    if (!summary) {
      return 'Sin actividad de mensajes todavía.';
    }

    const parts = [
      `Recibidos: ${summary.inboxCount || 0}`,
      `Enviados: ${summary.sentCount || 0}`,
      `Recordatorios: ${summary.remindersCount || 0}`,
    ];

    if (summary.latestTitle) {
      parts.push(`Último: ${summary.latestTitle}`);
    }

    return parts.join(' · ');
  }

  function formatMessageDetail(detail) {
    if (!Array.isArray(detail) || !detail.length) {
      return [
        {
          title: 'Sin conversación reciente',
          meta: 'Cuando haya intercambio de mensajes aparecerá aquí.',
        },
      ];
    }

    return detail;
  }

  function formatContact(student) {
    const parts = [student.contactEmail, student.contactPhone].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Pendiente de registrar';
  }

  function formatDelivery(student) {
    if (!student.deliveryStatus) {
      return 'Pendiente de activar';
    }

    const statusLabels = {
      pending: 'Pendiente de envío',
      ready: 'Listo para compartir',
      'ready-to-share': 'Listo para compartir',
      shared: 'Compartido manualmente',
      sent: 'Enviado automáticamente',
      delivered: 'Enviado automáticamente',
      opened: 'Acceso abierto',
      failed: 'Fallo de envío',
      'missing-contact': 'Falta contacto',
    };

    const parts = [
      statusLabels[student.deliveryStatus] || student.deliveryStatus,
    ];

    if (student.deliveryChannel) {
      parts.push(student.deliveryChannel);
    }

    if (student.deliverySentAt) {
      parts.push(formatDate(student.deliverySentAt));
    }

    if (student.deliveryError) {
      parts.push(student.deliveryError);
    }

    return parts.join(' · ');
  }

  function formatDeliverySummary(student) {
    if (student.waitingRoomConsumedAt) {
      return `Último estado: acceso abierto · ${formatDate(student.waitingRoomConsumedAt)}`;
    }

    if (
      !Array.isArray(student.deliveryHistory) ||
      !student.deliveryHistory.length
    ) {
      return 'Sin entregas registradas todavía.';
    }

    return `Último estado: ${formatDelivery(student)}`;
  }

  function formatDeliveryHistory(history) {
    if (!Array.isArray(history) || !history.length) {
      return [
        {
          title: 'Sin historial todavía',
          meta: 'Cuando se comparta o envíe el acceso aparecerá aquí.',
        },
      ];
    }

    return history;
  }

  function renderInsightList(container, items) {
    if (!container) {
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
          <article class="insight-item">
            <strong>${escapeHtml(item.title || '')}</strong>
            <span>${escapeHtml(item.meta || '')}</span>
          </article>
        `,
      )
      .join('');
  }

  function readStudentSummary(card) {
    return {
      name: String(card?.dataset.studentName || '').trim(),
      contactEmail: String(card?.dataset.studentContactEmail || '').trim(),
      contactPhone: String(card?.dataset.studentContactPhone || '').trim(),
    };
  }

  function buildMagicLinkMessage(student, waitingRoomLink) {
    return [
      `Hola ${student.name || 'cliente'}, tu acceso a Saulo Fitness APP ya está listo.`,
      `Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: ${waitingRoomLink}`,
      'Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.',
    ].join(' ');
  }

  function buildEmailLink(student, waitingRoomLink) {
    const email = String(student.contactEmail || '').trim();
    if (!email || !waitingRoomLink) {
      return '';
    }

    const subject = 'Saulo Fitness APP · Tu acceso está listo';
    const body = buildMagicLinkMessage(student, waitingRoomLink);
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function buildWhatsAppLink(student, waitingRoomLink) {
    const phone = String(student.contactPhone || '').trim();
    if (!phone || !waitingRoomLink) {
      return '';
    }

    const body = buildMagicLinkMessage(student, waitingRoomLink);
    return `https://wa.me/${String(phone).replace(/[^\d]/g, '')}?text=${encodeURIComponent(body)}`;
  }

  function compareNames(left, right) {
    return String(left?.name || '').localeCompare(
      String(right?.name || ''),
      'es',
    );
  }

  function matchesStudentStatus(student, status) {
    if (status === 'all') {
      return true;
    }

    if (status === 'active') {
      return !student.accessRevokedAt;
    }

    if (status === 'revoked') {
      return Boolean(student.accessRevokedAt);
    }

    if (status === 'paid') {
      return Boolean(student.paymentReceivedAt);
    }

    if (status === 'pending') {
      return !student.paymentReceivedAt;
    }

    if (status === 'ready') {
      return getOperationalState(student) === 'ready';
    }

    if (status === 'opened') {
      return getOperationalState(student) === 'opened';
    }

    if (status === 'sent') {
      return getOperationalState(student) === 'sent';
    }

    if (status === 'attention') {
      return ['attention', 'revoked'].includes(getOperationalState(student));
    }

    return true;
  }

  function getOperationalState(student) {
    if (student.accessRevokedAt) {
      return 'revoked';
    }

    if (!student.paymentReceivedAt) {
      return 'pending-payment';
    }

    if (student.deliveryStatus === 'failed') {
      return 'attention';
    }

    if (student.deliveryStatus === 'missing-contact') {
      return 'attention';
    }

    if (student.waitingRoomConsumedAt) {
      return 'opened';
    }

    if (['ready', 'pending'].includes(student.deliveryStatus)) {
      return 'ready';
    }

    if (['shared', 'sent'].includes(student.deliveryStatus)) {
      return student.waitingRoomConsumedAt ? 'opened' : 'sent';
    }

    return 'attention';
  }

  function getOperationalPriority(student) {
    const priorities = {
      'pending-payment': 0,
      ready: 1,
      attention: 2,
      sent: 3,
      opened: 4,
      revoked: 5,
    };

    return priorities[getOperationalState(student)] ?? 99;
  }

  function formatOperationalState(student) {
    const labels = {
      'pending-payment': 'Pago pendiente',
      ready: 'Listo para enviar',
      sent: 'Ya enviado',
      opened: 'Acceso abierto',
      attention: 'Revisar entrega',
      revoked: 'Acceso revocado',
    };

    return labels[getOperationalState(student)] || 'Revisar entrega';
  }

  function formatNextAction(student) {
    const state = getOperationalState(student);
    const nextActions = {
      'pending-payment': 'Confirmar pago para generar el acceso',
      ready: 'Compartir el magic link único con el alumno',
      sent: 'Esperar a que el alumno abra la sala de espera',
      opened: 'Comprobar instalación y uso de la app',
      attention: 'Revisar contacto o reintentar entrega',
      revoked: 'Rotar o reactivar acceso si procede',
    };

    return nextActions[state] || 'Revisar caso';
  }

  function isSupportedVideoUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      return (
        url.hostname.includes('youtube.com') ||
        url.hostname.includes('youtu.be')
      );
    } catch (_error) {
      return false;
    }
  }

  function parseExerciseLinesDetailed(rawValue) {
    const errors = [];

    const exercises = String(rawValue || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, reps, load, rest, videoUrl] = line
          .split('|')
          .map((part) => part.trim());

        if (!name || !reps || !load || !rest) {
          errors.push(
            `la línea ${index + 1} debe usar "Nombre | reps | carga | descanso | video opcional"`,
          );
          return null;
        }

        if (videoUrl && !isSupportedVideoUrl(videoUrl)) {
          errors.push(
            `la línea ${index + 1} tiene un vídeo no compatible; usa YouTube o youtu.be`,
          );
          return null;
        }

        return {
          name,
          reps,
          load,
          rest,
          ...(videoUrl ? { videoUrl } : {}),
        };
      })
      .filter(Boolean);

    return { exercises, errors };
  }

  function parseExerciseLines(rawValue) {
    return parseExerciseLinesDetailed(rawValue).exercises;
  }

  function serializeExercisesForEditor(exercises) {
    return exercises
      .map((exercise) =>
        [
          exercise.name || '',
          exercise.reps || '',
          exercise.load || '',
          exercise.rest || '',
          exercise.videoUrl || exercise.video_url || '',
        ]
          .filter((value, index) => index < 4 || value)
          .join(' | '),
      )
      .join('\n');
  }

  function createFallbackDay(dayNumber) {
    const isRecovery = ![1, 3, 5].includes(dayNumber);

    if (isRecovery) {
      return {
        day: dayNumber,
        title: 'Descanso activo',
        meta: 'Recuperación · Cardio ligero',
        exercises: [
          {
            name: 'Cardio suave',
            reps: '20 min',
            load: 'Suave',
            rest: 'Continuo',
          },
        ],
      };
    }

    return {
      day: dayNumber,
      title: `Día ${dayNumber} · Fuerza`,
      meta: 'Activa · Ganancia muscular',
      exercises: [
        {
          name: 'Ejercicio base',
          reps: '4 x 10',
          load: '75%',
          rest: '90 s',
        },
      ],
    };
  }

  window.SauloTrainerUtils = {
    buildEmailLink,
    buildMagicLinkMessage,
    buildWhatsAppLink,
    compareNames,
    createFallbackDay,
    escapeHtml,
    formatContact,
    formatDate,
    formatDelivery,
    formatDeliveryHistory,
    formatDeliverySummary,
    formatLatestReport,
    formatMessageDetail,
    formatMessageSummary,
    formatNextAction,
    formatOperationalState,
    formatPhotoDetail,
    formatPhotoSummary,
    formatReportHistory,
    getOperationalPriority,
    getOperationalState,
    isSupportedVideoUrl,
    matchesStudentStatus,
    parseExerciseLines,
    parseExerciseLinesDetailed,
    readStudentSummary,
    renderInsightList,
    serializeExercisesForEditor,
  };
})();
