# Expense Tracker API

A small, production-shaped REST API for tracking personal expenses: user auth, categories, and
expenses with filtering, pagination, and a per-category spending summary.

Built as a take-home exercise to demonstrate a proper (if minimal) end-to-end setup: AI-assisted
development, a real Git workflow, Docker, automated tests, and documentation an engineer could
pick up cold. See [`docs/AI_ASSISTED_DEVELOPMENT.md`](docs/AI_ASSISTED_DEVELOPMENT.md) for how it
was built.

## Stack

- **Runtime**: Node.js 20, TypeScript (strict mode)
- **HTTP**: Express 4
- **Database**: PostgreSQL 16, plain SQL via `pg` (no ORM)
- **Validation**: Zod
- **Auth**: JWT (`jsonwebtoken`) + `bcryptjs` for password hashing
- **Tests**: Jest + Supertest, with [`pg-mem`](https://github.com/oguimbal/pg-mem) as an
  in-memory Postgres-compatible database — the full suite runs without Docker or a real DB
- **Containerization**: multi-stage `Dockerfile` + `docker-compose.yml` (API + Postgres)
- **CI**: GitHub Actions (lint, typecheck, test with coverage, build, Docker image build)

## Quick start (Docker — recommended)

```bash
cp .env.example .env      # defaults work as-is for local Docker use
docker compose up --build
```

The API is now at `http://localhost:3000`. Schema is applied automatically on first run
(`src/db/schema.sql` is mounted into Postgres' `docker-entrypoint-initdb.d`).

```bash
curl http://localhost:3000/health
# {"status":"ok"}

curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'
```

Stop with `docker compose down` (add `-v` to also drop the Postgres volume).

## Quick start (local, without Docker)

Requires Node 20+ and a running Postgres 16 instance.

```bash
npm install
cp .env.example .env               # point DATABASE_URL at your local Postgres
npm run build && npm run db:migrate  # applies src/db/schema.sql
npm run dev                        # http://localhost:3000, auto-reload
```

## Running tests

```bash
npm test              # full suite (unit + integration), no Docker/Postgres needed
npm run test:coverage # with coverage report
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

Tests run against [`pg-mem`](https://github.com/oguimbal/pg-mem), an in-memory Postgres-compatible
engine, applying the real `schema.sql` — so they exercise real SQL (joins, aggregates, constraints)
without needing a database server. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why.

## Documentation

| Doc | Covers |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layering, data model, key design decisions, known gaps / next steps |
| [`docs/API.md`](docs/API.md) | Every endpoint, request/response shapes, error format |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | How this would actually go to production (none was provisioned for this exercise) |
| [`docs/AI_ASSISTED_DEVELOPMENT.md`](docs/AI_ASSISTED_DEVELOPMENT.md) | How AI assistance was used, and what was reviewed/changed by hand |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branching model, commit conventions, how to add a new resource module |

## Project layout

```
src/
  config/env.ts             # env var loading + defaults
  db/                        # pool, schema.sql, migrate script
  middleware/                # auth guard, error handler, async wrapper
  modules/
    auth/                     # register, login
    categories/               # CRUD, scoped to the authenticated user
    expenses/                 # CRUD + filtering/pagination + summary
  app.ts                      # Express app factory (db injected)
  index.ts                    # process entrypoint
tests/
  unit/                       # one file per service, pg-mem backed
  integration/                # full HTTP stack via supertest
  helpers/testDb.ts           # builds a fresh in-memory DB with schema applied
docs/                         # architecture, API reference, deployment, AI-assistance notes
.github/workflows/ci.yml      # lint, typecheck, test, build, docker build
docker-compose.yml            # API + Postgres for local/prod-like runs
Dockerfile                    # multi-stage build -> small, non-root runtime image
```

## Status / scope

This is intentionally scoped for a 6-hour timebox. What's in: auth, full CRUD on two resources,
filtering/pagination, a summary endpoint, 27 passing tests (~94% coverage), Docker, and CI. What's
deliberately left out (and why) is listed in
[`docs/ARCHITECTURE.md#suggested-next-steps`](docs/ARCHITECTURE.md#suggested-next-steps).

## License

MIT — see [`LICENSE`](LICENSE).
# expense-tracker-api
