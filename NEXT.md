# NEXT

CURRENT FOCUS

- Partir de `preview-evento-girl-power.html` como referencia visual aprobada para la futura landing publica de eventos.
- Mantener `https://saulofitness.com` como landing pura, limpia y sin exponer accesos operativos.
- Convertir `/app/` en PWA real de alumno conectada a Node + Supabase, sin copy de demo.
- Consolidar `/trainer/` como panel interno minimo de producto para operar alumnos, contacto email/WhatsApp, pago recibido, magic link unico, sala de espera, sesion PWA y accesos revocables.
- Mantener el bootstrap real de Supabase/Auth reproducible: entrenador inicial, tabla `trainers`, ownership por `trainer_id` y adopción controlada de alumnos.
- Mantener también el bootstrap reproducible del primer alumno real: `students`, `subscriptions`, `routines`, `messages` y `progress_photos`.
- Consolidar plantillas versionadas de alumnos reales para acelerar nuevas altas sin tocar código ni reescribir veinte variables.
- Mantener operativo el smoke local de entrega automática (`npm run product:smoke:delivery`) para validar el circuito `pago recibido -> webhook -> sala de espera` antes de tocar proveedor real.
- Mantener también exportable el checklist operativo de salida (`npm run product:handoff:go-live`) para no perder el estado real de bloqueos antes de conectar producción.
- Conectar en producción `MAGIC_LINK_WEBHOOK_URL` con el proveedor final de email/WhatsApp para que el envío salga automático sin fallback manual.
- Mantener como contrato cerrado de autenticacion alumno: `pago recibido -> magic link unico -> sala de espera -> sesion activa -> instalacion PWA`.
- No reabrir el debate de acceso directo a `/app/`: el alumno entra siempre por magic link unico hacia sala de espera y desde ahi instala la PWA con el flujo nativo del dispositivo.
- Mantener tambien la compatibilidad de enlaces heredados, pero siempre encauzados al flujo real de sala de espera, nunca a acceso directo de app.
- Siguiente frente: cerrar la sesion real de entrenador con Supabase Auth completa en producción y completar el ciclo real `pago recibido -> magic link -> sala de espera -> app instalada`.
- Cuando se retome eventos, integrar la landing real sin contaminar `/` ni `/app/`.
