const { execFileSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

const commands = [
  ['node', ['scripts/export-product-env-template.js']],
  ['node', ['scripts/export-product-commands.js']],
  ['node', ['scripts/export-supabase-function-template.js']],
  ['node', ['scripts/export-supabase-function-handoff.js']],
  ['node', ['scripts/export-magic-link-provider-handoff.js']],
  ['node', ['scripts/export-product-activation-runbook.js']],
  ['node', ['scripts/export-delivery-go-live-checklist.js']],
];

for (const [command, args] of commands) {
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('Saulo Fitness APP · Product handoff bundle exported');
console.log(
  '- Generated env templates, function handoff, delivery handoff, activation runbook and go-live checklist.',
);
