# Deployment notes

No server/VPS was provisioned for this exercise, so there is no live deployment. The project is
built so that deploying it is a matter of picking a target, not restructuring code:

- **Image**: `docker build -t expense-tracker-api .` produces a self-contained runtime image
  (final stage runs as a non-root user, has a `HEALTHCHECK`, and only ships production deps).
- **Anywhere that runs a container + Postgres** works: e.g. a single VM with
  `docker compose up -d`, or a managed target like Render/Railway/Fly.io/ECS. Point
  `DATABASE_URL` at a managed Postgres instance and set `JWT_SECRET` to a real secret — everything
  else in `.env.example` has a sane default.
- **First-run schema**: if you're not using the bundled `docker-compose.yml` (which mounts
  `schema.sql` into `docker-entrypoint-initdb.d`), run `npm run db:migrate` once against the
  target database after the container is deployed.
- **CI already builds and validates the image** (`.github/workflows/ci.yml`, `docker-build` job)
  on every push/PR to `main`, so a deploy step just needs to add a `docker push` + your platform's
  deploy hook once a target exists.
