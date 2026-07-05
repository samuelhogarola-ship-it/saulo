# Saulo Fitness APP · Product Activation Runbook

## Objetivo

Pasar del estado actual del repo a una primera activación real del producto con:

- entrenador real
- alumno real
- Supabase operativo
- Edge Function de entrega operativa
- smoke de login, delivery y activación verificados

## Paso 1 · Validar estado base

```bash
npm run product:check
```

## Paso 2 · Preparar entorno del backend

```bash
npm run product:env:template
```

Archivo generado:

- `docs/product-env-template.env`

## Paso 3 · Preparar entorno de la Edge Function

```bash
npm run product:env:function
npm run product:handoff:function
```

Archivos generados:

- `docs/supabase-function-template.env`
- `docs/supabase-function-handoff.md`

## Paso 4 · Crear o enlazar entrenador real

```bash
npm run product:bootstrap:trainer
```

## Paso 5 · Crear o actualizar el primer alumno real

```bash
npm run product:bootstrap:student
```

## Paso 6 · Verificar login real y ownership

```bash
npm run product:smoke:supabase
```

## Paso 7 · Desplegar la Edge Function

```bash
supabase functions deploy magic-link-delivery
```

## Paso 8 · Conectar URL real de entrega

```env
MAGIC_LINK_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/magic-link-delivery
```

Sustituye `your-project` por tu project ref real.

## Paso 9 · Validar entrega automática

```bash
npm run product:contract:delivery
npm run product:smoke:delivery
npm run product:smoke:activation
```

## Paso 10 · Confirmar go-live operativo

```bash
npm run product:handoff:go-live
```

Archivo generado:

- `docs/delivery-go-live-checklist.md`

## Criterio de salida

La activación inicial se considera lista cuando:

1. `product:check` ya no bloquea por Supabase.
2. El entrenador real puede iniciar sesión.
3. El alumno real existe con rutina y suscripción.
4. La Edge Function responde `2xx` al contrato actual.
5. `product:smoke:supabase`, `product:smoke:delivery` y `product:smoke:activation` pasan.
6. El panel persiste `deliveryStatus`, `channel` y `deliveryId`.
