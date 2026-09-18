import { Pool } from 'pg';
import { env } from '../config/env';

/**
 * Single shared connection pool for the app.
 * Tests inject their own pg-mem-backed pool instead of importing this file directly
 * (see tests/helpers/testDb.ts and how services accept a `db` dependency).
 */
export const pool = new Pool({ connectionString: env.databaseUrl });

export type Db = Pick<Pool, 'query'>;
