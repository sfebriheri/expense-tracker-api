# Contributing

## Branching model

- `main` is always deployable: CI must be green before merging into it.
- Work happens on short-lived branches off `main`, named `type/short-description`, e.g.
  `feat/expense-summary`, `fix/pagination-off-by-one`, `chore/bump-deps`.
- Open a PR into `main` early (draft is fine) rather than working in isolation for a long time.
- Squash-merge PRs so `main` has one commit per logical change; keep the incremental commits
  on the branch itself while it's in review (easier to review commit-by-commit).

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <short summary>

<optional body — why, not just what>
```

Types used in this repo: `feat`, `fix`, `test`, `docs`, `build`, `ci`, `chore`, `refactor`.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four run in CI on every PR (`.github/workflows/ci.yml`); please don't rely on CI to discover
a lint error you could have caught locally.

## Adding a new resource/module

Follow the existing pattern under `src/modules/<name>/`:

1. `<name>.schema.ts` — zod schemas for input validation.
2. `<name>.service.ts` — business logic + SQL, constructor-injected with a `Db`.
3. `<name>.controller.ts` — parses input with the schema, calls the service, shapes the response.
4. `<name>.routes.ts` — wires an Express `Router`, applies `requireAuth` if the resource is
   per-user.
5. Register the router in `src/app.ts`.
6. Add the table to `src/db/schema.sql`.
7. Add unit tests (`tests/unit/<name>.service.test.ts`) using `tests/helpers/testDb.ts`, and
   extend `tests/integration/api.test.ts` (or add a new integration file) for the HTTP contract.

## Code style

Enforced by ESLint + Prettier (`npm run lint`, `npm run format`). No unused exports/params,
strict TypeScript (`strict: true`), no `any` without a lint warning.
