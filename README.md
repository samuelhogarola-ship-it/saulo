# Saulo

Web principal de `saulofitness.com` y demo publica de `Saulo Fitness APP`.

Este repo queda centrado en dos superficies:

- `/`: landing principal de marca
- `/app/`: demo publica e instalable del panel de alumno

No incluye ya el formulario de presupuesto/cuestionario ni su backend asociado.

## Scripts

- `npm run dev`: lanza la app en `http://127.0.0.1:4173` y la expone tambien en tu red local para probarla desde el movil
- `npm run start`: arranca el servidor Node en modo normal
- `npm run format`: formatea el proyecto con Prettier
- `npm run format:check`: comprueba formato sin reescribir
- `npm run precommit`: ejecuta `lint-staged` sobre archivos cambiados
- `npm run playwright:install`: instala Chromium para Playwright
- `npm run test:e2e`: ejecuta Playwright

## Demo alumno incluida

- Navegacion lateral y superior con `Rutinas`, `Mensajes`, `Suscripcion` y
  `Perfil`
- Rutinas por `Dia 1-7` con deep links publicos
- Comentarios por ejercicio y generacion visual de informe al finalizar
- PWA instalable con icono, `manifest` y `service worker`

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

La suite E2E cubre la landing publica y la demo de alumno en `/app/`.
