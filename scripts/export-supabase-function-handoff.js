const fs = require('node:fs');
const path = require('node:path');

const { projectRoot } = require('../lib/config');
const {
  DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
} = require('../lib/magic-link-provider-contract');

const outputPath = resolveOutputPath(
  process.env.SUPABASE_FUNCTION_HANDOFF_OUTPUT_PATH ||
    'docs/supabase-function-handoff.md',
);

const markdown = buildMarkdown();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown);

console.log('Saulo Fitness APP · Supabase function handoff exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Use this file to deploy and wire the magic-link-delivery Edge Function end-to-end.',
);

function resolveOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs', 'supabase-function-handoff.md');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

function buildMarkdown() {
  const webhookSecret =
    String(process.env.MAGIC_LINK_WEBHOOK_SECRET || '').trim() ||
    'replace-with-shared-secret';
  const webhookBearerToken =
    String(process.env.MAGIC_LINK_WEBHOOK_BEARER_TOKEN || '').trim() ||
    'replace-with-app-bearer';
  const signatureHeader =
    String(process.env.MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER || '').trim() ||
    'x-saulo-signature';
  const downstreamUrl = String(
    process.env.DELIVERY_DOWNSTREAM_URL || '',
  ).trim();
  const downstreamBearer =
    String(process.env.DELIVERY_DOWNSTREAM_BEARER_TOKEN || '').trim() ||
    'replace-with-downstream-bearer';
  const defaultChannel =
    String(process.env.DELIVERY_DEFAULT_CHANNEL || '').trim() || 'whatsapp';

  return `# Saulo Fitness APP · Supabase Function Handoff

## Objetivo

Desplegar y conectar la Edge Function \`magic-link-delivery\` para que el flujo:

\`pago recibido -> waiting room link -> envio automatico -> sala de espera -> PWA\`

quede listo de extremo a extremo.

## Function target

- Function: \`magic-link-delivery\`
- URL esperada: \`${DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL}\`

## Deploy

\`\`\`bash
supabase functions deploy magic-link-delivery
\`\`\`

## Secrets recomendados

\`\`\`bash
supabase secrets set \\
SAULO_WEBHOOK_SECRET='${webhookSecret}' \\
SAULO_WEBHOOK_BEARER_TOKEN='${webhookBearerToken}' \\
SAULO_SIGNATURE_HEADER='${signatureHeader}' \\
DELIVERY_DEFAULT_CHANNEL='${defaultChannel}' \\
DELIVERY_DOWNSTREAM_URL='${downstreamUrl}' \\
DELIVERY_DOWNSTREAM_BEARER_TOKEN='${downstreamBearer}'
\`\`\`

## Variables del backend Node

\`\`\`env
MAGIC_LINK_WEBHOOK_URL=${DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL}
MAGIC_LINK_WEBHOOK_SECRET=${webhookSecret}
MAGIC_LINK_WEBHOOK_BEARER_TOKEN=${webhookBearerToken}
MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER=${signatureHeader}
\`\`\`

## Smoke recomendado

\`\`\`bash
npm run product:contract:delivery
npm run product:smoke:delivery
\`\`\`

## Checklist rápido

1. Desplegar la función.
2. Cargar los secrets.
3. Pegar la URL real en \`MAGIC_LINK_WEBHOOK_URL\`.
4. Ejecutar \`npm run product:smoke:delivery\`.
5. Confirmar que el panel persiste \`deliveryStatus=sent\`, \`channel\` y \`deliveryId\`.
`;
}
