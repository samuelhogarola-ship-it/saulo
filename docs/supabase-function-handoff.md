# Saulo Fitness APP · Supabase Function Handoff

## Objetivo

Desplegar y conectar la Edge Function `magic-link-delivery` para que el flujo:

`pago recibido -> waiting room link -> envio automatico -> sala de espera -> PWA`

quede listo de extremo a extremo.

## Function target

- Function: `magic-link-delivery`
- URL esperada: `https://your-project.supabase.co/functions/v1/magic-link-delivery`

## Deploy

```bash
supabase functions deploy magic-link-delivery
```

## Secrets recomendados

```bash
supabase secrets set \
SAULO_WEBHOOK_SECRET='replace-with-shared-secret' \
SAULO_WEBHOOK_BEARER_TOKEN='replace-with-app-bearer' \
SAULO_SIGNATURE_HEADER='x-saulo-signature' \
DELIVERY_DEFAULT_CHANNEL='whatsapp' \
DELIVERY_DOWNSTREAM_URL='' \
DELIVERY_DOWNSTREAM_BEARER_TOKEN='replace-with-downstream-bearer'
```

## Variables del backend Node

```env
MAGIC_LINK_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/magic-link-delivery
MAGIC_LINK_WEBHOOK_SECRET=replace-with-shared-secret
MAGIC_LINK_WEBHOOK_BEARER_TOKEN=replace-with-app-bearer
MAGIC_LINK_WEBHOOK_SIGNATURE_HEADER=x-saulo-signature
```

## Smoke recomendado

```bash
npm run product:contract:delivery
npm run product:smoke:delivery
```

## Checklist rápido

1. Desplegar la función.
2. Cargar los secrets.
3. Pegar la URL real en `MAGIC_LINK_WEBHOOK_URL`.
4. Ejecutar `npm run product:smoke:delivery`.
5. Confirmar que el panel persiste `deliveryStatus=sent`, `channel` y `deliveryId`.
