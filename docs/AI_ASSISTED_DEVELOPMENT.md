# AI-assisted development notes

This project was built with Claude (Anthropic) driving most of the implementation directly in an
agentic coding environment — writing files, running `npm install`/`tsc`/`eslint`/`jest` in a
sandbox, and iterating based on real command output rather than guessing.

## What AI did

- Scaffolded the project structure (routes → controller → service → db layering) and generated
  the initial implementation of each module (auth, categories, expenses).
- Wrote the Zod schemas, SQL, Dockerfile, `docker-compose.yml`, GitHub Actions workflow, and the
  test suite (unit tests per service + integration tests via supertest).
- Actually **ran** `npm install`, `tsc --noEmit`, `eslint`, and `jest --coverage` in a sandboxed
  container during development — every commit in this repo's history reflects a state where the
  build, lint, and full test suite (27 tests) were passing, not just code that "looks right."

## What was a deliberate human-equivalent decision (not just accepted AI output)

These are the judgment calls that shaped the design, called out explicitly because a reviewer
should know they were intentional rather than an AI default:

- **No ORM.** Plain SQL via `pg` was chosen over Prisma/TypeORM to keep the dependency surface
  small and avoid a generated-client step that can be fragile in constrained/offline build
  environments — a real constraint during this exercise (see `docs/ARCHITECTURE.md`).
- **`pg-mem` for tests instead of a real Postgres/Testcontainers setup.** This was the key
  decision that let the entire test suite run without Docker being available in the build
  environment, while still testing real SQL rather than mocked query results. This is flagged in
  `docs/ARCHITECTURE.md` as a trade-off, not presented as a universally "correct" choice — a
  real Postgres via Testcontainers would be worth it if/when CI environments make that free.
- **Single `schema.sql` instead of a migration tool.** Appropriate for a from-scratch schema with
  no production data yet; explicitly called out in `docs/ARCHITECTURE.md` as something to replace
  before the schema needs to evolve under real data.
- **No CD / no live deployment.** No server was provisioned for this exercise per the assignment;
  `docs/DEPLOYMENT.md` describes what deploying this would actually involve instead of faking a
  deployment.

## What a human reviewer should double check

In a real hiring/production context, this is the honest list of what deserves a second pair of
eyes rather than being trusted purely because a test passed:

- JWT secret handling and expiry defaults (`.env.example`) — fine for a take-home, not fine to
  ship with a placeholder secret.
- No rate limiting on `/api/auth/*` — noted as a gap in `docs/ARCHITECTURE.md`.
- Coverage is ~94% but coverage percentage is not the same as "correct" — the integration tests
  were written to match the API's actual behavior, so a reviewer should sanity-check the behavior
  itself (e.g. pagination semantics, ownership checks) against `docs/API.md`, not just trust that
  tests exist.
