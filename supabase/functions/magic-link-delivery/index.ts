type DeliveryPayload = {
  event?: string;
  sentAt?: string;
  senderName?: string;
  appName?: string;
  message?: string;
  mailtoUrl?: string;
  whatsappUrl?: string;
  student?: {
    id?: string;
    name?: string;
    plan?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  access?: {
    waitingRoomUrl?: string;
    waitingRoomPath?: string;
    accessUrl?: string;
    accessPath?: string;
  };
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const signatureHeader =
  Deno.env.get('SAULO_SIGNATURE_HEADER') || 'x-saulo-signature';
const webhookSecret = Deno.env.get('SAULO_WEBHOOK_SECRET') || '';
const webhookBearerToken = Deno.env.get('SAULO_WEBHOOK_BEARER_TOKEN') || '';
const downstreamUrl = Deno.env.get('DELIVERY_DOWNSTREAM_URL') || '';
const downstreamBearerToken =
  Deno.env.get('DELIVERY_DOWNSTREAM_BEARER_TOKEN') || '';
const defaultChannel = Deno.env.get('DELIVERY_DEFAULT_CHANNEL') || 'whatsapp';

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return respond(405, {
      ok: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  const rawBody = await request.text();

  if (!isAuthorized(request.headers)) {
    return respond(401, {
      ok: false,
      message: 'Bearer token no valido.',
    });
  }

  if (!(await hasValidSignature(request.headers, rawBody))) {
    return respond(401, {
      ok: false,
      message: 'Firma HMAC no valida.',
    });
  }

  const payload = parsePayload(rawBody);
  if (!payload.ok) {
    return respond(400, {
      ok: false,
      message: payload.message,
    });
  }

  const validation = validatePayload(payload.value);
  if (!validation.ok) {
    return respond(400, {
      ok: false,
      message: validation.message,
    });
  }

  if (!downstreamUrl) {
    return respond(200, {
      ok: true,
      mode: 'echo',
      channel: inferChannel(payload.value),
      deliveryId: `supabase-${crypto.randomUUID()}`,
      acceptedAt: new Date().toISOString(),
    });
  }

  try {
    const forwarded = await forwardPayload(payload.value);
    if (!forwarded.ok) {
      return respond(502, {
        ok: false,
        mode: 'forward',
        message: 'El canal externo rechazo la entrega.',
        status: forwarded.status,
        responseText: forwarded.responseText,
      });
    }

    return respond(200, {
      ok: true,
      mode: 'forward',
      channel: forwarded.responseJson?.channel || inferChannel(payload.value),
      deliveryId:
        forwarded.responseJson?.deliveryId || `supabase-${crypto.randomUUID()}`,
      acceptedAt: new Date().toISOString(),
    });
  } catch (error) {
    return respond(502, {
      ok: false,
      mode: 'forward',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo reenviar la entrega.',
    });
  }
});

function respond(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}

function isAuthorized(headers: Headers) {
  if (!webhookBearerToken) {
    return true;
  }

  return headers.get('authorization') === `Bearer ${webhookBearerToken}`;
}

async function hasValidSignature(headers: Headers, rawBody: string) {
  if (!webhookSecret) {
    return true;
  }

  const signature = headers.get(signatureHeader);
  if (!signature) {
    return false;
  }

  return (await signPayload(rawBody, webhookSecret)) === signature;
}

function parsePayload(rawBody: string) {
  try {
    return {
      ok: true as const,
      value: JSON.parse(rawBody || '{}') as DeliveryPayload,
    };
  } catch {
    return {
      ok: false as const,
      message: 'El body no es JSON valido.',
    };
  }
}

function validatePayload(payload: DeliveryPayload) {
  if (payload.event !== 'student_magic_link_ready') {
    return {
      ok: false as const,
      message: 'Evento no soportado.',
    };
  }

  if (!payload.student?.id || !payload.student?.name) {
    return {
      ok: false as const,
      message: 'Faltan los datos minimos del alumno.',
    };
  }

  if (!payload.access?.waitingRoomUrl || !payload.access?.waitingRoomPath) {
    return {
      ok: false as const,
      message: 'Falta el waiting room link.',
    };
  }

  return { ok: true as const };
}

function inferChannel(payload: DeliveryPayload) {
  if (payload.student?.contactPhone) {
    return 'whatsapp';
  }

  if (payload.student?.contactEmail) {
    return 'email';
  }

  return defaultChannel;
}

async function forwardPayload(payload: DeliveryPayload) {
  const response = await fetch(downstreamUrl, {
    method: 'POST',
    headers: buildForwardHeaders(payload),
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const responseJson = parseJson(responseText);

  return {
    ok: response.ok,
    status: response.status,
    responseText,
    responseJson,
  };
}

function buildForwardHeaders(payload: DeliveryPayload) {
  const headers = new Headers(jsonHeaders);
  headers.set('x-saulo-source', 'supabase-edge-function');
  headers.set('x-saulo-event', payload.event || 'student_magic_link_ready');

  if (downstreamBearerToken) {
    headers.set('Authorization', `Bearer ${downstreamBearerToken}`);
  }

  return headers;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return null;
  }
}

async function signPayload(body: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body),
  );

  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
