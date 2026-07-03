# Saulo Fitness APP · Delivery Go Live Checklist

## Estado actual

- Generado: `2026-07-03T15:12:13.668Z`
- Requested data mode: `local`
- Resolved data mode: `local`
- Supabase: sin configurar
- Webhook delivery: manual
- Signature header: `x-saulo-signature`
- Bucket fotos progreso: `progress-photos`

## Flujo de acceso cerrado

1. El entrenador marca `pago recibido`.
2. La app genera un `magic link` único y revocable.
3. El proveedor entrega el enlace hacia `/acceso/:token`.
4. El alumno entra primero a la sala de espera.
5. Desde la sala activa la sesión real de `/app/`.
6. Después instala la PWA con el flujo nativo del dispositivo.

## Checklist de salida

- [ ] Modo producto en Supabase: SAULO_DATA_MODE=local
- [ ] Credenciales reales de Supabase configuradas: Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY reales
- [x] Migraciones SQL disponibles: 6 migraciones encontradas
- [ ] Webhook automático de magic link configurado: Falta MAGIC_LINK_WEBHOOK_URL
- [ ] Firma HMAC del webhook configurada: Opcional, pero recomendada para producción
- [ ] Bearer del proveedor configurado: Opcional, depende del proveedor final
- [x] Bucket de fotos de progreso definido: progress-photos

## Bloqueos actuales

- Modo producto en Supabase: SAULO_DATA_MODE=local
- Credenciales reales de Supabase configuradas: Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY reales
- Webhook automático de magic link configurado: Falta MAGIC_LINK_WEBHOOK_URL

## Migraciones detectadas

- `20260702120000_product_mvp.sql`
- `20260702143000_waiting_room_magic_links.sql`
- `20260702183000_student_contact_channels.sql`
- `20260702190000_waiting_room_delivery_status.sql`
- `20260702193000_access_deliveries.sql`
- `20260703120000_public_events.sql`

## Comandos operativos

```bash
npm run product:check
npm run product:smoke:delivery
npm run product:smoke:supabase
npm run product:contract:delivery
npm run product:handoff:delivery
```

## Secuencia recomendada antes de producción

1. Crear o validar el entrenador real con `npm run product:bootstrap:trainer`.
2. Crear el primer alumno real con `npm run product:bootstrap:student`.
3. Ejecutar `npm run product:smoke:delivery` para validar `pago recibido -> webhook -> sala de espera`.
4. Ejecutar `npm run product:smoke:supabase` para validar login, ownership y lectura real.
5. Entregar al proveedor el contrato exportado y confirmar respuesta `2xx`.
6. Repetir una alta real y validar apertura de `/acceso/:token` desde móvil.

## Contrato del proveedor

- Webhook URL: `https://provider.example/webhook/magic-link`
- Bearer auth: disabled
- HMAC signature: disabled
- Waiting room path ejemplo: `/sala/demo-waiting-room-token`
- Respuesta 2xx recomendada: `channel` + `deliveryId`

## Nota operativa

Mientras no estén cerrados proveedor, Supabase real y smoke completo en móvil, la app no debe considerarse lista para entrega comercial final.
