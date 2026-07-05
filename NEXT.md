# NEXT

CURRENT FOCUS

- Mantener `https://saulofitness.com` como landing pura, limpia y sin exponer accesos operativos.
- Mantener `/app/` como PWA real de alumno conectada a Node + Supabase, sin copy de demo y con shell offline ya cubierta por tests.
- Consolidar `/trainer/` como panel interno mínimo de producto para operar alumnos, contacto email/WhatsApp, pago recibido, magic link único, sala de espera, sesión PWA y accesos revocables.
- Mantener el bootstrap real de Supabase/Auth reproducible: entrenador inicial, tabla `trainers`, ownership por `trainer_id` y adopción controlada de alumnos.
- Mantener también el bootstrap reproducible del primer alumno real: `students`, `subscriptions`, `routines`, `messages` y `progress_photos`.
- Consolidar plantillas versionadas de alumnos reales para acelerar nuevas altas sin tocar código ni reescribir veinte variables.
- Mantener operativo el smoke local de entrega automática (`npm run product:smoke:delivery`) para validar el circuito `pago recibido -> webhook -> sala de espera` antes de tocar proveedor real.
- Mantener exportable el checklist operativo de salida (`npm run product:handoff:go-live`) y el handoff del proveedor (`npm run product:handoff:delivery`) como fuente de verdad operativa.
- Mantener como contrato cerrado de autenticación alumno: `pago recibido -> magic link único -> sala de espera -> sesión activa -> instalación PWA`.
- No reabrir el debate de acceso directo a `/app/`: el alumno entra siempre por magic link unico hacia sala de espera y desde ahi instala la PWA con el flujo nativo del dispositivo.
- Mantener también la compatibilidad de enlaces heredados, pero siempre encauzados al flujo real de sala de espera, nunca a acceso directo de app.
- Blindar QA negativo/regresión sobre waiting room, sesión persistida de entrenador y revocación/rotación de accesos.
- La landing para evento `GIRLS` queda fuera de producción y se conserva solo como base genérica reutilizable para eventos futuros.

OBJETIVOS FALTANTES

- Configurar credenciales reales de bootstrap para entrenador: `BOOTSTRAP_TRAINER_EMAIL` y `BOOTSTRAP_TRAINER_PASSWORD`, o reutilizar `TRAINER_LOGIN_EMAIL` y `TRAINER_LOGIN_PASSWORD`.
- Configurar el objetivo real del smoke de producto: `SMOKE_STUDENT_ID` o `SMOKE_STUDENT_CONTACT_EMAIL`.
- Desplegar en Supabase la Edge Function `magic-link-delivery`.
- Conectar `MAGIC_LINK_WEBHOOK_URL` con la URL real de la Edge Function desplegada.
- Definir en producción `MAGIC_LINK_WEBHOOK_SECRET` y `MAGIC_LINK_WEBHOOK_BEARER_TOKEN` si el endpoint final va firmado/protegido.
- Ejecutar en entorno real `npm run product:bootstrap:trainer`.
- Ejecutar en entorno real `npm run product:bootstrap:student`.
- Ejecutar en entorno real `npm run product:smoke:supabase`.
- Ejecutar en entorno real `npm run product:smoke:delivery`.
- Confirmar en entorno real `npm run product:smoke:activation` para validar `pago recibido -> entrega -> sala de espera -> sesión activa`.
- Confirmar en móvil real la instalación PWA desde sala de espera con el flujo nativo del navegador.
- Sustituir el receptor manual actual por la Edge Function real usando `MAGIC_LINK_WEBHOOK_URL` de Supabase.
