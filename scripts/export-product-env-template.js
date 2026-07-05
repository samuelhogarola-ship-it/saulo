const fs = require('node:fs');
const path = require('node:path');

const { projectRoot } = require('../lib/config');
const {
  DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
} = require('../lib/magic-link-provider-contract');

const outputPath = resolveOutputPath(
  process.env.PRODUCT_ENV_TEMPLATE_OUTPUT_PATH ||
    'docs/product-env-template.env',
);

const template = buildTemplate();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, template);

console.log('Saulo Fitness APP · Product env template exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Copy the values into .env and replace every placeholder before running the real Supabase product flow.',
);

function resolveOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs', 'product-env-template.env');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

function buildTemplate() {
  return `# Saulo Fitness APP · Product environment template
# Copy the variables you need into .env and replace all placeholder values.

# Core product mode
SAULO_DATA_MODE=supabase
PORT=4173

# Real Supabase project
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-real-service-role-key
SUPABASE_PROGRESS_PHOTOS_BUCKET=progress-photos

# Trainer bootstrap
BOOTSTRAP_TRAINER_EMAIL=trainer@saulofitness.com
BOOTSTRAP_TRAINER_PASSWORD=replace-with-secure-password
BOOTSTRAP_TRAINER_NAME=Saulo Trainer
BOOTSTRAP_ADOPT_UNASSIGNED_STUDENTS=false

# First student bootstrap
BOOTSTRAP_STUDENT_TEMPLATE_PATH=product-templates/students/lucia-ortega.json
BOOTSTRAP_STUDENT_NAME=Lucia Ortega
BOOTSTRAP_STUDENT_CONTACT_EMAIL=lucia@saulofitness.app
BOOTSTRAP_STUDENT_CONTACT_PHONE=+34600000001
BOOTSTRAP_STUDENT_PLAN=Definicion
BOOTSTRAP_STUDENT_GOAL=Bajar grasa y mantener fuerza
BOOTSTRAP_STUDENT_PLAN_LABEL=Plan 30 dias

# Supabase smoke
SMOKE_TRAINER_EMAIL=trainer@saulofitness.com
SMOKE_TRAINER_PASSWORD=replace-with-secure-password
SMOKE_STUDENT_CONTACT_EMAIL=lucia@saulofitness.app
SMOKE_STUDENT_DAY=1
SMOKE_TRIGGER_WAITING_ROOM=true

# Supabase delivery endpoint
# Deploy first: supabase functions deploy magic-link-delivery
MAGIC_LINK_WEBHOOK_URL=${DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL}
MAGIC_LINK_SENDER_NAME=Coach Saulo
MAGIC_LINK_WEBHOOK_TIMEOUT_MS=5000
MAGIC_LINK_WEBHOOK_SECRET=replace-with-shared-secret
MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER=x-saulo-signature
MAGIC_LINK_WEBHOOK_BEARER_TOKEN=replace-with-supabase-function-bearer

# Local activation smoke
ACTIVATION_SMOKE_APP_PORT=4318
ACTIVATION_SMOKE_DELIVERY_PORT=8789
ACTIVATION_SMOKE_DELIVERY_HOST=127.0.0.1
ACTIVATION_SMOKE_OUTPUT_PATH=

# Generated artifacts
DELIVERY_GO_LIVE_OUTPUT_PATH=docs/delivery-go-live-checklist.md
DELIVERY_HANDOFF_OUTPUT_PATH=docs/provider-magic-link-handoff.md
PRODUCT_ENV_TEMPLATE_OUTPUT_PATH=docs/product-env-template.env

# Recommended activation order
# 1. npm run product:check
# 2. npm run product:bootstrap:trainer
# 3. npm run product:bootstrap:student
# 4. npm run product:smoke:supabase
# 5. npm run product:handoff:delivery
# 6. npm run product:smoke:delivery
# 7. npm run product:smoke:activation
`;
}
