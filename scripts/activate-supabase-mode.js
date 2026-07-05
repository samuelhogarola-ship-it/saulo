const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');
const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log('Saulo Fitness APP · Activate Supabase mode');
  console.log('');
  console.log('Usage:');
  console.log('  npm run product:env:activate-supabase');
  console.log('  node scripts/activate-supabase-mode.js [--dry-run]');
  console.log('');
  console.log('Behavior:');
  console.log(
    '- Creates .env from .env.example if needed and forces SAULO_DATA_MODE=supabase.',
  );
  console.log(
    '- Does not fill missing bootstrap, smoke, or webhook variables; use npm run product:check afterwards.',
  );
  process.exit(0);
}

const dryRun = args.has('--dry-run');

if (!fs.existsSync(envPath)) {
  if (!fs.existsSync(examplePath)) {
    throw new Error('No existen ni .env ni .env.example en el repo.');
  }

  const source = fs.readFileSync(examplePath, 'utf8');
  const seeded = replaceOrAppend(source, 'SAULO_DATA_MODE', 'supabase');
  if (!dryRun) {
    fs.writeFileSync(envPath, seeded);
  }

  console.log('Saulo Fitness APP · Supabase mode activated');
  console.log(`- ${dryRun ? 'Would create' : 'Created'}: ${envPath}`);
  console.log('- SAULO_DATA_MODE=supabase');
  console.log(
    '- Revisa y sustituye los placeholders de Supabase antes de lanzar el producto real.',
  );
  process.exit(0);
}

const current = fs.readFileSync(envPath, 'utf8');
const next = replaceOrAppend(current, 'SAULO_DATA_MODE', 'supabase');
if (!dryRun) {
  fs.writeFileSync(envPath, next);
}

console.log('Saulo Fitness APP · Supabase mode activated');
console.log(`- ${dryRun ? 'Would update' : 'Updated'}: ${envPath}`);
console.log('- SAULO_DATA_MODE=supabase');
console.log(
  '- Si todavía faltan credenciales o webhook, ejecuta npm run product:check para ver el siguiente hueco real.',
);

function replaceOrAppend(source, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${escapeRegExp(key)}=.*$`, 'm');

  if (pattern.test(source)) {
    return source.replace(pattern, line);
  }

  const suffix = source.endsWith('\n') ? '' : '\n';
  return `${source}${suffix}${line}\n`;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
