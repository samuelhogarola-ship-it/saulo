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
        MAGIC_LINK_WEBHOOK_URL:
          'https://project.supabase.co/functions/v1/magic-link-delivery',
        MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'provider-bearer',
        MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER: 'x-provider-signature',
        DELIVERY_CONTRACT_STUDENT_NAME: 'Saulo Premium',
        DELIVERY_CONTRACT_WAITING_ROOM_TOKEN: 'waiting-room-sample-456',
      },
    },
  );

  expect(output).toContain('Saulo Fitness APP · Supabase delivery contract');
  expect(output).toContain(
    '- Webhook URL: https://project.supabase.co/functions/v1/magic-link-delivery',
  );
  expect(output).toContain('- Signature header: x-provider-signature');
  expect(output).toContain('- Bearer auth: configured');
  expect(output).toContain('- HMAC signature: configured');
  expect(output).toContain('"Authorization": "Bearer provider-bearer"');
  expect(output).toContain('"x-provider-signature":');
  expect(output).toContain('"event": "student_magic_link_ready"');
  expect(output).toContain('"name": "Saulo Premium"');
  expect(output).toContain('/acceso/waiting-room-sample-456');
  expect(output).toContain('Manual test cURL');
  expect(output).toContain('curl -X POST');
  expect(output).toContain(
    'https://project.supabase.co/functions/v1/magic-link-delivery',
  );
  expect(output).toContain('Authorization: Bearer provider-bearer');
  expect(output).toContain('Expected endpoint 2xx response');
  expect(output).toContain('"channel": "whatsapp"');
  expect(output).toContain('"deliveryId": "supabase-delivery-001"');
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
    '- Next Supabase product command: npm run product:env:template',
  );
  expect(output).toContain(
    '- Next delivery command: npm run product:handoff:delivery',
  );
  expect(output).toContain(
    '- Next activation command: npm run product:handoff:delivery',
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
  expect(output).toContain('- Supabase delivery function: ready');
  expect(output).toContain('- Local delivery smoke: available');
  expect(output).toContain('npm run product:smoke:delivery');
  expect(output).toContain('npm run product:smoke:activation');
  expect(output).toContain('npm run product:contract:delivery');
  expect(output).toContain('npm run product:env:template');
  expect(output).toContain('npm run product:env:activate-supabase');
  expect(output).toContain('npm run product:env:function');
  expect(output).toContain('npm run product:handoff:function');
  expect(output).toContain('npm run product:handoff:activation');
  expect(output).toContain('npm run product:handoff:bundle');
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
  expect(output).toContain(
    'Si quieres cerrar también la entrega automática, conecta MAGIC_LINK_WEBHOOK_URL y después lanza npm run product:smoke:delivery.',
  );
  expect(output).toContain('- Recommended delivery 2xx response:');
  expect(output).toContain('channel: whatsapp');
  expect(output).toContain('deliveryId: supabase-delivery-001');
  expect(output).toContain('persistencia de channel y deliveryId');
  expect(output).toContain('Missing env vars by area');
  expect(output).toContain('Delivery webhook');
  expect(output).toContain('BOOTSTRAP_TRAINER_EMAIL or TRAINER_LOGIN_EMAIL');
  expect(output).toContain(
    'BOOTSTRAP_TRAINER_PASSWORD or TRAINER_LOGIN_PASSWORD',
  );
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
  expect(output).toContain(
    '- Next delivery command: npm run product:handoff:delivery',
  );
  expect(output).toContain(
    '- Next activation command: npm run product:handoff:delivery',
  );
});

test('product:check points to the real delivery smoke when webhook is configured', () => {
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
      MAGIC_LINK_WEBHOOK_URL:
        'https://project.supabase.co/functions/v1/magic-link-delivery',
      MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
    },
  });

  expect(output).toContain(
    '- Next delivery command: npm run product:smoke:delivery',
  );
  expect(output).toContain(
    '- Next activation command: npm run product:smoke:activation',
  );
  expect(output).toContain('- Production auto-delivery webhook: configured');
  expect(output).toContain('- Webhook signature: configured');
  expect(output).toContain(
    'Con el webhook configurado, ejecuta npm run product:smoke:delivery para validar el circuito pago recibido -> webhook -> sala de espera.',
  );
  expect(output).toContain(
    'Después, ejecuta npm run product:smoke:activation para validar sala de espera, sesión activa y reapertura already-opened.',
  );
});

test('product:check accepts trainer login fallbacks and a single detected template for bootstrap readiness', () => {
  const output = execFileSync('node', ['scripts/check-product-setup.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      SAULO_DATA_MODE: 'supabase',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-real-value',
      TRAINER_LOGIN_EMAIL: 'trainer-real@saulofitness.com',
      TRAINER_LOGIN_PASSWORD: 'super-secret-trainer-password',
      SMOKE_TRAINER_EMAIL: 'trainer-real@saulofitness.com',
      SMOKE_TRAINER_PASSWORD: 'super-secret-trainer-password',
      MAGIC_LINK_WEBHOOK_URL: '',
      BOOTSTRAP_TRAINER_EMAIL: '',
      BOOTSTRAP_TRAINER_PASSWORD: '',
      BOOTSTRAP_TRAINER_NAME: '',
      BOOTSTRAP_STUDENT_TEMPLATE_PATH: '',
      BOOTSTRAP_STUDENT_NAME: '',
      BOOTSTRAP_STUDENT_CONTACT_EMAIL: '',
    },
  });

  expect(output).toContain('- Trainer bootstrap helper vars: ready');
  expect(output).toContain('- Student bootstrap helper vars: ready');
  expect(output).not.toContain(
    'BOOTSTRAP_TRAINER_EMAIL or TRAINER_LOGIN_EMAIL',
  );
  expect(output).not.toContain(
    'BOOTSTRAP_TRAINER_PASSWORD or TRAINER_LOGIN_PASSWORD',
  );
  expect(output).not.toContain(
    'BOOTSTRAP_STUDENT_TEMPLATE_PATH or plantilla unica detectada o BOOTSTRAP_STUDENT_NAME + BOOTSTRAP_STUDENT_CONTACT_EMAIL',
  );
});

test('product:env:function exports the Supabase Edge Function template', () => {
  const outputPath = path.join(
    os.tmpdir(),
    `saulo-function-template-${Date.now()}.env`,
  );

  const output = execFileSync(
    'node',
    ['scripts/export-supabase-function-template.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SUPABASE_FUNCTION_TEMPLATE_OUTPUT_PATH: outputPath,
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Supabase function template exported',
  );
  expect(output).toContain(outputPath);

  const template = fs.readFileSync(outputPath, 'utf8');
  expect(template).toContain('# Edge Function: magic-link-delivery');
  expect(template).toContain('SAULO_WEBHOOK_SECRET=');
  expect(template).toContain('SAULO_WEBHOOK_BEARER_TOKEN=');
  expect(template).toContain('DELIVERY_DOWNSTREAM_URL=');
  expect(template).toContain('supabase functions deploy magic-link-delivery');
  expect(template).toContain(
    'MAGIC_LINK_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/magic-link-delivery',
  );
});

test('product:handoff:function exports deploy and secrets commands for the Edge Function', () => {
  const outputPath = path.join(
    os.tmpdir(),
    `saulo-function-handoff-${Date.now()}.md`,
  );

  const output = execFileSync(
    'node',
    ['scripts/export-supabase-function-handoff.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SUPABASE_FUNCTION_HANDOFF_OUTPUT_PATH: outputPath,
        MAGIC_LINK_WEBHOOK_SECRET: 'shared-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'app-bearer',
        MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER: 'x-saulo-signature',
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Supabase function handoff exported',
  );
  expect(output).toContain(outputPath);

  const markdown = fs.readFileSync(outputPath, 'utf8');
  expect(markdown).toContain('# Saulo Fitness APP · Supabase Function Handoff');
  expect(markdown).toContain('supabase functions deploy magic-link-delivery');
  expect(markdown).toContain('supabase secrets set');
  expect(markdown).toContain("SAULO_WEBHOOK_SECRET='shared-secret'");
  expect(markdown).toContain("SAULO_WEBHOOK_BEARER_TOKEN='app-bearer'");
  expect(markdown).toContain(
    'MAGIC_LINK_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/magic-link-delivery',
  );
  expect(markdown).toContain('npm run product:smoke:delivery');
});

test('product:handoff:activation exports the ordered real-product activation runbook', () => {
  const outputPath = path.join(
    os.tmpdir(),
    `saulo-activation-runbook-${Date.now()}.md`,
  );

  const output = execFileSync(
    'node',
    ['scripts/export-product-activation-runbook.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PRODUCT_ACTIVATION_RUNBOOK_OUTPUT_PATH: outputPath,
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Product activation runbook exported',
  );
  expect(output).toContain(outputPath);

  const markdown = fs.readFileSync(outputPath, 'utf8');
  expect(markdown).toContain(
    '# Saulo Fitness APP · Product Activation Runbook',
  );
  expect(markdown).toContain('npm run product:check');
  expect(markdown).toContain('npm run product:env:template');
  expect(markdown).toContain('npm run product:env:function');
  expect(markdown).toContain('npm run product:handoff:function');
  expect(markdown).toContain('npm run product:bootstrap:trainer');
  expect(markdown).toContain('npm run product:bootstrap:student');
  expect(markdown).toContain('npm run product:smoke:supabase');
  expect(markdown).toContain('supabase functions deploy magic-link-delivery');
  expect(markdown).toContain('npm run product:smoke:delivery');
  expect(markdown).toContain('npm run product:smoke:activation');
  expect(markdown).toContain('docs/delivery-go-live-checklist.md');
});

test('product:handoff:bundle regenerates the full operational package', () => {
  const output = execFileSync(
    'node',
    ['scripts/export-product-handoff-bundle.js'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Product handoff bundle exported',
  );
  expect(output).toContain(
    'Generated env templates, function handoff, delivery handoff, activation runbook and go-live checklist.',
  );
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/product-env-template.env')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/product-next-commands.md')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/supabase-function-template.env')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/supabase-function-handoff.md')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/provider-magic-link-handoff.md')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/product-activation-runbook.md')),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(repoRoot, 'docs/delivery-go-live-checklist.md')),
  ).toBe(true);
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
        MAGIC_LINK_WEBHOOK_URL:
          'https://project.supabase.co/functions/v1/magic-link-delivery',
        MAGIC_LINK_WEBHOOK_SECRET: 'provider-secret',
        MAGIC_LINK_WEBHOOK_BEARER_TOKEN: 'provider-bearer',
        MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER: 'x-provider-signature',
      },
    },
  );

  expect(output).toContain(
    'Saulo Fitness APP · Supabase delivery handoff exported',
  );
  expect(output).toContain(outputPath);
  expect(output).toContain('Supabase Edge Function');

  const markdown = fs.readFileSync(outputPath, 'utf8');
  expect(markdown).toContain(
    '# Saulo Fitness APP · Supabase Magic Link Delivery Handoff',
  );
  expect(markdown).toContain(
    '- Webhook URL: `https://project.supabase.co/functions/v1/magic-link-delivery`',
  );
  expect(markdown).toContain('- Bearer auth: configured');
  expect(markdown).toContain('- HMAC signature: configured');
  expect(markdown).toContain('## Payload example');
  expect(markdown).toContain('## Expected 2xx response');
  expect(markdown).toContain('"channel": "whatsapp"');
  expect(markdown).toContain('"deliveryId": "supabase-delivery-001"');
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
        MAGIC_LINK_WEBHOOK_URL:
          'https://project.supabase.co/functions/v1/magic-link-delivery',
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
  expect(markdown).toContain('npm run product:smoke:activation');
  expect(markdown).toContain('Waiting room path ejemplo');
  expect(markdown).toContain('Contrato del endpoint de entrega');
  expect(markdown).toContain(
    'https://project.supabase.co/functions/v1/magic-link-delivery',
  );
  expect(markdown).toContain(
    'Respuesta 2xx recomendada: `channel` + `deliveryId`',
  );
});

test('supabase delivery function scaffold exists with echo and forward modes', () => {
  const functionPath = path.join(
    repoRoot,
    'supabase/functions/magic-link-delivery/index.ts',
  );
  const readmePath = path.join(
    repoRoot,
    'supabase/functions/magic-link-delivery/README.md',
  );

  expect(fs.existsSync(functionPath)).toBe(true);
  expect(fs.existsSync(readmePath)).toBe(true);

  const source = fs.readFileSync(functionPath, 'utf8');
  const readme = fs.readFileSync(readmePath, 'utf8');

  expect(source).toContain("mode: 'echo'");
  expect(source).toContain("mode: 'forward'");
  expect(source).toContain('student_magic_link_ready');
  expect(source).toContain('SAULO_WEBHOOK_SECRET');
  expect(source).toContain('DELIVERY_DOWNSTREAM_URL');
  expect(readme).toContain('supabase functions deploy magic-link-delivery');
  expect(readme).toContain('### 1. `echo`');
  expect(readme).toContain('### 2. `forward`');
});

test('product activation smoke script exists', () => {
  const scriptPath = path.join(repoRoot, 'scripts/smoke-product-activation.js');

  expect(fs.existsSync(scriptPath)).toBe(true);

  const source = fs.readFileSync(scriptPath, 'utf8');
  expect(source).toContain('Saulo Fitness APP · Product activation smoke');
  expect(source).toContain('/api/waiting-room/');
  expect(source).toContain('/api/student/session');
  expect(source).toContain('/api/student/routine?day=1');
});
