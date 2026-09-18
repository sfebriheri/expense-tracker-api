# Architecture

## Overview

A small, layered REST API. No framework magic, no ORM — plain SQL via `pg`,
validated input via `zod`, and dependency injection on the database handle so
the whole stack is testable without Docker or a real Postgres server.

```
Request
  │
  ▼
Router (src/modules/*/*.routes.ts)      — wires paths to controller methods, applies requireAuth
  │
  ▼
Controller (*.controller.ts)            — parses/validates input (zod), calls the service, shapes the HTTP response
  │
  ▼
Service (*.service.ts)                  — business logic + SQL queries, receives `Db` via constructor injection
  │
  ▼
Db (src/db/pool.ts -> pg.Pool)          — real Postgres in prod, pg-mem in tests
```

Cross-cutting concerns:
- `src/middleware/auth.ts` — verifies the JWT and attaches `req.user`.
- `src/middleware/errorHandler.ts` — single place that turns thrown errors (including `ZodError`)
  into consistent JSON responses. Controllers/services just `throw`; they never touch `res` on the
  error path.
- `src/middleware/asyncHandler.ts` — forwards rejected promises from async route handlers to
  the error middleware (Express 4 doesn't do this automatically).

## Why dependency injection on the DB

`createApp(db: Db)` and every `*Service` take a `Db` (a `{ query }` interface, satisfied by
`pg.Pool`) instead of importing a shared pool directly. This means:

- **Unit tests** instantiate a service directly with an in-memory database
  ([`pg-mem`](https://github.com/oguimbal/pg-mem)) and call its methods — no HTTP, no mocking of
  `pg`.
- **Integration tests** build a real Express app (`createApp(testDb)`) and drive it with
  `supertest`, still backed by `pg-mem`, so they exercise routing/middleware/validation without
  needing Postgres running.
- **Production** (`src/index.ts`) wires the real `pg.Pool` from `src/db/pool.ts`.

This is the main design decision that lets `npm test` run in CI (or any laptop) with zero
external services, while still testing real SQL logic (joins, aggregates, filters) rather than
mocked query results.

## Data model

```
users 1───* categories
users 1───* expenses *───1 categories (nullable, ON DELETE SET NULL)
```

See `src/db/schema.sql` for the authoritative definition (types, constraints, indexes).

## Migrations

This project intentionally keeps migrations simple for its current scope: `schema.sql` is applied
as a Postgres `docker-entrypoint-initdb.d` script on first container start, and can also be run
manually with `npm run db:migrate` (executes the same file, idempotently — statements use
`CREATE TABLE IF NOT EXISTS`).

**This does not scale to a team making concurrent schema changes.** The natural next step (see
`docs/ARCHITECTURE.md#suggested-next-steps`) is a real migration tool (e.g. `node-pg-migrate` or
Prisma Migrate) with versioned, one-way migration files, once the schema needs to evolve after
data already exists in production.

## Suggested next steps

Left out to keep this within a 6-hour timebox; flagged here for whoever picks this up:

- Real migration tool instead of a single `schema.sql` (see above).
- Rate limiting on `/api/auth/*` (brute-force protection).
- Refresh tokens / token revocation (current JWTs are valid until they expire, with no revoke list).
- Structured logging (pino/winston) instead of `console.log`/`console.error`.
- OpenAPI spec generated from the zod schemas (e.g. `zod-to-openapi`) instead of hand-written
  `docs/API.md`.
- CD pipeline (this repo intentionally stops at CI + a runnable Docker image, since no server was
  provisioned for this exercise — see `docs/DEPLOYMENT.md`).
