# AGENTS

## Working Rules

- Keep `saulofitness.com` as the public brand landing.
- Keep `/app/` as the public student demo.
- Do not reintroduce the old questionnaire or budget form into the public flow.
- Preserve the current visual direction: white base, morado as brand accent, black for premium contrast.
- Prefer small, contextual UI changes over adding new screens.

## Repo Layout

- `index.html` is the public landing.
- `app/index.html` is the student demo shell.
- `app/app.js` drives demo state, navigation, and interactions.
- `app/styles.css` holds the shared demo styling.
- `tests/` contains the Playwright coverage for landing and demo.

## Verification

- Run `npm run format:check` before publishing.
- Run `npm run test:e2e` before publishing.
- Keep the staged diff focused; do not stage unrelated work silently.

## Publishing

- Use an intentional commit message.
- Push the branch with tracking.
- Open a PR when the scope is ready.
