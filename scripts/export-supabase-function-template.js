const fs = require('node:fs');
const path = require('node:path');

const { projectRoot } = require('../lib/config');
const {
  DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
} = require('../lib/magic-link-provider-contract');

const outputPath = resolveOutputPath(
  process.env.SUPABASE_FUNCTION_TEMPLATE_OUTPUT_PATH ||
    'docs/supabase-function-template.env',
);

const template = buildTemplate();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, template);

console.log('Saulo Fitness APP · Supabase function template exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Use this file to configure the magic-link-delivery Edge Function before wiring MAGIC_LINK_WEBHOOK_URL.',
);

function resolveOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs', 'supabase-function-template.env');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

function buildTemplate() {
  return `# Saulo Fitness APP · Supabase function template
# Edge Function: magic-link-delivery
# Deploy URL target:
# ${DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL}

# Required only if the app signs requests to the function
SAULO_WEBHOOK_SECRET=replace-with-shared-secret

# Required only if the app calls the function with bearer auth
SAULO_WEBHOOK_BEARER_TOKEN=replace-with-app-bearer

# Optional. Defaults to x-saulo-signature
SAULO_SIGNATURE_HEADER=x-saulo-signature

# Optional. Default response channel when no external forwarding is used
DELIVERY_DEFAULT_CHANNEL=whatsapp

# Optional forwarding target if the function should relay the payload
DELIVERY_DOWNSTREAM_URL=
DELIVERY_DOWNSTREAM_BEARER_TOKEN=

# Recommended deploy flow
# 1. supabase functions deploy magic-link-delivery
# 2. Configure these secrets in Supabase
# 3. Set MAGIC_LINK_WEBHOOK_URL=${DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL} in .env
# 4. Run npm run product:smoke:delivery
`;
}
