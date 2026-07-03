# AGENTS

## Working Rules

- `Saulo Fitness APP` queda congelada por ahora. No modificar `app/`, `trainer/`, la landing ni la PWA salvo orden explícita nueva del usuario.
- Keep `saulofitness.com` as the public brand landing.
- Keep `/app/` as the student PWA product surface.
- Keep the student auth contract closed: trainer marks payment received, the system sends a unique magic link to the waiting room, and the student activates and installs the PWA only from that flow.
- Do not reintroduce the old questionnaire or budget form into the public flow.
- Preserve the current visual direction: white base, morado as brand accent, black for premium contrast.
- Prefer small, contextual UI changes over adding new screens.

## Repo Layout

- Protected area until new order: `index.html`, `styles.css`, `app/`, `trainer/`, PWA manifests/service workers, and Saulo Fitness APP related tests.
- `index.html` is the public landing.
- `app/index.html` is the student PWA shell.
- `app/app.js` drives app state, navigation, and interactions.
- `app/styles.css` holds the shared app styling.
- `tests/` contains the Playwright coverage for landing and app flows.

## Verification

- Run `npm run precommit` or let the git pre-commit hook pass before pushing.
- Run `npm run format:check` before publishing.
- Run `npm run test:e2e` before publishing.
- Keep the staged diff focused; do not stage unrelated work silently.
- Treat CI, Playwright, and CodeRabbit as required checks for merge readiness.
- Before starting a local server, check whether there is already a project running on the target port.
- If the port is already in use, start the preview on a different free port instead of reusing or breaking the existing session.

## Publishing

- Use an intentional commit message.
- Push the branch with tracking.
- Open a PR when the scope is ready.
- Merge only when precommit, local checks, CI, Playwright, and CodeRabbit are all green.
