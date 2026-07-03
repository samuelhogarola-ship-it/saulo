const crypto = require('node:crypto');

function createMagicLinkWebhookPayload({
  appName,
  senderName,
  student,
  waitingRoom,
  access,
  share,
}) {
  return {
    event: 'student_magic_link_ready',
    sentAt: new Date().toISOString(),
    senderName,
    appName,
    student: {
      id: student.id,
      name: student.name,
      plan: student.plan,
      contactEmail: share.contactEmail,
      contactPhone: share.contactPhone,
    },
    access: {
      waitingRoomUrl: waitingRoom.waitingRoomUrl,
      waitingRoomPath: waitingRoom.waitingRoomPath,
      accessUrl: access.accessUrl,
      accessPath: access.accessPath,
    },
    message: share.shareMessage,
    mailtoUrl: share.mailtoUrl,
    whatsappUrl: share.whatsappUrl,
  };
}

async function sendMagicLinkWebhook({
  webhookUrl,
  timeoutMs,
  secret,
  signatureHeader,
  bearerToken,
  payload,
}) {
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json',
  };

  if (secret) {
    headers[signatureHeader || 'x-saulo-signature'] = signPayload(body, secret);
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs || 5000),
  });

  const responseText = await response.text().catch(() => '');
  const responseJson = parseResponseJson(responseText);

  return {
    ok: response.ok,
    status: response.status,
    responseText,
    responseJson,
  };
}

function parseResponseJson(value) {
  const raw = String(value || '').trim();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function signPayload(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function verifySignedPayload(body, secret, signature) {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = signPayload(body, secret);
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(String(signature), 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

module.exports = {
  createMagicLinkWebhookPayload,
  parseResponseJson,
  sendMagicLinkWebhook,
  signPayload,
  verifySignedPayload,
};
