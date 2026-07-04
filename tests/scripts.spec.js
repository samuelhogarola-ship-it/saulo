const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const { test, expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..');

test('product:contract:delivery prints the provider contract with headers and payload', () => {
  const output = execFileSync(
    'node',
    ['scripts/print-magic-link-provider-contract.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        MAGIC_LINK_WEBHOOK_URL: 'https://provider.example/webhook/magic-link',
        MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'provider-bearer',
        MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER: 'x-provider-signature',
        PROVIDER_CONTRACT_STUDENT_NAME: 'Saulo Demo',
        PROVIDER_CONTRACT_WAITING_ROOM_TOKEN: 'waiting-room-sample-456',
      },
    },
  );

  expect(output).toContain('Saulo Fitness APP · Magic link provider contract');
  expect(output).toContain(
    '- Webhook URL: https://provider.example/webhook/magic-link',
  );
  expect(output).toContain('- Signature header: x-provider-signature');
  expect(output).toContain('- Bearer auth: configured');
  expect(output).toContain('- HMAC signature: configured');
  expect(output).toContain('"Authorization": "Bearer provider-bearer"');
  expect(output).toContain('"x-provider-signature":');
  expect(output).toContain('"event": "student_magic_link_ready"');
  expect(output).toContain('"name": "Saulo Demo"');
  expect(output).toContain('/sala/waiting-room-sample-456');
  expect(output).toContain('Manual test cURL');
  expect(output).toContain('curl -X POST');
  expect(output).toContain('https://provider.example/webhook/magic-link');
  expect(output).toContain('Authorization: Bearer provider-bearer');
  expect(output).toContain('Expected provider 2xx response');
  expect(output).toContain('"channel": "whatsapp"');
  expect(output).toContain('"deliveryId": "provider-delivery-001"');
});

test('product:check highlights local delivery smoke and provider contract guidance', () => {
  let output = '';

  try {
    execFileSync('node', ['scripts/check-product-setup.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SAULO_DATA_MODE: 'local',
        SUPABASE_URL: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        MAGIC_LINK_WEBHOOK_URL: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    output = `${error.stdout || ''}${error.stderr || ''}`;
  }

  expect(output).toContain('Saulo Fitness APP · Product readiness');
  expect(output).toContain('- Production auto-delivery webhook: missing');
  expect(output).toContain('- Student templates: 1');
  expect(output).toContain(
    '- Next Supabase product command: configure-supabase-env',
  );
  expect(output).toContain('- PWA manifest: ready');
  expect(output).toContain('start_url: /app/?section=routines&day=1');
  expect(output).toContain('scope: /app/');
  expect(output).toContain('display: standalone');
  expect(output).toContain('- App service worker: ready');
  expect(output).toContain('cache prefix: saulo-fitness-app-v12');
  expect(output).toContain('app shell routes cached: yes');
  expect(output).toContain('- Waiting room HTML: ready');
  expect(output).toContain('- Waiting room app: ready');
  expect(output).toContain('- Trainer panel: ready');
  expect(output).toContain('- Trainer bootstrap script: ready');
  expect(output).toContain('- Student bootstrap script: ready');
  expect(output).toContain('- Local delivery smoke: available');
  expect(output).toContain('npm run product:smoke:delivery');
  expect(output).toContain('npm run product:contract:delivery');
  expect(output).toContain('Next steps');
  expect(output).toContain(
    'Configura SAULO_DATA_MODE=supabase antes de validar el camino real de producto.',
  );
  expect(output).toContain(
    'Completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY con valores reales para salir del fallback local.',
  );
  expect(output).toContain(
    'Prepara el bootstrap del entrenador y ejecuta: npm run product:bootstrap:trainer',
  );
  expect(output).toContain(
    'Prepara el bootstrap del alumno y ejecuta: npm run product:bootstrap:student',
  );
  expect(output).toContain(
    'Define SMOKE_TRAINER_EMAIL y SMOKE_TRAINER_PASSWORD para poder ejecutar npm run product:smoke:supabase',
  );
  expect(output).toContain('- Recommended provider 2xx response:');
  expect(output).toContain('channel: whatsapp');
  expect(output).toContain('deliveryId: provider-delivery-001');
  expect(output).toContain('persistencia de channel y deliveryId');
  expect(output).toContain(
    'SAULO_DATA_MODE no está en "supabase". El producto sigue arrancando en modo local.',
  );
});

test('product:check points to the real Supabase smoke when the environment is prepared', () => {
  const output = execFileSync('node', ['scripts/check-product-setup.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      SAULO_DATA_MODE: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-real-value',
      SUPABASE_PROGRESS_PHOTOS_BUCKET: 'progress-photos',
      TRAINER_LOGIN_EMAIL: 'trainer-real@saulofitness.com',
      TRAINER_LOGIN_PASSWORD: 'super-secret-trainer-password',
      BOOTSTRAP_TRAINER_EMAIL: 'trainer-real@saulofitness.com',
      BOOTSTRAP_TRAINER_PASSWORD: 'super-secret-trainer-password',
      BOOTSTRAP_TRAINER_NAME: 'Saulo Trainer',
      BOOTSTRAP_STUDENT_TEMPLATE_PATH:
        'product-templates/students/lucia-ortega.json',
      BOOTSTRAP_STUDENT_CONTACT_EMAIL: 'lucia@saulofitness.app',
      SMOKE_TRAINER_EMAIL: 'trainer-real@saulofitness.com',
      SMOKE_TRAINER_PASSWORD: 'super-secret-trainer-password',
      SMOKE_STUDENT_CONTACT_EMAIL: 'lucia@saulofitness.app',
      MAGIC_LINK_WEBHOOK_URL: '',
    },
  });

  expect(output).toContain(
    '- Next Supabase product command: npm run product:smoke:supabase',
  );
  expect(output).toContain('- Supabase smoke trainer credentials: ready');
  expect(output).toContain('- Supabase smoke student target: ready');
  expect(output).toContain('- Trainer bootstrap helper vars: ready');
  expect(output).toContain('- Student bootstrap helper vars: ready');
  expect(output).toContain(
    'Con el entorno listo, ejecuta npm run product:smoke:supabase para validar login real, ownership y lectura del alumno.',
  );
});

test('product:handoff:delivery exports a provider-ready markdown handoff', () => {
  const outputPath = path.join(
    os.tmpdir(),
    `saulo-provider-handoff-${Date.now()}.md`,
  );

  const output = execFileSync(
    'node',
    ['scripts/export-magic-link-provider-handoff.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DELIVERY_HANDOFF_OUTPUT_PATH: outputPath,
        MAGIC_LINK_WEBHOOK_URL: 'https://provider.example/webhook/magic-link',
        MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'provider-bearer',
        MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER: 'x-provider-signature',
      },
    },
  );

  expect(output).toContain('Saulo Fitness APP · Provider handoff exported');
  expect(output).toContain(outputPath);

  const markdown = fs.readFileSync(outputPath, 'utf8');
  expect(markdown).toContain(
    '# Saulo Fitness APP · Magic Link Provider Handoff',
  );
  expect(markdown).toContain(
    '- Webhook URL: `https://provider.example/webhook/magic-link`',
  );
  expect(markdown).toContain('- Bearer auth: configured');
  expect(markdown).toContain('- HMAC signature: configured');
  expect(markdown).toContain('## Payload example');
  expect(markdown).toContain('## Expected 2xx response');
  expect(markdown).toContain('"channel": "whatsapp"');
  expect(markdown).toContain('"deliveryId": "provider-delivery-001"');
  expect(markdown).toContain('## Manual cURL test');
  expect(markdown).toContain('Authorization: Bearer provider-bearer');
});

test('product:handoff:go-live exports the delivery go-live checklist', () => {
  const outputPath = path.join(os.tmpdir(), `saulo-go-live-${Date.now()}.md`);

  const output = execFileSync(
    'node',
    ['scripts/export-delivery-go-live-checklist.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DELIVERY_GO_LIVE_OUTPUT_PATH: outputPath,
        SAULO_DATA_MODE: 'supabase',
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-real-value',
        MAGIC_LINK_WEBHOOK_URL: 'https://provider.example/webhook/magic-link',
        MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'provider-bearer',
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Delivery go-live checklist exported',
  );
  expect(output).toContain(outputPath);

  const markdown = fs.readFileSync(outputPath, 'utf8');
  expect(markdown).toContain(
    '# Saulo Fitness APP · Delivery Go Live Checklist',
  );
  expect(markdown).toContain('## Flujo de acceso cerrado');
  expect(markdown).toContain('El entrenador marca `pago recibido`.');
  expect(markdown).toContain('[x] Modo producto en Supabase');
  expect(markdown).toContain(
    '[x] Webhook automático de magic link configurado',
  );
  expect(markdown).toContain('npm run product:smoke:delivery');
  expect(markdown).toContain('Waiting room path ejemplo');
  expect(markdown).toContain(
    'Respuesta 2xx recomendada: `channel` + `deliveryId`',
  );
});
