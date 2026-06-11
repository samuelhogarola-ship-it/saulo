# Saulo

Landing temporal para el formulario técnico de Saulo Fitness.

## Scripts

- `npm run dev`: lanza la landing en `http://127.0.0.1:4173`
- `npm run format`: formatea el proyecto con Prettier
- `npm run format:check`: comprueba formato sin reescribir
- `npm run test:e2e`: ejecuta Playwright

## Git hooks

El proyecto usa `husky` con un `pre-commit` básico que lanza `lint-staged` y formatea los archivos cambiados.

## CI

GitHub Actions ejecuta:

- `npm ci`
- `npm run format:check`
- `npm run test:e2e`
