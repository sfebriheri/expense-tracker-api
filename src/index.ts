/* eslint-disable no-console */
import { createApp } from './app';
import { pool } from './db/pool';
import { env } from './config/env';

const app = createApp(pool);

app.listen(env.port, () => {
  console.log(`Expense Tracker API listening on port ${env.port} (${env.nodeEnv})`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});
