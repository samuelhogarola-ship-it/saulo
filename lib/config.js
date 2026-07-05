const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

loadDotEnv(path.join(projectRoot, '.env'));

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      if (!key || process.env[key] != null) {
        return;
      }

      process.env[key] = stripQuotes(rawValue);
    });
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function hasRealValue(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return false;
  }

  return ![
    /^your-/i,
    /^replace-with/i,
    /^example/i,
    /^xxxx/i,
    /^https?:\/\/your-project\b/i,
    /^https?:\/\/provider\.example\b/i,
    /^https?:\/\/your-project\.supabase\.co\/functions\/v1\/magic-link-delivery\b/i,
  ].some((pattern) => pattern.test(normalized));
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const requestedDataMode = normalizeDataMode(process.env.SAULO_DATA_MODE);
const supabaseConfigured =
  requestedDataMode === 'supabase' &&
  hasRealValue(supabaseUrl) &&
  hasRealValue(supabaseServiceRoleKey);
const resolvedDataMode =
  requestedDataMode === 'supabase' && supabaseConfigured ? 'supabase' : 'local';

module.exports = {
  projectRoot,
  appName: 'Saulo Fitness APP',
  runtime: {
    requestedDataMode,
    resolvedDataMode,
    supabaseConfigured,
    usingFallbackLocalStore:
      requestedDataMode === 'supabase' && resolvedDataMode === 'local',
  },
  defaultStudentAccessToken:
    process.env.DEFAULT_STUDENT_ACCESS_TOKEN ||
    (resolvedDataMode === 'supabase' ? '' : 'lucia-access'),
  trainerApiToken: process.env.TRAINER_API_TOKEN || 'local-trainer-token',
  trainerLogin: {
    email: process.env.TRAINER_LOGIN_EMAIL || 'local@saulofitness.app',
    password: process.env.TRAINER_LOGIN_PASSWORD || 'saulo1234',
  },
  delivery: {
    webhookUrl: process.env.MAGIC_LINK_WEBHOOK_URL || '',
    senderName: process.env.MAGIC_LINK_SENDER_NAME || 'Coach Saulo',
    webhookTimeoutMs: normalizeTimeout(
      process.env.MAGIC_LINK_WEBHOOK_TIMEOUT_MS,
      5000,
    ),
    webhookSecret: process.env.MAGIC_LINK_WEBHOOK_SECRET || '',
    webhookSignatureHeader:
      process.env.MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER || 'x-saulo-signature',
    webhookBearerToken: process.env.MAGIC_LINK_WEBHOOK_BEARER_TOKEN || '',
  },
  supabase: {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
    storageBucket:
      process.env.SUPABASE_PROGRESS_PHOTOS_BUCKET || 'progress-photos',
    hasConfig: supabaseConfigured,
  },
};

function normalizeDataMode(value) {
  const normalized = String(value || 'local')
    .trim()
    .toLowerCase();

  return normalized === 'supabase' ? 'supabase' : 'local';
}

function normalizeTimeout(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.round(parsed);
}
