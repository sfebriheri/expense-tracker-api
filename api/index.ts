import { createApp } from '../src/app';
import { pool } from '../src/db/pool';

/**
 * Vercel serverless entry point.
 *
 * Vercel's Node.js runtime expects the module at this path to have a
 * default export that is either a request handler function
 * (req, res) => void or an http.Server. src/app.ts only exports the
 * createApp factory (used so tests can inject a pg-mem pool), so the
 * previous deploy failed with:
 *
 *   Invalid export found in module "/var/task/src/app.js".
 *   The default export must be a function or server.
 *
 * This file builds the real app once per cold start with the shared
 * Postgres pool and default-exports it. An Express app instance is itself
 * a valid (req, res) => void handler, so no extra wrapping is needed.
 */
const app = createApp(pool);

export default app;
