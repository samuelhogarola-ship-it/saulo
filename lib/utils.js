const crypto = require('node:crypto');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateLong(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatDateShort(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatDateDayMonth(dateValue) {
  if (!dateValue) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateValue}T12:00:00`));
}

function formatTime(timeValue) {
  if (!timeValue) {
    return '';
  }

  return String(timeValue).slice(0, 5);
}

function formatCurrency(value) {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
  }).format(numericValue);
}

function serializeForScript(value) {
  return JSON.stringify(value ?? null).replaceAll('</script', '<\\/script');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function parsePrice(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[€\s]/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let payload = '';

    req.on('data', (chunk) => {
      payload += chunk;
    });

    req.on('end', () => {
      if (!payload) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(payload));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${req.get('host')}`;
}

module.exports = {
  createId,
  createTimestamp,
  escapeHtml,
  formatCurrency,
  formatDateDayMonth,
  formatDateLong,
  formatDateShort,
  formatTime,
  getBaseUrl,
  parsePrice,
  readJsonBody,
  serializeForScript,
  slugify,
};
