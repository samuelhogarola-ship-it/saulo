const path = require('node:path');

const {
  createMagicLinkWebhookPayload,
  signPayload,
} = require('./magic-link-delivery');
const { appName, delivery, projectRoot } = require('./config');

function buildProviderContract(options = {}) {
  const origin =
    options.origin ||
    process.env.PROVIDER_CONTRACT_ORIGIN ||
    'https://saulofitness.com';
  const waitingRoomToken =
    options.waitingRoomToken ||
    process.env.PROVIDER_CONTRACT_WAITING_ROOM_TOKEN ||
    'waiting-room-sample-123';
  const accessToken =
    options.accessToken ||
    process.env.PROVIDER_CONTRACT_ACCESS_TOKEN ||
    'student-access-sample-123';

  const student = {
    id:
      options.studentId ||
      process.env.PROVIDER_CONTRACT_STUDENT_ID ||
      'student-sample-001',
    name:
      options.studentName ||
      process.env.PROVIDER_CONTRACT_STUDENT_NAME ||
      'Lucía Ortega',
    plan: options.plan || process.env.PROVIDER_CONTRACT_PLAN || 'Definición',
  };

  const shareMessage = buildShareMessage({
    origin,
    waitingRoomToken,
    studentName: student.name,
  });

  const share = {
    contactEmail:
      options.contactEmail ||
      process.env.PROVIDER_CONTRACT_CONTACT_EMAIL ||
      'lucia@saulofitness.app',
    contactPhone:
      options.contactPhone ||
      process.env.PROVIDER_CONTRACT_CONTACT_PHONE ||
      '+34600000001',
    shareMessage,
    mailtoUrl:
      options.mailtoUrl ||
      process.env.PROVIDER_CONTRACT_MAILTO_URL ||
      `mailto:${encodeURIComponent(
        options.contactEmail ||
          process.env.PROVIDER_CONTRACT_CONTACT_EMAIL ||
          'lucia@saulofitness.app',
      )}`,
    whatsappUrl:
      options.whatsappUrl ||
      process.env.PROVIDER_CONTRACT_WHATSAPP_URL ||
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
    webhookUrl:
      delivery.webhookUrl || 'https://provider.example/webhook/magic-link',
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
  const targetUrl = webhookUrl || 'https://provider.example/webhook/magic-link';
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
      process.env.PROVIDER_CONTRACT_RESPONSE_CHANNEL ||
      'whatsapp',
    deliveryId:
      options.responseDeliveryId ||
      process.env.PROVIDER_CONTRACT_RESPONSE_DELIVERY_ID ||
      'provider-delivery-001',
  };
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
  buildProviderContract,
  buildShareMessage,
  buildCurlCommand,
  resolveHandoffOutputPath,
};
