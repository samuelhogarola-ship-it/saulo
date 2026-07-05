# Saulo Fitness APP · Next Product Commands

## Trainer bootstrap

```bash
BOOTSTRAP_TRAINER_EMAIL='trainer@saulofitness.com' \
BOOTSTRAP_TRAINER_PASSWORD='replace-with-secure-password' \
BOOTSTRAP_TRAINER_NAME='Saulo Trainer' \
npm run product:bootstrap:trainer
```

## Student bootstrap

```bash
BOOTSTRAP_TRAINER_EMAIL='trainer@saulofitness.com' \
BOOTSTRAP_STUDENT_TEMPLATE_PATH='product-templates/students/lucia-ortega.json' \
npm run product:bootstrap:student
```

## Supabase smoke

```bash
SMOKE_TRAINER_EMAIL='trainer@saulofitness.com' \
SMOKE_TRAINER_PASSWORD='replace-with-secure-password' \
SMOKE_STUDENT_CONTACT_EMAIL='lucia@saulofitness.app' \
SMOKE_TRIGGER_WAITING_ROOM=true \
npm run product:smoke:supabase
```

## Supabase delivery function deploy

```bash
supabase functions deploy magic-link-delivery
npm run product:env:function
npm run product:handoff:function
npm run product:handoff:activation
```

## Delivery handoff

```bash
MAGIC_LINK_WEBHOOK_URL='https://your-project.supabase.co/functions/v1/magic-link-delivery' \
npm run product:handoff:delivery
```

## Delivery smoke

```bash
MAGIC_LINK_WEBHOOK_URL='https://your-project.supabase.co/functions/v1/magic-link-delivery' \
npm run product:smoke:delivery
```

## Full local activation smoke

```bash
MAGIC_LINK_WEBHOOK_URL='https://your-project.supabase.co/functions/v1/magic-link-delivery' \
npm run product:smoke:activation
```

## Notes

- Replace any placeholder password, Supabase delivery URL, or example template path before running against production data.
- Re-run `npm run product:check` after each step to confirm the next real gap.
