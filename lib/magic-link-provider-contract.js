const path = require('node:path');

const {
  createMagicLinkWebhookPayload,
  signPayload,
} = require('./magic-link-delivery');
const { appName, delivery, projectRoot } = require('./config');

const DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL =
  'https://your-project.supabase.co/functions/v1/magic-link-delivery';

function buildDeliveryContract(options = {}) {
  const origin =
    options.origin || getContractEnv('ORIGIN') || 'https://saulofitness.com';
  const waitingRoomToken =
    options.waitingRoomToken ||
    getContractEnv('WAITING_ROOM_TOKEN') ||
    'waiting-room-sample-123';
  const accessToken =
    options.accessToken ||
    getContractEnv('ACCESS_TOKEN') ||
    'student-access-sample-123';

  const student = {
    id:
      options.studentId || getContractEnv('STUDENT_ID') || 'student-sample-001',
    name:
      options.studentName || getContractEnv('STUDENT_NAME') || 'Lucía Ortega',
    plan: options.plan || getContractEnv('PLAN') || 'Definición',
  };

  const shareMessage = buildShareMessage({
    origin,
    waitingRoomToken,
    studentName: student.name,
  });

  const share = {
    contactEmail:
      options.contactEmail ||
      getContractEnv('CONTACT_EMAIL') ||
      'lucia@saulofitness.app',
    contactPhone:
      options.contactPhone || getContractEnv('CONTACT_PHONE') || '+34600000001',
    shareMessage,
    mailtoUrl:
      options.mailtoUrl ||
      getContractEnv('MAILTO_URL') ||
      `mailto:${encodeURIComponent(
        options.contactEmail ||
          getContractEnv('CONTACT_EMAIL') ||
          'lucia@saulofitness.app',
      )}`,
    whatsappUrl:
      options.whatsappUrl ||
      getContractEnv('WHATSAPP_URL') ||
      `https://wa.me/34600000001?text=${encodeURIComponent(shareMessage)}`,
  };

  const waitingRoom = {
    waitingRoomUrl: `${origin}/acceso/${encodeURIComponent(waitingRoomToken)}`,
    waitingRoomPath: `/acceso/${encodeURIComponent(waitingRoomToken)}`,
  };

  const access = {
    accessUrl: `${origin}/app/?access=${encodeURIComponent(accessToken)}`,
    accessPath: `/app/?access=${encodeURIComponent(accessToken)}`,
  };

  const payload = createMagicLinkWebhookPayload({
    appName,
    senderName: delivery.senderName,
    student,
    waitingRoom,
    access,
    share,
  });

  const rawPayload = JSON.stringify(payload);
  const prettyPayload = JSON.stringify(payload, null, 2);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (delivery.webhookBearerToken) {
    headers.Authorization = `Bearer ${delivery.webhookBearerToken}`;
  }

  if (delivery.webhookSecret) {
    headers[delivery.webhookSignatureHeader] = signPayload(
      rawPayload,
      delivery.webhookSecret,
    );
  }

  return {
    appName,
    senderName: delivery.senderName,
    webhookUrl: delivery.webhookUrl || DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
    signatureHeader: delivery.webhookSignatureHeader,
    hasBearer: Boolean(delivery.webhookBearerToken),
    hasSignature: Boolean(delivery.webhookSecret),
    headers,
    payload,
    rawPayload,
    prettyPayload,
    responseExample: buildResponseExample(options),
    curl: buildCurlCommand(delivery.webhookUrl, headers, rawPayload),
  };
}

function buildShareMessage({ origin, waitingRoomToken, studentName }) {
  return [
    `Hola ${studentName}, tu acceso a Saulo Fitness APP ya está listo.`,
    `Abre este enlace único y de un solo uso para entrar en tu sala de espera y activar la app en tu móvil: ${origin}/acceso/${encodeURIComponent(waitingRoomToken)}`,
    'Cuando la abras, tu sesión quedará activa y podrás añadirla a la pantalla de inicio como PWA.',
  ].join(' ');
}

function buildCurlCommand(webhookUrl, headers, rawBody) {
  const targetUrl = webhookUrl || DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL;
  const headerArgs = Object.entries(headers).map(
    ([key, value]) => `-H ${shellQuote(`${key}: ${value}`)}`,
  );

  return [
    'curl -X POST',
    shellQuote(targetUrl),
    ...headerArgs,
    `--data-raw ${shellQuote(rawBody)}`,
  ].join(' ');
}

function buildResponseExample(options = {}) {
  return {
    ok: true,
    channel:
      options.responseChannel ||
      getContractEnv('RESPONSE_CHANNEL') ||
      'whatsapp',
    deliveryId:
      options.responseDeliveryId ||
      getContractEnv('RESPONSE_DELIVERY_ID') ||
      'supabase-delivery-001',
  };
}

function getContractEnv(key) {
  return (
    process.env[`DELIVERY_CONTRACT_${key}`] ||
    process.env[`PROVIDER_CONTRACT_${key}`] ||
    ''
  );
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\"'\"'`)}'`;
}

function resolveHandoffOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs/provider-magic-link-handoff.md');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

module.exports = {
  DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
  buildDeliveryContract,
  buildProviderContract: buildDeliveryContract,
  buildShareMessage,
  buildCurlCommand,
  resolveHandoffOutputPath,
};
