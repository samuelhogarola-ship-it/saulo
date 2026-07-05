const fs = require('node:fs');
const path = require('node:path');

const { delivery, projectRoot, runtime, supabase } = require('../lib/config');
const {
  buildDeliveryContract,
} = require('../lib/magic-link-provider-contract');

const migrationDir = path.join(projectRoot, 'supabase', 'migrations');
const manifestPath = path.join(projectRoot, 'app', 'manifest.webmanifest');
const serviceWorkerPath = path.join(projectRoot, 'app', 'sw.js');
const waitingRoomIndexPath = path.join(
  projectRoot,
  'waiting-room',
  'index.html',
);
const waitingRoomAppPath = path.join(projectRoot, 'waiting-room', 'app.js');
const trainerIndexPath = path.join(projectRoot, 'trainer', 'index.html');
const bootstrapTrainerPath = path.join(
  projectRoot,
  'scripts',
  'bootstrap-supabase-trainer.js',
);
const bootstrapStudentPath = path.join(
  projectRoot,
  'scripts',
  'bootstrap-supabase-student.js',
);
const supabaseDeliveryFunctionPath = path.join(
  projectRoot,
  'supabase',
  'functions',
  'magic-link-delivery',
  'index.ts',
);
const studentTemplatesDir = path.join(
  projectRoot,
  'product-templates',
  'students',
);
const failures = [];
const warnings = [];
const notes = [];

const migrationFiles = fs.existsSync(migrationDir)
  ? fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
  : [];
const studentTemplateFiles = fs.existsSync(studentTemplatesDir)
  ? fs
      .readdirSync(studentTemplatesDir)
      .filter((file) => file.endsWith('.json'))
      .sort()
  : [];
const productFiles = [
  {
    label: 'Waiting room HTML',
    path: waitingRoomIndexPath,
  },
  {
    label: 'Waiting room app',
    path: waitingRoomAppPath,
  },
  {
    label: 'Trainer panel',
    path: trainerIndexPath,
  },
  {
    label: 'Trainer bootstrap script',
    path: bootstrapTrainerPath,
  },
  {
    label: 'Student bootstrap script',
    path: bootstrapStudentPath,
  },
  {
    label: 'Supabase delivery function',
    path: supabaseDeliveryFunctionPath,
  },
];
const smokeSupabaseReadiness = resolveSupabaseSmokeReadiness();
const bootstrapReadiness = resolveBootstrapReadiness();
const envChecklist = resolveEnvChecklist();
const supabaseEnvPresence = resolveSupabaseEnvPresence();

const manifestCheck = readManifest();
const serviceWorkerCheck = readServiceWorker();

if (runtime.requestedDataMode !== 'supabase') {
  failures.push(
    'SAULO_DATA_MODE no está en "supabase". El producto sigue arrancando en modo local.',
  );
}

if (!supabase.hasConfig) {
  failures.push(
    supabaseEnvPresence.urlPresent && supabaseEnvPresence.serviceRoleKeyPresent
      ? 'Hay credenciales reales de Supabase presentes, pero no se están usando porque SAULO_DATA_MODE sigue en local.'
      : 'Falta configurar SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY con valores reales.',
  );
}

if (!migrationFiles.length) {
  failures.push('No se encontraron migraciones SQL en supabase/migrations.');
}

if (!manifestCheck.exists) {
  failures.push('Falta app/manifest.webmanifest para la instalación PWA.');
} else if (!manifestCheck.isValid) {
  failures.push(
    'app/manifest.webmanifest no cumple el mínimo de producto (scope /app/, display standalone, start_url /app/ e iconos).',
  );
}

if (!serviceWorkerCheck.exists) {
  failures.push('Falta app/sw.js para el shell offline de la PWA.');
} else if (!serviceWorkerCheck.isValid) {
  failures.push(
    'app/sw.js no parece limitado al shell de /app/ con caches saulo-fitness-app-*.',
  );
}

productFiles.forEach((file) => {
  if (!fs.existsSync(file.path)) {
    failures.push(
      `Falta ${file.label} en ${path.relative(projectRoot, file.path)}.`,
    );
  }
});

if (!studentTemplateFiles.length) {
  warnings.push(
    'No hay plantillas JSON de alumnos en product-templates/students. Las nuevas altas dependerán de carga manual.',
  );
}

if (!smokeSupabaseReadiness.credentialsReady) {
  warnings.push(
    'Faltan credenciales reales para npm run product:smoke:supabase. Define SMOKE_TRAINER_EMAIL y SMOKE_TRAINER_PASSWORD, o deja TRAINER_LOGIN_EMAIL y TRAINER_LOGIN_PASSWORD reales.',
  );
}

if (!smokeSupabaseReadiness.studentTargetConfigured) {
  notes.push(
    'El smoke de Supabase no tiene alumno objetivo fijado. Si habrá más de un alumno, define SMOKE_STUDENT_ID o SMOKE_STUDENT_CONTACT_EMAIL.',
  );
}

if (
  runtime.requestedDataMode !== 'supabase' &&
  supabaseEnvPresence.urlPresent &&
  supabaseEnvPresence.serviceRoleKeyPresent
) {
  notes.push(
    'Hay credenciales reales de Supabase presentes en el entorno, pero siguen inactivas porque SAULO_DATA_MODE no está en supabase.',
  );
}

if (!bootstrapReadiness.trainerReady) {
  notes.push(
    'El bootstrap de entrenador aún no tiene credenciales reales listas. Revisa BOOTSTRAP_TRAINER_EMAIL y BOOTSTRAP_TRAINER_PASSWORD, o reutiliza TRAINER_LOGIN_EMAIL y TRAINER_LOGIN_PASSWORD. BOOTSTRAP_TRAINER_NAME es opcional.',
  );
}

if (!bootstrapReadiness.studentReady) {
  notes.push(
    'El bootstrap de alumno aún no tiene un objetivo claro. Revisa BOOTSTRAP_TRAINER_EMAIL, BOOTSTRAP_TRAINER_ID o TRAINER_LOGIN_EMAIL y una plantilla, la plantilla única detectada o email de alumno.',
  );
}

if (!delivery.webhookUrl) {
  warnings.push(
    'MAGIC_LINK_WEBHOOK_URL no está configurado. El envío del acceso seguirá en modo manual.',
  );
}

if (delivery.webhookUrl && !delivery.webhookSecret) {
  warnings.push(
    'MAGIC_LINK_WEBHOOK_SECRET no está configurado. El webhook saldrá sin firma HMAC.',
  );
}

if (!supabase.storageBucket) {
  warnings.push(
    'SUPABASE_PROGRESS_PHOTOS_BUCKET no está definido. Se usará el bucket por defecto.',
  );
}

const localDeliverySmoke = {
  appPort: Number(process.env.DELIVERY_SMOKE_APP_PORT || 4317),
  providerPort: Number(process.env.DELIVERY_SMOKE_PROVIDER_PORT || 8788),
  providerHost: process.env.DELIVERY_SMOKE_PROVIDER_HOST || '127.0.0.1',
  outputPath:
    process.env.DELIVERY_SMOKE_OUTPUT_PATH || '(tmp automatico del sistema)',
};
const localActivationSmoke = {
  appPort: Number(process.env.ACTIVATION_SMOKE_APP_PORT || 4318),
  deliveryPort: Number(process.env.ACTIVATION_SMOKE_DELIVERY_PORT || 8789),
  deliveryHost: process.env.ACTIVATION_SMOKE_DELIVERY_HOST || '127.0.0.1',
  outputPath:
    process.env.ACTIVATION_SMOKE_OUTPUT_PATH || '(tmp automatico del sistema)',
};
const deliveryContract = buildDeliveryContract();
const nextSteps = buildNextSteps({
  bootstrapReadiness,
  smokeSupabaseReadiness,
  runtime,
  supabase,
});
const nextSupabaseCommand = resolveNextSupabaseCommand({
  bootstrapReadiness,
  smokeSupabaseReadiness,
  runtime,
  supabase,
});
const nextDeliveryCommand = resolveNextDeliveryCommand({ delivery });
const nextActivationCommand = resolveNextActivationCommand({ delivery });

notes.push(
  'Puedes validar la entrega automática sin canal externo final con: npm run product:smoke:delivery',
);
notes.push(
  'Puedes validar el circuito completo hasta sesión activa con: npm run product:smoke:activation',
);
notes.push(
  'Puedes exportar el contrato exacto del webhook para tu Edge Function de Supabase con: npm run product:contract:delivery',
);
notes.push(
  'Puedes exportar una plantilla accionable de entorno real con: npm run product:env:template',
);
notes.push(
  'Puedes exportar los comandos exactos de bootstrap y smoke con: npm run product:env:commands',
);
notes.push(
  'Puedes exportar la plantilla de secrets de la Edge Function con: npm run product:env:function',
);
notes.push(
  'Puedes exportar el handoff completo de deploy y secrets de la Edge Function con: npm run product:handoff:function',
);
notes.push(
  'Puedes exportar un runbook único de activación real con: npm run product:handoff:activation',
);
notes.push(
  'Puedes regenerar todo el paquete operativo con: npm run product:handoff:bundle',
);
notes.push(
  'Si las credenciales reales ya están presentes en .env, puedes activar el modo producto con: npm run product:env:activate-supabase',
);
notes.push(
  'El smoke local ya valida no solo el waiting room link, sino también la persistencia de channel y deliveryId devueltos por el endpoint de entrega.',
);

if (!delivery.webhookBearerToken) {
  notes.push(
    'MAGIC_LINK_WEBHOOK_BEARER_TOKEN no está configurado. La Edge Function real funcionará sin bearer solo si lo permites explícitamente.',
  );
}

console.log('Saulo Fitness APP · Product readiness');
console.log(`- Requested data mode: ${runtime.requestedDataMode}`);
console.log(`- Resolved data mode: ${runtime.resolvedDataMode}`);
console.log(`- Supabase configured: ${supabase.hasConfig ? 'yes' : 'no'}`);
console.log(
  `- Real Supabase env vars present: ${supabaseEnvPresence.urlPresent && supabaseEnvPresence.serviceRoleKeyPresent ? 'yes' : 'no'}`,
);
console.log(`- Progress photos bucket: ${supabase.storageBucket}`);
console.log(`- Webhook timeout: ${delivery.webhookTimeoutMs}ms`);
console.log(`- SQL migrations: ${migrationFiles.length}`);
console.log(`- Student templates: ${studentTemplateFiles.length}`);
console.log(`- Next Supabase product command: ${nextSupabaseCommand}`);
console.log(`- Next delivery command: ${nextDeliveryCommand}`);
console.log(`- Next activation command: ${nextActivationCommand}`);
console.log(
  `- Missing real env vars: ${countMissingEnvVars(envChecklist.missing)}`,
);
console.log(
  `- Supabase smoke trainer credentials: ${smokeSupabaseReadiness.credentialsReady ? 'ready' : 'missing'}`,
);
console.log(
  `- Supabase smoke student target: ${smokeSupabaseReadiness.studentTargetConfigured ? 'ready' : 'not-fixed'}`,
);
console.log(
  `- Trainer bootstrap helper vars: ${bootstrapReadiness.trainerReady ? 'ready' : 'missing'}`,
);
console.log(
  `- Student bootstrap helper vars: ${bootstrapReadiness.studentReady ? 'ready' : 'missing'}`,
);
console.log(
  `- PWA manifest: ${manifestCheck.exists ? (manifestCheck.isValid ? 'ready' : 'invalid') : 'missing'}`,
);
if (manifestCheck.exists) {
  console.log(`  · start_url: ${manifestCheck.startUrl}`);
  console.log(`  · scope: ${manifestCheck.scope}`);
  console.log(`  · display: ${manifestCheck.display}`);
  console.log(`  · icons: ${manifestCheck.iconCount}`);
}
console.log(
  `- App service worker: ${serviceWorkerCheck.exists ? (serviceWorkerCheck.isValid ? 'ready' : 'invalid') : 'missing'}`,
);
if (serviceWorkerCheck.exists) {
  console.log(
    `  · cache prefix: ${serviceWorkerCheck.cachePrefix || 'missing'}`,
  );
  console.log(
    `  · app shell routes cached: ${serviceWorkerCheck.hasAppShell ? 'yes' : 'no'}`,
  );
}
productFiles.forEach((file) => {
  console.log(
    `- ${file.label}: ${fs.existsSync(file.path) ? 'ready' : 'missing'}`,
  );
});
console.log(
  `- Production auto-delivery webhook: ${delivery.webhookUrl ? 'configured' : 'missing'}`,
);
console.log(
  `- Webhook signature: ${delivery.webhookSecret ? 'configured' : 'missing'}`,
);
console.log(
  `- Webhook bearer auth: ${delivery.webhookBearerToken ? 'configured' : 'missing'}`,
);
console.log('- Local delivery smoke: available');
console.log(`  · App port: ${localDeliverySmoke.appPort}`);
console.log(
  `  · Mock delivery endpoint: http://${localDeliverySmoke.providerHost}:${localDeliverySmoke.providerPort}/webhook/magic-link`,
);
console.log(`  · Output file: ${localDeliverySmoke.outputPath}`);
console.log('- Local activation smoke: available');
console.log(`  · App port: ${localActivationSmoke.appPort}`);
console.log(
  `  · Mock delivery endpoint: http://${localActivationSmoke.deliveryHost}:${localActivationSmoke.deliveryPort}/webhook/magic-link`,
);
console.log(`  · Output file: ${localActivationSmoke.outputPath}`);
console.log('- Recommended delivery 2xx response:');
console.log(`  · channel: ${deliveryContract.responseExample.channel}`);
console.log(`  · deliveryId: ${deliveryContract.responseExample.deliveryId}`);

if (migrationFiles.length) {
  migrationFiles.forEach((file) => {
    console.log(`  · ${file}`);
  });
}

if (notes.length) {
  console.log('\nOperational notes');
  notes.forEach((note) => console.log(`- ${note}`));
}

if (hasMissingEnvVars(envChecklist.missing)) {
  console.log('\nMissing env vars by area');
  printMissingEnvGroup('Supabase core', envChecklist.missing.supabase);
  printMissingEnvGroup(
    'Trainer bootstrap',
    envChecklist.missing.trainerBootstrap,
  );
  printMissingEnvGroup(
    'Student bootstrap',
    envChecklist.missing.studentBootstrap,
  );
  printMissingEnvGroup('Supabase smoke', envChecklist.missing.supabaseSmoke);
  printMissingEnvGroup('Delivery webhook', envChecklist.missing.delivery);
}

if (nextSteps.length) {
  console.log('\nNext steps');
  nextSteps.forEach((step, index) => console.log(`${index + 1}. ${step}`));
}

if (warnings.length) {
  console.log('\nWarnings');
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (failures.length) {
  console.log('\nBlocking issues');
  failures.forEach((failure) => console.log(`- ${failure}`));
  process.exit(1);
}

console.log(
  '\nProduct mode is ready to be wired into production infrastructure.',
);

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    return {
      exists: false,
      isValid: false,
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const startUrl = String(manifest.start_url || '');
    const scope = String(manifest.scope || '');
    const display = String(manifest.display || '');
    const iconCount = Array.isArray(manifest.icons) ? manifest.icons.length : 0;
    const isValid =
      startUrl.startsWith('/app/') &&
      scope === '/app/' &&
      display === 'standalone' &&
      iconCount >= 1;

    return {
      exists: true,
      isValid,
      startUrl,
      scope,
      display,
      iconCount,
    };
  } catch (_error) {
    return {
      exists: true,
      isValid: false,
      startUrl: 'invalid-json',
      scope: 'invalid-json',
      display: 'invalid-json',
      iconCount: 0,
    };
  }
}

function readServiceWorker() {
  if (!fs.existsSync(serviceWorkerPath)) {
    return {
      exists: false,
      isValid: false,
    };
  }

  const source = fs.readFileSync(serviceWorkerPath, 'utf8');
  const cachePrefixMatch = source.match(/saulo-fitness-app-[^']+/);
  const hasScopedCacheCleanup = source.includes(
    "key.startsWith('saulo-fitness-app-')",
  );
  const hasAppShell =
    source.includes("'/app/'") &&
    source.includes("pathname.startsWith('/app/')");

  return {
    exists: true,
    isValid: Boolean(cachePrefixMatch && hasScopedCacheCleanup && hasAppShell),
    cachePrefix: cachePrefixMatch ? cachePrefixMatch[0] : '',
    hasAppShell,
  };
}

function resolveSupabaseSmokeReadiness() {
  const smokeTrainerEmail = firstMeaningfulValue(
    process.env.SMOKE_TRAINER_EMAIL,
    process.env.TRAINER_LOGIN_EMAIL,
  );
  const smokeTrainerPassword = firstMeaningfulValue(
    process.env.SMOKE_TRAINER_PASSWORD,
    process.env.TRAINER_LOGIN_PASSWORD,
  );
  const studentTargetConfigured = [
    process.env.SMOKE_STUDENT_ID,
    process.env.SMOKE_STUDENT_CONTACT_EMAIL,
    process.env.SMOKE_STUDENT_NAME,
    process.env.SMOKE_STUDENT_ACCESS_TOKEN,
  ].some((value) => hasMeaningfulValue(value));

  return {
    credentialsReady:
      hasMeaningfulValue(smokeTrainerEmail) &&
      hasMeaningfulValue(smokeTrainerPassword),
    studentTargetConfigured,
  };
}

function resolveBootstrapReadiness() {
  const trainerEmail = firstMeaningfulValue(
    process.env.BOOTSTRAP_TRAINER_EMAIL,
    process.env.TRAINER_LOGIN_EMAIL,
  );
  const trainerPassword = firstMeaningfulValue(
    process.env.BOOTSTRAP_TRAINER_PASSWORD,
    process.env.TRAINER_LOGIN_PASSWORD,
  );
  const trainerReady =
    hasMeaningfulValue(trainerEmail) && hasMeaningfulValue(trainerPassword);
  const hasTrainerBinding =
    hasMeaningfulValue(trainerEmail) ||
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_ID);
  const hasStudentInput =
    hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_TEMPLATE_PATH) ||
    studentTemplateFiles.length === 1 ||
    (hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_NAME) &&
      hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_CONTACT_EMAIL));

  return {
    trainerReady,
    studentReady: hasTrainerBinding && hasStudentInput,
  };
}

function resolveSupabaseEnvPresence() {
  return {
    urlPresent: hasMeaningfulValue(process.env.SUPABASE_URL),
    serviceRoleKeyPresent: hasMeaningfulValue(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}

function resolveEnvChecklist() {
  return {
    missing: {
      supabase: collectMissingEnvKeys([
        ['SAULO_DATA_MODE', runtime.requestedDataMode === 'supabase'],
        ['SUPABASE_URL', hasMeaningfulValue(process.env.SUPABASE_URL)],
        [
          'SUPABASE_SERVICE_ROLE_KEY',
          hasMeaningfulValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
        ],
      ]),
      trainerBootstrap: collectMissingEnvKeys([
        [
          'BOOTSTRAP_TRAINER_EMAIL or TRAINER_LOGIN_EMAIL',
          hasMeaningfulValue(
            firstMeaningfulValue(
              process.env.BOOTSTRAP_TRAINER_EMAIL,
              process.env.TRAINER_LOGIN_EMAIL,
            ),
          ),
        ],
        [
          'BOOTSTRAP_TRAINER_PASSWORD or TRAINER_LOGIN_PASSWORD',
          hasMeaningfulValue(
            firstMeaningfulValue(
              process.env.BOOTSTRAP_TRAINER_PASSWORD,
              process.env.TRAINER_LOGIN_PASSWORD,
            ),
          ),
        ],
      ]),
      studentBootstrap: collectMissingEnvKeys([
        [
          'BOOTSTRAP_TRAINER_EMAIL or BOOTSTRAP_TRAINER_ID or TRAINER_LOGIN_EMAIL',
          hasMeaningfulValue(
            firstMeaningfulValue(
              process.env.BOOTSTRAP_TRAINER_EMAIL,
              process.env.TRAINER_LOGIN_EMAIL,
            ),
          ) || hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_ID),
        ],
        [
          'BOOTSTRAP_STUDENT_TEMPLATE_PATH or plantilla unica detectada o BOOTSTRAP_STUDENT_NAME + BOOTSTRAP_STUDENT_CONTACT_EMAIL',
          hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_TEMPLATE_PATH) ||
            studentTemplateFiles.length === 1 ||
            (hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_NAME) &&
              hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_CONTACT_EMAIL)),
        ],
      ]),
      supabaseSmoke: collectMissingEnvKeys([
        [
          'SMOKE_TRAINER_EMAIL',
          hasMeaningfulValue(process.env.SMOKE_TRAINER_EMAIL),
        ],
        [
          'SMOKE_TRAINER_PASSWORD',
          hasMeaningfulValue(process.env.SMOKE_TRAINER_PASSWORD),
        ],
        [
          'SMOKE_STUDENT_ID or SMOKE_STUDENT_CONTACT_EMAIL',
          hasMeaningfulValue(process.env.SMOKE_STUDENT_ID) ||
            hasMeaningfulValue(process.env.SMOKE_STUDENT_CONTACT_EMAIL),
        ],
      ]),
      delivery: collectMissingEnvKeys([
        [
          'MAGIC_LINK_WEBHOOK_URL',
          hasMeaningfulValue(process.env.MAGIC_LINK_WEBHOOK_URL),
        ],
      ]),
    },
  };
}

function collectMissingEnvKeys(pairs) {
  return pairs.filter(([, ok]) => !ok).map(([name]) => name);
}

function hasMissingEnvVars(groups) {
  return Object.values(groups).some((items) => items.length > 0);
}

function countMissingEnvVars(groups) {
  return Object.values(groups).reduce(
    (total, items) => total + items.length,
    0,
  );
}

function printMissingEnvGroup(label, items) {
  if (!items.length) {
    return;
  }

  console.log(`- ${label}:`);
  items.forEach((item) => console.log(`  · ${item}`));
}

function firstMeaningfulValue(...values) {
  return values.find((value) => hasMeaningfulValue(value)) || '';
}

function hasMeaningfulValue(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return false;
  }

  return ![
    /^change-me$/i,
    /^replace-with/i,
    /^your-/i,
    /^example/i,
    /^xxxx/i,
    /^https?:\/\/your-project\b/i,
    /^https?:\/\/provider\.example\b/i,
    /^https?:\/\/your-project\.supabase\.co\/functions\/v1\/magic-link-delivery\b/i,
    /^local@saulofitness\.app$/i,
    /^saulo1234$/i,
  ].some((pattern) => pattern.test(normalized));
}

function buildNextSteps({
  bootstrapReadiness,
  smokeSupabaseReadiness,
  runtime,
  supabase,
}) {
  const steps = [];

  if (runtime.requestedDataMode !== 'supabase') {
    steps.push(
      supabaseEnvPresence.urlPresent &&
        supabaseEnvPresence.serviceRoleKeyPresent
        ? 'Ejecuta npm run product:env:activate-supabase para activar el producto real con las credenciales ya presentes.'
        : 'Configura SAULO_DATA_MODE=supabase antes de validar el camino real de producto.',
    );
  }

  if (!supabase.hasConfig) {
    if (
      !(
        runtime.requestedDataMode !== 'supabase' &&
        supabaseEnvPresence.urlPresent &&
        supabaseEnvPresence.serviceRoleKeyPresent
      )
    ) {
      steps.push(
        'Completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY con valores reales para salir del fallback local.',
      );
    }
  }

  if (!bootstrapReadiness.trainerReady) {
    steps.push(
      'Prepara el bootstrap del entrenador y ejecuta: npm run product:bootstrap:trainer',
    );
  }

  if (!bootstrapReadiness.studentReady) {
    steps.push(
      'Prepara el bootstrap del alumno y ejecuta: npm run product:bootstrap:student',
    );
  }

  if (!smokeSupabaseReadiness.credentialsReady) {
    steps.push(
      'Define SMOKE_TRAINER_EMAIL y SMOKE_TRAINER_PASSWORD para poder ejecutar npm run product:smoke:supabase',
    );
  } else if (!smokeSupabaseReadiness.studentTargetConfigured) {
    steps.push(
      'Fija SMOKE_STUDENT_ID o SMOKE_STUDENT_CONTACT_EMAIL antes de ejecutar npm run product:smoke:supabase con varios alumnos.',
    );
  } else {
    steps.push(
      'Con el entorno listo, ejecuta npm run product:smoke:supabase para validar login real, ownership y lectura del alumno.',
    );
  }

  if (!delivery.webhookUrl) {
    steps.push(
      'Si quieres cerrar también la entrega automática, conecta MAGIC_LINK_WEBHOOK_URL y después lanza npm run product:smoke:delivery.',
    );
  } else {
    steps.push(
      'Con el webhook configurado, ejecuta npm run product:smoke:delivery para validar el circuito pago recibido -> webhook -> sala de espera.',
    );
    steps.push(
      'Después, ejecuta npm run product:smoke:activation para validar sala de espera, sesión activa y reapertura already-opened.',
    );
  }

  return steps;
}

function resolveNextSupabaseCommand({
  bootstrapReadiness,
  smokeSupabaseReadiness,
  runtime,
  supabase,
}) {
  if (runtime.requestedDataMode !== 'supabase' || !supabase.hasConfig) {
    if (
      supabaseEnvPresence.urlPresent &&
      supabaseEnvPresence.serviceRoleKeyPresent
    ) {
      return 'npm run product:env:activate-supabase';
    }

    return 'npm run product:env:template';
  }

  if (!bootstrapReadiness.trainerReady) {
    return 'npm run product:bootstrap:trainer';
  }

  if (!bootstrapReadiness.studentReady) {
    return 'npm run product:bootstrap:student';
  }

  if (!smokeSupabaseReadiness.credentialsReady) {
    return 'npm run product:env:template';
  }

  if (!smokeSupabaseReadiness.studentTargetConfigured) {
    return 'npm run product:env:template';
  }

  return 'npm run product:smoke:supabase';
}

function resolveNextDeliveryCommand({ delivery }) {
  if (!delivery.webhookUrl) {
    return 'npm run product:handoff:delivery';
  }

  return 'npm run product:smoke:delivery';
}

function resolveNextActivationCommand({ delivery }) {
  if (!delivery.webhookUrl) {
    return 'npm run product:handoff:delivery';
  }

  return 'npm run product:smoke:activation';
}
