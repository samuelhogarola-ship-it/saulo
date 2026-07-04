# Saulo

Web principal de `saulofitness.com` y app instalable de `Saulo Fitness APP`.

Este repo queda centrado en dos superficies:

- `/`: landing principal de marca
- `/app/`: PWA del panel de alumno
- `/trainer/`: panel interno mínimo de entrenador conectado a API

No incluye ya el formulario de presupuesto/cuestionario ni su backend asociado.

## Scripts

- `npm run dev`: lanza la app en `http://127.0.0.1:4173` y la expone tambien en tu red local para probarla desde el movil
- `npm run start`: arranca el servidor Node en modo normal
- `npm run format`: formatea el proyecto con Prettier
- `npm run format:check`: comprueba formato sin reescribir
- `npm run precommit`: ejecuta `lint-staged` sobre archivos cambiados
- `npm run playwright:install`: instala Chromium para Playwright
- `npm run test:e2e`: ejecuta Playwright

## App alumno incluida

- Navegacion lateral y superior con `Rutinas`, `Mensajes`, `Suscripcion` y
  `Perfil`
- Rutinas por `Dia 1-7` con deep links publicos
- Comentarios por ejercicio y generacion visual de informe al finalizar
- PWA instalable con icono, `manifest`, `service worker` y datos servidos desde API
- Primer acceso real mediante magic link unico hacia sala de espera y activacion posterior de la app con sesion persistida en el movil
- Instalacion de la PWA siempre desde ese flujo de acceso, nunca como enlace publico directo a la app

## Panel entrenador incluido

- Inicio de sesión de entrenador con email y contraseña
- Sesión persistida con access token + refresh token
- Renovación automática de sesión cuando el token expira o está a punto de expirar
- Compatibilidad interna con bearer token para APIs, tests y transición a Supabase Auth
- Alta de alumnos
- Contacto de alumno por email y/o WhatsApp
- Listado operativo de alumnos
- Marcado de `pago recibido`
- Generacion y envio de magic link unico y de un solo uso hacia sala de espera
- Flujo de acceso pensado como: `pago recibido -> magic link unico -> sala de espera -> activacion de app -> instalacion PWA`
- Entrega de acceso lista para compartir y envio automatico opcional via `MAGIC_LINK_WEBHOOK_URL`
- Estado de entrega persistido en el panel (`pendiente`, `listo`, `compartido`, `enviado`, `fallido`)
- Rotacion y revocacion de enlace de acceso
- Envio de mensaje directo al alumno
- Edicion semanal de rutina (`Dia 1-7`) con varios ejercicios por dia y video opcional por ejercicio

## Modo producto

- `SAULO_DATA_MODE=local`: usa datos seed y login local para desarrollo rápido.
- `SAULO_DATA_MODE=supabase`: activa el backend real con Supabase Auth, tablas SQL y Storage.
- `npm run product:check`: valida si el proyecto está realmente listo para arrancar en modo producto.
- `npm run product:contract:delivery`: imprime el contrato exacto del webhook de magic link con headers y payload de ejemplo según la configuración actual.
- `npm run product:handoff:go-live`: exporta un checklist Markdown de salida a producción para el flujo real `pago recibido -> magic link -> sala de espera -> PWA`.
- `npm run product:handoff:delivery`: exporta un documento Markdown listo para enviar al proveedor final con contrato, payload y `curl` de prueba.
- `npm run product:bootstrap:trainer`: crea o enlaza el entrenador inicial en Supabase Auth + tabla `trainers`.
- `npm run product:bootstrap:student`: crea o actualiza un alumno real con sus entidades base de producto.
- `npm run product:check:templates`: valida todas las plantillas JSON de alumnos del repo.
- `npm run product:mock:delivery`: levanta un receptor local para probar `MAGIC_LINK_WEBHOOK_URL`.
- `npm run product:smoke:delivery`: levanta un smoke local de entrega real contra el mock provider y valida que `pago recibido` dispara el webhook con el waiting room link esperado.
- `npm run product:smoke:supabase`: valida login real, refresh real, ownership del entrenador y lectura real de un alumno en Supabase.

Para que el modo producto sea real y no caiga a local, necesitas:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- migraciones aplicadas en `supabase/migrations`

Opcional pero recomendado para producción:

- `MAGIC_LINK_WEBHOOK_URL` para enviar el acceso automáticamente por email o WhatsApp
- `MAGIC_LINK_WEBHOOK_SECRET` para firmar el webhook con HMAC SHA256
- `MAGIC_LINK_WEBHOOK_BEARER_TOKEN` si el proveedor exige bearer auth
- `MAGIC_LINK_WEBHOOK_TIMEOUT_MS` para controlar el timeout de entrega
- `SUPABASE_PROGRESS_PHOTOS_BUCKET` para separar el bucket final de fotos de progreso

### Contrato del webhook de magic link

Cuando `MAGIC_LINK_WEBHOOK_URL` está configurado, el backend hace `POST` con JSON a tu proveedor.

Headers opcionales:

- `Authorization: Bearer ...` si defines `MAGIC_LINK_WEBHOOK_BEARER_TOKEN`
- firma HMAC SHA256 en `x-saulo-signature` si defines `MAGIC_LINK_WEBHOOK_SECRET`

Payload:

- `event`
- `sentAt`
- `senderName`
- `appName`
- `student`
- `access`
- `message`
- `mailtoUrl`
- `whatsappUrl`

Si el proveedor no responde a tiempo o devuelve error, la app cae a modo manual y deja trazado `provider-error`.

Respuesta recomendada del proveedor cuando acepta la entrega:

- `2xx`
- JSON opcional con:
  - `channel`: canal real usado, por ejemplo `email` o `whatsapp`
  - `deliveryId`: identificador interno del proveedor para trazabilidad

Si esos campos llegan, el panel de entrenador persiste el canal real confirmado y el identificador de entrega.

### Exportar contrato exacto para el proveedor

Si necesitas entregar al proveedor final un ejemplo exacto del POST que recibirá:

```bash
npm run product:contract:delivery
```

Este comando imprime:

- URL objetivo actual
- headers efectivos
- bearer si existe
- cabecera de firma si existe
- payload JSON completo de ejemplo
- `curl` listo para probar manualmente el POST contra el proveedor

Puedes ajustar el ejemplo con variables opcionales:

- `PROVIDER_CONTRACT_ORIGIN`
- `PROVIDER_CONTRACT_WAITING_ROOM_TOKEN`
- `PROVIDER_CONTRACT_ACCESS_TOKEN`
- `PROVIDER_CONTRACT_STUDENT_ID`
- `PROVIDER_CONTRACT_STUDENT_NAME`
- `PROVIDER_CONTRACT_PLAN`
- `PROVIDER_CONTRACT_CONTACT_EMAIL`
- `PROVIDER_CONTRACT_CONTACT_PHONE`

Si además quieres generar un documento entregable para enviar al proveedor:

```bash
npm run product:handoff:delivery
```

Por defecto se guarda en:

- `docs/provider-magic-link-handoff.md`

Puedes cambiar la salida con:

- `DELIVERY_HANDOFF_OUTPUT_PATH`

Si quieres además un checklist operativo de salida a producción para validar que el circuito real está listo:

```bash
npm run product:handoff:go-live
```

Por defecto se guarda en:

- `docs/delivery-go-live-checklist.md`

Puedes cambiar la salida con:

- `DELIVERY_GO_LIVE_OUTPUT_PATH`

El contrato operativo del acceso queda asi:

- el entrenador marca `pago recibido`
- la app genera y envia un `magic link` unico y revocable para ese alumno
- ese enlace lleva primero a la `sala de espera`
- la preview de la sala de espera no expone el `accessToken` ni la URL final de la app
- ver la sala de espera no consume el enlace; el consumo real ocurre al pulsar abrir la app
- si el alumno reabre luego ese mismo magic link ya consumido desde el mismo móvil, la sala de espera responde como `ya activada` y le deja continuar sin generar un token nuevo
- desde la sala de espera el alumno abre la app y deja activa la sesion
- despues instala la PWA con el flujo nativo del navegador (`Añadir a pantalla de inicio` / `Instalar app`)
- no existe enlace publico estable a `/app/` para entregar acceso al alumno fuera de ese flujo

La ruta pública canónica del magic link es:

- `/acceso/:token`

Y la ruta antigua `/demo/:token` se mantiene solo como redirección compatible hacia la sala de espera.

### Probar el webhook en local

Puedes levantar un proveedor local de prueba:

```bash
MAGIC_LINK_WEBHOOK_SECRET=tu-secreto \
MAGIC_LINK_WEBHOOK_BEARER_TOKEN=tu-token \
MOCK_MAGIC_LINK_PROVIDER_OUTPUT_PATH=.tmp/magic-link-last.json \
npm run product:mock:delivery
```

Después apunta:

```bash
MAGIC_LINK_WEBHOOK_URL=http://127.0.0.1:8787/webhook/magic-link
```

Así puedes comprobar:

- que el backend envía el payload correcto
- que bearer y firma llegan bien
- que el último webhook recibido queda guardado en disco si defines `MOCK_MAGIC_LINK_PROVIDER_OUTPUT_PATH`

### Smoke local de entrega automática

Si quieres validar el circuito local completo:

```bash
npm run product:smoke:delivery
```

Qué hace:

- levanta el mock provider local
- levanta la app en modo `local` con `MAGIC_LINK_WEBHOOK_URL` apuntando al mock
- crea un alumno de prueba
- marca `pago recibido`
- verifica que el webhook sale en estado `delivered`
- valida que el payload recibido contiene el alumno correcto y el `waitingRoomUrl` esperado
- valida que el detalle del alumno persiste `deliveryStatus=sent`, `channel` y `deliveryId` devueltos por el proveedor mock

Variables opcionales:

- `DELIVERY_SMOKE_APP_PORT`
- `DELIVERY_SMOKE_PROVIDER_PORT`
- `DELIVERY_SMOKE_PROVIDER_HOST`
- `DELIVERY_SMOKE_OUTPUT_PATH`

## Bootstrap real de entrenador

Una vez configurado `SAULO_DATA_MODE=supabase` y las credenciales reales:

1. Aplica las migraciones de `supabase/migrations` en tu proyecto Supabase.
2. Ejecuta:

```bash
BOOTSTRAP_TRAINER_EMAIL=trainer@saulofitness.com \
BOOTSTRAP_TRAINER_PASSWORD='tu-password-segura' \
BOOTSTRAP_TRAINER_NAME='Saulo Trainer' \
npm run product:bootstrap:trainer
```

3. Si ya tienes alumnos creados sin `trainer_id`, puedes adoptarlos al bootstrap:

```bash
BOOTSTRAP_TRAINER_EMAIL=trainer@saulofitness.com \
BOOTSTRAP_TRAINER_PASSWORD='tu-password-segura' \
BOOTSTRAP_TRAINER_NAME='Saulo Trainer' \
BOOTSTRAP_ADOPT_UNASSIGNED_STUDENTS=true \
npm run product:bootstrap:trainer
```

Qué hace:

- crea o recupera el usuario de Supabase Auth
- crea o enlaza su fila en `trainers`
- actualiza nombre/email si han cambiado
- opcionalmente asigna al entrenador los alumnos sin propietario

En modo `supabase`, el panel de entrenador ya filtra alumnos por `trainer_id`.

## Bootstrap real de alumno

Con el entrenador ya creado, puedes levantar el primer alumno real con:

```bash
BOOTSTRAP_TRAINER_EMAIL=trainer@saulofitness.com \
BOOTSTRAP_STUDENT_NAME='Lucía Ortega' \
BOOTSTRAP_STUDENT_CONTACT_EMAIL='lucia@saulofitness.app' \
BOOTSTRAP_STUDENT_CONTACT_PHONE='+34600000001' \
BOOTSTRAP_STUDENT_PLAN='Definición' \
BOOTSTRAP_STUDENT_GOAL='Bajar grasa y mantener fuerza' \
npm run product:bootstrap:student
```

O con plantilla versionada:

```bash
BOOTSTRAP_TRAINER_EMAIL=trainer@saulofitness.com \
BOOTSTRAP_STUDENT_TEMPLATE_PATH=product-templates/students/lucia-ortega.json \
npm run product:bootstrap:student
```

Qué prepara:

- fila en `students` ligada al `trainer_id`
- `subscription` activa
- rutina semanal base (`Día 1-7`)
- mensajes iniciales de producto
- placeholders pendientes para las 4 fotos de progreso

Si ya existe un alumno del mismo entrenador con el mismo `contact_email`, el script actualiza su base en vez de duplicarlo.

La plantilla puede definir:

- datos del alumno
- rutina base
- mensajes iniciales
- slots de fotos

Los valores por variable de entorno siguen teniendo prioridad sobre la plantilla.

Antes de usar plantillas en una entrega real, puedes validarlas con:

```bash
npm run product:check:templates
```

## Smoke check real de Supabase

Cuando ya tengas el entrenador y al menos un alumno real creados, puedes validar el camino vivo completo de lectura con:

```bash
SAULO_DATA_MODE=supabase \
SMOKE_TRAINER_EMAIL=trainer@saulofitness.com \
SMOKE_TRAINER_PASSWORD='tu-password-segura' \
SMOKE_STUDENT_CONTACT_EMAIL=lucia@saulofitness.app \
npm run product:smoke:supabase
```

Qué comprueba:

- login real del entrenador en Supabase Auth
- refresh real del entrenador con su `refresh_token`
- recuperación de su perfil operativo
- listado de alumnos visible solo para ese entrenador
- lectura real de sesión, perfil, suscripción, rutina y mensajes del alumno objetivo
- consistencia entre la vista de entrenador y la vista de alumno

Si hay más de un alumno, también puedes fijar el objetivo con:

- `SMOKE_STUDENT_ID`

Opcionalmente puedes validar también el flujo vivo de acceso del alumno:

- `SMOKE_TRIGGER_WAITING_ROOM=true`

Cuando activas esa variable, el smoke:

- marca `pago recibido` para el alumno objetivo
- valida la preview de la sala de espera
- consume la sala de espera
- comprueba que el alumno queda en estado `opened`
- reabre la sala de espera consumida y valida el estado `already-opened`
- valida que la sesión del alumno sigue respondiendo con el `accessToken` activo

Ejemplo:

```bash
SAULO_DATA_MODE=supabase \
SMOKE_TRAINER_EMAIL=trainer@saulofitness.com \
SMOKE_TRAINER_PASSWORD='tu-password-segura' \
SMOKE_STUDENT_CONTACT_EMAIL=lucia@saulofitness.app \
SMOKE_TRIGGER_WAITING_ROOM=true \
npm run product:smoke:supabase
```

- `SMOKE_STUDENT_CONTACT_EMAIL`
- `SMOKE_STUDENT_NAME`
- `SMOKE_STUDENT_ACCESS_TOKEN`

Y puedes cambiar el día de rutina a revisar con:

- `SMOKE_STUDENT_DAY=1`

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

La suite E2E cubre la landing publica y la app de alumno en `/app/`.
