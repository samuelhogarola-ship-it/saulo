# Supabase Edge Function · `magic-link-delivery`

Esta función recibe el webhook interno que dispara la app cuando el entrenador marca `pago recibido`.

## Objetivo

- aceptar el payload `student_magic_link_ready`
- validar bearer y firma HMAC si están activos
- responder `2xx` con `channel` y `deliveryId`
- opcionalmente reenviar el payload a un canal final externo

## URL esperada

```text
https://<project-ref>.supabase.co/functions/v1/magic-link-delivery
```

## Variables de entorno

- `SAULO_WEBHOOK_SECRET`
- `SAULO_WEBHOOK_BEARER_TOKEN`
- `SAULO_SIGNATURE_HEADER`
- `DELIVERY_DOWNSTREAM_URL`
- `DELIVERY_DOWNSTREAM_BEARER_TOKEN`
- `DELIVERY_DEFAULT_CHANNEL`

## Modos

### 1. `echo`

Si `DELIVERY_DOWNSTREAM_URL` no existe, la función acepta el payload y responde:

```json
{
  "ok": true,
  "mode": "echo",
  "channel": "whatsapp",
  "deliveryId": "supabase-..."
}
```

Esto sirve para cerrar el circuito producto + PWA + waiting room sin depender aún del canal final.

### 2. `forward`

Si `DELIVERY_DOWNSTREAM_URL` existe, la función reenvía el mismo payload a ese endpoint y devuelve una respuesta normalizada al panel.

## Deploy

```bash
supabase functions deploy magic-link-delivery
```

## Secrets recomendados

```bash
supabase secrets set \
SAULO_WEBHOOK_SECRET='replace-with-shared-secret' \
SAULO_WEBHOOK_BEARER_TOKEN='replace-with-app-bearer' \
SAULO_SIGNATURE_HEADER='x-saulo-signature'
```

## Flujo mínimo para arrancar

1. desplegar la función
2. copiar su URL a `MAGIC_LINK_WEBHOOK_URL`
3. ejecutar `npm run product:smoke:delivery`
4. comprobar que el panel guarda `deliveryStatus=sent`, `channel` y `deliveryId`
