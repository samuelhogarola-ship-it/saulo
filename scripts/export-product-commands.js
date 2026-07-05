const fs = require('node:fs');
const path = require('node:path');

const { projectRoot } = require('../lib/config');
const {
  DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
} = require('../lib/magic-link-provider-contract');

const outputPath = resolveOutputPath(
  process.env.PRODUCT_COMMANDS_OUTPUT_PATH || 'docs/product-next-commands.md',
);
const templatePath = resolveDefaultTemplatePath();
const content = buildMarkdown({
  trainerEmail:
    String(process.env.BOOTSTRAP_TRAINER_EMAIL || '').trim() ||
    'trainer@saulofitness.com',
  trainerPassword:
    String(process.env.BOOTSTRAP_TRAINER_PASSWORD || '').trim() ||
    'replace-with-secure-password',
  trainerName:
    String(process.env.BOOTSTRAP_TRAINER_NAME || '').trim() || 'Saulo Trainer',
  studentTemplatePath: templatePath,
  studentEmail:
    String(process.env.BOOTSTRAP_STUDENT_CONTACT_EMAIL || '').trim() ||
    'lucia@saulofitness.app',
  webhookUrl:
    String(process.env.MAGIC_LINK_WEBHOOK_URL || '').trim() ||
    DEFAULT_SUPABASE_DELIVERY_WEBHOOK_URL,
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);

console.log('Saulo Fitness APP · Product commands exported');
console.log(`- Output: ${outputPath}`);
console.log(
  '- Review the placeholders before running the commands against the real product environment.',
);

function resolveOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs', 'product-next-commands.md');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

function resolveDefaultTemplatePath() {
  const explicit = String(
    process.env.BOOTSTRAP_STUDENT_TEMPLATE_PATH || '',
  ).trim();
  if (explicit) {
    return explicit;
  }

  const templatesDir = path.join(projectRoot, 'product-templates', 'students');
  if (!fs.existsSync(templatesDir)) {
    return 'product-templates/students/lucia-ortega.json';
  }

  const firstTemplate = fs
    .readdirSync(templatesDir)
    .filter((file) => file.endsWith('.json'))
    .sort()[0];

  return firstTemplate
    ? `product-templates/students/${firstTemplate}`
    : 'product-templates/students/lucia-ortega.json';
}

function buildMarkdown({
  trainerEmail,
  trainerPassword,
  trainerName,
  studentTemplatePath,
  studentEmail,
  webhookUrl,
}) {
  return `# Saulo Fitness APP · Next Product Commands

## Trainer bootstrap

\`\`\`bash
BOOTSTRAP_TRAINER_EMAIL='${trainerEmail}' \\
BOOTSTRAP_TRAINER_PASSWORD='${trainerPassword}' \\
BOOTSTRAP_TRAINER_NAME='${trainerName}' \\
npm run product:bootstrap:trainer
\`\`\`

## Student bootstrap

\`\`\`bash
BOOTSTRAP_TRAINER_EMAIL='${trainerEmail}' \\
BOOTSTRAP_STUDENT_TEMPLATE_PATH='${studentTemplatePath}' \\
npm run product:bootstrap:student
\`\`\`

## Supabase smoke

\`\`\`bash
SMOKE_TRAINER_EMAIL='${trainerEmail}' \\
SMOKE_TRAINER_PASSWORD='${trainerPassword}' \\
SMOKE_STUDENT_CONTACT_EMAIL='${studentEmail}' \\
SMOKE_TRIGGER_WAITING_ROOM=true \\
npm run product:smoke:supabase
\`\`\`

## Supabase delivery function deploy

\`\`\`bash
supabase functions deploy magic-link-delivery
npm run product:env:function
npm run product:handoff:function
npm run product:handoff:activation
\`\`\`

## Delivery handoff

\`\`\`bash
MAGIC_LINK_WEBHOOK_URL='${webhookUrl}' \\
npm run product:handoff:delivery
\`\`\`

## Delivery smoke

\`\`\`bash
MAGIC_LINK_WEBHOOK_URL='${webhookUrl}' \\
npm run product:smoke:delivery
\`\`\`

## Full local activation smoke

\`\`\`bash
MAGIC_LINK_WEBHOOK_URL='${webhookUrl}' \\
npm run product:smoke:activation
\`\`\`

## Notes

- Replace any placeholder password, Supabase delivery URL, or example template path before running against production data.
- Re-run \`npm run product:check\` after each step to confirm the next real gap.
`;
}
