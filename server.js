const express = require('express');
const os = require('node:os');
const path = require('node:path');

const { appName, delivery, runtime } = require('./lib/config');
const { createEventsStore } = require('./lib/events-store');
const {
  createMagicLinkWebhookPayload,
  sendMagicLinkWebhook,
} = require('./lib/magic-link-delivery');
const { createSauloStore } = require('./lib/saulo-store');
const {
  renderAdminEventsPage,
  renderEventDetailPage,
  renderEventsListPage,
} = require('./lib/site-pages');

const app = express();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';
const publicDir = __dirname;
const store = createSauloStore();
const eventsStore = createEventsStore();

app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  if (
    !runtime.publicAppSurfacesEnabled &&
    isProtectedSurfaceRequest(req.path)
  ) {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({
        ok: false,
        message: 'No disponible en esta publicación.',
      });
      return;
    }

    res.status(404).sendFile(path.join(publicDir, 'index.html'));
    return;
  }

  next();
});
app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/app', (_req, res) => {
  res.sendFile(path.join(publicDir, 'app', 'index.html'));
});

app.get('/trainer', (_req, res) => {
  res.sendFile(path.join(publicDir, 'trainer', 'index.html'));
});

app.get('/sala/:token', (_req, res) => {
  res.sendFile(path.join(publicDir, 'waiting-room', 'index.html'));
});

app.get('/acceso/:token', (req, res) => {
  const token = resolveWaitingRoomLinkToken(req.params.token);
  res.redirect(`/sala/${encodeURIComponent(token)}`);
});

app.get('/demo/:token', (req, res) => {
  const token = resolveWaitingRoomLinkToken(req.params.token);
  res.redirect(`/acceso/${encodeURIComponent(token)}`);
});

app.get(
  '/eventos',
  asyncHandler(async (_req, res) => {
    const lang = normalizePublicLanguage(_req.query.lang);
    const events = await listPublicEventsSafely();
    res.send(renderEventsListPage({ events, lang }));
  }),
);

app.get(
  '/eventos/:slug',
  asyncHandler(async (req, res) => {
    const lang = normalizePublicLanguage(req.query.lang);
    const event = await eventsStore.getPublicEventBySlug(req.params.slug);
    res.send(renderEventDetailPage({ event, lang }));
  }),
);

app.get('/admin/eventos', (_req, res) => {
  res.redirect(302, '/app/eventos');
});

app.get(
  '/api/public/events',
  asyncHandler(async (req, res) => {
    const limit =
      req.query.limit == null
        ? undefined
        : Number.parseInt(req.query.limit, 10);
    const events = await listPublicEventsSafely({
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    res.json({ events });
  }),
);

app.get(
  '/api/public/events/:slug',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.getPublicEventBySlug(req.params.slug);
    res.json({ event });
  }),
);

app.post(
  '/api/public/events/:slug/registrations',
  asyncHandler(async (req, res) => {
    const registration = await eventsStore.createPublicRegistration(
      req.params.slug,
      req.body || {},
    );
    res.status(201).json({
      ok: true,
      registration,
      message: 'Solicitud recibida. Te contactaremos para confirmar tu plaza.',
    });
  }),
);

app.get(
  '/api/admin/events',
  asyncHandler(async (req, res) => {
    const events = await eventsStore.listAdminEvents(getTrainerAuth(req));
    res.json({ events });
  }),
);

app.get(
  '/api/admin/events/:eventId',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.getAdminEvent(
      getTrainerAuth(req),
      req.params.eventId,
    );
    res.json({ event });
  }),
);

app.post(
  '/api/admin/events',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.createAdminEvent(
      getTrainerAuth(req),
      req.body || {},
    );
    res.status(201).json({ ok: true, event });
  }),
);

app.patch(
  '/api/admin/events/:eventId',
  asyncHandler(async (req, res) => {
    const event = await eventsStore.updateAdminEvent(
      getTrainerAuth(req),
      req.params.eventId,
      req.body || {},
    );
    res.json({ ok: true, event });
  }),
);

app.post(
  '/api/trainer/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!email || !password) {
      res.status(400).json({
        ok: false,
        message: 'Email y contraseña son obligatorios.',
      });
      return;
    }

    const session = await store.loginTrainer({ email, password });
    res.status(201).json({ ok: true, session });
  }),
);

app.post(
  '/api/trainer/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = String(req.body?.refreshToken || '').trim();

    if (!refreshToken) {
      res.status(400).json({
        ok: false,
        message: 'Refresh token no disponible.',
      });
      return;
    }

    const session = await store.refreshTrainerSession({ refreshToken });
    res.status(201).json({ ok: true, session });
  }),
);

app.get(
  '/api/student/session',
  asyncHandler(async (req, res) => {
    res.json(await store.getSession(getStudentAccessToken(req)));
  }),
);

app.get(
  '/api/student/profile',
  asyncHandler(async (req, res) => {
    res.json(await store.getProfile(getStudentAccessToken(req)));
  }),
);

app.get(
  '/api/student/subscription',
  asyncHandler(async (req, res) => {
    res.json(await store.getSubscription(getStudentAccessToken(req)));
  }),
);

app.get(
  '/api/student/routine',
  asyncHandler(async (req, res) => {
    res.json(
      await store.getRoutine(
        getStudentAccessToken(req),
        req.query.day || req.query.day_number,
      ),
    );
  }),
);

app.get(
  '/api/student/messages',
  asyncHandler(async (req, res) => {
    res.json(await store.getMessages(getStudentAccessToken(req)));
  }),
);

app.post(
  '/api/student/messages',
  asyncHandler(async (req, res) => {
    const title = String(req.body?.title || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!title || !body) {
      res
        .status(400)
        .json({ ok: false, message: 'Asunto y mensaje son obligatorios.' });
      return;
    }
    const message = await store.createMessage(getStudentAccessToken(req), {
      title,
      body,
    });
    res.status(201).json({ ok: true, message });
  }),
);

app.post(
  '/api/student/workout-reports',
  asyncHandler(async (req, res) => {
    const feedback = String(req.body?.feedback || '').trim();
    if (!feedback) {
      res
        .status(400)
        .json({ ok: false, message: 'Indica cómo fue la rutina.' });
      return;
    }
    const report = await store.createWorkoutReport(getStudentAccessToken(req), {
      day: req.body?.day,
      feedback,
      exercises: Array.isArray(req.body?.exercises) ? req.body.exercises : [],
      summary: String(req.body?.summary || ''),
    });
    res.status(201).json({ ok: true, report });
  }),
);

app.post(
  '/api/student/progress-photos',
  asyncHandler(async (req, res) => {
    const slot = String(req.body?.slot || '').trim();
    const dataUrl = String(req.body?.dataUrl || '').trim();
    if (!slot || !dataUrl) {
      res
        .status(400)
        .json({ ok: false, message: 'Falta la foto de progreso.' });
      return;
    }
    const photo = await store.uploadProgressPhoto(getStudentAccessToken(req), {
      slot,
      dataUrl,
      filename: req.body?.filename,
      contentType: req.body?.contentType || 'image/png',
    });
    res.status(201).json({ ok: true, photo });
  }),
);

app.get('/api/waiting-room/:token', async (req, res, next) => {
  try {
    const waitingRoom = await store.getWaitingRoomPreview(req.params.token);
    res.json(buildWaitingRoomPreviewPayload(waitingRoom));
  } catch (error) {
    if (Number(error.status) === 409 && error.waitingRoom) {
      res.status(409).json(
        buildWaitingRoomPreviewPayload(error.waitingRoom, {
          state: 'already-opened',
          message: error.message,
        }),
      );
      return;
    }
    next(error);
  }
});

app.post(
  '/api/waiting-room/:token/consume',
  asyncHandler(async (req, res) => {
    const waitingRoom = await store.consumeWaitingRoomSession(req.params.token);
    res.json(buildWaitingRoomActivationPayload(waitingRoom));
  }),
);

app.get(
  '/api/trainer/session',
  asyncHandler(async (req, res) => {
    res.json({ trainer: await store.getTrainerSession(getTrainerAuth(req)) });
  }),
);

app.get(
  '/api/trainer/students',
  asyncHandler(async (req, res) => {
    res.json({ students: await store.listStudents(getTrainerAuth(req)) });
  }),
);

app.get(
  '/api/trainer/students/:studentId',
  asyncHandler(async (req, res) => {
    res.json({
      student: await store.getTrainerStudent(
        getTrainerAuth(req),
        req.params.studentId,
      ),
    });
  }),
);

app.post(
  '/api/trainer/students',
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      res
        .status(400)
        .json({ ok: false, message: 'El nombre del alumno es obligatorio.' });
      return;
    }
    const student = await store.createStudent(
      getTrainerAuth(req),
      req.body || {},
    );
    res.status(201).json({ ok: true, student });
  }),
);

app.put(
  '/api/trainer/students/:studentId/routine',
  asyncHandler(async (req, res) => {
    const student = await store.updateStudentRoutine(
      getTrainerAuth(req),
      req.params.studentId,
      req.body?.routine,
    );
    res.json({ ok: true, student });
  }),
);

app.post(
  '/api/trainer/messages',
  asyncHandler(async (req, res) => {
    const studentId = String(req.body?.studentId || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!studentId || !body) {
      res
        .status(400)
        .json({ ok: false, message: 'Alumno y mensaje son obligatorios.' });
      return;
    }
    const message = await store.createTrainerMessage(getTrainerAuth(req), {
      studentId,
      title: req.body?.title,
      body,
    });
    res.status(201).json({ ok: true, message });
  }),
);

app.post(
  '/api/trainer/students/:studentId/payment-received',
  asyncHandler(async (req, res) => {
    const auth = getTrainerAuth(req);
    const waitingRoom = await store.markPaymentReceived(
      auth,
      req.params.studentId,
    );
    const student = await store.getTrainerStudent(auth, req.params.studentId);
    const waitingRoomPayload = buildWaitingRoomPayload(
      req,
      waitingRoom.waitingRoomToken,
      waitingRoom,
    );
    const deliveryPayload = await deliverWaitingRoomAccess({
      req,
      student,
      waitingRoom: waitingRoomPayload,
      autoDeliver: req.body?.deliver !== false,
    });
    await store.recordWaitingRoomDelivery(
      auth,
      req.params.studentId,
      normalizeDeliveryRecord(deliveryPayload),
    );

    res.status(201).json({
      ok: true,
      waitingRoom: waitingRoomPayload,
      delivery: deliveryPayload,
    });
  }),
);

app.post(
  '/api/trainer/students/:studentId/access/delivery',
  asyncHandler(async (req, res) => {
    const channel = String(req.body?.channel || '').trim();
    const status = String(req.body?.status || '').trim();

    if (!channel || !status) {
      res.status(400).json({
        ok: false,
        message: 'Canal y estado de entrega son obligatorios.',
      });
      return;
    }

    const student = await store.recordWaitingRoomDelivery(
      getTrainerAuth(req),
      req.params.studentId,
      {
        channel,
        status,
        sentAt: req.body?.sentAt || new Date().toISOString(),
        error: req.body?.error || '',
        note: req.body?.note || '',
      },
    );

    res.status(201).json({ ok: true, student });
  }),
);

app.post(
  '/api/trainer/students/:studentId/access/rotate',
  asyncHandler(async (req, res) => {
    const access = await store.rotateStudentAccess(
      getTrainerAuth(req),
      req.params.studentId,
    );
    res.status(201).json({
      ok: true,
      access: buildStudentAccessPayload(req, access.accessToken, access),
    });
  }),
);

app.post(
  '/api/trainer/students/:studentId/access/revoke',
  asyncHandler(async (req, res) => {
    const access = await store.revokeStudentAccess(
      getTrainerAuth(req),
      req.params.studentId,
    );
    res.json({
      ok: true,
      access: buildStudentAccessPayload(req, access.accessToken, access),
    });
  }),
);

app.use((error, _req, res, _next) => {
  const status = Number(error.status || 500);
  res.status(status).json({
    ok: false,
    message:
      status >= 500 ? 'No se pudo completar la operación.' : error.message,
  });
});

app.listen(port, host, () => {
  const networkUrls = getNetworkUrls(port);

  console.log(`${appName} listening on http://127.0.0.1:${port}`);
  console.log(
    `Data mode: ${runtime.resolvedDataMode} (requested: ${runtime.requestedDataMode})`,
  );

  if (networkUrls.length) {
    console.log('Available on local network:');
    networkUrls.forEach((url) => console.log(`- ${url}`));
  }

  if (runtime.usingFallbackLocalStore) {
    console.warn(
      'WARNING: SAULO_DATA_MODE=supabase was requested, but Supabase credentials are missing or invalid. Falling back to local seed data.',
    );
  }

  if (!delivery.webhookUrl) {
    console.warn(
      'WARNING: MAGIC_LINK_WEBHOOK_URL is not configured. Magic links will stay in manual-share mode.',
    );
  }
});

function getStudentAccessToken(req) {
  const authorization = req.headers.authorization || '';
  if (authorization.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    if (token) {
      return token;
    }
  }

  const token = String(req.query.access || req.body?.accessToken || '').trim();

  if (!token) {
    const error = new Error(
      'Acceso no disponible. Abre tu enlace de acceso o solicita uno nuevo a tu entrenador.',
    );
    error.status = 401;
    throw error;
  }

  return token;
}

function getTrainerAuth(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : req.headers['x-trainer-token'];
  return { token };
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

async function listPublicEventsSafely(options) {
  try {
    return await eventsStore.listPublicEvents(options);
  } catch (error) {
    if (String(error?.message || '').includes('PGRST205')) {
      return [];
    }

    throw error;
  }
}

function normalizePublicLanguage(value) {
  return String(value || '')
    .trim()
    .toLowerCase() === 'pt-br'
    ? 'pt-br'
    : 'es';
}

function getNetworkUrls(serverPort) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((entries) => {
    entries?.forEach((entry) => {
      if (!entry || entry.internal || entry.family !== 'IPv4') {
        return;
      }

      urls.push(`http://${entry.address}:${serverPort}`);
    });
  });

  return [...new Set(urls)];
}

function buildStudentAccessPayload(req, accessToken, accessState) {
  const origin = `${req.protocol}://${req.get('host')}`;
  const accessPath = `/app/?access=${encodeURIComponent(accessToken)}`;

  return {
    ...accessState,
    accessPath,
    accessUrl: `${origin}${accessPath}`,
  };
}

function buildWaitingRoomPayload(req, waitingRoomToken, waitingRoomState) {
  const origin = `${req.protocol}://${req.get('host')}`;
  const waitingRoomPath = `/acceso/${encodeURIComponent(waitingRoomToken)}`;

  return {
    ...waitingRoomState,
    waitingRoomPath,
    waitingRoomUrl: `${origin}${waitingRoomPath}`,
  };
}

async function deliverWaitingRoomAccess({
  req,
  student,
  waitingRoom,
  autoDeliver = true,
}) {
  const share = buildWaitingRoomShare(req, student, waitingRoom);
  const hasRecipient = Boolean(share.contactEmail || share.contactPhone);

  if (!hasRecipient) {
    return {
      ...share,
      dispatched: false,
      status: 'missing-contact',
      message:
        'Pago registrado. Falta email o WhatsApp del alumno para enviar el acceso automáticamente.',
    };
  }

  if (!autoDeliver || !delivery.webhookUrl) {
    return {
      ...share,
      dispatched: false,
      status: 'ready-to-share',
      message:
        'Pago registrado. Magic link listo para compartir desde email o WhatsApp.',
    };
  }

  try {
    const webhookPayload = createMagicLinkWebhookPayload({
      appName,
      senderName: delivery.senderName,
      student,
      waitingRoom,
      access: {
        accessUrl: share.accessUrl,
        accessPath: share.accessPath,
      },
      share,
    });
    const response = await sendMagicLinkWebhook({
      webhookUrl: delivery.webhookUrl,
      timeoutMs: delivery.webhookTimeoutMs,
      secret: delivery.webhookSecret,
      signatureHeader: delivery.webhookSignatureHeader,
      bearerToken: delivery.webhookBearerToken,
      payload: webhookPayload,
    });

    if (!response.ok) {
      const detail = response.responseText
        ? ` · ${response.responseText.slice(0, 160)}`
        : '';
      throw new Error(`Webhook respondió ${response.status}${detail}`);
    }

    return {
      ...share,
      dispatched: true,
      status: 'delivered',
      providerMeta: {
        statusCode: response.status,
        channel: String(response.responseJson?.channel || '').trim(),
        deliveryId: String(response.responseJson?.deliveryId || '').trim(),
      },
      message: 'Pago registrado y acceso enviado automáticamente al alumno.',
    };
  } catch (error) {
    return {
      ...share,
      dispatched: false,
      status: 'provider-error',
      providerMeta: {
        reason: error.name === 'TimeoutError' ? 'timeout' : 'request-failed',
        detail: error.message || '',
      },
      message:
        'Pago registrado, pero el proveedor externo no pudo enviar el acceso. Comparte el magic link manualmente.',
    };
  }
}

function buildWaitingRoomShare(req, student, waitingRoom) {
  const origin = `${req.protocol}://${req.get('host')}`;
  const accessPath = `/app/?access=${encodeURIComponent(student.accessToken || '')}`;
  const accessUrl = `${origin}${accessPath}`;
  const contactEmail = String(student.contactEmail || '').trim();
  const contactPhone = String(student.contactPhone || '').trim();
  const shareMessage = [
    `Hola ${student.name}, tu acceso a Saulo Fitness APP ya está listo.`,
    `Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: ${waitingRoom.waitingRoomUrl}`,
    'Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.',
  ].join(' ');
  const subject = `${appName} · Tu acceso está listo`;

  return {
    contactEmail,
    contactPhone,
    accessPath,
    accessUrl,
    waitingRoomPath: waitingRoom.waitingRoomPath,
    waitingRoomUrl: waitingRoom.waitingRoomUrl,
    shareMessage,
    mailtoUrl: contactEmail
      ? `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`
      : '',
    whatsappUrl: contactPhone
      ? `https://wa.me/${normalizePhoneForWa(contactPhone)}?text=${encodeURIComponent(shareMessage)}`
      : '',
  };
}

function normalizePhoneForWa(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function normalizeDeliveryRecord(deliveryPayload) {
  const statusMap = {
    delivered: 'sent',
    'ready-to-share': 'ready',
    'missing-contact': 'missing-contact',
    'provider-error': 'failed',
  };

  return {
    status: statusMap[deliveryPayload?.status] || 'pending',
    channel:
      deliveryPayload?.status === 'delivered'
        ? String(deliveryPayload?.providerMeta?.channel || '').trim() ||
          (deliveryPayload.contactPhone ? 'whatsapp' : 'email')
        : '',
    sentAt:
      deliveryPayload?.status === 'delivered' ? new Date().toISOString() : null,
    error:
      deliveryPayload?.status === 'provider-error'
        ? deliveryPayload.message || 'No se pudo enviar el acceso.'
        : '',
    note:
      deliveryPayload?.status === 'delivered' &&
      deliveryPayload?.providerMeta?.deliveryId
        ? `${deliveryPayload.message || ''} · deliveryId=${deliveryPayload.providerMeta.deliveryId}`
        : deliveryPayload?.message || '',
  };
}

function resolveWaitingRoomLinkToken(token) {
  if (String(token || '').trim() === '101') {
    return store.getDefaultWaitingRoomToken() || String(token || '').trim();
  }

  return String(token || '').trim();
}

function buildWaitingRoomPreviewPayload(waitingRoom, options = {}) {
  return {
    state: options.state || 'ready',
    message: options.message || '',
    student: waitingRoom.student,
    paymentReceivedAt: waitingRoom.paymentReceivedAt || null,
    waitingRoomSentAt: waitingRoom.waitingRoomSentAt || null,
    waitingRoomConsumedAt: waitingRoom.waitingRoomConsumedAt || null,
  };
}

function buildWaitingRoomActivationPayload(waitingRoom) {
  return {
    ...buildWaitingRoomPreviewPayload(waitingRoom),
    accessToken: waitingRoom.accessToken,
    appPath: `/app/?access=${encodeURIComponent(waitingRoom.accessToken)}`,
  };
}

function isProtectedSurfaceRequest(requestPath) {
  return [
    '/app',
    '/trainer',
    '/waiting-room',
    '/sala',
    '/acceso',
    '/demo',
    '/admin/eventos',
    '/api/student',
    '/api/trainer',
    '/api/waiting-room',
    '/api/admin/events',
  ].some((prefix) => {
    return requestPath === prefix || requestPath.startsWith(`${prefix}/`);
  });
}
