import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { Db } from '../../src/db/pool';

/**
 * Creates a fresh in-memory Postgres-compatible database (via pg-mem) for a test file,
 * with the real schema applied. This lets integration tests exercise real SQL
 * without requiring a running Postgres server or Docker.
 */
export function createTestDb(): Db {
  const mem = newDb({ autoCreateForeignKeyIndices: true });

  // pg-mem doesn't ship NOW()/gen timestamp functions by default in the way we need;
  // register a stable one so schema + queries relying on NOW() work in tests.
  mem.public.registerFunction({
    name: 'now',
    returns: 'timestamp' as never,
    implementation: () => new Date(),
  });

  const schema = fs.readFileSync(path.join(__dirname, '../../src/db/schema.sql'), 'utf-8');
  mem.public.none(schema);

  const adapter = mem.adapters.createPg();
  const { Pool } = adapter;
  return new Pool() as unknown as Db;
}
