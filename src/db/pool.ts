import { Pool } from 'pg';
import { env } from '../config/env';

/**
 * Single shared connection pool for the app.
 * Tests inject their own pg-mem-backed pool instead of importing this file directly
 * (see tests/helpers/testDb.ts and how services accept a `db` dependency).
 * 
 * For serverless environments (like Vercel), we use a smaller pool size
 * and shorter timeouts to avoid connection exhaustion.
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Serverless-friendly settings
  max: 1, // Only 1 connection per serverless function instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export type Db = Pick<Pool, 'query'>;
