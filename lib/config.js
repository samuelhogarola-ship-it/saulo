const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

loadDotEnv(envPath);

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  lines.forEach((line) => {
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

function isPlaceholder(value) {
  if (!value) {
    return true;
  }

  return /your-project|your-supabase|xxxxxxxxx|example\.com/i.test(value);
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const storageBucket =
  process.env.SUPABASE_EVENTS_STORAGE_BUCKET ||
  process.env.SUPABASE_STORAGE_BUCKET ||
  'event-posters';

const hasSupabaseConfig =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceRoleKey) &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseServiceRoleKey);

module.exports = {
  projectRoot,
  appName: 'Saulo Fitness APP',
  sessionCookieName: 'saulo_admin_session',
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'saulo-fallback-session-secret',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail:
    process.env.RESEND_FROM_EMAIL || 'Saulo Fitness <no-reply@saulo.local>',
  resendToEmail: process.env.RESEND_TO_EMAIL || 'hola@saulofitness.com',
  supabase: {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
    storageBucket,
    hasConfig: hasSupabaseConfig,
  },
};
