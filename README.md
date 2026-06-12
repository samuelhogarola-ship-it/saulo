# Saulo

Landing temporal para el formulario técnico de Saulo Fitness, ya preparada para
guardar respuestas en Supabase y enviar avisos por Resend.

El repo incluye también una primera versión navegable de la app real en
`/app/`, separada de la landing para poder evolucionar producto y captación en
paralelo.

La demo de `/app/` ya se comporta como PWA instalable: incluye `manifest`,
`service worker`, iconos y CTA para guardarla en el teléfono como acceso directo.

## Scripts

- `npm run dev`: lanza la app en `http://127.0.0.1:4173`
- `npm run start`: arranca el servidor Node en modo normal
- `npm run format`: formatea el proyecto con Prettier
- `npm run format:check`: comprueba formato sin reescribir
- `npm run precommit`: ejecuta `lint-staged` sobre archivos cambiados
- `npm run playwright:install`: instala Chromium para Playwright
- `npm run test:e2e`: ejecuta Playwright

## Rutas disponibles

- `/`: landing de captación y cuestionario técnico
- `/app/`: prototipo funcional e instalable de la app real para coach y alumno

## Validaciones incluidas

- El formulario no deja avanzar si faltan campos obligatorios del bloque actual.
- El logotipo solo admite `PNG`, `JPG`, `SVG` o `WEBP` y un máximo de `8 MB`.
- El backend replica esas validaciones para no depender solo del navegador.

## Variables de entorno

Duplica `.env.example` como `.env` y completa:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`

`ALLOW_DEMO_SUBMISSIONS=true` permite probar el envío local sin tocar Supabase ni
Resend.

## Patrón recomendado para webs estáticas

Para landings que se publican en hostings HTML puros sin Node:

1. la web estática publica el frontend
2. el formulario envía a una `Supabase Edge Function`
3. la Edge Function guarda en Supabase y envía el email por Resend

En este proyecto, esa función está en:

- [supabase/functions/submit-questionnaire/index.ts](/Users/sam/Desktop/webs/SAULO/repo-saulo/supabase/functions/submit-questionnaire/index.ts)

Para desplegarla como endpoint público:

```bash
supabase functions deploy submit-questionnaire --no-verify-jwt
```

Y en el frontend estático configura:

```js
window.SAULO_FORM_CONFIG = {
  endpoint:
    'https://owlcmhlfuszyuwqxuhpb.supabase.co/functions/v1/submit-questionnaire',
};
```

## Supabase

1. Crea un bucket llamado `questionnaire-assets` o usa el nombre que pongas en
   `SUPABASE_STORAGE_BUCKET`.
2. Ejecuta [supabase/schema.sql](/Users/sam/Desktop/webs/SAULO/repo-saulo/supabase/schema.sql)
   para crear la tabla `questionnaire_submissions`.
3. Usa la service role key solo en servidor, nunca en el frontend.

## Resend

El servidor envía un email resumen al destinatario definido en
`RESEND_TO_EMAIL`. Si el usuario adjunta logotipo, se adjunta también al correo.

## Git hooks

El proyecto usa `husky` con dos hooks:

- `pre-commit`: ejecuta `lint-staged` y formatea solo los archivos staged
- `pre-push`: ejecuta `npm run format:check` antes de subir cambios

## CI

GitHub Actions ejecuta:

- `npm ci`
- `npm run playwright:install`
- `npm run format:check`
- `npm run test:e2e`

La suite E2E cubre tanto el recorrido visual del formulario como validaciones del
endpoint `/api/questionnaire`, además de la base navegable de `/app/`.
