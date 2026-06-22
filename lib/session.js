const crypto = require('node:crypto');

const { sessionCookieName, sessionSecret } = require('./config');

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};

  cookieHeader.split(';').forEach((chunk) => {
    const [name, ...rest] = chunk.trim().split('=');
    if (!name) {
      return;
    }

    cookies[name] = decodeURIComponent(rest.join('=') || '');
  });

  return cookies;
}

function createSignedValue(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );
  const signature = crypto
    .createHmac('sha256', sessionSecret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifySignedValue(value) {
  if (!value || !value.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = value.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', sessionSecret)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    );

    if (payload?.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (_error) {
    return null;
  }
}

function readSession(req) {
  const cookies = parseCookies(req);
  return verifySignedValue(cookies[sessionCookieName]);
}

function setSession(res, payload, maxAgeMs = 1000 * 60 * 60 * 24 * 7) {
  const expiresAt = Date.now() + maxAgeMs;
  const signedValue = createSignedValue({
    ...payload,
    exp: expiresAt,
  });

  res.setHeader('Set-Cookie', [
    `${sessionCookieName}=${signedValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
      maxAgeMs / 1000,
    )}`,
  ]);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', [
    `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ]);
}

module.exports = {
  clearSession,
  parseCookies,
  readSession,
  setSession,
};
