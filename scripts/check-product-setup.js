const fs = require('node:fs');
const path = require('node:path');

const { delivery, projectRoot, runtime, supabase } = require('../lib/config');
const {
  buildProviderContract,
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
];
const smokeSupabaseReadiness = resolveSupabaseSmokeReadiness();
const bootstrapReadiness = resolveBootstrapReadiness();

const manifestCheck = readManifest();
const serviceWorkerCheck = readServiceWorker();

if (runtime.requestedDataMode !== 'supabase') {
  failures.push(
    'SAULO_DATA_MODE no está en "supabase". El producto sigue arrancando en modo local.',
  );
}

if (!supabase.hasConfig) {
  failures.push(
    'Falta configurar SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY con valores reales.',
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

if (!bootstrapReadiness.trainerReady) {
  notes.push(
    'El bootstrap de entrenador aún no tiene helper vars reales listos. Revisa BOOTSTRAP_TRAINER_EMAIL, BOOTSTRAP_TRAINER_PASSWORD y BOOTSTRAP_TRAINER_NAME.',
  );
}

if (!bootstrapReadiness.studentReady) {
  notes.push(
    'El bootstrap de alumno aún no tiene un objetivo claro. Revisa BOOTSTRAP_TRAINER_EMAIL o BOOTSTRAP_TRAINER_ID y una plantilla o email de alumno.',
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
const providerContract = buildProviderContract();
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

notes.push(
  'Puedes validar la entrega automática sin proveedor final con: npm run product:smoke:delivery',
);
notes.push(
  'Puedes exportar el contrato exacto del webhook para el proveedor final con: npm run product:contract:delivery',
);
notes.push(
  'El smoke local ya valida no solo el waiting room link, sino también la persistencia de channel y deliveryId devueltos por el proveedor.',
);

if (!delivery.webhookBearerToken) {
  notes.push(
    'MAGIC_LINK_WEBHOOK_BEARER_TOKEN no está configurado. El proveedor real funcionará sin bearer solo si lo permite explícitamente.',
  );
}

console.log('Saulo Fitness APP · Product readiness');
console.log(`- Requested data mode: ${runtime.requestedDataMode}`);
console.log(`- Resolved data mode: ${runtime.resolvedDataMode}`);
console.log(`- Supabase configured: ${supabase.hasConfig ? 'yes' : 'no'}`);
console.log(`- Progress photos bucket: ${supabase.storageBucket}`);
console.log(`- Webhook timeout: ${delivery.webhookTimeoutMs}ms`);
console.log(`- SQL migrations: ${migrationFiles.length}`);
console.log(`- Student templates: ${studentTemplateFiles.length}`);
console.log(`- Next Supabase product command: ${nextSupabaseCommand}`);
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
  `  · Mock provider: http://${localDeliverySmoke.providerHost}:${localDeliverySmoke.providerPort}/webhook/magic-link`,
);
console.log(`  · Output file: ${localDeliverySmoke.outputPath}`);
console.log('- Recommended provider 2xx response:');
console.log(`  · channel: ${providerContract.responseExample.channel}`);
console.log(`  · deliveryId: ${providerContract.responseExample.deliveryId}`);

if (migrationFiles.length) {
  migrationFiles.forEach((file) => {
    console.log(`  · ${file}`);
  });
}

if (notes.length) {
  console.log('\nOperational notes');
  notes.forEach((note) => console.log(`- ${note}`));
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
  const trainerReady =
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_EMAIL) &&
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_PASSWORD) &&
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_NAME);
  const hasTrainerBinding =
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_EMAIL) ||
    hasMeaningfulValue(process.env.BOOTSTRAP_TRAINER_ID);
  const hasStudentInput =
    hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_TEMPLATE_PATH) ||
    (hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_NAME) &&
      hasMeaningfulValue(process.env.BOOTSTRAP_STUDENT_CONTACT_EMAIL));

  return {
    trainerReady,
    studentReady: hasTrainerBinding && hasStudentInput,
  };
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
    /^your-/i,
    /^example/i,
    /^xxxx/i,
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
      'Configura SAULO_DATA_MODE=supabase antes de validar el camino real de producto.',
    );
  }

  if (!supabase.hasConfig) {
    steps.push(
      'Completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY con valores reales para salir del fallback local.',
    );
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
    return 'configure-supabase-env';
  }

  if (!bootstrapReadiness.trainerReady) {
    return 'npm run product:bootstrap:trainer';
  }

  if (!bootstrapReadiness.studentReady) {
    return 'npm run product:bootstrap:student';
  }

  if (!smokeSupabaseReadiness.credentialsReady) {
    return 'configure-smoke-trainer-credentials';
  }

  if (!smokeSupabaseReadiness.studentTargetConfigured) {
    return 'configure-smoke-student-target';
  }

  return 'npm run product:smoke:supabase';
}
