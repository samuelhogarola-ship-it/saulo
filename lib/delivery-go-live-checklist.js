const fs = require('node:fs');
const path = require('node:path');

const { buildDeliveryContract } = require('./magic-link-provider-contract');
const { delivery, projectRoot, runtime, supabase } = require('./config');

function buildDeliveryGoLiveChecklist() {
  const migrationDir = path.join(projectRoot, 'supabase', 'migrations');
  const migrationFiles = fs.existsSync(migrationDir)
    ? fs
        .readdirSync(migrationDir)
        .filter((file) => file.endsWith('.sql'))
        .sort()
    : [];

  const contract = buildDeliveryContract();
  const checks = [
    {
      label: 'Modo producto en Supabase',
      done: runtime.requestedDataMode === 'supabase',
      detail:
        runtime.requestedDataMode === 'supabase'
          ? 'SAULO_DATA_MODE=supabase'
          : `Esperado SAULO_DATA_MODE=supabase · actual ${runtime.requestedDataMode}`,
    },
    {
      label: 'Credenciales reales de Supabase configuradas',
      done: supabase.hasConfig,
      detail: supabase.hasConfig
        ? 'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY activos'
        : 'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY reales',
    },
    {
      label: 'Migraciones SQL disponibles',
      done: migrationFiles.length > 0,
      detail: migrationFiles.length
        ? `${migrationFiles.length} migraciones encontradas`
        : 'No hay migraciones en supabase/migrations',
    },
    {
      label: 'Webhook automático de magic link configurado',
      done: Boolean(delivery.webhookUrl),
      detail: delivery.webhookUrl || 'Falta MAGIC_LINK_WEBHOOK_URL',
    },
    {
      label: 'Firma HMAC del webhook configurada',
      done: Boolean(delivery.webhookSecret),
      detail: delivery.webhookSecret
        ? `Cabecera ${delivery.webhookSignatureHeader}`
        : 'Opcional, pero recomendada para producción',
    },
    {
      label: 'Bearer del endpoint de entrega configurado',
      done: Boolean(delivery.webhookBearerToken),
      detail: delivery.webhookBearerToken
        ? 'Bearer activo para la funcion de entrega'
        : 'Opcional, depende de tu Edge Function o del canal aguas abajo',
    },
    {
      label: 'Bucket de fotos de progreso definido',
      done: Boolean(supabase.storageBucket),
      detail: supabase.storageBucket,
    },
  ];

  const blockers = checks
    .filter((item) =>
      [
        'Modo producto en Supabase',
        'Credenciales reales de Supabase configuradas',
        'Migraciones SQL disponibles',
        'Webhook automático de magic link configurado',
      ].includes(item.label),
    )
    .filter((item) => !item.done)
    .map((item) => `${item.label}: ${item.detail}`);
  const recommendedSteps = buildRecommendedSteps({
    runtime,
    supabase,
    delivery,
  });

  return {
    generatedAt: new Date().toISOString(),
    runtime,
    supabase,
    delivery,
    migrationFiles,
    checks,
    blockers,
    contract,
    recommendedSteps,
  };
}

function renderDeliveryGoLiveChecklist(checklist) {
  return `# Saulo Fitness APP · Delivery Go Live Checklist

## Estado actual

- Generado: \`${checklist.generatedAt}\`
- Requested data mode: \`${checklist.runtime.requestedDataMode}\`
- Resolved data mode: \`${checklist.runtime.resolvedDataMode}\`
- Supabase: ${checklist.supabase.hasConfig ? 'configurado' : 'sin configurar'}
- Webhook delivery: ${checklist.delivery.webhookUrl ? 'configurado' : 'manual'}
- Signature header: \`${checklist.delivery.webhookSignatureHeader}\`
- Bucket fotos progreso: \`${checklist.supabase.storageBucket}\`

## Flujo de acceso cerrado

1. El entrenador marca \`pago recibido\`.
2. La app genera un \`magic link\` único y revocable.
3. El endpoint de entrega en Supabase envía el enlace hacia \`/acceso/:token\`.
4. El alumno entra primero a la sala de espera.
5. Desde la sala activa la sesión real de \`/app/\`.
6. Después instala la PWA con el flujo nativo del dispositivo.

## Checklist de salida

${checklist.checks
  .map((item) => `- [${item.done ? 'x' : ' '}] ${item.label}: ${item.detail}`)
  .join('\n')}

## Bloqueos actuales

${
  checklist.blockers.length
    ? checklist.blockers.map((item) => `- ${item}`).join('\n')
    : '- Ningún bloqueo crítico detectado para conectar el endpoint de entrega en Supabase.'
}

## Migraciones detectadas

${
  checklist.migrationFiles.length
    ? checklist.migrationFiles.map((file) => `- \`${file}\``).join('\n')
    : '- No se encontraron migraciones SQL.'
}

## Comandos operativos

\`\`\`bash
npm run product:check
npm run product:smoke:delivery
npm run product:smoke:activation
npm run product:smoke:supabase
npm run product:contract:delivery
npm run product:handoff:delivery
\`\`\`

## Secuencia recomendada antes de producción

${checklist.recommendedSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Contrato del endpoint de entrega

- Webhook URL: \`${checklist.contract.webhookUrl}\`
- Bearer auth: ${checklist.contract.hasBearer ? 'configured' : 'disabled'}
- HMAC signature: ${checklist.contract.hasSignature ? 'configured' : 'disabled'}
- Waiting room path ejemplo: \`${checklist.contract.payload.access.waitingRoomPath}\`
- Respuesta 2xx recomendada: \`channel\` + \`deliveryId\`

## Nota operativa

Mientras no estén cerrados el endpoint de entrega en Supabase, Supabase real y el smoke completo en móvil, la app no debe considerarse lista para entrega comercial final.
`;
}

function resolveDeliveryGoLiveOutputPath(value) {
  const nextValue = String(value || '').trim();
  if (!nextValue) {
    return path.join(projectRoot, 'docs/delivery-go-live-checklist.md');
  }

  return path.isAbsolute(nextValue)
    ? nextValue
    : path.join(projectRoot, nextValue);
}

module.exports = {
  buildDeliveryGoLiveChecklist,
  renderDeliveryGoLiveChecklist,
  resolveDeliveryGoLiveOutputPath,
};

function buildRecommendedSteps({ runtime, supabase, delivery }) {
  const steps = [];

  if (runtime.requestedDataMode !== 'supabase') {
    steps.push(
      'Copiar `.env.example` a `.env` y fijar `SAULO_DATA_MODE=supabase`.',
    );
  }

  if (!supabase.hasConfig) {
    steps.push(
      'Rellenar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con valores reales.',
    );
  }

  steps.push(
    'Crear o validar el entrenador real con `npm run product:bootstrap:trainer`.',
  );
  steps.push(
    'Crear el primer alumno real con `npm run product:bootstrap:student`.',
  );
  steps.push(
    'Ejecutar `npm run product:smoke:supabase` para validar login, ownership y lectura real.',
  );

  if (!delivery.webhookUrl) {
    steps.push(
      'Configurar `MAGIC_LINK_WEBHOOK_URL` y ejecutar `npm run product:smoke:delivery` para validar `pago recibido -> webhook -> sala de espera`.',
    );
  } else {
    steps.push(
      'Ejecutar `npm run product:smoke:delivery` para validar `pago recibido -> webhook -> sala de espera` con la Function configurada.',
    );
  }

  steps.push(
    'Conectar la Edge Function de Supabase al contrato exportado y confirmar respuesta `2xx`.',
  );
  steps.push(
    'Ejecutar `npm run product:smoke:activation` para validar `pago recibido -> entrega -> sala de espera -> sesión activa` en local.',
  );
  steps.push(
    'Repetir una alta real y validar apertura de `/acceso/:token` desde móvil.',
  );

  return steps;
}
